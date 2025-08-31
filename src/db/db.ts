import Dexie, { type EntityTable } from "dexie";

interface History {
  id: number;
  model: string;
  mode: "Standard" | "Separate" | "Separate with comparison";
  temperature: number;
  isCache: boolean;
  prompt: string;
}

const db = new Dexie("HistoriesDatabase") as Dexie & {
  history: EntityTable<
    History,
    "id" // primary key "id" (for the typings only)
  >;
};

// Schema declaration:
db.version(1).stores({
  history: "++id, model, mode, temperature, isCache, prompt", // primary key "id" (for the runtime!)
});

export type { History };
export { db };
