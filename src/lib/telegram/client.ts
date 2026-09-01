import type { PublicTelegramIdentity } from "@/lib/telegram/types";

export function readTelegramWebAppInitData(): string {
  if (typeof window === "undefined") return "";

  const fromSdk = window.Telegram?.WebApp?.initData?.trim() ?? "";
  if (fromSdk) return fromSdk;

  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : "";
  if (hash) {
    const fromHash = new URLSearchParams(hash).get("tgWebAppData")?.trim();
    if (fromHash) return fromHash;
  }

  const fromQuery = new URLSearchParams(window.location.search).get("tgWebAppData")?.trim();
  return fromQuery ?? "";
}

export async function establishTelegramSession(
  initData: string,
): Promise<{ identity: PublicTelegramIdentity | null; status: string; message: string }> {
  const response = await fetch("/api/telegram/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Telegram-Init-Data": initData,
    },
    credentials: "include",
    body: JSON.stringify({ initData }),
  });
  const payload = (await response.json()) as {
    identity?: PublicTelegramIdentity | null;
    status?: string;
    message?: string;
  };
  return {
    identity: payload.identity ?? null,
    status: payload.status ?? "invalid",
    message: payload.message ?? "Unable to validate Telegram identity.",
  };
}

export async function readTelegramSessionFromApi(): Promise<PublicTelegramIdentity | null> {
  const response = await fetch("/api/telegram/session", { credentials: "include" });
  if (!response.ok) return null;
  const payload = (await response.json()) as { identity?: PublicTelegramIdentity | null };
  return payload.identity ?? null;
}
