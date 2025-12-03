import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium text-sm outline-none transition-all focus-visible:border-border-subtle focus-visible:ring-[3px] focus-visible:ring-border-subtle/50 disabled:pointer-events-none aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-bg-button-primary text-text-primary hover:bg-bg-button-primary/90 hover:ring-[1.5px] hover:ring-border-subtle hover:ring-inset disabled:bg-button-disabled disabled:text-text-secondary",
        secondary:
          "border border-[1px] border-border-subtle bg-bg-button-secondary text-text-primary hover:bg-bg-button-secondary/80 hover:ring-[1.5px] hover:ring-border-subtle hover:ring-inset disabled:text-text-secondary",
        tertiary:
          "border border-button-tertiary text-button-tertiary shadow-xs hover:border-button-tertiary/80 hover:text-button-tertiary/80 disabled:border-button-tertiary/30 disabled:text-text-secondary",
        error:
          "border border-border-danger text-text-error hover:border-border-danger/80 hover:text-text-error/80 focus-visible:ring-border-danger/60",
        ghost: "text-text-primary hover:text-text-primary/80 disabled:text-text-secondary",
        "ghost-error": "text-text-error hover:text-text-error/80 disabled:text-text-secondary",
        link: "underline-offset-4 hover:underline",
        ethereal:
          "border-2 border-border-subtle bg-transparent shadow-xs hover:bg-bg-button-secondary/90 hover:shadow-[0_0px_20px_rgba(255,255,255,0.5)]",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
