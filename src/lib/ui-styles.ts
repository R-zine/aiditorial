export const ui = {
  container: "mx-auto w-[min(1180px,calc(100%_-_2rem))]",
  page: "mx-auto flex w-[min(1180px,calc(100%_-_2rem))] flex-col gap-5 pt-14 pb-20 max-sm:pt-9",
  pageHeading:
    "mb-3 flex items-end justify-between gap-8 max-[850px]:flex-col max-[850px]:items-start",
  pageTitle: "m-0 text-[clamp(2.4rem,5vw,4rem)] tracking-[-0.055em]",
  pageDescription: "mt-2.5 max-w-2xl leading-relaxed text-muted-foreground",
  eyebrow:
    "relative mb-3.5 inline-flex items-center gap-2 text-xs font-bold tracking-[0.13em] text-[oklch(0.78_0.09_275)] uppercase [&_svg]:size-4",
  surfaceCard:
    "overflow-hidden border-border bg-[oklch(0.16_0.014_285/88%)] shadow-[0_20px_60px_oklch(0.05_0.01_285/18%)]",
  cardHeader: "flex flex-col items-start gap-6",
  splitCardHeader:
    "flex flex-row items-start justify-between gap-6 max-[850px]:flex-col",
  stack: "flex flex-col gap-2.5",
  actionRow: "flex flex-wrap items-center gap-2.5",
  compactActions:
    "flex flex-wrap items-center justify-end gap-2.5 max-[850px]:justify-start",
  notice:
    "flex items-center justify-between gap-4 rounded-xl border border-[oklch(0.72_0.12_245/35%)] bg-[oklch(0.23_0.04_245/40%)] px-4 py-3 text-sm",
  noticeError:
    "border-[oklch(0.64_0.2_25/45%)] bg-[oklch(0.27_0.08_25/35%)]",
  twoColumn: "grid grid-cols-2 items-stretch gap-4 max-[850px]:grid-cols-1",
  comparisonGrid:
    "grid grid-cols-2 gap-3 max-[850px]:grid-cols-1 [&>div]:min-h-32 [&>div]:rounded-xl [&>div]:border [&>div]:border-border [&>div]:bg-[oklch(0.12_0.012_285/60%)] [&>div]:p-4 [&_span]:mb-2 [&_span]:block [&_span]:text-[0.7rem] [&_span]:font-bold [&_span]:tracking-[0.1em] [&_span]:text-[oklch(0.76_0.07_275)] [&_span]:uppercase [&_p]:m-0 [&_p]:leading-7 [&_p]:whitespace-pre-wrap [&_p]:[overflow-wrap:anywhere]",
  emptyState:
    "flex min-h-80 flex-col items-center justify-center gap-2.5 rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground [&_h2]:m-0 [&_h2]:text-foreground [&_p]:m-0",
  compactEmpty: "min-h-32 p-4",
  runMeta:
    "flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground",
  modelName:
    "mt-1.5 max-w-3xl overflow-hidden text-ellipsis whitespace-nowrap text-xs leading-relaxed text-muted-foreground",
  fieldError: "mt-2 text-sm text-[oklch(0.76_0.14_25)]",
  previewLabel:
    "mb-2 block text-[0.7rem] font-bold tracking-[0.1em] text-[oklch(0.76_0.07_275)] uppercase",
  preWrap: "m-0 leading-7 whitespace-pre-wrap [overflow-wrap:anywhere]",
  progressDetails:
    "flex justify-between gap-4 text-xs text-muted-foreground",
} as const;
