export function closeTelegramMiniApp() {
  const webApp = typeof window !== "undefined" ? window.Telegram?.WebApp : undefined;
  if (webApp?.close) {
    webApp.close();
    return;
  }
  window.close();
  window.location.href = "/";
}
