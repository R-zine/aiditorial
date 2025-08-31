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
import { Checkbox } from "@/components/ui/checkbox";
import { DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { db } from "@/db/db";
import { availableModels, useWebLLM } from "@/hooks/useWebLLM/useWebLLM";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@radix-ui/react-dialog";
import { useRef, useState } from "react";
import ReactDiffViewer from "react-diff-viewer";

export default function Prompt() {
  const {
    model,
    isLoading,
    loadingData,
    mode,
    messages,
    isReplying,
    temperature,
    isCache,
    dispatch,
  } = useWebLLM();

  const [isDBError, setIsDBError] = useState(false);

  const inputRef = useRef(null);
  const textRef = useRef(null);

  return (
    <div className="min-h-screen flex flex-col gap-15">
      <div className="flex md:flex-row flex-col !gap-10 !mt-30 !ml-10 !mr-10">
        <Card className=" w-full bg-foreground text-background !p-5 relative ">
          <CardHeader>
            <CardTitle>Model Select</CardTitle>
            <CardDescription>
              Every time you select a new LLM you might have to download and
              cache it, which takes time depending on your connection. Please
              make sure to have your caching preference selected before
              selecting the model.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-between ">
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

            <div className="flex justify-center gap-2">
              <Label htmlFor="temperature">Temperature: </Label>
              <Input
                id="temperature"
                type="number"
                placeholder="Tempeature"
                min={0}
                max={2}
                className="w-40 indent-3"
                value={temperature}
                onChange={(e) =>
                  dispatch({
                    type: "changeTemperature",
                    payload: Number(e.target.value ?? 0),
                  })
                }
              />
            </div>

            <Label className=" !pt-2.5 !px-2 w-max hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3 has-[[aria-checked=true]]:border-blue-600 has-[[aria-checked=true]]:bg-blue-950 dark:has-[[aria-checked=true]]:border-blue-900 dark:has-[[aria-checked=true]]:bg-blue-950">
              <Checkbox
                id="toggle-2"
                checked={isCache}
                onClick={() => dispatch({ type: "toggleCache", payload: null })}
                className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 !data-[state=checked]:text-[black] dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700"
              />
              <div className="grid gap-1.5 font-normal">
                <p className="text-sm leading-none font-medium">
                  Enable indexedDB caching
                </p>
              </div>
            </Label>
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
            <Select
              value={mode}
              onValueChange={(value) =>
                dispatch({ type: "changeMode", payload: value })
              }
            >
              <SelectTrigger className="w-[180px] indent-2">
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 indent-2 text-accent">
                <SelectItem value="Standard">Standard</SelectItem>
                <SelectItem value="Separate">Separate</SelectItem>
                <SelectItem value="Separate with comparison">
                  Separate with comparison
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
                  {isReplying && (
                    <AIMessage from="assistant">
                      <AIMessageContent className="!mb-5 !px-3 !py-1">
                        Calculating a reply...
                      </AIMessageContent>
                    </AIMessage>
                  )}
                </AIConversationContent>
                <AIConversationScrollButton />
              </AIConversation>
            </div>
            <AIInput className="bg-accent-foreground text-background min-h-60 ">
              <AIInputTextarea
                disabled={isReplying}
                ref={inputRef}
                placeholder="Prompt goes here"
                className="!pl-4 !pt-4 min-h-60"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (inputRef.current) {
                      dispatch({
                        type: "addMessage",
                        payload: {
                          role: "user",
                          content: (inputRef.current as any).value,
                        },
                      });
                      (inputRef.current as any).value = "";
                    }
                  }
                }}
              />
            </AIInput>
          </div>
        </div>
      )}
      {mode === "Separate" && (
        <div className="flex justify-center w-full">
          <div className="min-w-[90vw] flex flex-col gap-10">
            <AIInput className="bg-accent-foreground text-background min-h-40 max-w-[90vw]">
              <AIInputTextarea
                disabled={isReplying}
                ref={inputRef}
                placeholder="Your prompt goes here, while the paragraph/s you want to be edited should go in the box below. This is useful for developing a prompt that can be executed on your whole document batch by batch. Once you are happy with the result from this prompt you can go to the batch page from the navigator above. This mode only supports one message per 'chat'. Use the 'Clear' button to remove the messages but keep the prompt."
                className="!pl-4 !pt-4 min-h-60 !placeholder-gray-100"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (inputRef.current) {
                      dispatch({
                        type: "addMessage",
                        payload: {
                          role: "user",
                          content: (inputRef.current as any).value,
                        },
                      });
                      (inputRef.current as any).value = "";
                    }
                  }
                }}
              />
            </AIInput>
            <div className="flex max-w-[90vw] gap-10">
              <AIInput className="bg-accent-foreground text-background min-h-70 w-[50%]">
                <AIInputTextarea
                  disabled={isReplying}
                  ref={textRef}
                  placeholder="Your text goes here. It is appended to the end of your prompt."
                  className="!pl-4 !pt-4 min-h-70 !placeholder-gray-100"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (inputRef.current) {
                        dispatch({
                          type: "addMessage",
                          payload: {
                            role: "user",
                            content: (inputRef.current as any).value,
                          },
                        });
                        (inputRef.current as any).value = "";
                      }
                    }
                  }}
                />
              </AIInput>
              <AIConversation className=" rounded-lg border bg-foreground text-background !p-4 min-h-50 min-w-[50%]">
                <AIConversationContent>
                  {!isReplying && (
                    <AIMessage from={"assistant"}>
                      <AIMessageContent className="!mb-5 !px-3 !py-1">
                        {messages.at(1)?.content ??
                          "The AI response will appear here..."}
                      </AIMessageContent>
                    </AIMessage>
                  )}

                  {isReplying && (
                    <AIMessage from="assistant">
                      <AIMessageContent className="!mb-5 !px-3 !py-1">
                        Calculating a reply...
                      </AIMessageContent>
                    </AIMessage>
                  )}
                </AIConversationContent>
                <AIConversationScrollButton />
              </AIConversation>
            </div>
          </div>
        </div>
      )}
      {mode === "Separate with comparison" && (
        <div className="flex justify-center w-full">
          <div className="min-w-[90vw] flex flex-col gap-10">
            <AIInput className="bg-accent-foreground text-background min-h-40 max-w-[90vw]">
              <AIInputTextarea
                disabled={isReplying}
                ref={inputRef}
                placeholder="Your prompt goes here, while the paragraph/s you want to be edited should go in the box below. This is useful for developing a prompt that can be executed on your whole document batch by batch. Once you are happy with the result from this prompt you can go to the batch page from the navigator above. This mode only supports one message per 'chat'. Use the 'Clear' button to remove the messages but keep the prompt."
                className="!pl-4 !pt-4 min-h-60 !placeholder-gray-100"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (inputRef.current) {
                      dispatch({
                        type: "addMessage",
                        payload: {
                          role: "user",
                          content: (inputRef.current as any).value,
                        },
                      });
                      (inputRef.current as any).value = "";
                    }
                  }
                }}
              />
            </AIInput>
            {!messages.length ? (
              <div className="flex max-w-[90vw] gap-10">
                <AIInput className="bg-accent-foreground text-background min-h-70 w-[50%]">
                  <AIInputTextarea
                    disabled={isReplying}
                    ref={textRef}
                    placeholder="Your text goes here. It is appended to the end of your prompt. After receiving the reply, this will be replaced by a text comparison component."
                    className="!pl-4 !pt-4 min-h-70 !placeholder-gray-100"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (inputRef.current) {
                          dispatch({
                            type: "addMessage",
                            payload: {
                              role: "user",
                              content: (inputRef.current as any).value,
                            },
                          });
                          (inputRef.current as any).value = "";
                        }
                      }
                    }}
                  />
                </AIInput>
                <AIConversation className=" rounded-lg border bg-foreground text-background !p-4 min-h-50 min-w-[50%]">
                  <AIConversationContent>
                    {!isReplying && (
                      <AIMessage from={"assistant"}>
                        <AIMessageContent className="!mb-5 !px-3 !py-1">
                          {messages.at(1)?.content ??
                            "The AI response will appear here..."}
                        </AIMessageContent>
                      </AIMessage>
                    )}

                    {isReplying && (
                      <AIMessage from="assistant">
                        <AIMessageContent className="!mb-5 !px-3 !py-1">
                          Calculating a reply...
                        </AIMessageContent>
                      </AIMessage>
                    )}
                  </AIConversationContent>
                  <AIConversationScrollButton />
                </AIConversation>
              </div>
            ) : (
              <div className="w-[90vw]">
                <ReactDiffViewer
                  oldValue={messages[0].content}
                  newValue={messages[1]?.content ?? ""}
                  hideLineNumbers
                />
              </div>
            )}
          </div>
        </div>
      )}
      <div className="flex gap-10 justify-center ">
        <RainbowButton
          className={`!p-4 w-40 ${
            isReplying ? "pointer-events-none grayscale" : ""
          } ${isDBError ? "pointer-events-none text-destructive !w-60" : ""}`}
          disabled={isReplying}
          onClick={async () => {
            if (model && (inputRef.current as any)?.value) {
              const id = await db.history.add({
                model,
                mode,
                temperature,
                isCache,
                prompt: (inputRef.current as any).value,
              });

              if (!id) setIsDBError(true);
            }
          }}
        >
          {isDBError ? "Unable to save to history!" : "Save to history"}
        </RainbowButton>
        <InteractiveHoverButton
          disabled={isReplying}
          className={`!p-1 w-30 !pl-6 ${
            isReplying || (messages.length && mode !== "Standard")
              ? "pointer-events-none grayscale invert-80"
              : ""
          }`}
          onClick={() => {
            if (inputRef.current) {
              if (mode === "Standard") {
                dispatch({
                  type: "addMessage",
                  payload: {
                    role: "user",
                    content: (inputRef.current as any).value,
                  },
                });
                (inputRef.current as any).value = "";
              } else {
                if (textRef.current) {
                  dispatch({
                    type: "addMessage",
                    payload: {
                      role: "user",
                      content:
                        (inputRef.current as any).value +
                        (textRef.current as any).value,
                    },
                  });
                }
              }
            }
          }}
        >
          Prompt
        </InteractiveHoverButton>
        <ShimmerButton
          onClick={() => {
            dispatch({ type: "clear", payload: null });
            if (mode !== "Standard") (textRef.current as any).value = "";
          }}
          disabled={isReplying}
          className={`!py-1 w-30 text-(--destructive) ${
            isReplying ? "pointer-events-none grayscale" : ""
          }`}
        >
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
