"use client";

import { db } from "@/db/db";
import { useLiveQuery } from "dexie-react-hooks";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCallback, useMemo, useRef, useState } from "react";
const tabs = [
  {
    name: "New document",
    value: "newdocument",
  },
  {
    name: "New batch job",
    value: "newjob",
  },
  {
    name: "Job history",
    value: "jobhistory",
  },
];

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { RainbowButton } from "@/components/magicui/rainbow-button";
import { Separator } from "@/components/ui/separator";
import { DialogHeader } from "@/components/ui/dialog";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@radix-ui/react-dialog";
import { InteractiveHoverButton } from "@/components/magicui/interactive-hover-button";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import JSZip from "jszip";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/shadcn-io/combobox";
import { Check, X } from "lucide-react";
import { CreateMLCEngine, prebuiltAppConfig } from "@mlc-ai/web-llm";

export default function Batch() {
  const documents = useLiveQuery(() => db.document.toArray());
  const histories = useLiveQuery(() => db.history.toArray());
  const jobs = useLiveQuery(() => db.job.toArray());

  const [currentView, setCurrentView] = useState("newdocument");
  const [newFile, setNewFile] = useState<{
    name: string;
    content: string[];
  } | null>(null);

  const joinedJobs = useMemo(
    () =>
      jobs?.map((job) => {
        const relatedHistory = histories?.find((h) => h.id === job.historyId);
        const relatedDocument = documents?.find((d) => d.id === job.documentId);

        return {
          ...job,
          history: relatedHistory,
          document: relatedDocument,
        };
      }),
    [jobs, histories, documents]
  );

  const [selectedSettings, setSelectedSettings] = useState<number | null>();
  const [selectedDocument, setSelectedDocument] = useState<number | null>();

  const [isJobInProgress, setIsJobInProgress] = useState(false);
  const [modelLoadProgress, setModelLoadProgress] = useState<null | number>();
  const [modelLoadText, setModelLoadText] = useState("");
  const [currentParagraph, setCurrentParagraph] = useState<null | number>(null);

  const [cachedEditedContent, setCachedEditedContent] = useState<string[]>([]);

  const [previewId, setPreviewId] = useState<null | number>(null);

  const onJobStart = useCallback(
    async (id: number) => {
      const job = joinedJobs?.find((j) => j.id === id);
      if (!job || !job.history || !job.document) return;

      setIsJobInProgress(true);

      const engineInstance = await CreateMLCEngine(job.history.model, {
        initProgressCallback: (progress) => {
          setModelLoadProgress(progress.progress);
          setModelLoadText(progress.text);
          console.log(progress.text);
        },
        appConfig: {
          ...prebuiltAppConfig,
          useIndexedDBCache: job.history.isCache,
        },
      });

      const engine = await engineInstance;
      if (!engine) return;
      setCachedEditedContent(job.editedContent);
      const editedContentCopy = structuredClone(job.editedContent);
      for (let i = job.progress; i < job.document.content.length; i++) {
        setCurrentParagraph(i);
        const reply = await engine.chat.completions.create({
          messages: [
            {
              role: "user",
              content: `${job.history.prompt} ${job.document.content[i]}`,
            },
          ],
          temperature: job.history.temperature,
        });
        console.log(reply.choices[0].message.content);
        setCachedEditedContent((p) => [
          ...p,
          reply.choices[0].message.content ?? "",
        ]);
        await db.job.update(job.id, {
          progress: i + 1,
          editedContent: [
            ...editedContentCopy,
            reply.choices[0].message.content ?? "",
          ],
        });
        editedContentCopy.push(reply.choices[0].message.content ?? "");
      }
      setCurrentParagraph(null);
      setIsJobInProgress(false);
    },
    [joinedJobs]
  );

  return (
    <div>
      <div className="min-h-screen flex flex-col gap-15">
        <div className="!mt-30 !ml-10 !mr-10">
          <div className="!w-full !max-w-md !p-6">
            <Tabs defaultValue="newdocument">
              <TabsList>
                {tabs.map((tab) => (
                  <TabsTrigger
                    className="!px-3"
                    key={tab.value}
                    value={tab.value}
                    onClick={() => setCurrentView(tab.value)}
                  >
                    {tab.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          {currentView === "newdocument" && (
            <>
              <div className="!w-full !p-6 !flex !justify-center">
                <Card className="w-full !p-6 bg-foreground text-background">
                  <CardHeader>
                    <CardTitle>Ingest a new document</CardTitle>
                    <CardDescription>
                      You can use the form below to ingest a new .DOCX or .ODT
                      document. The contents of the file are not uploaded
                      anywhere and are stored in the browser's memory for later
                      use.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex !gap-10 align-middle">
                      <RainbowButton
                        className="!p-5"
                        onClick={(e) => (e.target as any).children[0].click()}
                      >
                        Ingest a .DOCX
                        <input
                          type="file"
                          className="hidden"
                          onChange={async (e) => {
                            // @ts-ignore
                            const file = e.target.files[0];
                            if (!file) return;
                            const arrayBuffer = await file.arrayBuffer();
                            const { default: mammoth } = await import(
                              // @ts-ignore
                              "mammoth/mammoth.browser"
                            );

                            const result = await mammoth.extractRawText({
                              arrayBuffer,
                            });

                            const resultArr = result.value.split("\n\n");

                            setNewFile({ name: file.name, content: resultArr });
                          }}
                        />
                      </RainbowButton>
                      <Separator orientation="vertical" className="!h-12" />
                      <RainbowButton
                        variant="outline"
                        className="!p-5"
                        onClick={(e) => (e.target as any).children[0].click()}
                      >
                        Ingest an .ODT
                        <input
                          type="file"
                          className="hidden"
                          onChange={async (e) => {
                            // @ts-ignore
                            const file = e.target.files[0];
                            if (!file) return;
                            const arrayBuffer = await file.arrayBuffer();
                            const zip = await JSZip.loadAsync(arrayBuffer);

                            // @ts-ignore
                            const contentXml = await zip
                              .file("content.xml")
                              .async("string");

                            const parser = new DOMParser();
                            const xmlDoc = parser.parseFromString(
                              contentXml,
                              "application/xml"
                            );

                            // ODT text is inside <text:p> elements
                            const paragraphs = Array.from(
                              xmlDoc.getElementsByTagName("text:p")
                            ).flatMap((p) =>
                              p.textContent ? p.textContent : []
                            );

                            setNewFile({
                              name: file.name,
                              content: paragraphs,
                            });
                          }}
                        />
                      </RainbowButton>
                    </div>
                  </CardContent>
                </Card>
              </div>
              {newFile && (
                <div className="w-[100vw] h-[100vh] top-0 left-0 fixed flex justify-center !z-1100">
                  <Dialog modal open={!!newFile}>
                    <DialogContent className="h-full w-full bg-foreground flex flex-col items-center justify-center gap-10">
                      <DialogHeader className="text-background items-center">
                        <DialogTitle>Document preview</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                          Below you can see how your document was ingested. You
                          also able to change the name of the document.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="text-muted-foreground overflow-auto max-h-[60vh] !px-10">
                        {newFile.content.map((paragraph) => (
                          <p>{paragraph}</p>
                        ))}
                      </div>
                      <div className="flex gap-20 items-center">
                        <InteractiveHoverButton
                          className="!px-6 !py-3"
                          onClick={async () => {
                            await db.document.add({
                              name: newFile.name,
                              content: newFile.content,
                              length: newFile.content.length,
                            });
                            setCurrentView("newjob");
                          }}
                        >
                          Save to browser DB
                        </InteractiveHoverButton>
                        <ShimmerButton
                          onClick={() => {
                            setNewFile(null);
                            window.location.reload();
                          }}
                          className="!px-6 !py-3 text-destructive"
                        >
                          Cancel
                        </ShimmerButton>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </>
          )}
          {currentView === "newjob" && (
            <Card>
              <CardContent className="!p-6 bg-accent-foreground">
                <Combobox
                  data={(documents ?? []).map((document) => ({
                    label: document.name,
                    value: String(document.id),
                  }))}
                  type="document"
                  onValueChange={(e) => setSelectedDocument(Number(e))}
                >
                  <ComboboxTrigger className="!px-6 !my-10" />
                  <ComboboxContent>
                    <ComboboxInput />
                    <ComboboxEmpty />
                    <ComboboxList>
                      <ComboboxGroup>
                        {(documents ?? []).map((document) => (
                          <ComboboxItem
                            key={document.id}
                            value={String(document.id)}
                          >
                            {document.name}, {document.length} paragraphs
                          </ComboboxItem>
                        ))}
                      </ComboboxGroup>
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                <Table className="bg-ring gap-10 indent-2">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="">Prompt</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead className="w-20">Mode</TableHead>
                      <TableHead className="w-30">Temperature</TableHead>
                      <TableHead className="w-30">Model caching</TableHead>
                      <TableHead className="w-50">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {histories?.map((history) => {
                      const isSelected = selectedSettings === history.id;

                      return (
                        <TableRow
                          className={`h-20 ${
                            selectedSettings &&
                            !isSelected &&
                            "bg-muted-foreground pointer-events-none"
                          }`}
                          key={history.id}
                        >
                          <TableCell className="font-medium">
                            {history.prompt}
                          </TableCell>
                          <TableCell>{history.model}</TableCell>
                          <TableCell>{history.mode}</TableCell>
                          <TableCell>{history.temperature}</TableCell>
                          <TableCell>
                            {history.isCache ? <Check /> : <X />}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-5">
                              <Button
                                className="w-18 cursor-pointer"
                                onClick={() =>
                                  setSelectedSettings((p) =>
                                    p ? null : history.id
                                  )
                                }
                              >
                                {isSelected ? "Unselect" : "Select"}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <TableFooter className="h-10 text-center">
                    <TableRow>
                      <TableCell colSpan={6}>
                        {histories?.length
                          ? "All data is stored locally!"
                          : "No data to display"}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
                <InteractiveHoverButton
                  disabled={!selectedSettings || !selectedDocument}
                  className={`!py-2 !px-6 !mt-10 ${
                    (!selectedSettings || !selectedDocument) &&
                    "pointer-events-none invert-25"
                  }`}
                  onClick={() => {
                    if (selectedDocument && selectedSettings) {
                      db.job.add({
                        historyId: selectedSettings,
                        documentId: selectedDocument,
                        editedContent: [],
                        progress: 0,
                      });
                      setCurrentView("jobhistory");
                    }
                  }}
                >
                  Create batch job
                </InteractiveHoverButton>
              </CardContent>
            </Card>
          )}
          {currentView === "jobhistory" && (
            <>
              <Card>
                <CardContent className="!p-6 bg-accent-foreground">
                  <Table className="bg-ring gap-10 indent-2">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-150">Prompt</TableHead>
                        <TableHead className="w-80">Model</TableHead>
                        <TableHead className="w-60">Document Name</TableHead>
                        <TableHead className="w-20">Progress</TableHead>

                        <TableHead className="">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {joinedJobs?.map((job) => {
                        return (
                          <TableRow className={`h-20 `} key={job.id}>
                            <TableCell className="font-medium">
                              {job.history?.prompt}
                            </TableCell>
                            <TableCell>{job.history?.model}</TableCell>
                            <TableCell>{job.document?.name}</TableCell>
                            <TableCell>
                              {job.progress}/{job.document?.length}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-5">
                                {job.progress < (job.document?.length ?? 0) && (
                                  <Button
                                    className="w-18 cursor-pointer"
                                    onClick={() => onJobStart(job.id)}
                                  >
                                    {job.progress ? "Resume" : "Start"}
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  className="w-30 cursor-pointer"
                                  onClick={() => setPreviewId(job.id)}
                                >
                                  View results
                                </Button>
                                <Button
                                  variant="secondary"
                                  className="w-40 cursor-pointer"
                                  onClick={() =>
                                    navigator.clipboard.writeText(
                                      job.editedContent.join("\n")
                                    )
                                  }
                                >
                                  Copy to clipboard
                                </Button>
                                <Button
                                  variant="destructive"
                                  className="w-40 cursor-pointer"
                                  onClick={() => db.job.delete(job.id)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                    <TableFooter className="h-10 text-center">
                      <TableRow>
                        <TableCell colSpan={6}>
                          {joinedJobs?.length
                            ? "All data is stored locally!"
                            : "No data to display"}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </CardContent>
              </Card>
              {isJobInProgress && (
                <div className="w-[100vw] h-[100vh] top-0 left-0 fixed flex justify-center !z-1100">
                  <Dialog modal open={isJobInProgress}>
                    <DialogContent className="h-full w-full bg-foreground flex flex-col items-center justify-center gap-10">
                      <DialogHeader className="text-background items-center">
                        <DialogTitle>Batch job is in progress</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                          {currentParagraph === null
                            ? "Your model is currently loading, see below for details"
                            : "The LLM is editing your document, paragraphs will appear as they are ready."}
                        </DialogDescription>
                      </DialogHeader>

                      <div className="text-muted-foreground overflow-auto max-h-[60vh] !px-10">
                        {currentParagraph !== null ? (
                          cachedEditedContent.map((paragraph) => (
                            <p className="!mb-5">{paragraph}</p>
                          ))
                        ) : (
                          <>
                            <p>Loading: {modelLoadProgress}%</p>
                            <br></br>
                            <b>{modelLoadText}</b>
                          </>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
              {previewId !== null && (
                <div className="w-[100vw] h-[100vh] top-0 left-0 fixed flex justify-center !z-1100">
                  <Dialog modal open={previewId !== null}>
                    <DialogContent className="h-full w-full bg-foreground flex flex-col items-center justify-center gap-10">
                      <DialogHeader className="text-background items-center">
                        <DialogTitle>Batch job preview</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                          Below are the currently ready paragraphs of your batch
                          job
                        </DialogDescription>
                      </DialogHeader>

                      <div className="text-muted-foreground overflow-auto max-h-[60vh] !px-10">
                        {joinedJobs
                          ?.find((job) => job.id === previewId)
                          ?.editedContent.map((paragraph) => (
                            <p className="!mb-5">{paragraph}</p>
                          ))}
                      </div>

                      <Button
                        variant="secondary"
                        className="w-40 cursor-pointer"
                        onClick={() => setPreviewId(null)}
                      >
                        Close
                      </Button>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
