import { FieldError } from "@/components/ui/field-error";

type SegmentedControlProps<T extends string> = {
  label: string;
  options: readonly T[];
  value: string;
  onChange: (value: T) => void;
  error?: string;
};

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
}: SegmentedControlProps<T>) {
  const gridClass = options.length === 3 ? "grid-cols-3" : "grid-cols-2";
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-ink">{label}</legend>
      <div className={`grid gap-2 ${gridClass}`}>
        {options.map((option) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option)}
              className={`min-h-12 rounded-card border px-2 text-sm font-semibold touch-manipulation ${
                selected ? "border-brand bg-brand text-white" : "border-line bg-surface text-ink"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
      <FieldError message={error} />
    </fieldset>
  );
}
