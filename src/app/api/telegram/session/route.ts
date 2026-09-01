import { NextResponse } from "next/server";
import { attachTelegramToStudent } from "@/lib/magster/telegram-link";
import { getServerEnv, isTelegramBotConfigured } from "@/lib/env";
import { readAppSession } from "@/lib/session/app-session";
import {
  clearTelegramSession,
  createTelegramSession,
  readTelegramSession,
  toPublicIdentity,
  writeTelegramSession,
} from "@/lib/telegram/session";
import {
  TelegramInitDataError,
  validateTelegramInitData,
} from "@/lib/telegram/validate";

export async function GET() {
  const session = await readTelegramSession();
  return NextResponse.json({
    identity: toPublicIdentity(session),
    botConfigured: isTelegramBotConfigured(),
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { initData?: unknown } | null;
  const initData = typeof body?.initData === "string" ? body.initData : "";

  if (!isTelegramBotConfigured()) {
    return NextResponse.json(
      {
        status: "unconfigured",
        identity: null,
        message:
          "Telegram identity is not active yet. Add TELEGRAM_BOT_TOKEN on the server to validate initData.",
      },
      { status: 503 },
    );
  }

  try {
    const env = getServerEnv();
    const validated = validateTelegramInitData(
      initData,
      env.telegramBotToken,
      env.telegramAuthMaxAgeSeconds,
    );
    const session = createTelegramSession(validated.user);
    await writeTelegramSession(session);
    const app = await readAppSession();
    if (app.studentId) {
      try {
        await attachTelegramToStudent(app.studentId, app.deviceId, initData);
      } catch (linkError) {
        console.warn("Telegram attach on session skipped:", linkError);
      }
    }
    return NextResponse.json({
      status: "authenticated",
      identity: toPublicIdentity(session),
      message: "Telegram identity verified.",
    });
  } catch (error) {
    const code = error instanceof TelegramInitDataError ? error.code : "invalid_hash";
    return NextResponse.json(
      {
        status: "invalid",
        identity: null,
        code,
        message: "Telegram identity could not be verified.",
      },
      { status: 401 },
    );
  }
}

export async function DELETE() {
  await clearTelegramSession();
  return NextResponse.json({ ok: true });
}
