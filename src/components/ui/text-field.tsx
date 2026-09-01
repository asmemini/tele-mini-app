import type { InputHTMLAttributes } from "react";
import { FieldError } from "@/components/ui/field-error";

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
  label: string;
  error?: string;
};

export function TextField({ id, label, error, ...props }: TextFieldProps) {
  const errorId = error ? `${id}-error` : undefined;
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-1 block text-[11px] font-semibold tracking-wide text-muted">{label}</span>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        className={`h-11 w-full rounded-card border bg-surface px-3 text-base text-ink outline-none transition-colors placeholder:text-hint ${
          error ? "border-danger" : "border-line focus:border-brand"
        }`}
        {...props}
      />
      <FieldError id={errorId} message={error} />
    </label>
  );
}
