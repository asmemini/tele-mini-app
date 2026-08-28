-- NOT APPLIED.
-- Proposed for a later phase after Telegram registration is implemented.
-- Do not run this against the Magster production database until that work starts.

CREATE TABLE IF NOT EXISTS public.telegram_identities (
  telegram_user_id bigint PRIMARY KEY,
  student_id bigint UNIQUE REFERENCES public.students(id) ON DELETE SET NULL,
  username text,
  first_name text,
  last_name text,
  language_code text,
  is_premium boolean NOT NULL DEFAULT false,
  photo_url text,
  linked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS telegram_identities_student_id_idx
  ON public.telegram_identities (student_id);

ALTER TABLE public.telegram_identities ENABLE ROW LEVEL SECURITY;

-- No anon policies. Linking must happen through a SECURITY DEFINER RPC
-- after server-side Telegram initData validation.

COMMENT ON TABLE public.telegram_identities IS
  'Maps a verified Telegram user to an existing Magster students row. Do not trust client-supplied telegram IDs.';
