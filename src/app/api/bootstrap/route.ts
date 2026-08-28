import { NextResponse } from "next/server";
import { composeMiniAppConfig, filterVisibleIds } from "@/lib/config/mini-app-config";
import { loadMagsterCatalog } from "@/lib/magster/catalog";
import { emptyTelegramStudentLink } from "@/lib/magster/identity";
import { loadActivePaymentMethods } from "@/lib/magster/payment-methods";
import { loadRegistrationCatalog } from "@/lib/magster/registration";
import { loadMagsterPublicSettings } from "@/lib/magster/settings";
import { isTelegramBotConfigured } from "@/lib/env";
import { readTelegramSession, toPublicIdentity } from "@/lib/telegram/session";

export async function GET() {
  try {
    const [session, settings, catalog, paymentMethods, registration] = await Promise.all([
      readTelegramSession(),
      loadMagsterPublicSettings(),
      loadMagsterCatalog(),
      loadActivePaymentMethods(),
      loadRegistrationCatalog(),
    ]);

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
    const detail = error instanceof Error ? error.message : "Unknown error";
    console.error("Unable to load Magster data:", detail);
    return NextResponse.json(
      {
        ok: false,
        message: "Unable to load Magster data.",
        detail,
      },
      { status: 500 },
    );
  }
}