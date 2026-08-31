import Dexie from "dexie";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db, type BatchJob, type LocalDocument } from "@/db/db";
import {
  deleteBatchJob,
  ensureJobParagraphs,
  isCompletedParagraph,
} from "@/lib/batch";

async function resetDatabase() {
  db.close();
  await Dexie.delete(db.name);
  await db.open();
}

beforeEach(resetDatabase);
afterAll(async () => {
  db.close();
  await Dexie.delete(db.name);
});

describe("batch state", () => {
  it.each([
    ["pending", false],
    ["error", false],
    ["complete", true],
    ["accepted", true],
    ["rejected", true],
  ] as const)("classifies %s status", (status, completed) => {
    expect(isCompletedParagraph(status)).toBe(completed);
  });

  it("lazily migrates legacy output once and preserves paragraph order", async () => {
    const document: LocalDocument = {
      id: 1,
      createdAt: new Date().toISOString(),
      name: "essay.docx",
      sourceType: "docx",
      content: ["First", "Second", "Third"],
      length: 16,
    };
    const job: BatchJob = {
      id: 9,
      createdAt: new Date().toISOString(),
      name: "Legacy edit",
      documentId: 1,
      historyId: 2,
      progress: 1,
      status: "paused",
      editedContent: ["Edited first"],
    };

    const firstRead = await ensureJobParagraphs(job, document);
    const secondRead = await ensureJobParagraphs(job, document);

    expect(firstRead).toHaveLength(3);
    expect(secondRead).toHaveLength(3);
    expect(await db.jobParagraph.count()).toBe(3);
    expect(firstRead.map(({ index, originalText, editedText, status }) => ({
      index,
      originalText,
      editedText,
      status,
    }))).toEqual([
      {
        index: 0,
        originalText: "First",
        editedText: "Edited first",
        status: "complete",
      },
      {
        index: 1,
        originalText: "Second",
        editedText: "",
        status: "pending",
      },
      {
        index: 2,
        originalText: "Third",
        editedText: "",
        status: "pending",
      },
    ]);
  });

  it("deletes only the selected job and its paragraph checkpoints", async () => {
    const jobOne = await db.job.add({
      createdAt: new Date().toISOString(),
      name: "One",
      documentId: 1,
      historyId: 1,
      progress: 0,
      status: "pending",
    });
    const jobTwo = await db.job.add({
      createdAt: new Date().toISOString(),
      name: "Two",
      documentId: 1,
      historyId: 1,
      progress: 0,
      status: "pending",
    });
    await db.jobParagraph.bulkAdd([
      {
        jobId: jobOne,
        index: 0,
        originalText: "One",
        editedText: "",
        status: "pending",
      },
      {
        jobId: jobTwo,
        index: 0,
        originalText: "Two",
        editedText: "",
        status: "pending",
      },
    ]);

    await deleteBatchJob(jobOne);

    expect(await db.job.get(jobOne)).toBeUndefined();
    expect(await db.jobParagraph.where("jobId").equals(jobOne).count()).toBe(0);
    expect(await db.job.get(jobTwo)).toBeTruthy();
    expect(await db.jobParagraph.where("jobId").equals(jobTwo).count()).toBe(1);
  });
});
