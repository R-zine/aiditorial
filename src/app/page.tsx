import Link from "next/link";
import {
  ArrowRight,
  FileStack,
  History,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuroraText } from "@/components/magicui/aurora-text";
import { Meteors } from "@/components/magicui/meteors";
import { RainbowButton } from "@/components/magicui/rainbow-button";
import { ui } from "@/lib/ui-styles";

const featureCard =
  "min-h-60 min-w-0 rounded-2xl border border-border bg-linear-to-br from-[oklch(0.19_0.018_285/78%)] to-[oklch(0.14_0.014_285/84%)] p-6 [&>svg]:size-5 [&>svg]:text-[oklch(0.75_0.12_275)] [&>h3]:mt-15 [&>h3]:mb-2.5 [&>h3]:text-lg [&>p]:leading-relaxed [&>p]:text-muted-foreground";

export default function HomePage() {
  return (
    <div className="relative isolate overflow-hidden">
      <Meteors
        number={32}
        minDelay={0}
        maxDelay={8}
        minDuration={6}
        maxDuration={14}
        angle={215}
        className="z-0 h-[52rem] opacity-55 [mask-image:linear-gradient(to_bottom,black_0%,black_62%,transparent_100%)]"
      />
      <div className="relative z-10 mx-auto w-[min(1180px,calc(100%_-_2rem))] pt-22 pb-24 max-sm:pt-10">
        <section className="relative mx-auto flex min-h-136 w-full min-w-0 max-w-[900px] flex-col items-center justify-center text-center max-sm:min-h-124">
          <div
            className="pointer-events-none absolute top-4 left-1/2 h-88 w-[min(42rem,85vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,oklch(0.58_0.19_290/20%),transparent_68%)] blur-xl"
            aria-hidden="true"
          />
          <p className={ui.eyebrow}>
            <LockKeyhole /> Private by design · powered by WebLLM
          </p>
          <h1 className="relative m-0 w-full min-w-0 max-w-[850px] text-[clamp(2.8rem,7vw,5.5rem)] leading-[0.98] tracking-[-0.065em] max-sm:text-[clamp(2.65rem,14vw,4.2rem)]">
            A calmer way to edit with a{" "}
            <AuroraText speed={0.8}>local language model.</AuroraText>
          </h1>
          <p className="relative mx-auto mt-7 w-full max-w-2xl text-lg leading-8 text-muted-foreground">
            Refine essays, fiction, and personal writing directly in your
            browser. Your text stays on your device, your model remains your
            choice, and every change is yours to review.
          </p>
          <div className="relative mt-8 flex w-full flex-wrap items-center justify-center gap-2.5">
            <RainbowButton asChild size="lg">
              <Link href="/prompt">
                Open the editor <ArrowRight />
              </Link>
            </RainbowButton>
            <Button asChild size="lg" variant="outline">
              <Link href="/batch">Edit a document</Link>
            </Button>
          </div>
          <div className="relative mt-9 flex w-full flex-wrap justify-center gap-x-6 gap-y-3 text-xs text-muted-foreground [&>span]:before:mr-2 [&>span]:before:inline-block [&>span]:before:size-1.5 [&>span]:before:rounded-full [&>span]:before:bg-[oklch(0.74_0.13_245)] [&>span]:before:align-middle">
            <span>No account</span>
            <span>No text upload</span>
            <span>Runs after model download</span>
          </div>
        </section>

        <section className="py-20" aria-labelledby="features-title">
          <div className="mb-8">
            <p className={ui.eyebrow}>Focused tools, fewer distractions</p>
            <h2
              id="features-title"
              className="m-0 text-[clamp(2rem,4vw,3rem)] tracking-[-0.045em]"
            >
              Built around the edit
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-4 max-[850px]:grid-cols-1">
            <article className={featureCard}>
              <Sparkles />
              <h3>Write and compare</h3>
              <p>
                Stream an edit, inspect the original beside the result, and keep
                complete run history locally.
              </p>
            </article>
            <article className={featureCard}>
              <FileStack />
              <h3>Process long work</h3>
              <p>
                Apply a proven instruction paragraph by paragraph, pause
                safely, and review every change before export.
              </p>
            </article>
            <article className={featureCard}>
              <History />
              <h3>Return to decisions</h3>
              <p>
                Restore prompts, source text, output, model settings, and
                conversations from this browser.
              </p>
            </article>
          </div>
        </section>

        <section className="mt-8 grid grid-cols-2 gap-16 rounded-[1.25rem] border border-border bg-[oklch(0.16_0.018_285/75%)] p-12 max-[850px]:grid-cols-1 max-[850px]:gap-6 max-[850px]:p-6">
          <div>
            <p className={ui.eyebrow}>What “local” means here</p>
            <h2 className="m-0 text-[clamp(2rem,4vw,3rem)] tracking-[-0.045em]">
              The model downloads. Your writing does not upload.
            </h2>
          </div>
          <p className="m-0 leading-relaxed text-muted-foreground">
            WebLLM fetches model files when you first select a model, then
            performs inference through WebGPU. AIditorial stores runs and
            extracted document text in IndexedDB without a remote application
            server.
          </p>
        </section>
      </div>
    </div>
  );
}
