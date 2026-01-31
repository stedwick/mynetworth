"use client";

import type { Ref } from "react";
import { Autocomplete } from "@base-ui/react/autocomplete";
import type { AutocompleteMatch } from "@/app/lib/asset-autocomplete";

const autocompletePopupClassName =
  "min-w-[var(--anchor-width)] rounded-xl border border-slate-200/70 bg-white/95 p-1 text-sm text-slate-900 shadow-lg outline-none dark:border-white/10 dark:bg-neutral-950/95 dark:text-white";
const autocompleteListClassName = "max-h-64 overflow-y-auto py-1";
const autocompleteItemClassName =
  "flex cursor-default items-center justify-between gap-3 rounded-lg px-3 py-2 outline-none transition data-[highlighted]:bg-slate-900 data-[highlighted]:text-white dark:data-[highlighted]:bg-white dark:data-[highlighted]:text-slate-900";
const autocompleteStatusClassName =
  "px-3 py-2 text-xs text-slate-500 dark:text-white/50 empty:hidden";
const autocompleteEmptyClassName =
  "px-3 py-2 text-xs text-slate-500 dark:text-white/50";
const autocompleteInputClassName =
  "h-11 w-full rounded-lg border border-slate-200/80 bg-white px-3 text-sm text-slate-900 shadow-sm transition focus:outline focus:outline-2 focus:-outline-offset-1 focus:outline-slate-900/40 disabled:cursor-not-allowed disabled:border-slate-200/60 disabled:bg-slate-100/80 disabled:text-slate-400 dark:border-white/10 dark:bg-neutral-900/40 dark:text-white/90 dark:focus:outline-white/30 dark:disabled:border-white/10 dark:disabled:bg-white/5 dark:disabled:text-white/40";

type AutocompleteInputProps = {
  items: AutocompleteMatch[];
  value: string;
  onValueChange: (value: string) => void;
  onBlur: () => void;
  inputRef: Ref<HTMLInputElement>;
  placeholder: string;
  loading: boolean;
  query: string;
  minChars?: number;
  required?: boolean;
  itemToStringValue: (item: AutocompleteMatch) => string;
  onSelect: (item: AutocompleteMatch) => void;
};

export function AutocompleteInput({
  items,
  value,
  onValueChange,
  onBlur,
  inputRef,
  placeholder,
  loading,
  query,
  minChars = 2,
  required,
  itemToStringValue,
  onSelect,
}: AutocompleteInputProps) {
  const trimmedQuery = query.trim();
  const statusText = loading
    ? "Searching..."
    : trimmedQuery.length > 0 && trimmedQuery.length < minChars
      ? `Type at least ${minChars} characters`
      : null;

  return (
    <Autocomplete.Root
      items={items}
      value={value}
      onValueChange={onValueChange}
      itemToStringValue={itemToStringValue}
      filter={() => true}
    >
      <Autocomplete.Input
        ref={inputRef}
        className={autocompleteInputClassName}
        placeholder={placeholder}
        required={required}
        onBlur={onBlur}
      />
      <Autocomplete.Portal>
        <Autocomplete.Positioner sideOffset={8} className="z-50">
          <Autocomplete.Popup className={autocompletePopupClassName}>
            <Autocomplete.Status className={autocompleteStatusClassName}>
              {statusText}
            </Autocomplete.Status>
            <Autocomplete.Empty className={autocompleteEmptyClassName}>
              No matches
            </Autocomplete.Empty>
            <Autocomplete.List className={autocompleteListClassName}>
              {(item) => (
                <Autocomplete.Item
                  key={item.symbol}
                  value={item}
                  className={autocompleteItemClassName}
                  onClick={() => onSelect(item)}
                >
                  <span className="text-sm font-semibold">{item.symbol}</span>
                  {item.name ? (
                    <span className="truncate text-xs text-slate-500 dark:text-white/50">
                      {item.name}
                    </span>
                  ) : null}
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  );
}
