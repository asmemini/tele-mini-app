"use client";

import { ETHIOPIAN_COUNTRY_CODE, LOCAL_PHONE_LENGTH } from "@/lib/constants/auth";
import { digitsOnly } from "@/lib/validation/registration";
import { FieldError } from "@/components/ui/field-error";

type PhoneFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export function PhoneField({ id, value, onChange, error }: PhoneFieldProps) {
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-[11px] font-semibold tracking-wide text-muted">
          Phone Number
        </label>
        <span className="text-[11px] font-medium tabular-nums text-hint">
          {value.length}/{LOCAL_PHONE_LENGTH}
        </span>
      </div>
      <div
        className={`flex h-11 items-stretch overflow-hidden rounded-card border bg-surface ${
          error ? "border-danger" : "border-line focus-within:border-brand"
        }`}
      >
        <span className="flex items-center border-r border-line bg-canvas px-2.5 text-[13px] font-semibold text-ink">
          {ETHIOPIAN_COUNTRY_CODE}
        </span>
        <input
          id={id}
          value={value}
          onChange={(event) => onChange(digitsOnly(event.target.value, LOCAL_PHONE_LENGTH))}
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={LOCAL_PHONE_LENGTH}
          placeholder="XXXXXXXXX"
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          className="min-w-0 flex-1 bg-transparent px-3 text-base text-ink outline-none placeholder:text-hint"
        />
      </div>
      <FieldError id={errorId} message={error} />
    </div>
  );
}
