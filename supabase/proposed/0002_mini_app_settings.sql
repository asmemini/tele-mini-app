-- NOT APPLIED.
-- Optional later customization store for the Telegram Mini App.
-- Prefer namespaced keys in existing public.app_settings first:
--   mini_app_welcome_title
--   mini_app_welcome_subtitle
--   mini_app_welcome_image_url
--   mini_app_primary_cta_label
--   mini_app_primary_color
--   mini_app_visible_course_ids
--   mini_app_visible_bundle_ids
--   mini_app_payment_instructions
--
-- Create this table only if nested JSON configuration outgrows app_settings.

CREATE TABLE IF NOT EXISTS public.mini_app_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mini_app_settings ENABLE ROW LEVEL SECURITY;

-- Admin panel (authenticated Magster admins) would manage rows.
-- Anon read can be added later for public Mini App copy, or the Mini App
-- server can read with a service-role key and expose a curated JSON config.

COMMENT ON TABLE public.mini_app_settings IS
  'Optional Telegram Mini App configuration. Magster courses and bundles remain in existing tables.';
