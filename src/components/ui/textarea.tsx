import type * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "field-sizing-content flex min-h-32 w-full resize-none rounded-md border border-border-subtle px-3 py-2 text-base shadow-xs outline-none transition-[color,box-shadow] [background:var(--background-text-field)] placeholder:text-text-secondary disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus:border-border-active focus:ring-2 focus:ring-border-active/20",
        "aria-invalid:border-border-danger aria-invalid:ring-border-danger/20",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
