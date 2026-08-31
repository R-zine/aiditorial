"use client";

import {
  CreateMLCEngine,
  prebuiltAppConfig,
  type ChatCompletionMessageParam,
  type InitProgressReport,
  type MLCEngine,
} from "@mlc-ai/web-llm";
import { useCallback, useEffect, useRef, useState } from "react";

export const availableModels = prebuiltAppConfig.model_list.map((model) => ({
  id: model.model_id,
  label: model.model_id.replaceAll("-", " "),
}));

export type EngineStatus =
  | "idle"
  | "unsupported"
  | "loading"
  | "ready"
  | "generating"
  | "error";

interface UseWebLLMResult {
  status: EngineStatus;
  progress: InitProgressReport | null;
  error: string | null;
  generate: (
    messages: ChatCompletionMessageParam[],
    temperature: number,
    onUpdate?: (content: string) => void,
  ) => Promise<string>;
  cancel: () => Promise<void>;
  retry: () => void;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "An unexpected WebLLM error occurred.";
}

class GenerationCancelledError extends Error {
  constructor() {
    super("Generation cancelled.");
    this.name = "GenerationCancelledError";
  }
}

export function supportsWebGPU(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

export function useWebLLM(
  model: string | null,
  useIndexedDBCache: boolean,
): UseWebLLMResult {
  const engineRef = useRef<MLCEngine | null>(null);
  const generationRef = useRef(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [status, setStatus] = useState<EngineStatus>("idle");
  const [progress, setProgress] = useState<InitProgressReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let createdEngine: MLCEngine | null = null;

    const load = async () => {
      // Lets React's development-only effect replay cancel the first setup
      // before it starts a duplicate model download.
      await Promise.resolve();
      if (cancelled) return;

      generationRef.current += 1;
      const previousEngine = engineRef.current;
      engineRef.current = null;
      if (previousEngine) {
        await previousEngine.interruptGenerate().catch(() => undefined);
        await previousEngine.unload().catch(() => undefined);
      }

      if (!model) {
        setStatus("idle");
        setProgress(null);
        setError(null);
        return;
      }

      if (!supportsWebGPU()) {
        setStatus("unsupported");
        setError(
          "WebGPU is unavailable. Use a current Chrome, Edge, or other WebGPU-enabled browser.",
        );
        return;
      }

      setStatus("loading");
      setError(null);
      setProgress({
        progress: 0,
        timeElapsed: 0,
        text: "Preparing the model…",
      });

      try {
        createdEngine = await CreateMLCEngine(model, {
          initProgressCallback: (report) => {
            if (!cancelled) setProgress(report);
          },
          appConfig: {
            ...prebuiltAppConfig,
            useIndexedDBCache,
          },
        });

        if (cancelled) {
          await createdEngine.unload().catch(() => undefined);
          return;
        }

        engineRef.current = createdEngine;
        setProgress(null);
        setStatus("ready");
      } catch (loadError) {
        if (!cancelled) {
          setError(errorMessage(loadError));
          setProgress(null);
          setStatus("error");
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
      generationRef.current += 1;
      if (createdEngine && engineRef.current === createdEngine) {
        engineRef.current = null;
        void createdEngine
          .interruptGenerate()
          .catch(() => undefined)
          .then(() => createdEngine?.unload())
          .catch(() => undefined);
      }
    };
  }, [model, reloadKey, useIndexedDBCache]);

  const generate = useCallback(
    async (
      messages: ChatCompletionMessageParam[],
      temperature: number,
      onUpdate?: (content: string) => void,
    ) => {
      const engine = engineRef.current;
      if (!engine) throw new Error("Load a model before generating text.");

      const generation = generationRef.current + 1;
      generationRef.current = generation;
      setStatus("generating");
      setError(null);

      try {
        const chunks = await engine.chat.completions.create({
          messages,
          temperature,
          stream: true,
        });
        let content = "";

        for await (const chunk of chunks) {
          if (generationRef.current !== generation) break;
          content += chunk.choices[0]?.delta.content ?? "";
          onUpdate?.(content);
        }

        if (generationRef.current !== generation) {
          throw new GenerationCancelledError();
        }
        setStatus("ready");
        return content;
      } catch (generationError) {
        if (
          generationError instanceof GenerationCancelledError ||
          generationRef.current !== generation
        ) {
          setStatus(engineRef.current ? "ready" : "idle");
          throw new GenerationCancelledError();
        }
        const message = errorMessage(generationError);
        setError(message);
        setStatus("error");
        throw new Error(message, { cause: generationError });
      }
    },
    [],
  );

  const cancel = useCallback(async () => {
    generationRef.current += 1;
    await engineRef.current?.interruptGenerate().catch(() => undefined);
    setStatus(engineRef.current ? "ready" : "idle");
  }, []);

  const retry = useCallback(() => setReloadKey((key) => key + 1), []);

  return { status, progress, error, generate, cancel, retry };
}
