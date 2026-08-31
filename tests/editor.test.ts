import { describe, expect, it } from "vitest";
import type { JobParagraph } from "@/db/db";
import {
  acceptedDocumentText,
  composePrompt,
  modeLabel,
  runAsMarkdown,
  safeFilename,
} from "@/lib/editor";

describe("composePrompt", () => {
  it("inserts every occurrence of a supported template token", () => {
    expect(
      composePrompt("Rewrite <<PARAGRAPH>> then check <<PARAGRAPH>>", "  Draft.  "),
    ).toBe("Rewrite Draft. then check Draft.");
    expect(composePrompt("Context: <<CONTEXT>>", "Notes")).toBe(
      "Context: Notes",
    );
    expect(composePrompt("Text: {{text}}", "Copy")).toBe("Text: Copy");
  });

  it("separates plain instructions from the source text", () => {
    expect(composePrompt(" Improve the prose. ", " A rough sentence. ")).toBe(
      "Improve the prose.\n\nText to edit:\nA rough sentence.",
    );
  });

  it("handles an empty instruction or source", () => {
    expect(composePrompt("", " Source only. ")).toBe("Source only.");
    expect(composePrompt(" Instruction only. ", "")).toBe("Instruction only.");
    expect(composePrompt("", "")).toBe("");
  });
});

describe("editor labels and exports", () => {
  it.each([
    ["Chat", "Conversation"],
    ["Edit", "Focused edit"],
    ["Compare", "Compare changes"],
  ] as const)("labels %s mode", (mode, label) => {
    expect(modeLabel(mode)).toBe(label);
  });

  it("preserves paragraph order and review decisions", () => {
    const paragraphs: JobParagraph[] = [
      {
        id: 3,
        jobId: 1,
        index: 2,
        originalText: "Use the fallback.",
        editedText: "",
        status: "pending",
      },
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

    expect(acceptedDocumentText(paragraphs)).toBe(
      "Polished.\n\nKeep me.\n\nUse the fallback.",
    );
  });

  it("creates portable filenames with a safe fallback", () => {
    expect(safeFilename("My Essay (final).docx")).toBe("My-Essay-final");
    expect(safeFilename("résumé 2026.odt")).toBe("r-sum-2026");
    expect(safeFilename("...docx")).toBe("aiditorial-export");
  });

  it("includes the complete run in Markdown exports", () => {
    const markdown = runAsMarkdown({
      prompt: "Improve clarity.",
      input: "Before.",
      output: "After.",
      model: "local-model",
      createdAt: "2026-08-31T10:00:00.000Z",
    });

    expect(markdown).toContain("- Model: local-model");
    expect(markdown).toContain("## Instruction\n\nImprove clarity.");
    expect(markdown).toContain("## Original\n\nBefore.");
    expect(markdown).toContain("## Edited\n\nAfter.");
    expect(markdown.endsWith("\n")).toBe(true);
  });
});
