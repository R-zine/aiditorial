import Dexie, { type EntityTable } from "dexie";

export type EditorMode = "Chat" | "Edit" | "Compare";
export type JobStatus =
  | "pending"
  | "running"
  | "paused"
  | "completed"
  | "error";
export type ParagraphStatus =
  | "pending"
  | "complete"
  | "accepted"
  | "rejected"
  | "error";

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface HistoryRun {
  id: number;
  createdAt: string;
  model: string;
  mode: EditorMode;
  temperature: number;
  isCache: boolean;
  prompt: string;
  input: string;
  output: string;
  messages?: ConversationMessage[];
}

export interface LocalDocument {
  id: number;
  createdAt: string;
  name: string;
  sourceType: "docx" | "odt" | "text";
  content: string[];
  length: number;
}

export interface BatchJob {
  id: number;
  createdAt: string;
  name: string;
  historyId: number;
  documentId: number;
  status: JobStatus;
  progress: number;
  error?: string;
  // Retained only so version-one jobs can be migrated lazily.
  editedContent?: string[];
}

export interface JobParagraph {
  id: number;
  jobId: number;
  index: number;
  originalText: string;
  editedText: string;
  status: ParagraphStatus;
  error?: string;
}

const db = new Dexie("AIditorialDatabase") as Dexie & {
  history: EntityTable<HistoryRun, "id">;
  document: EntityTable<LocalDocument, "id">;
  job: EntityTable<BatchJob, "id">;
  jobParagraph: EntityTable<JobParagraph, "id">;
};

db.version(1).stores({
  history: "++id, model, mode, temperature, isCache, prompt",
  document: "++id, name, content, length",
  job: "++id, name, historyId, documentId, progress, editedContent",
});

db.version(2)
  .stores({
    history: "++id, createdAt, model, mode",
    document: "++id, createdAt, name",
    job: "++id, createdAt, status, historyId, documentId",
    jobParagraph: "++id, &[jobId+index], jobId, status",
  })
  .upgrade(async (transaction) => {
    const createdAt = new Date().toISOString();

    await transaction
      .table<HistoryRun, number>("history")
      .toCollection()
      .modify((run) => {
        run.createdAt ||= createdAt;
        run.mode = normalizeMode(run.mode);
        run.input ||= "";
        run.output ||= "";
      });

    await transaction
      .table<LocalDocument, number>("document")
      .toCollection()
      .modify((document) => {
        document.createdAt ||= createdAt;
        document.sourceType ||= inferSourceType(document.name);
      });

    await transaction
      .table<BatchJob, number>("job")
      .toCollection()
      .modify((job) => {
        job.createdAt ||= createdAt;
        job.name ||= `Batch job ${job.id}`;
        job.status ||= "pending";
      });
  });

export function normalizeMode(mode: string): EditorMode {
  if (mode === "Standard") return "Chat";
  if (mode === "Separate with comparison") return "Compare";
  if (mode === "Separate") return "Edit";
  if (mode === "Chat" || mode === "Compare") return mode;
  return "Edit";
}

export function inferSourceType(name: string): LocalDocument["sourceType"] {
  const extension = name.split(".").pop()?.toLowerCase();
  if (extension === "docx" || extension === "odt") return extension;
  return "text";
}

export { db };
