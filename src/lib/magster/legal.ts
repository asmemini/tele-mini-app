import { MagsterTables } from "@/lib/magster/tables";
import { asString } from "@/lib/magster/parse";
import { getMagsterSupabase } from "@/lib/supabase/server";

export const MAGSTER_LEGAL_SLUGS = ["terms_of_service", "privacy_policy"] as const;
export type MagsterLegalSlug = (typeof MAGSTER_LEGAL_SLUGS)[number];

export type MagsterLegalPage = {
  slug: MagsterLegalSlug;
  title: string;
  body: string;
};

const FALLBACK: Record<MagsterLegalSlug, MagsterLegalPage> = {
  terms_of_service: {
    slug: "terms_of_service",
    title: "Terms of Service",
    body: "By using Magster Academy you agree to our Terms of Service. Updated terms load when you are online.",
  },
  privacy_policy: {
    slug: "privacy_policy",
    title: "Privacy Policy",
    body: "Magster Academy respects your privacy. Updated policy content loads when you are online.",
  },
};

export function isMagsterLegalSlug(value: string): value is MagsterLegalSlug {
  return MAGSTER_LEGAL_SLUGS.includes(value as MagsterLegalSlug);
}

export async function loadMagsterLegalPage(slug: MagsterLegalSlug): Promise<MagsterLegalPage> {
  const fallback = FALLBACK[slug];
  const { data, error } = await getMagsterSupabase()
    .from(MagsterTables.appLegalPages)
    .select("slug, title, body_markdown")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return fallback;

  const title = asString((data as { title?: unknown }).title).trim() || fallback.title;
  const body = asString((data as { body_markdown?: unknown }).body_markdown).trim() || fallback.body;
  return { slug, title, body };
}
