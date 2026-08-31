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
    <div className="app-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Stored only in this browser</p>
          <h1>Run history</h1>
          <p>Review, export, or restore complete inputs and outputs.</p>
        </div>
        <div className="search-field">
          <Search aria-hidden="true" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search runs"
            aria-label="Search saved runs"
          />
        </div>
      </section>

      {notice && (
        <div className="notice" role="status">
          <span>{notice}</span>
          <Button size="sm" variant="ghost" onClick={() => setNotice("")}>
            Dismiss
          </Button>
        </div>
      )}

      {filteredRuns?.length ? (
        <div className="history-list">
          {filteredRuns.map((run) => (
            <Card key={run.id} className="surface-card history-card">
              <CardHeader>
                <div>
                  <div className="run-meta">
                    <Badge variant="secondary">{modeLabel(run.mode)}</Badge>
                    <time dateTime={run.createdAt}>
                      {new Date(run.createdAt).toLocaleString()}
                    </time>
                  </div>
                  <CardTitle>{run.prompt || "Untitled run"}</CardTitle>
                  <p className="model-name">{run.model}</p>
                </div>
                <div className="action-row compact-actions">
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
              <CardContent className="run-preview-grid">
                <div>
                  <span>Original</span>
                  <p>{run.input || "No original text was saved for this legacy run."}</p>
                </div>
                <div>
                  <span>Edited</span>
                  <p>{run.output || "No output was saved for this legacy run."}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="empty-state">
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
    <div className="empty-icon" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}
