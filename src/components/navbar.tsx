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
    <header className="site-header">
      <nav className="site-nav" aria-label="Primary navigation">
        <Link href="/" className="wordmark" aria-label="AIditorial home">
          <span>A</span>
          AIditorial
        </Link>
        <div className="nav-links">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "nav-link",
                pathname.startsWith(href) && "nav-link-active",
              )}
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
