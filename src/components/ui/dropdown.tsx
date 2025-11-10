import { Combobox } from "@base-ui-components/react/combobox";
import * as React from "react";

interface DropdownProps<T = string> {
  label: string;
  items: T[];
  value?: T | null;
  onValueChange?: (value: T | null) => void;
  itemToString?: (item: T) => string;
  itemToKey?: (item: T) => string | number;
}

export function Dropdown<T = string>({
  label,
  items,
  value,
  onValueChange,
  itemToString = (item) => String(item),
  itemToKey = (item) => String(item),
}: DropdownProps<T>) {
  const id = React.useId();

  return (
    <Combobox.Root items={items} value={value} onValueChange={onValueChange}>
      <div>
        <label htmlFor={id} className="mb-1 block text-sm text-text-primary">
          {label}
        </label>
        <div className="relative w-full">
          <Combobox.Input
            placeholder="Start typing or select an option"
            id={id}
            className="h-10 w-full rounded-md border border-border-subtle bg-bg-text-field pr-10 pl-3.5 text-sm text-text-primary placeholder:text-text-secondary focus:border-border-active focus:outline-none data-[invalid]:border-border-danger"
          />
          <div className="pointer-events-none absolute top-0 right-2 flex h-10 items-center justify-center text-text-secondary">
            <Combobox.Trigger
              className="pointer-events-auto flex h-10 w-6 items-center justify-center rounded bg-transparent p-0"
              aria-label="Open popup"
            >
              <ChevronDownIcon className="size-4" />
            </Combobox.Trigger>
          </div>
        </div>
      </div>

      <Combobox.Portal>
        <Combobox.Positioner className="outline-none" side="bottom" sideOffset={4}>
          <Combobox.Popup className="max-h-[min(var(--available-height),15rem)] w-[var(--anchor-width)] max-w-[var(--available-width)] origin-[var(--transform-origin)] overflow-y-auto overscroll-contain rounded-md border border-border-subtle bg-bg-dropdown py-2 text-sm shadow-lg transition-[transform,scale,opacity] [scrollbar-color:theme(colors.text.secondary)_transparent] [scrollbar-width:thin] data-[ending-style]:scale-95 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-2">
            <Combobox.Empty className="px-4 py-2 text-sm text-text-secondary empty:m-0 empty:p-0">
              No results found.
            </Combobox.Empty>
            <Combobox.List>
              {(item: T) => (
                <Combobox.Item
                  key={itemToKey(item)}
                  value={item}
                  className="grid cursor-default select-none grid-cols-[1fr_0.75rem] items-center gap-2 py-2 pr-4 pl-4 text-sm text-text-primary outline-none data-[highlighted]:bg-bg-dropdown-selected"
                >
                  <div className="col-start-1">{itemToString(item)}</div>
                  <Combobox.ItemIndicator className="col-start-2">
                    <CheckIcon className="size-3" />
                  </Combobox.ItemIndicator>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

function CheckIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}

function ChevronDownIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
