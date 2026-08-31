import {
  db,
  type BatchJob,
  type JobParagraph,
  type LocalDocument,
  type ParagraphStatus,
} from "@/db/db";

export function isCompletedParagraph(status: ParagraphStatus): boolean {
  return status === "complete" || status === "accepted" || status === "rejected";
}

export async function ensureJobParagraphs(
  job: BatchJob,
  document: LocalDocument,
): Promise<JobParagraph[]> {
  const existing = await db.jobParagraph.where("jobId").equals(job.id).sortBy("index");
  if (existing.length) return existing;

  const legacyOutput = job.editedContent ?? [];
  await db.jobParagraph.bulkAdd(
    document.content.map((originalText, index) => ({
      jobId: job.id,
      index,
      originalText,
      editedText: legacyOutput[index] ?? "",
      status: legacyOutput[index] ? "complete" : "pending",
    })),
  );
  return db.jobParagraph.where("jobId").equals(job.id).sortBy("index");
}

export async function deleteBatchJob(jobId: number): Promise<void> {
  await db.transaction("rw", db.job, db.jobParagraph, async () => {
    await db.jobParagraph.where("jobId").equals(jobId).delete();
    await db.job.delete(jobId);
  });
}
