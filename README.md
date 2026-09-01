# AIditorial

AIditorial is a writing editor that runs a language model in your browser. It
is meant for essays, fiction, and other drafts that you would rather not send
to an application server.

[Try AIditorial](https://aiditorial.netlify.app/)

## What it does

- Chat with a local model or give it a focused editing instruction.
- Compare the source and edited text before keeping the result.
- Save prompts, output, model settings, and conversations in local history.
- Import DOCX and ODT files and work through them paragraph by paragraph.
- Pause batch jobs, review each change, and export the result as text or
  Markdown.

There is no account system and no text-processing backend. WebLLM downloads the
selected model, then runs inference through WebGPU on the device. Saved runs,
imported text, and batch progress live in the browser's IndexedDB.

## Before you try it

Use a current WebGPU-capable browser. Chrome and Edge are the most predictable
options at the moment. The first model load can be large and may take a while;
start with a small instruct model if you are unsure how much memory your device
can spare.

“Local” does not mean completely offline. WebLLM still needs a network
connection to fetch uncached model files, and the hosted app itself must be
loaded from Netlify. Browser storage is also not encrypted, so use a browser
profile and device you trust.

## Running locally

You will need Node.js 22 or newer and Corepack.

```bash
corepack enable
yarn install --immutable
yarn dev
```

Then open [http://localhost:3000](http://localhost:3000), go to the editor, and
choose a model.

The repository uses Yarn 4 and strict peer-dependency checks. It is not
configured to fall back to `legacy-peer-deps`.

## Checks

```bash
yarn check
yarn build
```

`yarn check` runs TypeScript, ESLint, and the coverage-enabled Vitest suite.
The Husky pre-commit hook runs the same check.

For a single test run or watch mode:

```bash
yarn test
yarn test:watch
```

## Document imports

DOCX and ODT imports are intentionally converted to plain paragraphs. Tables,
images, tracked changes, comments, and document styling are not preserved, and
exports are TXT or Markdown rather than reconstructed office documents.

## Stack

Next.js, React, TypeScript, Tailwind CSS, WebLLM, Dexie, Radix UI, and Vitest.

## License

[MIT](./LICENSE)
