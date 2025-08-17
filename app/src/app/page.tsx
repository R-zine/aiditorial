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
          delay={3}
          duration={3}
          animation="slideUp"
          by="word"
          once
          className="text-gray-300 max-w-prose text-xl mt-200"
        >
          Why? Free-to-use options like ChatGPT are usually wrappers for a bunch
          of different models, which can make them fairly inconsistent across
          time.
        </TextAnimate>
        <TextAnimate
          delay={6}
          duration={3}
          animation="slideUp"
          by="word"
          once
          className="text-gray-300 max-w-prose text-xl"
        >
          Paid options are often too expensive for hobby or school work.
        </TextAnimate>
        <TextAnimate
          delay={9}
          duration={3}
          animation="slideUp"
          by="word"
          once
          className="text-gray-300 max-w-prose text-xl"
        >
          All options are a black box and your data could be used for training
          new models and services.
        </TextAnimate>
        <TextAnimate
          delay={12}
          duration={3}
          animation="slideUp"
          by="word"
          once
          className="text-gray-300 max-w-prose text-xl"
        >
          Token restrictions can be hard to judge when considering longer works
          like novels, for example.
        </TextAnimate>
        <TextAnimate
          delay={15}
          duration={5}
          animation="slideUp"
          by="word"
          once
          className="text-gray-300 max-w-prose text-xl"
        >
          Finally, as these are all commercial products, they are liable for the
          advise they give and have guardrails that can impede them when editing
          works that touch on sensitive or dark topics.
        </TextAnimate>
        <TextAnimate
          delay={20}
          duration={5}
          animation="slideUp"
          by="word"
          once
          className="text-gray-300 max-w-prose text-xl"
        >
          The solution? Run your own editorial LLM on your own machine via the
          browser. You don't trust me? Good. Cache the model you'll be using and
          disable the internet for this page (or for your whole system). The
          Google Docs integration I personally find very handy, but you
          definitely don't need it to fully edit your own works.
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
