export function closeTelegramMiniApp() {
  const webApp = typeof window !== "undefined" ? window.Telegram?.WebApp : undefined;
  webApp?.ready?.();
  if (typeof webApp?.close === "function") {
    webApp.close();
    return;
  }
  window.close();
  window.location.href = "/";
}
