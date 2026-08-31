import JSZip from "jszip";
import { describe, expect, it, vi } from "vitest";
import { downloadText, parseDocument } from "@/lib/documents";

async function zipFile(
  name: string,
  entries: Record<string, string>,
): Promise<File> {
  const zip = new JSZip();
  for (const [path, content] of Object.entries(entries)) zip.file(path, content);
  const archive = await zip.generateAsync({ type: "arraybuffer" });
  return new File([archive], name);
}

function odtFile(contentXml: string): Promise<File> {
  return zipFile("novel.odt", { "content.xml": contentXml });
}

describe("parseDocument", () => {
  it("rejects unsupported and oversized files before reading them", async () => {
    await expect(parseDocument(new File(["notes"], "notes.txt"))).rejects.toThrow(
      "Choose a .docx or .odt document.",
    );

    const oversized = {
      name: "large.odt",
      size: 25 * 1024 * 1024 + 1,
      arrayBuffer: vi.fn(),
    } as unknown as File;
    await expect(parseDocument(oversized)).rejects.toThrow(
      "Documents must be 25 MB or smaller.",
    );
    expect(oversized.arrayBuffer).not.toHaveBeenCalled();
  });

  it("extracts and cleans ODT headings and paragraphs", async () => {
    const file = await odtFile(`<?xml version="1.0" encoding="UTF-8"?>
      <office:document-content
        xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
        xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0">
        <office:body><office:text>
          <text:h> Chapter one </text:h>
          <text:p>First <text:span>paragraph</text:span>.</text:p>
          <text:p>   </text:p>
          <text:p>Second paragraph.</text:p>
        </office:text></office:body>
      </office:document-content>`);

    await expect(parseDocument(file)).resolves.toEqual({
      name: "novel.odt",
      sourceType: "odt",
      content: ["Chapter one", "First paragraph.", "Second paragraph."],
      warnings: [
        "Formatting, comments, tables, images, and tracked changes are not preserved.",
      ],
    });
  });

  it("reports malformed or incomplete ODT archives", async () => {
    const missingContent = await zipFile("empty.odt", { "mimetype": "odt" });
    await expect(parseDocument(missingContent)).rejects.toThrow(
      "This ODT file has no content.xml entry.",
    );

    await expect(parseDocument(await odtFile("<office:broken>"))).rejects.toThrow(
      "The ODT document contains invalid XML.",
    );

    await expect(
      parseDocument(await odtFile("<?xml version=\"1.0\"?><document />")),
    ).rejects.toThrow("No editable paragraphs were found.");
  });

  it("extracts text from a minimal DOCX document", async () => {
    const file = await zipFile("essay.docx", {
      "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8"?>
        <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
          <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
          <Default Extension="xml" ContentType="application/xml"/>
          <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
        </Types>`,
      "_rels/.rels": `<?xml version="1.0" encoding="UTF-8"?>
        <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
          <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
        </Relationships>`,
      "word/document.xml": `<?xml version="1.0" encoding="UTF-8"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p><w:r><w:t>First paragraph.</w:t></w:r></w:p>
            <w:p><w:r><w:t>Second paragraph.</w:t></w:r></w:p>
          </w:body>
        </w:document>`,
    });

    const parsed = await parseDocument(file);
    expect(parsed.name).toBe("essay.docx");
    expect(parsed.sourceType).toBe("docx");
    expect(parsed.content).toEqual(["First paragraph.", "Second paragraph."]);
  });
});

describe("downloadText", () => {
  it("downloads a Blob and releases its object URL", () => {
    const createObjectURL = vi.fn((blob: Blob) => {
      void blob;
      return "blob:aiditorial";
    });
    const revokeObjectURL = vi.fn();
    Object.defineProperties(URL, {
      createObjectURL: { configurable: true, value: createObjectURL },
      revokeObjectURL: { configurable: true, value: revokeObjectURL },
    });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);

    downloadText("essay.md", "Edited text", "text/markdown;charset=utf-8");

    const blob = createObjectURL.mock.calls[0]?.[0];
    expect(blob).toBeInstanceOf(Blob);
    expect(blob?.type).toBe("text/markdown;charset=utf-8");
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:aiditorial");
  });
});
