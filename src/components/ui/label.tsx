import * as LabelPrimitive from "@radix-ui/react-label";
import type * as React from "react";

import { cn } from "@/lib/utils";

function Label({
  className,
  children,
  isRequired,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root> & { isRequired?: boolean }) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "select-none font-medium text-sm leading-normal peer-disabled:cursor-not-allowed peer-disabled:opacity-50 group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
      {isRequired ? <span className="text-border-danger"> *</span> : null}
    </LabelPrimitive.Root>
  );
}

export { Label };
