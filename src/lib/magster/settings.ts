import { MagsterRpc, MagsterTables } from "@/lib/magster/tables";
import { asString } from "@/lib/magster/parse";
import type { MagsterPublicSettings } from "@/lib/magster/types";
import { getMagsterSupabase } from "@/lib/supabase/server";

const DEFAULT_SETTINGS: MagsterPublicSettings = {
  slogan: "Learn with Magster.",
  logoUrl: null,
  contactTelegram: "MagsterHelp",
  phoneNotice:
    "Enter the phone number on the Telegram account you are using right now. Your private channel invite is sent to this Telegram account only, so this number must match your active Telegram number exactly.",
};

export async function loadMagsterPublicSettings(): Promise<MagsterPublicSettings> {
  const client = getMagsterSupabase();
  const [settingsResult, phoneNoticeResult] = await Promise.all([
    client
      .from(MagsterTables.appSettings)
      .select("key, value")
      .in("key", ["slogan", "app_logo_url", "contact_telegram"]),
    client.rpc(MagsterRpc.getMiniAppPhoneNotice),
  ]);

  if (settingsResult.error) throw settingsResult.error;

  const values = new Map<string, string>();
  for (const row of settingsResult.data ?? []) {
    const item = row as { key: unknown; value: unknown };
    values.set(asString(item.key), asString(item.value).trim());
  }

  const phoneNotice = asString(phoneNoticeResult.data).trim() || DEFAULT_SETTINGS.phoneNotice;

  return {
    slogan: values.get("slogan") || DEFAULT_SETTINGS.slogan,
    logoUrl: values.get("app_logo_url") || null,
    contactTelegram: values.get("contact_telegram") || DEFAULT_SETTINGS.contactTelegram,
    phoneNotice,
  };
}
