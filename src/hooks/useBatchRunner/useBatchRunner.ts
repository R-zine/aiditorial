"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CreateMLCEngine,
  prebuiltAppConfig,
  type InitProgressReport,
  type MLCEngine,
} from "@mlc-ai/web-llm";
import {
  db,
  type BatchJob,
  type HistoryRun,
  type LocalDocument,
} from "@/db/db";
import { composePrompt } from "@/lib/editor";
import { ensureJobParagraphs, isCompletedParagraph } from "@/lib/batch";
import { supportsWebGPU } from "@/hooks/useWebLLM/useWebLLM";

export interface BatchRunTarget extends BatchJob {
  history?: HistoryRun;
  document?: LocalDocument;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An unexpected batch error occurred.";
}

export function useBatchRunner() {
  const [activeJobId, setActiveJobId] = useState<number | null>(null);
  const [loadProgress, setLoadProgress] = useState<InitProgressReport | null>(null);
  const [currentParagraph, setCurrentParagraph] = useState<number | null>(null);
  const [streamedParagraph, setStreamedParagraph] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const engineRef = useRef<MLCEngine | null>(null);
  const cancelledRef = useRef(false);
  const runningRef = useRef(false);

  useEffect(
    () => () => {
      cancelledRef.current = true;
      void engineRef.current?.interruptGenerate().catch(() => undefined);
      void engineRef.current?.unload().catch(() => undefined);
      engineRef.current = null;
    },
    [],
  );

  const start = useCallback(
    async (job: BatchRunTarget) => {
      if (!job.history || !job.document || runningRef.current) return;
      if (!supportsWebGPU()) {
        setError(
          "WebGPU is unavailable. Use a current Chrome, Edge, or other WebGPU-enabled browser.",
        );
        return;
      }

      const run = job.history;
      runningRef.current = true;
      cancelledRef.current = false;
      setActiveJobId(job.id);
      setError("");
      setMessage("");
      setLoadProgress({ progress: 0, timeElapsed: 0, text: "Preparing the model…" });
      setStreamedParagraph("");
      try {
        await db.job.update(job.id, { status: "running", error: undefined });
        const paragraphs = await ensureJobParagraphs(job, job.document);
        let completed = paragraphs.filter((paragraph) =>
          isCompletedParagraph(paragraph.status),
        ).length;
        const pending = paragraphs.filter(
          (paragraph) => paragraph.status === "pending" || paragraph.status === "error",
        );

        engineRef.current = await CreateMLCEngine(run.model, {
          initProgressCallback: setLoadProgress,
          appConfig: {
            ...prebuiltAppConfig,
            useIndexedDBCache: run.isCache,
          },
        });
        setLoadProgress(null);

        for (const paragraph of pending) {
          if (cancelledRef.current) break;
          setCurrentParagraph(paragraph.index);
          setStreamedParagraph("");

          try {
            const chunks = await engineRef.current.chat.completions.create({
              messages: [
                {
                  role: "user",
                  content: composePrompt(run.prompt, paragraph.originalText),
                },
              ],
              temperature: run.temperature,
              stream: true,
            });
            let output = "";
            for await (const chunk of chunks) {
              if (cancelledRef.current) break;
              output += chunk.choices[0]?.delta.content ?? "";
              setStreamedParagraph(output);
            }

            if (cancelledRef.current) break;
            if (!output.trim()) throw new Error("The model returned an empty paragraph.");
            await db.jobParagraph.update(paragraph.id, {
              editedText: output,
              status: "complete",
              error: undefined,
            });
            completed += 1;
            await db.job.update(job.id, { progress: completed });
          } catch (paragraphError) {
            const paragraphMessage = errorMessage(paragraphError);
            await db.jobParagraph.update(paragraph.id, {
              status: "error",
              error: paragraphMessage,
            });
            throw paragraphError;
          }
        }

        const finalStatus = cancelledRef.current ? "paused" : "completed";
        await db.job.update(job.id, { status: finalStatus, error: undefined });
        setMessage(
          cancelledRef.current
            ? "Batch job paused. Its completed paragraphs are safe."
            : "Batch job completed and is ready for review.",
        );
      } catch (runError) {
        const runMessage = errorMessage(runError);
        setError(runMessage);
        await db.job.update(job.id, { status: "error", error: runMessage });
      } finally {
        await engineRef.current?.interruptGenerate().catch(() => undefined);
        await engineRef.current?.unload().catch(() => undefined);
        engineRef.current = null;
        setLoadProgress(null);
        setCurrentParagraph(null);
        setStreamedParagraph("");
        setActiveJobId(null);
        runningRef.current = false;
      }
    },
    [],
  );

  const pause = useCallback(async () => {
    cancelledRef.current = true;
    await engineRef.current?.interruptGenerate().catch(() => undefined);
  }, []);

  const clearFeedback = useCallback(() => {
    setError("");
    setMessage("");
  }, []);

  return {
    activeJobId,
    loadProgress,
    currentParagraph,
    streamedParagraph,
    error,
    message,
    start,
    pause,
    clearFeedback,
  };
}
