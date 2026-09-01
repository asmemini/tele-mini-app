import { NextResponse } from "next/server";
import { composeMiniAppConfig, filterVisibleIds } from "@/lib/config/mini-app-config";
import { loadMagsterCatalog } from "@/lib/magster/catalog";
import { emptyTelegramStudentLink } from "@/lib/magster/identity";
import { loadActivePaymentMethods } from "@/lib/magster/payment-methods";
import { loadRegistrationCatalog } from "@/lib/magster/registration";
import { loadMagsterPublicSettings } from "@/lib/magster/settings";
import { loadMiniAppResumeByTelegram } from "@/lib/magster/resume";
import { attachTelegramToStudent, syncTelegramSessionFromInitData } from "@/lib/magster/telegram-link";
import { isTelegramBotConfigured } from "@/lib/env";
import { readAppSession, writeAppSession } from "@/lib/session/app-session";
import { readInitDataFromJson, readInitDataFromRequest } from "@/lib/telegram/init-data";
import { readTelegramSession, toPublicIdentity } from "@/lib/telegram/session";
import type { MiniAppResumePayload } from "@/lib/bootstrap/types";

export async function GET() {
  return handleBootstrap();
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { initData?: unknown; initDataB64?: unknown }
    | null;
  const initData = readInitDataFromJson(body) || readInitDataFromRequest(request);
  return handleBootstrap(initData);
}

async function handleBootstrap(initData?: string) {
  try {
    const [cookieSession, settings, catalog, paymentMethods, registration] = await Promise.all([
      readTelegramSession(),
      loadMagsterPublicSettings(),
      loadMagsterCatalog(),
      loadActivePaymentMethods(),
      loadRegistrationCatalog(),
    ]);

    const app = await readAppSession();
    const telegram = (await syncTelegramSessionFromInitData(initData)) ?? cookieSession;
    const resumeRow = telegram
      ? await loadMiniAppResumeByTelegram(telegram.telegramUserId)
      : null;

    if (resumeRow) {
      const now = Math.floor(Date.now() / 1000);
      await writeAppSession({
        ...app,
        studentId: resumeRow.studentId,
        iat: now,
        exp: now + 60 * 60 * 24 * 7,
      });
    }

    const attachStudentId = resumeRow?.studentId ?? app.studentId;
    if (attachStudentId) {
      try {
        await attachTelegramToStudent(attachStudentId, app.deviceId, initData);
      } catch (linkError) {
        console.warn("Telegram attach on bootstrap skipped:", linkError);
      }
    }

    const session = (await readTelegramSession()) ?? telegram;
    const resume: MiniAppResumePayload | null = resumeRow
      ? {
          studentId: resumeRow.studentId,
          profileComplete: resumeRow.profileComplete,
          fullName: resumeRow.fullName,
          phone: resumeRow.phone,
          gender: resumeRow.gender,
          academicYear: resumeRow.academicYear,
          institution: resumeRow.institution,
          ownedCourseIds: resumeRow.ownedCourseIds,
          ownedBundleIds: resumeRow.ownedBundleIds,
        }
      : null;
    const config = composeMiniAppConfig(settings);

    return NextResponse.json({
      ok: true,
      identity: toPublicIdentity(session),
      studentLink: emptyTelegramStudentLink(session),
      botConfigured: isTelegramBotConfigured(),
      magster: {
        slogan: settings.slogan,
        logoUrl: settings.logoUrl,
        contactTelegram: settings.contactTelegram,
      },
      config,
      catalog: {
        courses: filterVisibleIds(catalog.courses, config.visibleCourseIds),
        bundles: filterVisibleIds(catalog.bundles, config.visibleBundleIds),
      },
      paymentMethods,
      registration,
      resume,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        ok: false,
        message: "Unable to load Magster data.",
        detail: message,
      },
      { status: 500 },
    );
  }
}
