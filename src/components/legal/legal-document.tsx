"use client";

import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/brand/brand-mark";

export function LegalDocument({ title, body }: { title: string; body: string }) {
  const router = useRouter();
  return (
    <main className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,calc(env(safe-area-inset-top)+0.5rem))]">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="h-11 text-sm font-semibold text-brand touch-manipulation"
        >
          Back
        </button>
        <BrandMark size="sm" />
      </div>
      <h1 className="text-[26px] font-bold tracking-[-0.04em] text-ink">{title}</h1>
      <article className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted">{body}</article>
    </main>
  );
}
