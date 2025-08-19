"use client";

import { AnimatedCircularProgressBar } from "@/components/magicui/animated-circular-progress-bar";
import { BorderBeam } from "@/components/magicui/border-beam";
import { InteractiveHoverButton } from "@/components/magicui/interactive-hover-button";
import { RainbowButton } from "@/components/magicui/rainbow-button";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DialogHeader } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AIConversation,
  AIConversationContent,
  AIConversationScrollButton,
} from "@/components/ui/shadcn-io/ai/conversation";
import { AIInput, AIInputTextarea } from "@/components/ui/shadcn-io/ai/input";
import {
  AIMessage,
  AIMessageContent,
} from "@/components/ui/shadcn-io/ai/message";
import { availableModels, useWebLLM } from "@/hooks/useWebLLM/useWebLLM";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@radix-ui/react-dialog";
import { useRef } from "react";

export default function Prompt() {
  const { model, isLoading, loadingData, mode, messages, dispatch } =
    useWebLLM();

  const inputRef = useRef(null);

  return (
    <div className="min-h-screen flex flex-col gap-15">
      <div className="flex md:flex-row flex-col !gap-10 !mt-30 !ml-10 !mr-10">
        <Card className=" w-full bg-foreground text-background !p-5 relative ">
          <CardHeader>
            <CardTitle>Model Select</CardTitle>
            <CardDescription>
              Every time you select a new LLM you might have to download and
              cache it, which takes time depending on your connection.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={model ?? undefined}
              onValueChange={(value) =>
                dispatch({ type: "changeModel", payload: value })
              }
            >
              <SelectTrigger className="w-[180px] indent-2">
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 indent-2 text-accent max-h-80 w-80">
                {availableModels.map((model) => (
                  <SelectItem value={model} key={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>

          <BorderBeam duration={8} size={100} />
        </Card>
        <Card className="w-full bg-foreground text-background !p-5 relative ">
          <CardHeader>
            <CardTitle>Mode Select</CardTitle>
            <CardDescription>
              Choose between typical chatbot style where you and the LLM use the
              same input space to communicate, separated prompt and response
              which is useful when trying to automate the editing from a batch
              job, and separated prompt and response with a before and after
              comparison.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select>
              <SelectTrigger className="w-[180px] indent-2">
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 indent-2 text-accent">
                <SelectItem value="light">Standard</SelectItem>
                <SelectItem value="dark">Separated</SelectItem>
                <SelectItem value="system">
                  Separated with comparison
                </SelectItem>
              </SelectContent>
            </Select>
          </CardContent>

          <BorderBeam duration={8} delay={4} size={100} />
        </Card>
      </div>
      {mode === "Standard" && (
        <div className="flex justify-center w-full">
          <div className="min-w-[90vw] flex flex-col gap-10">
            <div className="relative flex size-full flex-col divide-y overflow-hidden">
              <AIConversation className="relative size-full rounded-lg border bg-foreground text-background !p-4 min-h-80">
                <AIConversationContent>
                  {messages.map((message) => (
                    <AIMessage from={message.role}>
                      <AIMessageContent className="!mb-5 !px-3 !py-1">
                        {message.content}
                      </AIMessageContent>
                    </AIMessage>
                  ))}
                </AIConversationContent>
                <AIConversationScrollButton />
              </AIConversation>
            </div>
            <AIInput className="bg-accent-foreground text-background min-h-60 ">
              <AIInputTextarea
                ref={inputRef}
                placeholder="Prompt goes here"
                className="!pl-4 !pt-4 min-h-60"
              />
            </AIInput>
          </div>
        </div>
      )}
      <div className="flex gap-10 justify-center ">
        <RainbowButton className="!p-4 w-40 ">Save to history</RainbowButton>
        <InteractiveHoverButton
          className="!p-1 w-30 !pl-6"
          onClick={() => {
            if (inputRef.current)
              dispatch({
                type: "addMessage",
                payload: {
                  role: "user",
                  content: (inputRef.current as any).value,
                },
              });
          }}
        >
          Prompt
        </InteractiveHoverButton>
        <ShimmerButton className="!py-1 w-30 text-(--destructive)">
          Clear
        </ShimmerButton>
      </div>

      {isLoading && (
        <div className="w-[100vw] h-[100vh] fixed bg-black z-100">
          <div className="w-[80vw] h-[80vh] top-[10vh] left-[10vw] fixed p-6 flex justify-center z-110  ">
            <Dialog modal open={isLoading}>
              <DialogContent className="h-full w-full bg-foreground flex flex-col items-center justify-center gap-10">
                <DialogHeader className="text-background items-center">
                  <DialogTitle>Model Loading</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Your chosen model is currently loading, details below...
                  </DialogDescription>
                </DialogHeader>

                <AnimatedCircularProgressBar
                  value={Number(loadingData?.percent) * 100}
                  gaugePrimaryColor="rgb(80.2% 0.134 225)"
                  gaugeSecondaryColor="rgb(60.4% 0.26 302)"
                />
                <div className="text-muted-foreground">
                  {loadingData?.message}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}
    </div>
  );
}
