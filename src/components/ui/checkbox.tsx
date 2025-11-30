import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer background:var(--background-translucent-card) size-4 shrink-0 rounded-[4px] border border-border-subtle text-bg-button-control shadow-xs outline-none transition-shadow focus-visible:border-border-active focus-visible:ring-[3px] focus-visible:ring-border-subtle/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-border-danger aria-invalid:ring-border-danger/20 data-[state=checked]:border-border-active",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
