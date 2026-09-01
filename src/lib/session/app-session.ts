import { randomUUID } from "crypto";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getServerEnv } from "@/lib/env";

export const APP_SESSION_COOKIE = "magster_app_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export type AppSession = {
  deviceId: string;
  studentId: number | null;
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

function parse(token: string, secret: string): AppSession | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  if (!signaturesMatch(sign(payload, secret), signature)) return null;
  try {
    const session = JSON.parse(decode(payload)) as AppSession;
    if (!session.deviceId || session.exp < Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

export async function readAppSession(): Promise<AppSession> {
  const { sessionSecret } = getServerEnv();
  const store = await cookies();
  const existing = store.get(APP_SESSION_COOKIE)?.value;
  if (existing) {
    const parsed = parse(existing, sessionSecret);
    if (parsed) return parsed;
  }

  const iat = Math.floor(Date.now() / 1000);
  const session: AppSession = {
    deviceId: `miniapp:${randomUUID()}`,
    studentId: null,
    iat,
    exp: iat + SESSION_TTL_SECONDS,
  };
  await writeAppSession(session);
  return session;
}

export async function writeAppSession(session: AppSession): Promise<void> {
  const { sessionSecret } = getServerEnv();
  const store = await cookies();
  const payload = encode(JSON.stringify(session));
  const production = process.env.NODE_ENV === "production";
  store.set(APP_SESSION_COOKIE, `${payload}.${sign(payload, sessionSecret)}`, {
    httpOnly: true,
    sameSite: production ? "none" : "lax",
    secure: production,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}
