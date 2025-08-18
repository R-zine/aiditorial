"use client";

import { BorderBeam } from "@/components/magicui/border-beam";
import { InteractiveHoverButton } from "@/components/magicui/interactive-hover-button";
import { RainbowButton } from "@/components/magicui/rainbow-button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  AIInput,
  AIInputSubmit,
  AIInputTextarea,
  AIInputToolbar,
} from "@/components/ui/shadcn-io/ai/input";
import {
  AIMessage,
  AIMessageContent,
} from "@/components/ui/shadcn-io/ai/message";
import { useState } from "react";

export default function Prompt() {
  const [mode, setMode] = useState("Standard");

  const messages: string[] = ["test", "test2"];

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
            <Select>
              <SelectTrigger className="w-[180px] indent-2">
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 indent-2 text-accent">
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
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
              <AIConversation className="relative size-full rounded-lg border bg-foreground text-background">
                <AIConversationContent>
                  {messages.map((message) => (
                    <AIMessage from="user">
                      <AIMessageContent>{message}</AIMessageContent>
                    </AIMessage>
                  ))}
                </AIConversationContent>
                <AIConversationScrollButton />
              </AIConversation>
            </div>
            <AIInput className="bg-accent-foreground text-background min-h-60 ">
              <AIInputTextarea
                placeholder="Prompt goes here"
                className="!pl-4 !pt-4 min-h-60"
              />
            </AIInput>
          </div>
        </div>
      )}
      <div className="flex gap-10 justify-center">
        <InteractiveHoverButton className="!p-1 w-30 !pl-6">
          Prompt
        </InteractiveHoverButton>

        <RainbowButton className="!p-4 w-40 ">Save to history</RainbowButton>
      </div>
    </div>
  );
}
