import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const webLlm = vi.hoisted(() => ({
  createEngine: vi.fn(),
}));

vi.mock("@mlc-ai/web-llm", () => ({
  CreateMLCEngine: webLlm.createEngine,
  prebuiltAppConfig: {
    model_list: [
      { model_id: "model-one" },
      { model_id: "model-two" },
    ],
  },
}));

import {
  availableModels,
  supportsWebGPU,
  useWebLLM,
} from "@/hooks/useWebLLM/useWebLLM";

interface MockEngine {
  chat: {
    completions: {
      create: ReturnType<typeof vi.fn>;
    };
  };
  interruptGenerate: ReturnType<typeof vi.fn>;
  unload: ReturnType<typeof vi.fn>;
}

function setWebGpu(supported: boolean) {
  Reflect.deleteProperty(navigator, "gpu");
  if (supported) {
    Object.defineProperty(navigator, "gpu", {
      configurable: true,
      value: {},
    });
  }
}

function stream(...parts: string[]) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const content of parts) {
        yield { choices: [{ delta: { content } }] };
      }
    },
  };
}

function createMockEngine(...parts: string[]): MockEngine {
  return {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue(stream(...parts)),
      },
    },
    interruptGenerate: vi.fn().mockResolvedValue(undefined),
    unload: vi.fn().mockResolvedValue(undefined),
  };
}

beforeEach(() => {
  setWebGpu(true);
  webLlm.createEngine.mockReset();
});

describe("WebLLM capability and catalog", () => {
  it("reports WebGPU support and exposes readable model labels", () => {
    expect(supportsWebGPU()).toBe(true);
    setWebGpu(false);
    expect(supportsWebGPU()).toBe(false);
    expect(availableModels).toEqual([
      { id: "model-one", label: "model one" },
      { id: "model-two", label: "model two" },
    ]);
  });

  it("stays idle until a model is selected", async () => {
    const { result } = renderHook(() => useWebLLM(null, true));
    await waitFor(() => expect(result.current.status).toBe("idle"));
    expect(webLlm.createEngine).not.toHaveBeenCalled();
    await expect(result.current.generate([], 0.2)).rejects.toThrow(
      "Load a model before generating text.",
    );
  });

  it("returns an actionable state when WebGPU is missing", async () => {
    setWebGpu(false);
    const { result } = renderHook(() => useWebLLM("model-one", true));

    await waitFor(() => expect(result.current.status).toBe("unsupported"));
    expect(result.current.error).toMatch(/WebGPU is unavailable/);
    expect(webLlm.createEngine).not.toHaveBeenCalled();
  });
});

describe("useWebLLM lifecycle", () => {
  it("loads a model, reports progress, and streams cumulative output", async () => {
    const engine = createMockEngine("Hello", " world");
    webLlm.createEngine.mockImplementation(async (_model, options) => {
      options.initProgressCallback({
        progress: 0.5,
        timeElapsed: 1,
        text: "Halfway",
      });
      return engine;
    });
    const { result } = renderHook(() => useWebLLM("model-one", false));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(webLlm.createEngine).toHaveBeenCalledWith(
      "model-one",
      expect.objectContaining({
        appConfig: expect.objectContaining({ useIndexedDBCache: false }),
      }),
    );

    const updates: string[] = [];
    let output = "";
    await act(async () => {
      output = await result.current.generate(
        [{ role: "user", content: "Continue." }],
        0.4,
        (partial) => updates.push(partial),
      );
    });

    expect(output).toBe("Hello world");
    expect(updates).toEqual(["Hello", "Hello world"]);
    expect(engine.chat.completions.create).toHaveBeenCalledWith({
      messages: [{ role: "user", content: "Continue." }],
      temperature: 0.4,
      stream: true,
    });
    expect(result.current.status).toBe("ready");
  });

  it("surfaces model-load errors and retries successfully", async () => {
    const engine = createMockEngine();
    webLlm.createEngine
      .mockRejectedValueOnce(new Error("Model download failed"))
      .mockResolvedValueOnce(engine);
    const { result } = renderHook(() => useWebLLM("model-one", true));

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error).toBe("Model download failed");

    act(() => result.current.retry());
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(webLlm.createEngine).toHaveBeenCalledTimes(2);
  });

  it("surfaces generation errors and keeps their original cause", async () => {
    const engine = createMockEngine();
    engine.chat.completions.create.mockRejectedValue(new Error("GPU lost"));
    webLlm.createEngine.mockResolvedValue(engine);
    const { result } = renderHook(() => useWebLLM("model-one", true));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    let failure: Error | undefined;
    await act(async () => {
      try {
        await result.current.generate([], 0.2);
      } catch (error) {
        failure = error as Error;
      }
    });

    expect(failure?.message).toBe("GPU lost");
    expect((failure?.cause as Error).message).toBe("GPU lost");
    expect(result.current.status).toBe("error");
    expect(result.current.error).toBe("GPU lost");
  });

  it("interrupts an active stream and rejects its partial result", async () => {
    let releaseStream: (() => void) | undefined;
    const engine = createMockEngine();
    engine.chat.completions.create.mockResolvedValue({
      async *[Symbol.asyncIterator]() {
        yield { choices: [{ delta: { content: "Partial" } }] };
        await new Promise<void>((resolve) => {
          releaseStream = resolve;
        });
        yield { choices: [{ delta: { content: " result" } }] };
      },
    });
    webLlm.createEngine.mockResolvedValue(engine);
    const { result } = renderHook(() => useWebLLM("model-one", true));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    const updates: string[] = [];
    let generation!: Promise<string>;
    act(() => {
      generation = result.current.generate([], 0.2, (partial) =>
        updates.push(partial),
      );
    });
    await waitFor(() => expect(updates).toEqual(["Partial"]));

    const cancellation = expect(generation).rejects.toThrow(
      "Generation cancelled.",
    );
    await act(async () => result.current.cancel());
    releaseStream?.();
    await cancellation;

    expect(engine.interruptGenerate).toHaveBeenCalledOnce();
    expect(result.current.status).toBe("ready");
    expect(updates).toEqual(["Partial"]);
  });

  it("releases the previous engine when the model changes", async () => {
    const firstEngine = createMockEngine();
    const secondEngine = createMockEngine();
    webLlm.createEngine
      .mockResolvedValueOnce(firstEngine)
      .mockResolvedValueOnce(secondEngine);
    const { result, rerender } = renderHook(
      ({ model }) => useWebLLM(model, true),
      { initialProps: { model: "model-one" } },
    );
    await waitFor(() => expect(result.current.status).toBe("ready"));

    rerender({ model: "model-two" });

    await waitFor(() => expect(webLlm.createEngine).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.status).toBe("ready"));
    await waitFor(() => expect(firstEngine.interruptGenerate).toHaveBeenCalled());
    await waitFor(() => expect(firstEngine.unload).toHaveBeenCalled());
  });

  it("interrupts and unloads the active engine on unmount", async () => {
    const engine = createMockEngine();
    webLlm.createEngine.mockResolvedValue(engine);
    const { result, unmount } = renderHook(() =>
      useWebLLM("model-one", true),
    );
    await waitFor(() => expect(result.current.status).toBe("ready"));

    unmount();

    await waitFor(() => expect(engine.interruptGenerate).toHaveBeenCalledOnce());
    await waitFor(() => expect(engine.unload).toHaveBeenCalledOnce());
  });
});
