export const TELEGRAM_INIT_DATA_HEADER = "x-telegram-init-data";

function decodeBase64InitData(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  try {
    return Buffer.from(value, "base64").toString("utf8").trim();
  } catch {
    return "";
  }
}

export function readInitDataFromJson(body: { initData?: unknown; initDataB64?: unknown } | null): string {
  if (!body) return "";
  const fromPlain = typeof body.initData === "string" ? body.initData.trim() : "";
  if (fromPlain) return fromPlain;
  if (typeof body.initDataB64 === "string") return decodeBase64InitData(body.initDataB64);
  return "";
}

export function readInitDataFromRequest(request: Request, form?: FormData | null): string {
  const fromHeader = request.headers.get(TELEGRAM_INIT_DATA_HEADER)?.trim() ?? "";
  if (fromHeader) return fromHeader;

  if (form) {
    const fromB64 = decodeBase64InitData(String(form.get("initDataB64") ?? ""));
    if (fromB64) return fromB64;
    const fromForm = String(form.get("initData") ?? "").trim();
    if (fromForm) return fromForm;
  }

  return "";
}
