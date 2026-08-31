import Dexie from "dexie";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db, inferSourceType, normalizeMode } from "@/db/db";

async function resetDatabase() {
  db.close();
  await Dexie.delete(db.name);
}

beforeEach(resetDatabase);
afterAll(resetDatabase);

describe("database helpers", () => {
  it.each([
    ["Standard", "Chat"],
    ["Separate", "Edit"],
    ["Separate with comparison", "Compare"],
    ["Chat", "Chat"],
    ["Compare", "Compare"],
    ["unknown", "Edit"],
  ] as const)("normalizes %s to %s", (input, output) => {
    expect(normalizeMode(input)).toBe(output);
  });

  it.each([
    ["draft.DOCX", "docx"],
    ["book.odt", "odt"],
    ["notes.txt", "text"],
    ["untitled", "text"],
  ] as const)("infers %s as %s", (name, sourceType) => {
    expect(inferSourceType(name)).toBe(sourceType);
  });
});

describe("Dexie schema migration", () => {
  it("upgrades version-one records with safe defaults", async () => {
    const legacy = new Dexie(db.name);
    legacy.version(1).stores({
      history: "++id, model, mode, temperature, isCache, prompt",
      document: "++id, name, content, length",
      job: "++id, name, historyId, documentId, progress, editedContent",
    });
    await legacy.open();

    const historyId = await legacy.table("history").add({
      model: "local-model",
      mode: "Separate with comparison",
      temperature: 0.2,
      isCache: true,
      prompt: "Edit this.",
    });
    const documentId = await legacy.table("document").add({
      name: "essay.DOCX",
      content: ["Paragraph"],
      length: 9,
    });
    const jobId = await legacy.table("job").add({
      name: "",
      historyId,
      documentId,
      progress: 0,
      editedContent: [],
    });
    legacy.close();

    await db.open();
    const history = await db.history.get(historyId as number);
    const document = await db.document.get(documentId as number);
    const job = await db.job.get(jobId as number);

    expect(history).toMatchObject({
      mode: "Compare",
      input: "",
      output: "",
    });
    expect(history?.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(document).toMatchObject({ sourceType: "docx" });
    expect(document?.createdAt).toBeTruthy();
    expect(job).toMatchObject({
      name: `Batch job ${jobId}`,
      status: "pending",
    });
    expect(job?.createdAt).toBeTruthy();
  });
});
