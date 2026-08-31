declare module "mammoth/mammoth.browser" {
  interface MammothMessage {
    type: "warning" | "error";
    message: string;
    error?: unknown;
  }

  interface MammothBrowser {
    extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<{
      value: string;
      messages: MammothMessage[];
    }>;
  }

  const mammoth: MammothBrowser;
  export default mammoth;
}
