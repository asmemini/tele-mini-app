"use client";

import { useEffect, useState } from "react";
import { CatalogPreview } from "@/components/catalog/catalog-preview";
import { useTelegramIdentity } from "@/components/telegram/telegram-provider";
import { PrimaryButton } from "@/components/ui/primary-button";
import type { MiniAppConfig } from "@/lib/config/mini-app-config";
import type { MagsterCatalog } from "@/lib/magster/types";
import type { MiniAppResumePayload } from "@/lib/bootstrap/types";
import { readTelegramWebAppInitData } from "@/lib/telegram/client";

type BootstrapResponse = {
  ok: boolean;
  message?: string;
  config?: MiniAppConfig;
  catalog?: MagsterCatalog;
  resume?: MiniAppResumePayload | null;
};

export function WelcomeScreen() {
  const telegram = useTelegramIdentity();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<MiniAppConfig | null>(null);
  const [catalog, setCatalog] = useState<MagsterCatalog | null>(null);
  const [resume, setResume] = useState<MiniAppResumePayload | null>(null);

  useEffect(() => {
    if (telegram.state === "loading" || telegram.state === "validating") return;

    let cancelled = false;
    setLoading(true);
    fetch("/api/bootstrap", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Telegram-Init-Data": readTelegramWebAppInitData(),
      },
      body: JSON.stringify({ initData: readTelegramWebAppInitData() }),
    })
      .then(async (response) => {
        const payload = (await response.json()) as BootstrapResponse;
        if (!response.ok || !payload.ok) {
          throw new Error(payload.message || "Unable to load Magster.");
        }
        if (cancelled) return;
        setConfig(payload.config ?? null);
        setCatalog(payload.catalog ?? null);
        setResume(payload.resume ?? null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Unable to load Magster.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [telegram.state]);

  const title = config?.welcomeTitle ?? "Welcome to Registration";

  return (
    <main className="relative flex h-full min-h-0 flex-1 flex-col overflow-y-auto pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <header className="shrink-0 border-b border-line bg-white px-5 pb-3 pt-[max(0.6rem,env(safe-area-inset-top))] text-ink">
        <p className="text-center text-[15px] font-semibold tracking-tight">Magster</p>
      </header>
      <div className="px-5 pt-3">
        <h1 className="text-center text-[16px] font-semibold leading-snug tracking-tight text-ink">
          {title}
        </h1>
        {telegram.identity?.firstName ? (
          <p className="mt-1 text-center text-sm text-muted">Hello, {telegram.identity.firstName}.</p>
        ) : null}
        <p className="mt-2 text-center text-[13px] leading-5 text-muted">
          {config?.welcomeSubtitle ?? "Premium university courses and bundles, now inside Telegram."}
        </p>
      </div>

      <div className="mt-2 min-h-0 flex-1">
        {error ? (
          <div className="mx-5 mt-5 rounded-card border border-red-100 bg-white p-4 text-sm text-muted">
            {error}
          </div>
        ) : (
          <CatalogPreview
            courses={catalog?.courses ?? []}
            bundles={catalog?.bundles ?? []}
            loading={loading}
          />
        )}
      </div>

      <div className="shrink-0 bg-canvas px-5 pt-4">
        <PrimaryButton href="/register">
          {resume?.profileComplete
            ? "Continue"
            : (config?.primaryCtaLabel ?? "Register Now")}
        </PrimaryButton>
        <p className="mt-3 text-center text-[11px] leading-5 text-hint">
          Access is granted after Magster Admin verifies your payment.
        </p>
      </div>
    </main>
  );
}
