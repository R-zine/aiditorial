# ✨ Local Literature Editor with WebLLM

A **Next.js** web application that lets you edit and refine writing — literature, essays, school work, whatever — directly **in your browser** using in-browser LLMs (WebLLM). Everything (models, prompts, results, and metadata) is stored locally using **IndexedDB (Dexie.js)**. Once a model is loaded into the browser, you can continue editing offline.

---

## Table of Contents

- [Features](#%EF%B8%8F-features)
- [Tech Stack](#%EF%B8%8F-tech-stack)
- [Project Structure](#%EF%B8%8F-project-structure)
- [Getting Started](#%EF%B8%8F-getting-started)
- [Usage Guide](#%EF%B8%8F-usage-guide)
- [Batch Jobs](#%EF%B8%8F-batch-jobs)
- [History and Persistence](#%EF%B8%8F-history-and-persistence)
- [Offline / Privacy](#%EF%B8%8F-offline--privacy)
- [Roadmap](#%EF%B8%8F-roadmap)
- [Contributing](#%EF%B8%8F-contributing)
- [License](#%EF%B8%8F-license)

---

## 🚀 Features

- **Playground / Editor** — Load different WebLLM models, edit text, compare outputs and choose the best edit.
- **Model Comparison** — Run the same prompt against multiple models side-by-side, quickly compare quality and style.
- **Save to History** — Save outputs, prompts, and model settings for later reuse.
- **Batch Jobs** — Import `.docx` or `.odt` documents, apply a chosen prompt + model to every paragraph, then export the edited result.
- **Local-first** — Uses Dexie (IndexedDB) for local storage. Your data stays in the browser.
- **Offline-capable** — After loading a model into memory/cache, you can disconnect from the network and continue using the app.

---

## 🛠️ Tech Stack

- **Next.js** — Application framework (React + routing + SSR/SSG as needed).
- **WebLLM** — Run LLMs directly in-browser (model files can be cached to enable offline usage).
- **Dexie.js** — IndexedDB wrapper to persist models, prompts, outputs, job definitions and history.
- **mammoth / @nativedocx / odt-parsers** — Tools to parse `.docx` / `.odt` for importing and exporting (your implementation may pick preferred libraries).
- **react-quill / tiptap / slate** — Rich text editor used in the editor view.

---

## 📂 Project Structure

```
├── pages/                # Next.js routes
│   ├── index.tsx         # Editor / playground (load models, prompt UI, compare pane)
│   ├── history.tsx       # View saved edits, prompts, and model settings
│   ├── batch.tsx         # Create/manage/execute batch jobs
│   └── api/ (optional)   # Optional helpers if any server is used (minimal or none)

├── components/           # Reusable UI components
├── lib/                  # Utilities (dexie wrapper, doc parsers, model loader helpers)
├── styles/               # CSS / Tailwind
├── public/               # Static assets
├── scripts/              # Helpers (build, pre-cache models, etc.)
└── README.md             # This file
```

---

## ⚡ Getting Started

1. Clone the repository

```bash
git clone https://github.com/yourusername/webllm-literature-editor.git
cd webllm-literature-editor
```

2. Install dependencies

```bash
npm install
# or
# yarn
```

3. Run the dev server

```bash
npm run dev
# open http://localhost:3000
```

4. Load a model

- Open the editor page.
- Choose a model from the model selector and **Load** it.
- Wait for the model to initialize and (optionally) cache to IndexedDB.
- Once loaded, you can try disconnecting the network and continue working.

> **Note:** Actual offline capability depends on how the model files are cached and how WebLLM is integrated. The app ships tools to cache model artefacts to IndexedDB or browser cache where feasible.

---

## 📖 Usage Guide

### Editor / Playground

- Paste or type any text you want edited.
- Choose a model + prompt. Prompts support templating (e.g. `<<PARAGRAPH>>` or `<<CONTEXT>>`).
- Run the prompt: the model returns edited text.
- Use the comparison view to run the same prompt across multiple models.
- Save a particular edited version to **History** (includes model id, model settings, prompt, input and output).

### History

- Browse all saved runs.
- Re-open a saved run to re-run (if model available) or to copy/export the saved output.
- Each history item stores: timestamp, model identifier, model settings, prompt text, input snapshot, output snapshot, and optional user notes.

---

## 🔁 Batch Jobs

Batch jobs let you take a `.docx` / `.odt` import and apply the same prompt+model settings to every paragraph.

**Workflow**:

1. Create a new batch job and upload a `.docx` or `.odt` file.
2. The importer parses the document into paragraphs (preserving lightweight metadata and headings where possible).
3. Choose a model and prompt. Optionally tweak temperature, max tokens, or other model-specific settings.
4. Start the job — the app will loop over the paragraphs and run the prompt for each one.
5. Review results in the job's run page. You can accept/reject per-paragraph edits.
6. Export the edited document back to `.docx` or `.odt` with the accepted edits.

**Implementation notes**:

- Use `mammoth` (or similar) to extract paragraphs from `.docx` into plain text segments for processing.
- Keep a mapping between original document structure and paragraph IDs so you can place edited text back in the right slots.
- Batch runs are run locally and persisted in Dexie so they can be resumed.

---

## 🗄️ History & Persistence (Dexie / IndexedDB)

The app stores the following locally:

- Cached models (when feasible)
- Saved runs / history entries (prompt, input, output, metadata)
- Saved job definitions and job results
- User preferences (UI settings, last-used model, etc.)

**Dexie schema (example)**

```
db.version(1).stores({
  models: 'id, name, size, cachedAt',
  runs: '++id, timestamp, modelId, prompt',
  jobs: '++id, name, status, createdAt',
  paragraphs: '++id, jobId, paragraphIndex, originalText, editedText, status'
});
```

---

## 🔒 Offline & Privacy

- **Local-first**: everything is stored locally in the browser using IndexedDB via Dexie. The app does not send your text to a remote server by default.
- **Model caching**: WebLLM model files may be downloaded and cached in the browser; once present, the models can be used offline. The exact feasibility depends on browser storage limits and the model size.
- **Security**: Keep in mind that browser storage is device-local. Anyone with access to your device/profile/browser can read the data unless you add an encryption layer.

---

## 🗺️ Roadmap (Ideas)

- Export to Markdown and PDF
- Model scoring / automated quality metrics
- Add more robust ODT support and round-trip fidelity
- UI notebooks for comparing multiple runs and fine-tuning prompts
- Optional encrypted storage layer for history

---

## 🤝 Contributing

Contributions welcome — small PRs, bugfixes, or suggestions for UX improvements. Please open issues for feature requests or bugs.

Suggested workflow:

```bash
# fork -> branch -> PR
git checkout -b feat/your-feature
# implement
git push
# open PR
```

---

## 📜 License

This project is provided under the **MIT License**. See the `LICENSE` file for details.

---

## FAQ

**Q: Do I need a server?**
A: No — the app is intended to be a local-first single-page app. Some optional helpers (e.g., model prefetching endpoints) can exist but are not required for core editing.

**Q: How big a model can I load?**
A: Browser storage and memory limits apply. Smaller quantized models will be far more practical for offline usage.

**Q: Is the edited document guaranteed to preserve formatting?**
A: The import/export pipeline attempts to preserve structure (headings, paragraphs). Complex styling, tracked changes, or embedded objects may not round-trip perfectly depending on the parser library used.

---

If you want, I can also generate:

- A **developer-focused README** (adding architecture diagrams and code snippets for the model loader, Dexie schema & batch job runner).
- A **user-focused quick start** meant for non-technical writers (screenshots + step-by-step with examples).

Which variant would you like next?
