import { Combobox } from "@base-ui-components/react/combobox";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { CSSProperties, ComponentProps } from "react";
import { useCallback, useDeferredValue, useEffect, useId, useMemo, useRef, useState } from "react";

interface DropdownProps<T = string> {
  label?: string;
  items: T[];
  value?: T | null;
  onValueChange?: (value: T | null) => void;
  itemToString?: (item: T) => string;
  itemToKey?: (item: T) => string | number;
  createOtherOption?: boolean; // if true, allows the user to create a custom option
  createOtherItem?: (input: string) => T;
  /**
   * wiring hooks for form libraries like React Hook Form.
   */
  name?: string;
  inputId?: string;
  invalid?: boolean;
  onBlur?: () => void;
}

export function Dropdown<T = string>({
  label,
  items,
  value,
  onValueChange,
  itemToString = (item) => String(item),
  itemToKey = (item) => String(item),
  createOtherOption = false,
  createOtherItem,
  name,
  inputId,
  invalid,
  onBlur,
}: DropdownProps<T>) {
  const generatedId = useId();
  const id = inputId ?? generatedId;
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  // Defer filtering slightly so typing feels snappier on huge lists.
  const deferredSearchValue = useDeferredValue(searchValue);
  const scrollElementRef = useRef<HTMLDivElement | null>(null);

  // Normalize empty-string/undefined to `null` so the combobox always sees
  // either `null` or a real item from `items`.
  const selectedValue = value === "" || value == null ? null : (value as T);
  const { contains } = Combobox.useFilter({ value: selectedValue });

  const resolvedSearchValue =
    searchValue === "" || deferredSearchValue === "" ? searchValue : deferredSearchValue;

  const allItems = useMemo(() => {
    if (!createOtherOption || selectedValue == null) {
      return items;
    }

    const selectedLabel = itemToString(selectedValue);
    const exists = items.some((item) => itemToString(item) === selectedLabel);
    return exists ? items : [...items, selectedValue];
  }, [createOtherOption, itemToString, items, selectedValue]);

  const filteredItems = useMemo(
    () =>
      resolvedSearchValue === ""
        ? allItems
        : allItems.filter((item) => contains(item, resolvedSearchValue, itemToString)),
    [allItems, contains, itemToString, resolvedSearchValue],
  );

  const commitInputToValue = useCallback(() => {
    if (!createOtherOption) return;

    const raw = searchValue.trim();

    if (!raw) {
      onValueChange?.(null);
      return;
    }

    const existingMatch = allItems.find((item) => itemToString(item) === raw);

    if (existingMatch) {
      onValueChange?.(existingMatch);
      return;
    }

    const nextValue = createOtherItem ? createOtherItem(raw) : (raw as T);
    onValueChange?.(nextValue);
  }, [allItems, createOtherItem, createOtherOption, itemToString, onValueChange, searchValue]);

  // Virtualizer drives which rows are mounted and their positions.
  const virtualizer = useVirtualizer({
    enabled: open,
    count: filteredItems.length,
    getScrollElement: () => scrollElementRef.current,
    // Approximate row height: text-sm (20px line-height) + py-2 (16px total) ≈ 36px
    estimateSize: () => 36,
    overscan: 20,
    paddingStart: 8,
    paddingEnd: 8,
    scrollPaddingEnd: 8,
    scrollPaddingStart: 8,
  });

  // Keep a ref to the scroll container and re-measure when it mounts.
  const handleScrollElementRef = useCallback(
    (element: HTMLDivElement | null) => {
      scrollElementRef.current = element;
      if (element) {
        virtualizer.measure();
      }
    },
    [virtualizer],
  );

  const totalSize = virtualizer.getTotalSize();

  useEffect(() => {
    if (!open) {
      setSearchValue(selectedValue ? itemToString(selectedValue) : "");
    }
  }, [open, selectedValue, itemToString]);

  return (
    <Combobox.Root
      virtualized
      items={allItems}
      filteredItems={filteredItems}
      open={open}
      onOpenChange={setOpen}
      inputValue={searchValue}
      onInputValueChange={setSearchValue}
      value={selectedValue}
      onValueChange={onValueChange}
      itemToStringLabel={itemToString}
      onItemHighlighted={(item, { reason, index }) => {
        if (!item || index == null) {
          return;
        }

        const isStart = index === 0;
        const isEnd = index === filteredItems.length - 1;
        const shouldScroll = reason === "none" || (reason === "keyboard" && (isStart || isEnd));

        if (shouldScroll) {
          queueMicrotask(() => {
            virtualizer.scrollToIndex(index, { align: isEnd ? "start" : "end" });
          });
        }
      }}
    >
      <div>
        {label ? (
          <label htmlFor={id} className="mb-1 block text-sm text-text-primary">
            {label}
          </label>
        ) : null}
        <div className="relative w-full">
          <Combobox.Input
            placeholder="Start typing or select an option"
            id={id}
            name={name}
            aria-invalid={invalid || undefined}
            data-invalid={invalid || undefined}
            onBlur={() => {
              commitInputToValue();
              onBlur?.();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && createOtherOption && filteredItems.length === 0) {
                event.preventDefault();
                commitInputToValue();
              }
            }}
            className="h-9 w-full min-w-0 rounded-md border border-border-subtle bg-bg-text-field py-1 pr-10 pl-3 text-base text-text-primary shadow-xs outline-none transition-[color,box-shadow] selection:bg-bg-text-field selection:text-text-primary placeholder:text-text-secondary focus:border-border-active focus:ring-2 focus:ring-border-active/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-border-danger aria-invalid:ring-border-danger/20 md:text-sm"
          />
          <div className="pointer-events-none absolute top-0 right-2 flex h-9 items-center justify-center text-text-secondary">
            <Combobox.Trigger
              className="pointer-events-auto flex h-9 w-6 items-center justify-center rounded bg-transparent p-0"
              aria-label="Open popup"
            >
              <ChevronDownIcon className="size-4" />
            </Combobox.Trigger>
          </div>
        </div>
      </div>

      <Combobox.Portal>
        <Combobox.Positioner
          className="outline-none"
          side="bottom"
          sideOffset={4}
          collisionAvoidance={{
            side: "none",
            align: "none",
            fallbackAxisSide: "none",
          }}
        >
          <Combobox.Popup className="max-h-[min(var(--available-height),15rem)] w-[var(--anchor-width)] max-w-[var(--available-width)] origin-[var(--transform-origin)] rounded-md border border-border-subtle bg-bg-dropdown text-sm shadow-lg transition-[transform,scale,opacity] data-[ending-style]:scale-95 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0">
            <Combobox.Empty className="px-4 py-2 text-sm text-text-secondary empty:m-0 empty:p-0">
              {createOtherOption
                ? "No results found. Hit enter to create a new option."
                : "No results found."}
            </Combobox.Empty>
            <Combobox.List className="p-0">
              {filteredItems.length > 0 ? (
                <div
                  role="presentation"
                  ref={handleScrollElementRef}
                  className="h-[min(15rem,var(--total-size))] max-h-[min(var(--available-height),15rem)] overflow-y-auto overscroll-contain [scrollbar-color:theme(colors.text.secondary)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-2"
                  style={{ "--total-size": `${totalSize}px` } as CSSProperties}
                >
                  <div
                    role="presentation"
                    className="relative w-full"
                    style={{ height: totalSize }}
                  >
                    {virtualizer.getVirtualItems().map((virtualItem) => {
                      const item = filteredItems[virtualItem.index];
                      if (!item) {
                        return null;
                      }

                      const key = itemToKey(item);

                      return (
                        <Combobox.Item
                          key={virtualItem.key}
                          index={virtualItem.index}
                          data-index={virtualItem.index}
                          data-item-key={key}
                          ref={virtualizer.measureElement}
                          value={item}
                          aria-setsize={filteredItems.length}
                          aria-posinset={virtualItem.index + 1}
                          className="grid cursor-default select-none grid-cols-[1fr_0.75rem] items-center gap-2 py-2 pr-4 pl-4 text-sm text-text-primary outline-none data-[highlighted]:bg-bg-dropdown-selected"
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            transform: `translateY(${virtualItem.start}px)`,
                          }}
                        >
                          <div className="col-start-1">{itemToString(item)}</div>
                          <Combobox.ItemIndicator className="col-start-2">
                            <CheckIcon className="size-3" />
                          </Combobox.ItemIndicator>
                        </Combobox.Item>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

function CheckIcon(props: ComponentProps<"svg">) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}

function ChevronDownIcon(props: ComponentProps<"svg">) {
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
