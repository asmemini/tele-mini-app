import { NextResponse } from "next/server";
import { composeMiniAppConfig, filterVisibleIds } from "@/lib/config/mini-app-config";
import { loadMagsterCatalog } from "@/lib/magster/catalog";
import { emptyTelegramStudentLink } from "@/lib/magster/identity";
import { loadActivePaymentMethods } from "@/lib/magster/payment-methods";
import { loadRegistrationCatalog } from "@/lib/magster/registration";
import { loadMagsterPublicSettings } from "@/lib/magster/settings";
import { attachTelegramToStudent, syncTelegramSessionFromInitData } from "@/lib/magster/telegram-link";
import { isTelegramBotConfigured } from "@/lib/env";
import { readAppSession } from "@/lib/session/app-session";
import { readInitDataFromJson, readInitDataFromRequest } from "@/lib/telegram/init-data";
import { readTelegramSession, toPublicIdentity } from "@/lib/telegram/session";

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
    await syncTelegramSessionFromInitData(initData);
    if (app.studentId) {
      try {
        await attachTelegramToStudent(app.studentId, app.deviceId, initData);
      } catch (linkError) {
        console.warn("Telegram attach on bootstrap skipped:", linkError);
      }
    }

    const session = (await readTelegramSession()) ?? cookieSession;
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
