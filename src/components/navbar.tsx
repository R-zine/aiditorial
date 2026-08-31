"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileStack, History, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/prompt", label: "Editor", icon: PenLine },
  { href: "/history", label: "History", icon: History },
  { href: "/batch", label: "Batch", icon: FileStack },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-white/7 bg-[oklch(0.12_0.012_285/82%)] backdrop-blur-lg">
      <nav
        className="mx-auto flex min-h-17 w-[min(1180px,calc(100%_-_2rem))] items-center justify-between gap-6 max-sm:min-h-16"
        aria-label="Primary navigation"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 text-[1.05rem] font-bold tracking-[-0.03em]"
          aria-label="AIditorial home"
        >
          <span className="grid size-8 place-items-center rounded-[0.6rem] border border-[oklch(0.72_0.15_286/45%)] bg-linear-to-br from-[oklch(0.65_0.2_300/35%)] to-[oklch(0.6_0.16_240/18%)] text-[oklch(0.88_0.08_275)]">
            A
          </span>
          AIditorial
        </Link>
        <div className="flex min-w-0 items-center gap-1">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname.startsWith(href) ? "page" : undefined}
              className={cn(
                "inline-flex min-h-10 items-center gap-2 rounded-[0.65rem] px-3.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/6 hover:text-foreground max-sm:px-2.5",
                pathname.startsWith(href) && "bg-white/6 text-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span className="max-sm:hidden">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
