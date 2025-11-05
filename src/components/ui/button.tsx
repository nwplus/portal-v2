import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium text-sm outline-none transition-all focus-visible:border-subtle focus-visible:ring-[3px] focus-visible:ring-subtle/50 disabled:pointer-events-none aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-button-primary text-primary-foreground hover:bg-button-primary/90 hover:ring-[1.5px] hover:ring-subtle hover:ring-inset disabled:bg-button-disabled disabled:text-secondary-foreground",
        secondary:
          "border border-[1px] border-subtle bg-button-secondary text-primary-foreground hover:bg-button-secondary/80 hover:ring-[1.5px] hover:ring-subtle hover:ring-inset disabled:text-secondary-foreground",
        tertiary:
          "border border-button-tertiary text-tertiary-button-foreground shadow-xs hover:border-button-tertiary/80 hover:text-tertiary-button-foreground/80 disabled:border-button-disabled disabled:text-secondary-foreground",
        error:
          "border border-danger text-error-foreground hover:bg-danger/90 hover:text-primary-foreground focus-visible:ring-danger/60",
        ghost:
          "text-primary-foreground hover:text-primary-foreground/80 disabled:text-secondary-foreground",
        "ghost-error":
          "text-error-foreground hover:text-error-foreground/80 disabled:text-secondary-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        ethereal:
          "border-2 border-foreground/30 bg-transparent shadow-xs hover:bg-foreground/20 hover:shadow-[0_0px_20px_rgba(255,255,255,0.5)] dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
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
