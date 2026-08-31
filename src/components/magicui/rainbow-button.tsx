import type { ButtonHTMLAttributes } from "react";
import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const rainbowButtonVariants = cva(
  "magic-rainbow-button relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-[0.65rem] border border-transparent text-sm font-semibold whitespace-nowrap text-white shadow-[0_10px_34px_oklch(0.52_0.19_285/24%)] outline-none transition-[transform,box-shadow,filter] duration-200 hover:-translate-y-px hover:brightness-105 hover:shadow-[0_13px_38px_oklch(0.52_0.19_285/32%)] active:translate-y-0 focus-visible:shadow-[0_0_0_3px_oklch(0.72_0.15_255/24%),0_13px_38px_oklch(0.52_0.19_285/28%)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:transition-transform hover:[&_svg]:translate-x-0.5",
  {
  variants: {
    size: {
      default: "min-h-9 px-4 py-2",
      sm: "min-h-8 px-3 py-1.5 text-xs",
      lg: "min-h-10 px-6 py-2.5",
    },
  },
  defaultVariants: {
    size: "default",
  },
  },
);

interface RainbowButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof rainbowButtonVariants> {
  asChild?: boolean;
}

const RainbowButton = forwardRef<HTMLButtonElement, RainbowButtonProps>(
  ({ asChild = false, className, size, ...props }, ref) => {
    const Component = asChild ? Slot : "button";

    return (
      <Component
        ref={ref}
        data-slot="magic-rainbow-button"
        className={cn(rainbowButtonVariants({ size }), className)}
        {...props}
      />
    );
  },
);

RainbowButton.displayName = "RainbowButton";

export { RainbowButton, rainbowButtonVariants };
