"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MAGSTER_COLORS } from "@/lib/brand";
import { establishTelegramSession } from "@/lib/telegram/client";
import type {
  PublicTelegramIdentity,
  TelegramLaunchState,
  TelegramWebApp,
} from "@/lib/telegram/types";

type TelegramContextValue = {
  state: TelegramLaunchState;
  identity: PublicTelegramIdentity | null;
  message: string;
  platform: string;
};

const TelegramContext = createContext<TelegramContextValue>({
  state: "loading",
  identity: null,
  message: "Connecting to Telegram…",
  platform: "unknown",
});

function getWebApp(): TelegramWebApp | null {
  if (typeof window === "undefined") return null;
  return window.Telegram?.WebApp ?? null;
}

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TelegramLaunchState>("loading");
  const [identity, setIdentity] = useState<PublicTelegramIdentity | null>(null);
  const [message, setMessage] = useState("Connecting to Telegram…");
  const [platform, setPlatform] = useState("unknown");

  useEffect(() => {
    const webApp = getWebApp();
    webApp?.ready();
    webApp?.expand();
    webApp?.setHeaderColor?.(MAGSTER_COLORS.primary);
    webApp?.setBackgroundColor?.(MAGSTER_COLORS.background);
    if (webApp?.platform) setPlatform(webApp.platform);

    const initData = webApp?.initData ?? "";
    if (!initData) {
      setState("browser");
      setMessage("Opened outside Telegram. Identity is not verified.");
      return;
    }

    let cancelled = false;
    setState("validating");
    setMessage("Verifying Telegram identity…");

    establishTelegramSession(initData)
      .then((result) => {
        if (cancelled) return;
        if (result.status === "authenticated" && result.identity) {
          setIdentity(result.identity);
          setState("authenticated");
          setMessage("Telegram identity verified.");
          return;
        }
        if (result.status === "unconfigured") {
          setState("unconfigured");
          setMessage(result.message);
          return;
        }
        setState("invalid");
        setMessage(result.message);
      })
      .catch(() => {
        if (cancelled) return;
        setState("invalid");
        setMessage("Telegram identity could not be verified.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({ state, identity, message, platform }),
    [state, identity, message, platform],
  );

  return (
    <TelegramContext.Provider value={value}>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </TelegramContext.Provider>
  );
}

export function useTelegramIdentity() {
  return useContext(TelegramContext);
}
