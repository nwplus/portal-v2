import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import type * as React from "react";

const tagVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-full border bg-transparent px-2 py-1 font-regular text-md md:px-4 [&>svg]:pointer-events-none",
  {
    variants: {
      variant: {
        active: "border-tag-active text-tag-active",
        disabled: "border-tag-disabled text-tag-disabled",
        success: "border-tag-success text-tag-success",
      },
    },
    defaultVariants: {
      variant: "active",
    },
  },
);

type TagProps = React.ComponentProps<"span"> &
  VariantProps<typeof tagVariants> & {
    asChild?: boolean;
  };

function Tag({ className, variant, asChild = false, ...props }: TagProps) {
  const Comp = asChild ? Slot : "span";

  return <Comp data-slot="tag" className={cn(tagVariants({ variant }), className)} {...props} />;
}

export { Tag };
