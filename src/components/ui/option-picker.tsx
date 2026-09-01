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
      <span className="mb-1 block text-[11px] font-semibold tracking-wide text-muted">
        {label}
      </span>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex h-11 w-full items-center justify-between rounded-card border bg-surface px-3 text-left text-[15px] touch-manipulation ${
          error ? "border-danger" : "border-line"
        }`}
      >
        <span className={value ? "truncate text-ink" : "text-hint"}>{value || placeholder}</span>
        <span className="text-base leading-none text-muted" aria-hidden="true">
          ▾
        </span>
      </button>
      <FieldError message={error} />

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
          <button
            type="button"
            aria-label={`Close ${label} list`}
            className="absolute inset-0 bg-ink/45"
            onClick={() => {
              setOpen(false);
              setQuery("");
            }}
          />
          <div className="relative z-10 flex max-h-[70dvh] w-full max-w-[360px] flex-col overflow-hidden rounded-2xl bg-surface shadow-soft">
            <div className="border-b border-line px-4 py-3">
              <h2 className="text-sm font-semibold text-ink">{label}</h2>
              {searchable ? (
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={searchPlaceholder}
                  autoComplete="off"
                  className="mt-2 h-10 w-full rounded-xl border border-line bg-canvas px-3 text-base text-ink outline-none placeholder:text-hint focus:border-brand"
                />
              ) : null}
            </div>
            <ul className="flex-1 overflow-y-auto py-1">
              {results.map((name) => (
                <li key={name}>
                  <button
                    type="button"
                    onClick={() => choose(name)}
                    className={`flex min-h-11 w-full items-center px-4 text-left text-[14px] font-medium touch-manipulation ${
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
