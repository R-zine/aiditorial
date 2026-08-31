"use client";

import Link from "next/link";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Copy, Download, ExternalLink, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { db, type HistoryRun } from "@/db/db";
import { downloadText } from "@/lib/documents";
import { modeLabel, runAsMarkdown, safeFilename } from "@/lib/editor";
import { ui } from "@/lib/ui-styles";

function includesQuery(run: HistoryRun, query: string): boolean {
  const haystack = [run.prompt, run.input, run.output, run.model]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}

export default function HistoryPage() {
  const runs = useLiveQuery(() => db.history.orderBy("createdAt").reverse().toArray());
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const filteredRuns = runs?.filter((run) => includesQuery(run, query));

  const deleteRun = async (run: HistoryRun) => {
    const linkedJobs = await db.job.where("historyId").equals(run.id).count();
    if (linkedJobs) {
      setNotice(
        `This run is used by ${linkedJobs} batch job${linkedJobs === 1 ? "" : "s"}. Delete those jobs first.`,
      );
      return;
    }
    if (!window.confirm("Delete this saved run? This cannot be undone.")) return;
    await db.history.delete(run.id);
    setNotice("Saved run deleted.");
  };

  return (
    <div className={ui.page}>
      <section className={ui.pageHeading}>
        <div>
          <p className={ui.eyebrow}>Stored only in this browser</p>
          <h1 className={ui.pageTitle}>Run history</h1>
          <p className={ui.pageDescription}>
            Review, export, or restore complete inputs and outputs.
          </p>
        </div>
        <div className="relative w-[min(20rem,100%)]">
          <Search
            className="absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            className="pl-9"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search runs"
            aria-label="Search saved runs"
          />
        </div>
      </section>

      {notice && (
        <div className={ui.notice} role="status">
          <span>{notice}</span>
          <Button size="sm" variant="ghost" onClick={() => setNotice("")}>
            Dismiss
          </Button>
        </div>
      )}

      {filteredRuns?.length ? (
        <div className="flex flex-col gap-3.5">
          {filteredRuns.map((run) => (
            <Card key={run.id} className={ui.surfaceCard}>
              <CardHeader className={ui.splitCardHeader}>
                <div>
                  <div className={ui.runMeta}>
                    <Badge variant="secondary">{modeLabel(run.mode)}</Badge>
                    <time dateTime={run.createdAt}>
                      {new Date(run.createdAt).toLocaleString()}
                    </time>
                  </div>
                  <CardTitle className="mt-2.5 max-w-3xl overflow-hidden text-ellipsis whitespace-nowrap text-base leading-snug max-[850px]:whitespace-normal">
                    {run.prompt || "Untitled run"}
                  </CardTitle>
                  <p className={ui.modelName}>{run.model}</p>
                </div>
                <div className={ui.compactActions}>
                  <Button asChild size="sm">
                    <Link href={`/prompt/${run.id}`}>
                      <ExternalLink /> Restore
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void navigator.clipboard.writeText(run.output)}
                  >
                    <Copy /> Copy output
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      downloadText(
                        `${safeFilename(run.prompt)}.md`,
                        runAsMarkdown(run),
                        "text/markdown;charset=utf-8",
                      )
                    }
                  >
                    <Download /> Export
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Delete saved run"
                    onClick={() => void deleteRun(run)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className={ui.comparisonGrid}>
                <div>
                  <span>Original</span>
                  <p className="line-clamp-4 text-muted-foreground">
                    {run.input || "No original text was saved for this legacy run."}
                  </p>
                </div>
                <div>
                  <span>Edited</span>
                  <p className="line-clamp-4 text-muted-foreground">
                    {run.output || "No output was saved for this legacy run."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className={ui.emptyState}>
          <HistoryEmptyIcon />
          <h2>{runs?.length ? "No matching runs" : "No saved runs yet"}</h2>
          <p>Successful edits and conversations are saved here automatically.</p>
          {!runs?.length && (
            <Button asChild>
              <Link href="/prompt">Open the editor</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function HistoryEmptyIcon() {
  return (
    <div className="mb-2 flex flex-col gap-1" aria-hidden="true">
      <span className="block h-1 w-8 rounded-full bg-[oklch(0.65_0.13_275/60%)]" />
      <span className="block h-1 w-8 rounded-full bg-[oklch(0.65_0.13_275/60%)]" />
      <span className="block h-1 w-8 rounded-full bg-[oklch(0.65_0.13_275/60%)]" />
    </div>
  );
}
