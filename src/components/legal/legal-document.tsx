"use client";

import { useRouter } from "next/navigation";

export function LegalDocument({ title, body }: { title: string; body: string }) {
  const router = useRouter();
  return (
    <main className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <header className="flex items-center gap-1 bg-header px-2 pb-2.5 pt-[max(0.4rem,env(safe-area-inset-top))] text-white">
        <button
          type="button"
          aria-label="Back"
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center touch-manipulation"
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
        <h1 className="min-w-0 truncate text-[13px] font-medium tracking-tight">{title}</h1>
      </header>
      <article className="px-5 pt-4 whitespace-pre-wrap text-sm leading-6 text-muted">{body}</article>
    </main>
  );
}
