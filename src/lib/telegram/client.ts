import type { PublicTelegramIdentity } from "@/lib/telegram/types";

export function readTelegramWebAppInitData(): string {
  if (typeof window === "undefined") return "";
  return window.Telegram?.WebApp?.initData?.trim() ?? "";
}

export async function establishTelegramSession(
  initData: string,
): Promise<{ identity: PublicTelegramIdentity | null; status: string; message: string }> {
  const response = await fetch("/api/telegram/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
