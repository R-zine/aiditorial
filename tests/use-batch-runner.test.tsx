import Dexie from "dexie";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const webLlm = vi.hoisted(() => ({
  createEngine: vi.fn(),
}));

vi.mock("@mlc-ai/web-llm", () => ({
  CreateMLCEngine: webLlm.createEngine,
  prebuiltAppConfig: { model_list: [] },
}));

import { db, type BatchJob, type HistoryRun, type LocalDocument } from "@/db/db";
import {
  type BatchRunTarget,
  useBatchRunner,
} from "@/hooks/useBatchRunner/useBatchRunner";

function streamed(...parts: string[]) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const content of parts) {
        yield { choices: [{ delta: { content } }] };
      }
    },
  };
}

function mockEngine() {
  return {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue(streamed("Edited", " paragraph")),
      },
    },
    interruptGenerate: vi.fn().mockResolvedValue(undefined),
    unload: vi.fn().mockResolvedValue(undefined),
  };
}

async function resetDatabase() {
  db.close();
  await Dexie.delete(db.name);
  await db.open();
}

async function createTarget(content = ["First", "Second"]): Promise<BatchRunTarget> {
  const historyData: Omit<HistoryRun, "id"> = {
    createdAt: new Date().toISOString(),
    model: "local-model",
    mode: "Edit",
    temperature: 0.3,
    isCache: true,
    prompt: "Rewrite <<PARAGRAPH>>",
    input: "Example input",
    output: "Example output",
  };
  const historyId = await db.history.add(historyData as HistoryRun);
  const documentData: Omit<LocalDocument, "id"> = {
    createdAt: new Date().toISOString(),
    name: "essay.docx",
    sourceType: "docx",
    content,
    length: content.join("").length,
  };
  const documentId = await db.document.add(documentData as LocalDocument);
  const jobData: Omit<BatchJob, "id"> = {
    createdAt: new Date().toISOString(),
    name: "Essay edit",
    historyId,
    documentId,
    status: "pending",
    progress: 0,
  };
  const id = await db.job.add(jobData as BatchJob);

  return {
    id,
    ...jobData,
    history: { id: historyId, ...historyData },
    document: { id: documentId, ...documentData },
  };
}

beforeEach(async () => {
  await resetDatabase();
  webLlm.createEngine.mockReset();
  Object.defineProperty(navigator, "gpu", { configurable: true, value: {} });
});

afterAll(async () => {
  db.close();
  await Dexie.delete(db.name);
});

describe("useBatchRunner", () => {
  it("edits every pending paragraph and checkpoints progress", async () => {
    const target = await createTarget();
    const engine = mockEngine();
    webLlm.createEngine.mockResolvedValue(engine);
    const { result } = renderHook(() => useBatchRunner());

    await act(async () => result.current.start(target));

    const savedJob = await db.job.get(target.id);
    const paragraphs = await db.jobParagraph
      .where("jobId")
      .equals(target.id)
      .sortBy("index");
    expect(savedJob).toMatchObject({ status: "completed", progress: 2 });
    expect(paragraphs.map(({ editedText, status }) => ({ editedText, status }))).toEqual([
      { editedText: "Edited paragraph", status: "complete" },
      { editedText: "Edited paragraph", status: "complete" },
    ]);
    expect(engine.chat.completions.create).toHaveBeenCalledTimes(2);
    expect(engine.chat.completions.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        messages: [{ role: "user", content: "Rewrite First" }],
        temperature: 0.3,
        stream: true,
      }),
    );
    expect(result.current.message).toMatch(/completed/i);
    expect(result.current.activeJobId).toBeNull();
    expect(engine.unload).toHaveBeenCalledOnce();
  });

  it("resumes only unfinished checkpoints", async () => {
    const target = await createTarget();
    await db.jobParagraph.bulkAdd([
      {
        jobId: target.id,
        index: 0,
        originalText: "First",
        editedText: "Already reviewed",
        status: "accepted",
      },
      {
        jobId: target.id,
        index: 1,
        originalText: "Second",
        editedText: "",
        status: "error",
        error: "Old failure",
      },
    ]);
    const engine = mockEngine();
    webLlm.createEngine.mockResolvedValue(engine);
    const { result } = renderHook(() => useBatchRunner());

    await act(async () => result.current.start(target));

    expect(engine.chat.completions.create).toHaveBeenCalledOnce();
    expect(await db.job.get(target.id)).toMatchObject({
      status: "completed",
      progress: 2,
    });
    expect(await db.jobParagraph.where("jobId").equals(target.id).first()).toMatchObject({
      editedText: "Already reviewed",
      status: "accepted",
    });
  });

  it("records paragraph and job errors without losing checkpoints", async () => {
    const target = await createTarget(["Only paragraph"]);
    const engine = mockEngine();
    engine.chat.completions.create.mockRejectedValue(new Error("GPU allocation failed"));
    webLlm.createEngine.mockResolvedValue(engine);
    const { result } = renderHook(() => useBatchRunner());

    await act(async () => result.current.start(target));

    expect(result.current.error).toBe("GPU allocation failed");
    expect(await db.job.get(target.id)).toMatchObject({
      status: "error",
      error: "GPU allocation failed",
    });
    expect(await db.jobParagraph.where("jobId").equals(target.id).first()).toMatchObject({
      status: "error",
      error: "GPU allocation failed",
    });

    act(() => result.current.clearFeedback());
    expect(result.current.error).toBe("");
    expect(result.current.message).toBe("");
  });

  it("pauses safely during a streamed paragraph", async () => {
    const target = await createTarget(["Only paragraph"]);
    let releaseStream: (() => void) | undefined;
    const engine = mockEngine();
    engine.chat.completions.create.mockResolvedValue({
      async *[Symbol.asyncIterator]() {
        yield { choices: [{ delta: { content: "Partial" } }] };
        await new Promise<void>((resolve) => {
          releaseStream = resolve;
        });
        yield { choices: [{ delta: { content: " output" } }] };
      },
    });
    webLlm.createEngine.mockResolvedValue(engine);
    const { result } = renderHook(() => useBatchRunner());

    let running!: Promise<void>;
    act(() => {
      running = result.current.start(target);
    });
    await waitFor(() => expect(result.current.streamedParagraph).toBe("Partial"));

    await act(async () => result.current.pause());
    releaseStream?.();
    await act(async () => running);

    expect(await db.job.get(target.id)).toMatchObject({ status: "paused", progress: 0 });
    expect(await db.jobParagraph.where("jobId").equals(target.id).first()).toMatchObject({
      status: "pending",
      editedText: "",
    });
    expect(result.current.message).toMatch(/paused/i);
  });

  it("does not start when WebGPU is unavailable", async () => {
    const target = await createTarget();
    Reflect.deleteProperty(navigator, "gpu");
    const { result } = renderHook(() => useBatchRunner());

    await act(async () => result.current.start(target));

    expect(result.current.error).toMatch(/WebGPU is unavailable/);
    expect(webLlm.createEngine).not.toHaveBeenCalled();
    expect(await db.job.get(target.id)).toMatchObject({ status: "pending" });
  });
});
