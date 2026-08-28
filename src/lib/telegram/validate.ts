import { createHmac, timingSafeEqual } from "crypto";

export type TelegramUser = {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  languageCode: string;
  isPremium: boolean;
  photoUrl: string | null;
};

export type ValidatedTelegramIdentity = {
  user: TelegramUser;
  authDate: number;
  queryId: string | null;
  startParam: string | null;
};

export type InitDataValidationFailure =
  | "missing"
  | "malformed"
  | "missing_hash"
  | "missing_user"
  | "expired"
  | "invalid_hash";

export class TelegramInitDataError extends Error {
  constructor(public readonly code: InitDataValidationFailure) {
    super(`Telegram initData validation failed: ${code}`);
    this.name = "TelegramInitDataError";
  }
}

function hmacSha256(key: string | Buffer, message: string): Buffer {
  return createHmac("sha256", key).update(message).digest();
}

function parseUser(raw: string | null): TelegramUser | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const id = Number(parsed.id);
    if (!Number.isFinite(id) || id <= 0) return null;
    return {
      id,
      firstName: String(parsed.first_name ?? ""),
      lastName: String(parsed.last_name ?? ""),
      username: String(parsed.username ?? ""),
      languageCode: String(parsed.language_code ?? ""),
      isPremium: parsed.is_premium === true,
      photoUrl: parsed.photo_url ? String(parsed.photo_url) : null,
    };
  } catch {
    return null;
  }
}

function hashesMatch(expectedHex: string, receivedHex: string): boolean {
  const expected = Buffer.from(expectedHex, "hex");
  const received = Buffer.from(receivedHex, "hex");
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}

/**
 * Validates Telegram Web App initData using the official HMAC-SHA256 algorithm.
 * Never treat a client-supplied Telegram user ID as proof of identity.
 */
export function validateTelegramInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds: number,
  nowSeconds = Math.floor(Date.now() / 1000),
): ValidatedTelegramIdentity {
  if (!initData.trim()) {
    throw new TelegramInitDataError("missing");
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) {
    throw new TelegramInitDataError("missing_hash");
  }

  params.delete("hash");
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = hmacSha256("WebAppData", botToken);
  const expectedHash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (!hashesMatch(expectedHash, hash)) {
    throw new TelegramInitDataError("invalid_hash");
  }

  const authDate = Number(params.get("auth_date"));
  if (!Number.isFinite(authDate) || authDate <= 0) {
    throw new TelegramInitDataError("malformed");
  }
  if (nowSeconds - authDate > maxAgeSeconds) {
    throw new TelegramInitDataError("expired");
  }

  const user = parseUser(params.get("user"));
  if (!user) {
    throw new TelegramInitDataError("missing_user");
  }

  return {
    user,
    authDate,
    queryId: params.get("query_id"),
    startParam: params.get("start_param"),
  };
}
