import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface MeteorsProps {
  number?: number;
  minDelay?: number;
  maxDelay?: number;
  minDuration?: number;
  maxDuration?: number;
  angle?: number;
  className?: string;
}

interface MeteorStyle extends CSSProperties {
  "--meteor-angle": string;
}

function seededFraction(index: number, salt: number) {
  return ((index + 1) * salt % 101) / 101;
}

export function Meteors({
  number = 20,
  minDelay = 0.2,
  maxDelay = 1.2,
  minDuration = 2,
  maxDuration = 10,
  angle = 215,
  className,
}: MeteorsProps) {
  const meteors = Array.from({ length: number }, (_, index) => {
    const position = ((index + 0.5) / number) * 100;
    const delay =
      minDelay + seededFraction(index, 47) * (maxDelay - minDelay);
    const duration =
      minDuration + seededFraction(index, 71) * (maxDuration - minDuration);
    const style: MeteorStyle = {
      "--meteor-angle": `${angle}deg`,
      left: `${position}%`,
      animationDelay: `${delay.toFixed(2)}s`,
      animationDuration: `${duration.toFixed(2)}s`,
    };

    return style;
  });

  return (
    <div
      data-slot="magic-meteors"
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 overflow-hidden",
        className,
      )}
    >
      {meteors.map((style, index) => (
        <span
          // The style is deterministic, so the index maps to the same meteor.
          key={index}
          style={style}
          className="absolute top-[-5%] size-0.5 animate-meteor rounded-full bg-[oklch(0.8_0.11_270/70%)] shadow-[0_0_0_1px_oklch(1_0_0/8%)]"
        >
          <span className="absolute top-1/2 -z-10 h-px w-20 -translate-y-1/2 bg-linear-to-r from-[oklch(0.72_0.12_260/55%)] to-transparent" />
        </span>
      ))}
    </div>
  );
}
