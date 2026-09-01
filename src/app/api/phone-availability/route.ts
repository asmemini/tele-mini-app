import { NextResponse } from "next/server";
import { loadMiniAppResumeByTelegram } from "@/lib/magster/resume";
import { isPhoneTakenForNewRegistration } from "@/lib/magster/registration";
import { requireTelegramSession } from "@/lib/magster/telegram-link";
import { readAppSession } from "@/lib/session/app-session";
import { readInitDataFromJson, readInitDataFromRequest } from "@/lib/telegram/init-data";
import { validateLocalPhone, validationMessages } from "@/lib/validation/registration";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      phone?: unknown;
      initData?: unknown;
      initDataB64?: unknown;
    };
    const phone = String(body.phone ?? "");
    const formatError = validateLocalPhone(phone);
    if (formatError) {
      return NextResponse.json({ ok: false, message: formatError }, { status: 400 });
    }

    const session = await readAppSession();
    const initData = readInitDataFromJson(body) || readInitDataFromRequest(request);
    const telegram = await requireTelegramSession(initData);
    const resume = telegram ? await loadMiniAppResumeByTelegram(telegram.telegramUserId) : null;
    const currentStudentId = resume?.studentId ?? session.studentId;
    const taken = await isPhoneTakenForNewRegistration(phone, currentStudentId);
    return NextResponse.json({ ok: true, taken });
  } catch (error) {
    const message = error instanceof Error ? error.message : validationMessages.phoneCheckFailed;
    return NextResponse.json(
      { ok: false, message: validationMessages.phoneCheckFailed, detail: message },
      { status: 500 },
    );
  }
}
