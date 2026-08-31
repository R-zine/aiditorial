"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Check,
  Copy,
  Download,
  FilePlus2,
  FileText,
  LoaderCircle,
  Pause,
  Play,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  db,
  type BatchJob,
  type JobParagraph,
  type LocalDocument,
} from "@/db/db";
import { downloadText, parseDocument, type ParsedDocument } from "@/lib/documents";
import { acceptedDocumentText, safeFilename } from "@/lib/editor";
import { cn } from "@/lib/utils";
import { deleteBatchJob, ensureJobParagraphs } from "@/lib/batch";
import {
  useBatchRunner,
  type BatchRunTarget,
} from "@/hooks/useBatchRunner/useBatchRunner";

type BatchView = "documents" | "create" | "jobs";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An unexpected batch error occurred.";
}

export default function BatchPage() {
  const documents = useLiveQuery(() => db.document.orderBy("createdAt").reverse().toArray());
  const runs = useLiveQuery(() => db.history.orderBy("createdAt").reverse().toArray());
  const jobs = useLiveQuery(() => db.job.orderBy("createdAt").reverse().toArray());
  const [view, setView] = useState<BatchView>("documents");
  const [parsedDocument, setParsedDocument] = useState<ParsedDocument | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [importError, setImportError] = useState("");
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [selectedRunId, setSelectedRunId] = useState("");
  const [jobName, setJobName] = useState("");
  const [notice, setNotice] = useState("");
  const [operationError, setOperationError] = useState("");
  const [previewId, setPreviewId] = useState<number | null>(null);
  const {
    activeJobId,
    loadProgress,
    currentParagraph,
    streamedParagraph,
    error: batchError,
    message: runnerMessage,
    start: startJob,
    pause: pauseJob,
    clearFeedback,
  } = useBatchRunner();

  const previewParagraphs = useLiveQuery<JobParagraph[], JobParagraph[]>(
    () =>
      previewId === null
        ? Promise.resolve([] as JobParagraph[])
        : db.jobParagraph.where("jobId").equals(previewId).sortBy("index"),
    [previewId],
    [] as JobParagraph[],
  );

  const joinedJobs = useMemo<BatchRunTarget[]>(
    () =>
      (jobs ?? []).map((job) => ({
        ...job,
        history: runs?.find((run) => run.id === job.historyId),
        document: documents?.find((document) => document.id === job.documentId),
      })),
    [documents, jobs, runs],
  );

  const performLocalOperation = async (operation: () => Promise<void>) => {
    try {
      setOperationError("");
      await operation();
    } catch (error) {
      setOperationError(errorMessage(error));
    }
  };

  const ingestFile = async (file: File | undefined) => {
    if (!file) return;
    setImportError("");
    try {
      const parsed = await parseDocument(file);
      setParsedDocument(parsed);
      setDocumentName(parsed.name);
    } catch (error) {
      setImportError(errorMessage(error));
    }
  };

  const saveDocument = async () => {
    if (!parsedDocument || !documentName.trim()) return;
    try {
      setOperationError("");
      const id = await db.document.add({
        createdAt: new Date().toISOString(),
        name: documentName.trim(),
        sourceType: parsedDocument.sourceType,
        content: parsedDocument.content,
        length: parsedDocument.content.length,
      });
      setParsedDocument(null);
      setDocumentName("");
      setSelectedDocumentId(String(id));
      setView("create");
      setNotice("Document saved locally.");
    } catch (error) {
      setOperationError(errorMessage(error));
    }
  };

  const createJob = async () => {
    const documentId = Number(selectedDocumentId);
    const historyId = Number(selectedRunId);
    const document = documents?.find((item) => item.id === documentId);
    const run = runs?.find((item) => item.id === historyId);
    if (!document || !run) return;

    try {
      setOperationError("");
      await db.transaction("rw", db.job, db.jobParagraph, async () => {
        const id = await db.job.add({
          createdAt: new Date().toISOString(),
          name: jobName.trim() || `${document.name} edit`,
          historyId,
          documentId,
          status: "pending",
          progress: 0,
        });
        await db.jobParagraph.bulkAdd(
          document.content.map((originalText, index) => ({
            jobId: id,
            index,
            originalText,
            editedText: "",
            status: "pending",
          })),
        );
      });

      setJobName("");
      setView("jobs");
      setNotice("Batch job created.");
    } catch (error) {
      setOperationError(errorMessage(error));
    }
  };

  const setParagraphStatus = async (id: number, status: "accepted" | "rejected") => {
    await performLocalOperation(async () => {
      await db.jobParagraph.update(id, { status });
    });
  };

  const acceptAll = async () => {
    if (previewId === null) return;
    await performLocalOperation(async () => {
      await db.jobParagraph
        .where("jobId")
        .equals(previewId)
        .filter((paragraph) => paragraph.status === "complete")
        .modify({ status: "accepted" });
    });
  };

  const deleteJob = async (job: BatchJob) => {
    if (!window.confirm(`Delete “${job.name}” and all of its results?`)) return;
    await performLocalOperation(async () => {
      await deleteBatchJob(job.id);
      if (previewId === job.id) setPreviewId(null);
    });
  };

  const openPreview = async (job: BatchRunTarget) => {
    await performLocalOperation(async () => {
      if (job.document) await ensureJobParagraphs(job, job.document);
      setPreviewId(job.id);
    });
  };

  const deleteDocument = async (document: LocalDocument) => {
    await performLocalOperation(async () => {
      const linkedJobs = await db.job.where("documentId").equals(document.id).count();
      if (linkedJobs) {
        setNotice("Delete this document's batch jobs before deleting the document.");
        return;
      }
      if (!window.confirm(`Delete “${document.name}” from this browser?`)) return;
      await db.document.delete(document.id);
    });
  };

  const previewJob = joinedJobs.find((job) => job.id === previewId);
  const exportPreview = (extension: "txt" | "md") => {
    if (!previewJob?.document || !previewParagraphs?.length) return;
    const content = acceptedDocumentText(previewParagraphs);
    const basename = safeFilename(previewJob.document.name);
    downloadText(
      `${basename}-edited.${extension}`,
      content,
      extension === "md" ? "text/markdown;charset=utf-8" : undefined,
    );
  };

  return (
    <div className="app-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Paragraph-by-paragraph, on device</p>
          <h1>Batch workspace</h1>
          <p>Import plain document text, resume local edits, review changes, and export.</p>
        </div>
      </section>

      <Tabs value={view} onValueChange={(value) => setView(value as BatchView)}>
        <TabsList aria-label="Batch workspace section">
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="create">Create job</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
        </TabsList>
      </Tabs>

      {(notice || operationError || batchError || runnerMessage) && (
        <div
          className={`notice ${operationError || batchError ? "notice-error" : ""}`}
          role={operationError || batchError ? "alert" : "status"}
        >
          <span>{operationError || batchError || notice || runnerMessage}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setNotice("");
              setOperationError("");
              clearFeedback();
            }}
          >
            Dismiss
          </Button>
        </div>
      )}

      {view === "documents" && (
        <div className="batch-grid">
          <Card className="surface-card">
            <CardHeader>
              <CardTitle>Import document text</CardTitle>
              <CardDescription>
                DOCX and ODT files up to 25 MB. Imports are local and intentionally
                plain-text; complex formatting is not preserved.
              </CardDescription>
            </CardHeader>
            <CardContent className="editor-stack">
              <label className={cn(buttonVariants({ variant: "outline" }), "file-picker")}>
                <FilePlus2 /> Choose DOCX or ODT
                <input
                  type="file"
                  accept=".docx,.odt,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.oasis.opendocument.text"
                  onChange={(event) => void ingestFile(event.target.files?.[0])}
                />
              </label>
              {importError && <p className="field-error">{importError}</p>}
              {parsedDocument && (
                <div className="document-preview">
                  <Label htmlFor="document-name">Document name</Label>
                  <Input
                    id="document-name"
                    value={documentName}
                    onChange={(event) => setDocumentName(event.target.value)}
                  />
                  <p>{parsedDocument.content.length} editable paragraphs found.</p>
                  <ul>
                    {parsedDocument.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                  <div className="preview-scroll">
                    {parsedDocument.content.slice(0, 20).map((paragraph, index) => (
                      <p key={`${index}-${paragraph.slice(0, 20)}`}>{paragraph}</p>
                    ))}
                    {parsedDocument.content.length > 20 && <p>…and more</p>}
                  </div>
                  <div className="action-row">
                    <Button onClick={() => void saveDocument()} disabled={!documentName.trim()}>
                      Save locally
                    </Button>
                    <Button variant="ghost" onClick={() => setParsedDocument(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="surface-card">
            <CardHeader>
              <CardTitle>Local documents</CardTitle>
              <CardDescription>Only extracted paragraphs are stored.</CardDescription>
            </CardHeader>
            <CardContent className="document-list">
              {documents?.length ? (
                documents.map((document) => (
                  <div key={document.id} className="document-row">
                    <FileText aria-hidden="true" />
                    <div>
                      <strong>{document.name}</strong>
                      <span>{document.length} paragraphs · {document.sourceType.toUpperCase()}</span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Delete ${document.name}`}
                      onClick={() => void deleteDocument(document)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="empty-state compact">No imported documents yet.</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {view === "create" && (
        <Card className="surface-card form-card">
          <CardHeader>
            <CardTitle>Create batch job</CardTitle>
            <CardDescription>
              Reuse the instruction and model settings from a successful editor run.
            </CardDescription>
          </CardHeader>
          <CardContent className="form-grid">
            <div className="field-stack">
              <Label htmlFor="job-document">Document</Label>
              <Select value={selectedDocumentId} onValueChange={setSelectedDocumentId}>
                <SelectTrigger id="job-document">
                  <SelectValue placeholder="Choose a document" />
                </SelectTrigger>
                <SelectContent>
                  {documents?.map((document) => (
                    <SelectItem key={document.id} value={String(document.id)}>
                      {document.name} · {document.length} paragraphs
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="field-stack">
              <Label htmlFor="job-run">Saved instruction</Label>
              <Select value={selectedRunId} onValueChange={setSelectedRunId}>
                <SelectTrigger id="job-run">
                  <SelectValue placeholder="Choose a saved run" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {runs?.map((run) => (
                    <SelectItem key={run.id} value={String(run.id)}>
                      {run.prompt.slice(0, 80)} · {run.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="field-stack">
              <Label htmlFor="job-name">Job name</Label>
              <Input
                id="job-name"
                value={jobName}
                onChange={(event) => setJobName(event.target.value)}
                placeholder="Optional"
              />
            </div>
            <Button
              onClick={() => void createJob()}
              disabled={!selectedDocumentId || !selectedRunId}
            >
              Create job
            </Button>
            {(!documents?.length || !runs?.length) && (
              <p className="form-hint">
                {!documents?.length ? "Import a document first. " : ""}
                {!runs?.length ? "Complete an editor run first." : ""}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {view === "jobs" && (
        <div className="job-stack">
          {activeJobId !== null && (
            <Card className="surface-card active-job-card">
              <CardHeader>
                <div>
                  <p className="eyebrow">Running locally</p>
                  <CardTitle>{joinedJobs.find((job) => job.id === activeJobId)?.name}</CardTitle>
                </div>
                <Button variant="outline" onClick={() => void pauseJob()}>
                  <Pause /> Pause safely
                </Button>
              </CardHeader>
              <CardContent>
                {loadProgress ? (
                  <div className="model-progress">
                    <div>
                      <span>{loadProgress.text}</span>
                      <span>{Math.round(loadProgress.progress * 100)}%</span>
                    </div>
                    <progress value={loadProgress.progress} max={1} />
                  </div>
                ) : (
                  <div className="stream-preview" aria-live="polite">
                    <span>Paragraph {(currentParagraph ?? 0) + 1}</span>
                    <p>{streamedParagraph || "Generating…"}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {joinedJobs.length ? (
            joinedJobs.map((job) => (
              <Card key={job.id} className="surface-card job-card">
                <CardHeader>
                  <div>
                    <div className="run-meta">
                      <Badge variant={job.status === "error" ? "destructive" : "secondary"}>
                        {job.status}
                      </Badge>
                      <span>{job.progress}/{job.document?.length ?? 0} complete</span>
                    </div>
                    <CardTitle>{job.name}</CardTitle>
                    <p className="model-name">
                      {job.document?.name ?? "Missing document"} · {job.history?.model ?? "Missing run"}
                    </p>
                  </div>
                  <div className="action-row compact-actions">
                    {job.status !== "completed" && (
                      <Button
                        size="sm"
                        onClick={() => void startJob(job)}
                        disabled={activeJobId !== null || !job.history || !job.document}
                      >
                        {activeJobId === job.id ? <LoaderCircle className="spin" /> : <Play />}
                        {job.progress ? "Resume" : "Start"}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void openPreview(job)}
                    >
                      Review
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Delete ${job.name}`}
                      disabled={activeJobId === job.id}
                      onClick={() => void deleteJob(job)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <progress value={job.progress} max={job.document?.length || 1} />
                  {job.error && <p className="field-error">{job.error}</p>}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="empty-state">
              <h2>No batch jobs yet</h2>
              <p>Create one from an imported document and saved editor run.</p>
              <Button onClick={() => setView("create")}>Create a job</Button>
            </div>
          )}
        </div>
      )}

      {previewId !== null && previewJob && (
        <section className="review-panel">
          <div className="review-heading">
            <div>
              <p className="eyebrow">Review changes</p>
              <h2>{previewJob.name}</h2>
              <p>Accept an edit or reject it to keep the original paragraph.</p>
            </div>
            <div className="action-row compact-actions">
              <Button variant="outline" size="sm" onClick={() => void acceptAll()}>
                <Check /> Accept all ready
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportPreview("txt")}>
                <Download /> TXT
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportPreview("md")}>
                <Download /> Markdown
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  void navigator.clipboard.writeText(acceptedDocumentText(previewParagraphs ?? []))
                }
              >
                <Copy /> Copy
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setPreviewId(null)}>
                Close
              </Button>
            </div>
          </div>
          <div className="paragraph-review-list">
            {previewParagraphs?.map((paragraph) => (
              <article key={paragraph.id} className="paragraph-review">
                <header>
                  <span>Paragraph {paragraph.index + 1}</span>
                  <Badge variant="outline">{paragraph.status}</Badge>
                </header>
                <div className="comparison-grid">
                  <div>
                    <span>Original</span>
                    <p>{paragraph.originalText}</p>
                  </div>
                  <div>
                    <span>Edited</span>
                    <p>{paragraph.editedText || paragraph.error || "Not generated yet."}</p>
                  </div>
                </div>
                {paragraph.editedText && (
                  <footer>
                    <Button
                      size="sm"
                      variant={paragraph.status === "accepted" ? "default" : "outline"}
                      onClick={() => void setParagraphStatus(paragraph.id, "accepted")}
                    >
                      <Check /> Accept edit
                    </Button>
                    <Button
                      size="sm"
                      variant={paragraph.status === "rejected" ? "destructive" : "outline"}
                      onClick={() => void setParagraphStatus(paragraph.id, "rejected")}
                    >
                      <X /> Keep original
                    </Button>
                  </footer>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
