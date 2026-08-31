import JSZip from "jszip";
import { inferSourceType, type LocalDocument } from "@/db/db";

const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;

export interface ParsedDocument {
  name: string;
  sourceType: LocalDocument["sourceType"];
  content: string[];
  warnings: string[];
}

export async function parseDocument(file: File): Promise<ParsedDocument> {
  const sourceType = inferSourceType(file.name);
  if (sourceType === "text") {
    throw new Error("Choose a .docx or .odt document.");
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    throw new Error("Documents must be 25 MB or smaller.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const warnings = [
    "Formatting, comments, tables, images, and tracked changes are not preserved.",
  ];
  let paragraphs: string[];

  if (sourceType === "docx") {
    const { default: mammoth } = await import("mammoth/mammoth.browser");
    const result = await mammoth.extractRawText({ arrayBuffer });
    paragraphs = result.value.split(/\n\s*\n/);
    warnings.push(...result.messages.map((message) => message.message));
  } else {
    const zip = await JSZip.loadAsync(arrayBuffer);
    const contentFile = zip.file("content.xml");
    if (!contentFile) throw new Error("This ODT file has no content.xml entry.");

    const contentXml = await contentFile.async("string");
    const xmlDocument = new DOMParser().parseFromString(
      contentXml,
      "application/xml",
    );
    if (xmlDocument.querySelector("parsererror")) {
      throw new Error("The ODT document contains invalid XML.");
    }

    paragraphs = Array.from(xmlDocument.getElementsByTagName("*"))
      .filter((element) => element.localName === "p" || element.localName === "h")
      .map((element) => element.textContent ?? "");
  }

  const content = paragraphs.map((value) => value.trim()).filter(Boolean);
  if (!content.length) throw new Error("No editable paragraphs were found.");

  return { name: file.name, sourceType, content, warnings };
}

export function downloadText(
  filename: string,
  content: string,
  type = "text/plain;charset=utf-8",
): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
