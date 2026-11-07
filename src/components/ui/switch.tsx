import { Switch as SwitchPrimitive } from "@base-ui-components/react/switch";
import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * On/off toggle for a setting that applies immediately in meaning, even when the form
 * around it saves on submit.
 *
 * Built on Base UI rather than Radix — Base UI is already a dependency (see
 * `ui/dropdown.tsx`) and ships a Switch, while Radix does not have one installed. The
 * prop surface (`checked`, `onCheckedChange`, `disabled`, `id`) matches `ui/checkbox.tsx`
 * either way, so the two are interchangeable at call sites.
 *
 * Base UI passes its own event details as a second argument to `onCheckedChange`; the
 * wrapper below narrows that to just the boolean, which is all any caller here wants.
 */
function Switch({
  className,
  onCheckedChange,
  ...props
}: Omit<React.ComponentProps<typeof SwitchPrimitive.Root>, "onCheckedChange"> & {
  onCheckedChange?: (checked: boolean) => void;
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      onCheckedChange={(checked) => onCheckedChange?.(checked)}
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-border-subtle p-0.5 outline-none transition-colors",
        "[background:var(--background-text-field)] data-[checked]:border-border-active data-[checked]:bg-bg-button-control",
        "focus-visible:border-border-active focus-visible:ring-[3px] focus-visible:ring-border-subtle/50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="size-4 rounded-full bg-text-primary shadow-xs transition-transform data-[checked]:translate-x-4 data-[checked]:bg-bg-main"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
