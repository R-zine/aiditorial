"use client";

import { Meteors } from "@/components/magicui/meteors";
import styles from "./page.module.css";
import { AuroraText } from "@/components/magicui/aurora-text";
import { LineShadowText } from "@/components/magicui/line-shadow-text";
import { MorphingText } from "@/components/magicui/morphing-text";
import { TextAnimate } from "@/components/magicui/text-animate";
import { RainbowButton } from "@/components/magicui/rainbow-button";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className={styles.page}>
      <div className="flex">
        <div className="absolute inset-0 w-screen h-200 bg-foreground overflow-hidden">
          <Meteors
            number={50}
            minDelay={0}
            maxDelay={2}
            minDuration={0.5}
            maxDuration={30}
            angle={230}
            className="absolute inset-0"
          />

          <div className="relative top-30 z-10 flex flex-col items-center justify-center gap-10 text-center">
            <h1 className="text-white text-4xl font-bold mt-4xl">
              AIditorial is your <AuroraText>LLM-powered</AuroraText>
              <MorphingText texts={["literature", "message", "essay"]} />
              <hr className="mt-20" />
              <br />
              editor that runs{" "}
              <LineShadowText className="font-thin" shadowColor="white">
                locally
              </LineShadowText>{" "}
              on your machine.
            </h1>
          </div>
        </div>
      </div>
      <div className="z-1000 !mt-80">
        <TextAnimate
          delay={2}
          duration={1}
          animation="slideUp"
          by="word"
          once
          className="text-gray-300 max-w-prose text-xl mt-200"
        >
          Why? Free options such as ChatGPT are typically front ends for a
          rotating set of underlying models, which can lead to inconsistent
          behavior over time.
        </TextAnimate>
        <TextAnimate
          delay={3}
          duration={1}
          animation="slideUp"
          by="word"
          once
          className="text-gray-300 max-w-prose text-xl"
        >
          Paid services are often prohibitively expensive for hobbyist, student,
          or exploratory work.
        </TextAnimate>
        <TextAnimate
          delay={4}
          duration={1}
          animation="slideUp"
          by="word"
          once
          className="text-gray-300 max-w-prose text-xl"
        >
          Most available tools operate as black boxes, with limited transparency
          around how data is stored or whether it may be reused for training
          future models or services.
        </TextAnimate>
        <TextAnimate
          delay={5}
          duration={1}
          animation="slideUp"
          by="word"
          once
          className="text-gray-300 max-w-prose text-xl"
        >
          Token limits can be difficult to evaluate in advance, particularly for
          longer projects such as novels or extended essays.
        </TextAnimate>
        <TextAnimate
          delay={6}
          duration={2}
          animation="slideUp"
          by="word"
          once
          className="text-gray-300 max-w-prose text-xl"
        >
          Finally, as commercial products, these systems are subject to legal
          and policy constraints. As a result, they include guardrails that can
          interfere with editing work that addresses sensitive, controversial,
          or dark subject matter.
        </TextAnimate>
        <TextAnimate
          delay={8}
          duration={2}
          animation="slideUp"
          by="word"
          once
          className="text-gray-300 max-w-prose text-xl"
        >
          The solution? Run a language model locally, directly in the browser.
          If you are skeptical, that is intentional. You can cache the model in
          advance and disable network access for this page — or for your entire
          system — while using it.
        </TextAnimate>
      </div>
      <Link href="/prompt">
        <RainbowButton variant="outline" className="w-36 p-6">
          Start{" "}
          <ChevronRightIcon className="ml-1 size-4 transition-transform duration-300 group-hover:translate-x-1" />
        </RainbowButton>
      </Link>
    </div>
  );
}
