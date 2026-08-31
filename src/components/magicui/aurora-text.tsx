import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AuroraTextProps {
  children: ReactNode;
  className?: string;
  colors?: string[];
  speed?: number;
}

export function AuroraText({
  children,
  className,
  colors = ["#c4b5fd", "#a78bfa", "#60a5fa", "#67e8f9"],
  speed = 1,
}: AuroraTextProps) {
  const duration = Math.max(4, 12 / Math.max(speed, 0.1));
  const gradient = [...colors, colors[0]].join(", ");

  return (
    <span
      className={cn(
        "magic-aurora-text -mb-[0.12em] inline-block bg-[length:220%_auto] bg-clip-text pb-[0.12em] align-baseline leading-[1.08] text-transparent will-change-[background-position]",
        className,
      )}
      style={
        {
          "--aurora-duration": `${duration}s`,
          backgroundImage: `linear-gradient(110deg, ${gradient})`,
        } as CSSProperties
      }
    >
      {children}
    </span>
  );
}
