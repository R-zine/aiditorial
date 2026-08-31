# AIditorial

AIditorial is a local-first writing editor built with Next.js and WebLLM. It
runs language-model inference through WebGPU in the browser and stores editor
runs, extracted document text, and batch progress in IndexedDB.

The application has no text-processing backend. WebLLM downloads model assets
when a model is selected; prompts and document content are then processed on
the device.

## What is implemented

- Streamed local chat, focused editing, and original/edited comparison views.
- WebLLM model selection, download progress, browser caching, retry,
  cancellation, and engine cleanup.
- Prompt templates using `<<PARAGRAPH>>`, `<<CONTEXT>>`, or `{{text}}`.
- Complete local run history containing the instruction, source, output,
  conversation, model, settings, and timestamp.
- Client-side plain-text extraction from DOCX and ODT files up to 25 MB.
- Resumable paragraph-by-paragraph batch jobs with progress checkpoints.
- Per-paragraph accept/reject review and TXT, Markdown, or clipboard export.
- A versioned Dexie schema that upgrades existing version-one browser data.
- Type checking, linting, focused unit tests, and GitHub Actions CI.

## Deliberate limitations

- DOCX and ODT imports are converted to paragraphs. Formatting, tables, images,
  tracked changes, comments, and other document structure are not preserved.
- Exports are plain text or Markdown, not round-tripped DOCX/ODT files.
- The comparison view compares one local model's output with the source. It does
  not keep multiple models in GPU memory or score models automatically.
- Model availability, download size, speed, and memory use are determined by
  WebLLM and the user's hardware.
- IndexedDB is local to a browser profile but is not encrypted. Anyone with
  access to that profile may be able to inspect stored writing.
- Model caching supports reuse after a download. The project is not a PWA and
  does not promise that the application shell can be opened from a cold browser
  start without a network connection.

## Browser requirements

- A current WebGPU-enabled browser. Recent Chrome and Edge releases are the
  most predictable choices.
- Enough GPU memory and browser storage for the selected model. Start with a
  small instruct model when testing an unfamiliar device.
- JavaScript and IndexedDB enabled.

The editor reports an actionable compatibility error when WebGPU is not
available.

## Development

Requirements: Node.js 22 or newer and Corepack (included with supported Node.js
releases). The repository pins its Yarn version in `package.json`.

```bash
corepack enable
yarn install --immutable
yarn dev
```

Open `http://localhost:3000`, choose a model in the Editor, and wait for the
initial model download to complete.

### Quality commands

```bash
yarn typecheck
yarn lint
yarn test
yarn build
```

`yarn check` runs type checking, linting, and unit tests together. Production
builds do not suppress TypeScript or ESLint failures.

## Architecture

```text
src/
├── app/
│   ├── prompt/       Controlled editor and streamed local generation
│   ├── history/      Complete saved-run review and export
│   └── batch/        Import, job execution, review, and export
├── db/db.ts          Dexie schema and version-one migration
├── hooks/
│   ├── useWebLLM/    Editor model lifecycle, streaming, retry, and cancellation
│   └── useBatchRunner/ Batch lifecycle, checkpointing, pause, and cleanup
└── lib/
    ├── documents.ts  DOCX/ODT parsing and browser downloads
    └── editor.ts     Prompt composition and export utilities
```

Batch results are stored as individual paragraph records. This avoids rewriting
an ever-growing result array at every checkpoint and lets review decisions be
updated independently.

## Privacy model

AIditorial does not contain application code that uploads prompts or extracted
documents. WebLLM must contact its configured model hosts to obtain uncached
model assets. As with any hosted web application, users must trust the
JavaScript delivered by the host; for the strongest assurance, inspect and run
the project locally.

Deleting browser site data removes AIditorial's saved runs, documents, jobs, and
potentially cached model assets. Export important work before clearing storage.

## License

[MIT](./LICENSE)
