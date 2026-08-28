import { NextResponse } from "next/server";
import { isPhoneTakenForNewRegistration } from "@/lib/magster/registration";
import { readAppSession } from "@/lib/session/app-session";
import { validateLocalPhone, validationMessages } from "@/lib/validation/registration";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { phone?: unknown };
    const phone = String(body.phone ?? "");
    const formatError = validateLocalPhone(phone);
    if (formatError) {
      return NextResponse.json({ ok: false, message: formatError }, { status: 400 });
    }

    const session = await readAppSession();
    const taken = await isPhoneTakenForNewRegistration(phone, session.studentId);
    return NextResponse.json({ ok: true, taken });
  } catch (error) {
    const message = error instanceof Error ? error.message : validationMessages.phoneCheckFailed;
    return NextResponse.json(
      { ok: false, message: validationMessages.phoneCheckFailed, detail: message },
      { status: 500 },
    );
  }
}
