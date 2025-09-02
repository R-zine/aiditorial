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
import { Check, X } from "lucide-react";

export default function History() {
  const histories = useLiveQuery(() => db.history.toArray());

  return (
    <div className="min-h-screen flex flex-col gap-15">
      <div className="!mt-30 !ml-10 !mr-10">
        <Table className="bg-ring gap-10 indent-2">
          <TableCaption className="!h-20">
            A list of your saved prompts with settings.
          </TableCaption>
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
            {histories?.map((history) => (
              <TableRow className="h-20" key={history.id}>
                <TableCell className="font-medium">{history.prompt}</TableCell>
                <TableCell>{history.model}</TableCell>
                <TableCell>{history.mode}</TableCell>
                <TableCell>{history.temperature}</TableCell>
                <TableCell>{history.isCache ? <Check /> : <X />}</TableCell>
                <TableCell>
                  <div className="flex gap-5">
                    <Link href={`/prompt/${history.id}`}>
                      <Button className="w-15 cursor-pointer">Restore</Button>
                    </Link>

                    <Button
                      className="w-15 bg-destructive cursor-pointer"
                      onClick={async () => {
                        await db.history.delete(history.id);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
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
      </div>
    </div>
  );
}
