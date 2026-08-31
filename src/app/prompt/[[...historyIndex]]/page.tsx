"use client";

import { use, useEffect, useMemo, useState } from "react";
import { Copy, History, LoaderCircle, RotateCcw, Send, Square } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  db,
  type ConversationMessage,
  type EditorMode,
} from "@/db/db";
import { composePrompt, modeLabel } from "@/lib/editor";
import {
  availableModels,
  type EngineStatus,
  useWebLLM,
} from "@/hooks/useWebLLM/useWebLLM";
import { cn } from "@/lib/utils";
import { ui } from "@/lib/ui-styles";

const modes: EditorMode[] = ["Chat", "Edit", "Compare"];
const statusColor: Record<EngineStatus, string> = {
  idle: "bg-muted-foreground",
  unsupported: "bg-destructive",
  loading: "bg-[oklch(0.78_0.13_245)]",
  ready: "bg-[oklch(0.74_0.15_155)]",
  generating: "bg-[oklch(0.78_0.13_245)]",
  error: "bg-destructive",
};

function createMessage(
  role: ConversationMessage["role"],
  content: string,
): ConversationMessage {
  return { id: crypto.randomUUID(), role, content };
}

export default function Prompt({
  params,
}: {
  params: Promise<{ historyIndex?: string[] }>;
}) {
  const { historyIndex } = use(params);
  const [model, setModel] = useState<string | null>(null);
  const [mode, setMode] = useState<EditorMode>("Edit");
  const [temperature, setTemperature] = useState(0.2);
  const [isCache, setIsCache] = useState(true);
  const [instruction, setInstruction] = useState(
    "Improve clarity and flow while preserving the author's voice.",
  );
  const [source, setSource] = useState("");
  const [draft, setDraft] = useState("");
  const [result, setResult] = useState("");
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [savedNotice, setSavedNotice] = useState("");
  const [restoreError, setRestoreError] = useState("");
  const [storageError, setStorageError] = useState("");
  const { status, progress, error, generate, cancel, retry } = useWebLLM(
    model,
    isCache,
  );

  useEffect(() => {
    const id = Number(historyIndex?.[0]);
    if (!Number.isFinite(id)) return;

    void db.history
      .get(id)
      .then((run) => {
        if (!run) {
          setRestoreError("That saved run no longer exists.");
          return;
        }
        setModel(run.model);
        setMode(run.mode);
        setTemperature(run.temperature);
        setIsCache(run.isCache);
        setInstruction(run.prompt);
        setSource(run.input);
        setResult(run.output);
        setMessages(run.messages ?? []);
      })
      .catch(() => setRestoreError("The saved run could not be restored."));
  }, [historyIndex]);

  const busy = status === "loading" || status === "generating";
  const canGenerate = status === "ready";
  const statusLabel = useMemo(() => {
    if (status === "idle") return "Choose a model";
    if (status === "loading") return "Loading model";
    if (status === "generating") return "Writing";
    if (status === "ready") return "Ready locally";
    if (status === "unsupported") return "WebGPU unavailable";
    return "Needs attention";
  }, [status]);

  const saveRun = async (
    prompt: string,
    input: string,
    output: string,
    savedMessages?: ConversationMessage[],
  ) => {
    if (!model || !output.trim()) return;
    try {
      setStorageError("");
      await db.history.add({
        createdAt: new Date().toISOString(),
        model,
        mode,
        temperature,
        isCache,
        prompt,
        input,
        output,
        messages: savedMessages,
      });
      setSavedNotice("Saved to local history");
      window.setTimeout(() => setSavedNotice(""), 2500);
    } catch {
      setStorageError(
        "The result was generated, but this browser could not save it to local history.",
      );
    }
  };

  const runEdit = async () => {
    if (!source.trim() || !instruction.trim() || !canGenerate) return;
    setResult("");
    setSavedNotice("");
    try {
      const output = await generate(
        [{ role: "user", content: composePrompt(instruction, source) }],
        temperature,
        setResult,
      );
      await saveRun(instruction.trim(), source.trim(), output);
    } catch {
      // The hook exposes the actionable error in the status panel.
    }
  };

  const sendMessage = async () => {
    const content = draft.trim();
    if (!content || !canGenerate) return;

    const userMessage = createMessage("user", content);
    const assistantMessage = createMessage("assistant", "");
    const requestMessages = [...messages, userMessage];
    setMessages([...requestMessages, assistantMessage]);
    setDraft("");

    try {
      const output = await generate(
        requestMessages.map(({ role, content: messageContent }) => ({
          role,
          content: messageContent,
        })),
        temperature,
        (partial) =>
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantMessage.id
                ? { ...message, content: partial }
                : message,
            ),
          ),
      );
      const completedMessages = [
        ...requestMessages,
        { ...assistantMessage, content: output },
      ];
      setMessages(completedMessages);
      await saveRun(content, content, output, completedMessages);
    } catch {
      // The hook exposes the actionable error in the status panel.
    }
  };

  return (
    <div className={ui.page}>
      <section className={ui.pageHeading}>
        <div>
          <p className={ui.eyebrow}>Local writing workspace</p>
          <h1 className={ui.pageTitle}>Editor</h1>
          <p className={ui.pageDescription}>
            Your text stays in this browser. Models are downloaded once and run
            through WebGPU on your device.
          </p>
        </div>
        <Badge variant="outline" className="gap-2 px-3 py-2">
          <span className={cn("size-2 rounded-full", statusColor[status])} />
          {statusLabel}
        </Badge>
      </section>

      {(restoreError || storageError || error) && (
        <div className={cn(ui.notice, ui.noticeError)} role="alert">
          <span>{restoreError || storageError || error}</span>
          {status === "error" && (
            <Button size="sm" variant="outline" onClick={retry}>
              <RotateCcw /> Retry
            </Button>
          )}
        </div>
      )}

      <Card className={ui.surfaceCard}>
        <CardHeader className={ui.cardHeader}>
          <CardTitle>Model and output</CardTitle>
          <CardDescription>
            Start with a small instruct model if you are unsure what your device
            can hold. Switching model or cache mode releases the current engine.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-[minmax(0,2fr)_minmax(8rem,0.6fr)_minmax(12rem,0.8fr)] items-end gap-4 max-[850px]:grid-cols-1">
          <div className={ui.stack}>
            <Label htmlFor="model">Model</Label>
            <Select value={model ?? ""} onValueChange={setModel} disabled={busy}>
              <SelectTrigger id="model">
                <SelectValue placeholder="Choose a WebLLM model" />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {availableModels.map((availableModel) => (
                  <SelectItem key={availableModel.id} value={availableModel.id}>
                    {availableModel.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className={ui.stack}>
            <Label htmlFor="temperature">Temperature</Label>
            <Input
              id="temperature"
              type="number"
              min={0}
              max={2}
              step={0.1}
              value={temperature}
              onChange={(event) => setTemperature(Number(event.target.value))}
              disabled={busy}
            />
          </div>
          <Label
            className="flex min-h-10 cursor-pointer items-center gap-3"
            htmlFor="cache-model"
          >
            <Checkbox
              id="cache-model"
              checked={isCache}
              onCheckedChange={(checked) => setIsCache(checked === true)}
              disabled={busy}
            />
            <span className="flex flex-col gap-0.5">
              Cache model
              <small className="font-normal text-muted-foreground">
                Allows reuse without downloading it again.
              </small>
            </span>
          </Label>
        </CardContent>
        {status === "loading" && progress && (
          <div className="flex flex-col gap-2.5 px-6 pb-6" aria-live="polite">
            <div className={ui.progressDetails}>
              <span>{progress.text}</span>
              <span>{Math.round(progress.progress * 100)}%</span>
            </div>
            <progress value={progress.progress} max={1} />
          </div>
        )}
      </Card>

      <Tabs
        value={mode}
        onValueChange={(value) => setMode(value as EditorMode)}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span
            id="editor-mode-label"
            className="text-xs font-bold tracking-[0.1em] text-muted-foreground uppercase"
          >
            Editor mode
          </span>
          <TabsList aria-labelledby="editor-mode-label">
            {modes.map((editorMode) => (
              <TabsTrigger key={editorMode} value={editorMode} disabled={busy}>
                {modeLabel(editorMode)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      {mode === "Chat" ? (
        <Card className={cn(ui.surfaceCard, "[&_textarea]:min-h-80")}>
          <CardHeader className={ui.cardHeader}>
            <CardTitle>Conversation</CardTitle>
            <CardDescription>
              Use Enter for a new line and Ctrl/⌘ + Enter to send.
            </CardDescription>
          </CardHeader>
          <CardContent className={ui.stack}>
            <div
              className="flex min-h-72 max-h-136 flex-col gap-3 overflow-y-auto p-1.5"
              aria-live="polite"
            >
              {messages.length ? (
                messages.map((message) => (
                  <article
                    key={message.id}
                    className={cn(
                      "w-[min(80%,760px)] rounded-2xl border border-border bg-[oklch(0.12_0.012_285/65%)] px-4 py-3.5 max-sm:w-[94%]",
                      message.role === "user" &&
                        "self-end bg-[oklch(0.27_0.06_285/60%)]",
                    )}
                  >
                    <span className="mb-1.5 block text-[0.7rem] font-bold text-muted-foreground uppercase">
                      {message.role === "user" ? "You" : "AIditorial"}
                    </span>
                    <p className={ui.preWrap}>{message.content || "…"}</p>
                  </article>
                ))
              ) : (
                <div className={cn(ui.emptyState, ui.compactEmpty)}>
                  Ask for an edit, critique, rewrite, or explanation.
                </div>
              )}
            </div>
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder="Paste a passage or ask a writing question…"
              rows={6}
              disabled={busy}
            />
            <div className={ui.actionRow}>
              {status === "generating" ? (
                <Button variant="outline" onClick={() => void cancel()}>
                  <Square /> Stop
                </Button>
              ) : (
                <Button onClick={() => void sendMessage()} disabled={!canGenerate || !draft.trim()}>
                  <Send /> Send
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => setMessages([])}
                disabled={busy || !messages.length}
              >
                Clear conversation
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 items-stretch gap-4 max-[850px]:grid-cols-1">
          <Card className={cn(ui.surfaceCard, "h-full")}>
            <CardHeader className="min-h-24 gap-2 max-[850px]:min-h-0">
              <CardTitle>Instruction</CardTitle>
              <CardDescription>
                Add {"<<PARAGRAPH>>"}, {"<<CONTEXT>>"}, or {"{{text}}"} where
                the source should appear, or leave it out to append the text.
              </CardDescription>
            </CardHeader>
            <CardContent className={cn(ui.stack, "flex-1")}>
              <Textarea
                value={instruction}
                onChange={(event) => setInstruction(event.target.value)}
                className="min-h-28 resize-y"
                rows={5}
                disabled={busy}
              />
              <Label htmlFor="source-text">Text to edit</Label>
              <Textarea
                id="source-text"
                value={source}
                onChange={(event) => setSource(event.target.value)}
                className="min-h-72 resize-y"
                placeholder="Paste your essay, scene, or paragraph…"
                rows={14}
                disabled={busy}
              />
              <div className={ui.actionRow}>
                {status === "generating" ? (
                  <Button variant="outline" onClick={() => void cancel()}>
                    <Square /> Stop
                  </Button>
                ) : (
                  <Button
                    onClick={() => void runEdit()}
                    disabled={!canGenerate || !source.trim() || !instruction.trim()}
                  >
                    {status === "loading" ? (
                      <LoaderCircle className="animate-spin" />
                    ) : (
                      <Send />
                    )}
                    Edit locally
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSource("");
                    setResult("");
                  }}
                  disabled={busy || (!source && !result)}
                >
                  Clear text
                </Button>
                {savedNotice && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground [&_svg]:size-3.5">
                    <History /> {savedNotice}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className={cn(ui.surfaceCard, "h-full")}>
            <CardHeader className="flex min-h-24 flex-row items-start justify-between gap-6 max-[850px]:min-h-0">
              <div>
                <CardTitle>{mode === "Compare" ? "Before and after" : "Edited result"}</CardTitle>
                <CardDescription>Generated output streams here as it is written.</CardDescription>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void navigator.clipboard.writeText(result)}
                disabled={!result}
              >
                <Copy /> Copy
              </Button>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              {mode === "Compare" && source ? (
                <div className={cn(ui.comparisonGrid, "h-full flex-1")}>
                  <div>
                    <span>Original</span>
                    <p>{source}</p>
                  </div>
                  <div>
                    <span>Edited</span>
                    <p>{result || "The edited text will appear here."}</p>
                  </div>
                </div>
              ) : (
                <div
                  className={cn(
                    ui.preWrap,
                    "min-h-72 flex-1 rounded-xl border border-border bg-[oklch(0.12_0.012_285/60%)] p-4",
                    !result && "text-muted-foreground",
                  )}
                  aria-live="polite"
                >
                  {result || "The edited text will appear here."}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
