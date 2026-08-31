import type { EditorMode, JobParagraph } from "@/db/db";

const TEMPLATE_TOKENS = ["<<PARAGRAPH>>", "<<CONTEXT>>", "{{text}}"];

export function composePrompt(instruction: string, source: string): string {
  const cleanInstruction = instruction.trim();
  const cleanSource = source.trim();
  const token = TEMPLATE_TOKENS.find((candidate) =>
    cleanInstruction.includes(candidate),
  );

  if (token) return cleanInstruction.replaceAll(token, cleanSource);
  if (!cleanInstruction) return cleanSource;
  if (!cleanSource) return cleanInstruction;
  return `${cleanInstruction}\n\nText to edit:\n${cleanSource}`;
}

export function modeLabel(mode: EditorMode): string {
  if (mode === "Chat") return "Conversation";
  if (mode === "Compare") return "Compare changes";
  return "Focused edit";
}

export function acceptedDocumentText(paragraphs: JobParagraph[]): string {
  return [...paragraphs]
    .sort((left, right) => left.index - right.index)
    .map((paragraph) =>
      paragraph.status === "rejected"
        ? paragraph.originalText
        : paragraph.editedText || paragraph.originalText,
    )
    .join("\n\n");
}

export function runAsMarkdown(run: {
  prompt: string;
  input: string;
  output: string;
  model: string;
  createdAt: string;
}): string {
  return [
    "# AIditorial run",
    "",
    `- Model: ${run.model}`,
    `- Created: ${run.createdAt}`,
    "",
    "## Instruction",
    "",
    run.prompt,
    "",
    "## Original",
    "",
    run.input,
    "",
    "## Edited",
    "",
    run.output,
    "",
  ].join("\n");
}

export function safeFilename(name: string): string {
  const withoutExtension = name.replace(/\.[^.]+$/, "");
  return (
    withoutExtension
      .trim()
      .replace(/[^a-z0-9_-]+/gi, "-")
      .replace(/^-+|-+$/g, "") || "aiditorial-export"
  );
}
