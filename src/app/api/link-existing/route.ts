import { NextResponse } from "next/server";
import { linkTelegramToExistingStudent } from "@/lib/magster/telegram-link";
import { readAppSession, writeAppSession } from "@/lib/session/app-session";
import { readInitDataFromRequest } from "@/lib/telegram/init-data";
import { validateLocalPhone } from "@/lib/validation/registration";

export const runtime = "nodejs";

const PIN_PATTERN = /^\d{4}$/;

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { phone?: unknown; pin?: unknown; initData?: unknown }
      | null;

    const phone = String(body?.phone ?? "").trim();
    const pin = String(body?.pin ?? "").trim();
    const initData =
      (typeof body?.initData === "string" ? body.initData : "") ||
      readInitDataFromRequest(request);

    const formatError = validateLocalPhone(phone);
    if (formatError || !PIN_PATTERN.test(pin)) {
      return NextResponse.json(
        { ok: false, message: "Please enter a valid phone number and 4-digit PIN." },
        { status: 400 },
      );
    }

    const result = await linkTelegramToExistingStudent({ phone, pin, initData });
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, code: result.code, message: result.message },
        { status: result.code === "incorrect_pin" || result.code === "account_not_found" ? 401 : 400 },
      );
    }

    const session = await readAppSession();
    const iat = Math.floor(Date.now() / 1000);
    await writeAppSession({
      ...session,
      studentId: result.studentId,
      iat,
      exp: iat + 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ ok: true, studentId: result.studentId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not link your account.";
    return NextResponse.json(
      { ok: false, message: "Could not link your account.", detail: message },
      { status: 500 },
    );
  }
}
