type WizardProgressProps = {
  step: number;
  total: number;
};

export function WizardProgress({ step, total }: WizardProgressProps) {
  return (
    <div className="mb-5 shrink-0">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
          Step {step} of {total}
        </p>
        <p className="text-xs font-medium text-muted">{Math.round((step / total) * 100)}%</p>
      </div>
      <div className="mt-2 flex gap-1.5">
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={`h-1.5 flex-1 rounded-full ${
              index < step ? "bg-brand" : "bg-line"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
