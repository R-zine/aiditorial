import Dexie, { type EntityTable } from "dexie";

interface History {
  id: number;
  model: string;
  mode: "Standard" | "Separate" | "Separate with comparison";
  temperature: number;
  isCache: boolean;
  prompt: string;
}

interface Document {
  id: number;
  name: string;
  content: string[];
  length: number;
}

interface Job {
  id: number;
  name?: string;
  historyId: number;
  documentId: number;
  progress: number;
  editedContent: string[];
}

const db = new Dexie("AIditorialDatabase") as Dexie & {
  history: EntityTable<
    History,
    "id" // primary key "id" (for the typings only)
  >;
  document: EntityTable<
    Document,
    "id" // primary key "id" (for the typings only)
  >;
  job: EntityTable<Job, "id">;
};

// Schema declaration:
db.version(1).stores({
  history: "++id, model, mode, temperature, isCache, prompt", // primary key "id" (for the runtime!)
  document: "++id, name, content, length",
  job: "++id, name, historyId, documentId, progress, editedContent",
});

export type { History, Document, Job };
export { db };
