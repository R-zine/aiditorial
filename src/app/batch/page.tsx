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
import { useRef, useState } from "react";
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
    value: "history",
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
import { AnimatedCircularProgressBar } from "@/components/magicui/animated-circular-progress-bar";
import { DialogFooter, DialogHeader } from "@/components/ui/dialog";
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

export default function Batch() {
  const documents = useLiveQuery(() => db.document.toArray());
  const histories = useLiveQuery(() => db.history.toArray());

  const [currentView, setCurrentView] = useState("newdocument");
  const [newFile, setNewFile] = useState<{
    name: string;
    content: string[];
  } | null>(null);

  const [selectedSettings, setSelectedSettings] = useState<number | null>();
  const [selectedDocument, setSelectedDocument] = useState<number | null>();

  console.log(selectedDocument, selectedSettings);

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
                >
                  Create batch job
                </InteractiveHoverButton>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
