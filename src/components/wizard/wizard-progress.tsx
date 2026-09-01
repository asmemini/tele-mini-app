type WizardHeaderProps = {
  step: number;
  total: number;
  onBack: () => void;
};

export function WizardHeader({ step, total, onBack }: WizardHeaderProps) {
  return (
    <header className="-mx-5 shrink-0 border-b border-line bg-white text-ink">
      <div className="flex items-center gap-1 px-2 pb-2 pt-[max(0.4rem,env(safe-area-inset-top))]">
        <button
          type="button"
          aria-label="Back"
          onClick={onBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full touch-manipulation"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
            <path
              d="M15.5 5.5 9 12l6.5 6.5"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <p className="min-w-0 truncate text-[13px] font-medium tracking-tight">
          Step {step} of {total}
        </p>
        <span className="ml-auto pr-2 text-[11px] font-medium text-muted">
          {Math.round((step / total) * 100)}%
        </span>
      </div>
      <div className="flex gap-1 px-4 pb-2.5">
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={`h-0.5 flex-1 rounded-full ${index < step ? "bg-brand" : "bg-line"}`}
          />
        ))}
      </div>
    </header>
  );
}
