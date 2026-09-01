import { MAGSTER_COLORS } from "@/lib/brand";
import type { MagsterPublicSettings } from "@/lib/magster/types";

/**
 * Runtime Mini App configuration.
 *
 * Today this is composed from Magster `app_settings` plus local defaults.
 * Later the Admin Panel can override these values via namespaced
 * `app_settings` keys (`mini_app_*`) or a dedicated `mini_app_settings` table.
 * The UI should always consume this type, never hard-code copy or colors
 * throughout screens.
 */
export type MiniAppConfig = {
  welcomeTitle: string;
  welcomeSubtitle: string;
  welcomeImageUrl: string | null;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  colors: {
    primary: string;
    background: string;
    surface: string;
    text: string;
    muted: string;
  };
  visibleCourseIds: "all" | number[];
  visibleBundleIds: "all" | number[];
  paymentInstructions: string;
  phoneNotice: string;
  banners: Array<{
    id: string;
    imageUrl: string;
    title: string;
  }>;
};

export const DEFAULT_MINI_APP_CONFIG: MiniAppConfig = {
  welcomeTitle: "Welcome to Registration",
  welcomeSubtitle:
    "Premium university courses and bundles, now inside Telegram.",
  welcomeImageUrl: null,
  primaryCtaLabel: "Register Now",
  secondaryCtaLabel: "Browse Magster courses",
  colors: {
    primary: MAGSTER_COLORS.primary,
    background: MAGSTER_COLORS.background,
    surface: MAGSTER_COLORS.surface,
    text: MAGSTER_COLORS.text,
    muted: MAGSTER_COLORS.muted,
  },
  visibleCourseIds: "all",
  visibleBundleIds: "all",
  paymentInstructions: "",
  phoneNotice:
    "Enter the phone number on the Telegram account you are using right now. Your private channel invite is sent to this Telegram account only, so this number must match your active Telegram number exactly.",
  banners: [],
};

export function composeMiniAppConfig(settings: MagsterPublicSettings): MiniAppConfig {
  return {
    ...DEFAULT_MINI_APP_CONFIG,
    welcomeSubtitle: settings.slogan || DEFAULT_MINI_APP_CONFIG.welcomeSubtitle,
    welcomeImageUrl: settings.logoUrl,
    phoneNotice: settings.phoneNotice || DEFAULT_MINI_APP_CONFIG.phoneNotice,
  };
}

export function filterVisibleIds<T extends { id: number }>(
  items: T[],
  visible: "all" | number[],
): T[] {
  if (visible === "all") return items;
  const allowed = new Set(visible);
  return items.filter((item) => allowed.has(item.id));
}
