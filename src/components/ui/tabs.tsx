"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex min-h-11 w-fit items-center justify-center gap-1 rounded-xl border border-white/8 bg-[oklch(0.155_0.014_285/92%)] p-1 text-muted-foreground shadow-[inset_0_1px_0_oklch(1_0_0/4%)] max-sm:grid max-sm:w-full max-sm:grid-cols-3",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex min-h-9 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.025] px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap text-muted-foreground transition-[color,background-color,border-color,box-shadow] after:size-1.5 after:rounded-full after:bg-current after:opacity-0 after:content-[''] hover:border-white/15 hover:bg-white/[0.055] hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 data-[state=active]:border-[oklch(0.72_0.15_286/65%)] data-[state=active]:bg-[oklch(0.3_0.09_285/72%)] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_0_1px_oklch(0.72_0.15_286/16%),0_7px_20px_oklch(0.08_0.02_285/30%)] data-[state=active]:after:opacity-100 disabled:pointer-events-none disabled:cursor-default disabled:opacity-50 max-sm:gap-1.5 max-sm:px-1.5 max-sm:text-xs max-sm:after:hidden [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
