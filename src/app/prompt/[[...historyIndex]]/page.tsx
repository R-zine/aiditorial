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
import { availableModels, useWebLLM } from "@/hooks/useWebLLM/useWebLLM";

const modes: EditorMode[] = ["Chat", "Edit", "Compare"];

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
    <div className="app-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Local writing workspace</p>
          <h1>Editor</h1>
          <p>
            Your text stays in this browser. Models are downloaded once and run
            through WebGPU on your device.
          </p>
        </div>
        <Badge variant="outline" className="status-badge">
          <span className={`status-dot status-${status}`} />
          {statusLabel}
        </Badge>
      </section>

      {(restoreError || storageError || error) && (
        <div className="notice notice-error" role="alert">
          <span>{restoreError || storageError || error}</span>
          {status === "error" && (
            <Button size="sm" variant="outline" onClick={retry}>
              <RotateCcw /> Retry
            </Button>
          )}
        </div>
      )}

      <Card className="surface-card">
        <CardHeader>
          <CardTitle>Model and output</CardTitle>
          <CardDescription>
            Start with a small instruct model if you are unsure what your device
            can hold. Switching model or cache mode releases the current engine.
          </CardDescription>
        </CardHeader>
        <CardContent className="settings-grid">
          <div className="field-stack settings-model">
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
          <div className="field-stack">
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
          <Label className="cache-control" htmlFor="cache-model">
            <Checkbox
              id="cache-model"
              checked={isCache}
              onCheckedChange={(checked) => setIsCache(checked === true)}
              disabled={busy}
            />
            <span>
              Cache model
              <small>Allows reuse without downloading it again.</small>
            </span>
          </Label>
        </CardContent>
        {status === "loading" && progress && (
          <div className="model-progress" aria-live="polite">
            <div>
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
        className="workspace-tabs"
      >
        <TabsList aria-label="Editor mode">
          {modes.map((editorMode) => (
            <TabsTrigger key={editorMode} value={editorMode} disabled={busy}>
              {modeLabel(editorMode)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {mode === "Chat" ? (
        <Card className="surface-card editor-card">
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
            <CardDescription>
              Use Enter for a new line and Ctrl/⌘ + Enter to send.
            </CardDescription>
          </CardHeader>
          <CardContent className="editor-stack">
            <div className="conversation" aria-live="polite">
              {messages.length ? (
                messages.map((message) => (
                  <article key={message.id} className={`message ${message.role}`}>
                    <span>{message.role === "user" ? "You" : "AIditorial"}</span>
                    <p>{message.content || "…"}</p>
                  </article>
                ))
              ) : (
                <div className="empty-state compact">
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
            <div className="action-row">
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
        <div className="edit-workspace">
          <Card className="surface-card editor-card">
            <CardHeader>
              <CardTitle>Instruction</CardTitle>
              <CardDescription>
                Add {"<<PARAGRAPH>>"}, {"<<CONTEXT>>"}, or {"{{text}}"} where
                the source should appear, or leave it out to append the text.
              </CardDescription>
            </CardHeader>
            <CardContent className="editor-stack">
              <Textarea
                value={instruction}
                onChange={(event) => setInstruction(event.target.value)}
                rows={5}
                disabled={busy}
              />
              <Label htmlFor="source-text">Text to edit</Label>
              <Textarea
                id="source-text"
                value={source}
                onChange={(event) => setSource(event.target.value)}
                placeholder="Paste your essay, scene, or paragraph…"
                rows={14}
                disabled={busy}
              />
              <div className="action-row">
                {status === "generating" ? (
                  <Button variant="outline" onClick={() => void cancel()}>
                    <Square /> Stop
                  </Button>
                ) : (
                  <Button
                    onClick={() => void runEdit()}
                    disabled={!canGenerate || !source.trim() || !instruction.trim()}
                  >
                    {status === "loading" ? <LoaderCircle className="spin" /> : <Send />}
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
                {savedNotice && <span className="saved-notice"><History /> {savedNotice}</span>}
              </div>
            </CardContent>
          </Card>

          <Card className="surface-card result-card">
            <CardHeader>
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
            <CardContent>
              {mode === "Compare" && source ? (
                <div className="comparison-grid">
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
                <div className={`result-copy ${result ? "" : "muted-copy"}`}>
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
