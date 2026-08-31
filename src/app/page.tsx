import Link from "next/link";
import { ArrowRight, FileStack, History, LockKeyhole, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-glow" aria-hidden="true" />
        <p className="eyebrow"><LockKeyhole /> Private by design · powered by WebLLM</p>
        <h1>
          A calmer way to edit with a <span>local language model.</span>
        </h1>
        <p className="hero-copy">
          Refine essays, fiction, and personal writing directly in your browser.
          Your text stays on your device, your model remains your choice, and
          every change is yours to review.
        </p>
        <div className="hero-actions">
          <Button asChild size="lg">
            <Link href="/prompt">Open the editor <ArrowRight /></Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/batch">Edit a document</Link>
          </Button>
        </div>
        <div className="trust-row">
          <span>No account</span>
          <span>No text upload</span>
          <span>Runs after model download</span>
        </div>
      </section>

      <section className="feature-section" aria-labelledby="features-title">
        <div className="section-heading">
          <p className="eyebrow">Focused tools, fewer distractions</p>
          <h2 id="features-title">Built around the edit</h2>
        </div>
        <div className="feature-grid">
          <article>
            <Sparkles />
            <h3>Write and compare</h3>
            <p>
              Stream an edit, inspect the original beside the result, and keep
              complete run history locally.
            </p>
          </article>
          <article>
            <FileStack />
            <h3>Process long work</h3>
            <p>
              Apply a proven instruction paragraph by paragraph, pause safely,
              and review every change before export.
            </p>
          </article>
          <article>
            <History />
            <h3>Return to decisions</h3>
            <p>
              Restore prompts, source text, output, model settings, and
              conversations from this browser.
            </p>
          </article>
        </div>
      </section>

      <section className="privacy-section">
        <div>
          <p className="eyebrow">What “local” means here</p>
          <h2>The model downloads. Your writing does not upload.</h2>
        </div>
        <p>
          WebLLM fetches model files when you first select a model, then performs
          inference through WebGPU. AIditorial stores runs and extracted document
          text in IndexedDB without an application server. Browser storage is not
          encrypted, so use a trusted browser profile and device.
        </p>
      </section>
    </div>
  );
}
