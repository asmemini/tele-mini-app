import { MagsterTables } from "@/lib/magster/tables";
import { asString } from "@/lib/magster/parse";
import type { MagsterPublicSettings } from "@/lib/magster/types";
import { getMagsterSupabase } from "@/lib/supabase/server";

const DEFAULT_SETTINGS: MagsterPublicSettings = {
  slogan: "Learn with Magster.",
  logoUrl: null,
  contactTelegram: "MagsterHelp",
};

export async function loadMagsterPublicSettings(): Promise<MagsterPublicSettings> {
  const client = getMagsterSupabase();
  const { data, error } = await client
    .from(MagsterTables.appSettings)
    .select("key, value")
    .in("key", ["slogan", "app_logo_url", "contact_telegram"]);

  if (error) throw error;

  const values = new Map<string, string>();
  for (const row of data ?? []) {
    const item = row as { key: unknown; value: unknown };
    values.set(asString(item.key), asString(item.value).trim());
  }

  return {
    slogan: values.get("slogan") || DEFAULT_SETTINGS.slogan,
    logoUrl: values.get("app_logo_url") || null,
    contactTelegram: values.get("contact_telegram") || DEFAULT_SETTINGS.contactTelegram,
  };
}
