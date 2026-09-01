export const TELEGRAM_INIT_DATA_HEADER = "x-telegram-init-data";

export function readInitDataFromRequest(request: Request, form?: FormData | null): string {
  const fromHeader = request.headers.get(TELEGRAM_INIT_DATA_HEADER)?.trim() ?? "";
  if (fromHeader) return fromHeader;

  if (form) {
    const fromForm = String(form.get("initData") ?? "").trim();
    if (fromForm) return fromForm;
  }

  return "";
}
