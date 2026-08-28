import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getServerEnv } from "@/lib/env";
import type { TelegramUser } from "@/lib/telegram/validate";

export const TELEGRAM_SESSION_COOKIE = "magster_tg_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export type TelegramSession = {
  telegramUserId: number;
  firstName: string;
  lastName: string;
  username: string;
  languageCode: string;
  photoUrl: string | null;
  iat: number;
  exp: number;
};

function encode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function signaturesMatch(expected: string, received: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function createTelegramSession(user: TelegramUser): TelegramSession {
  const iat = Math.floor(Date.now() / 1000);
  return {
    telegramUserId: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    languageCode: user.languageCode,
    photoUrl: user.photoUrl,
    iat,
    exp: iat + SESSION_TTL_SECONDS,
  };
}

export function serializeTelegramSession(session: TelegramSession, secret: string): string {
  const payload = encode(JSON.stringify(session));
  return `${payload}.${sign(payload, secret)}`;
}

export function parseTelegramSession(token: string, secret: string): TelegramSession | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  if (!signaturesMatch(sign(payload, secret), signature)) return null;

  try {
    const session = JSON.parse(decode(payload)) as TelegramSession;
    if (!session.telegramUserId || session.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export async function readTelegramSession(): Promise<TelegramSession | null> {
  const { sessionSecret } = getServerEnv();
  const store = await cookies();
  const token = store.get(TELEGRAM_SESSION_COOKIE)?.value;
  if (!token) return null;
  return parseTelegramSession(token, sessionSecret);
}

export async function writeTelegramSession(session: TelegramSession): Promise<void> {
  const { sessionSecret } = getServerEnv();
  const store = await cookies();
  store.set(TELEGRAM_SESSION_COOKIE, serializeTelegramSession(session, sessionSecret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearTelegramSession(): Promise<void> {
  const store = await cookies();
  store.delete(TELEGRAM_SESSION_COOKIE);
}

export function toPublicIdentity(session: TelegramSession | null) {
  if (!session) return null;
  return {
    telegramUserId: session.telegramUserId,
    firstName: session.firstName,
    lastName: session.lastName,
    username: session.username,
    photoUrl: session.photoUrl,
  };
}
