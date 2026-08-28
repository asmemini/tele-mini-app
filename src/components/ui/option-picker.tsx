"use client";

import { useMemo, useState } from "react";
import { FieldError } from "@/components/ui/field-error";

type OptionPickerProps = {
  label: string;
  value: string;
  options: readonly string[];
  placeholder: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  onChange: (value: string) => void;
  error?: string;
};

export function OptionPicker({
  label,
  value,
  options,
  placeholder,
  searchable = false,
  searchPlaceholder = "Search",
  onChange,
  error,
}: OptionPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((name) => name.toLowerCase().includes(needle));
  }, [options, query]);

  function choose(name: string) {
    onChange(name);
    setOpen(false);
    setQuery("");
  }

  return (
    <div>
      <span className="mb-2 block text-sm font-semibold text-ink">{label}</span>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex h-14 w-full items-center justify-between rounded-card border bg-surface px-4 text-left touch-manipulation ${
          error ? "border-danger" : "border-line"
        }`}
      >
        <span className={value ? "truncate text-ink" : "text-hint"}>{value || placeholder}</span>
        <span className="text-lg leading-none text-muted" aria-hidden="true">
          ▾
        </span>
      </button>
      <FieldError message={error} />

      {open ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label={`Close ${label} list`}
            className="absolute inset-0 bg-ink/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[80dvh] w-full max-w-[430px] flex-col rounded-t-3xl bg-surface shadow-soft">
            <div className="px-5 pt-4">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
              <h2 className="text-lg font-bold text-ink">{label}</h2>
              {searchable ? (
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={searchPlaceholder}
                  autoComplete="off"
                  className="mt-3 h-12 w-full rounded-card border border-line bg-canvas px-4 text-base text-ink outline-none placeholder:text-hint focus:border-brand"
                />
              ) : null}
            </div>
            <ul className="mt-2 flex-1 overflow-y-auto px-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {results.map((name) => (
                <li key={name}>
                  <button
                    type="button"
                    onClick={() => choose(name)}
                    className={`flex min-h-12 w-full items-center rounded-2xl px-4 text-left text-sm font-medium touch-manipulation ${
                      value === name ? "bg-brand/10 text-brand" : "text-ink"
                    }`}
                  >
                    {name}
                  </button>
                </li>
              ))}
              {!results.length ? (
                <li className="px-4 py-6 text-sm text-muted">No matching options.</li>
              ) : null}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
