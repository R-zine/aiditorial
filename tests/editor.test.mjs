import assert from "node:assert/strict";
import test from "node:test";
import {
  acceptedDocumentText,
  composePrompt,
  runAsMarkdown,
  safeFilename,
} from "../src/lib/editor.ts";

test("composePrompt inserts supported template tokens", () => {
  assert.equal(
    composePrompt("Rewrite this: <<PARAGRAPH>>", "A rough sentence."),
    "Rewrite this: A rough sentence.",
  );
  assert.equal(
    composePrompt("Context: {{text}}", "A second sentence."),
    "Context: A second sentence.",
  );
});

test("composePrompt separates an instruction from source text", () => {
  assert.equal(
    composePrompt("Improve the prose.", "A rough sentence."),
    "Improve the prose.\n\nText to edit:\nA rough sentence.",
  );
});

test("acceptedDocumentText preserves order and rejected originals", () => {
  const paragraphs = [
    {
      id: 2,
      jobId: 1,
      index: 1,
      originalText: "Keep me.",
      editedText: "Replace me.",
      status: "rejected",
    },
    {
      id: 1,
      jobId: 1,
      index: 0,
      originalText: "Rough.",
      editedText: "Polished.",
      status: "accepted",
    },
  ];

  assert.equal(acceptedDocumentText(paragraphs), "Polished.\n\nKeep me.");
});

test("exports use safe filenames and include complete run data", () => {
  assert.equal(safeFilename("My Essay (final).docx"), "My-Essay-final");
  const markdown = runAsMarkdown({
    prompt: "Improve clarity.",
    input: "Before.",
    output: "After.",
    model: "local-model",
    createdAt: "2026-08-31T10:00:00.000Z",
  });
  assert.match(markdown, /## Original\n\nBefore\./);
  assert.match(markdown, /## Edited\n\nAfter\./);
});
