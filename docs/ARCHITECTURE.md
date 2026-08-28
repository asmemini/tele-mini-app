# Magster Telegram Mini App — Phase 1 Architecture

This document is the inspection + architecture record for Prompt 1. The Mini App lives in `tele_mini`. The Flutter Student App (`Magster`) and Admin Panel (`magster_admin`) were inspected and were **not** modified.

## Ecosystem

```
Existing Magster Admin Panel
        ↓
Existing Supabase project `mrzmhtirmxqnnoqppnyf`
        ↓
  ┌─────┴─────┐
  ↓           ↓
Magster App   Telegram Mini App (this repo)
```

- Supabase URL: `https://mrzmhtirmxqnnoqppnyf.supabase.co`
- Region: `eu-west-1`
- Do not create a second Supabase project.
- Do not duplicate `courses` or `bundles`.

## Identity model

```
Telegram WebApp.initData
      ↓  HMAC-SHA256 validation on the Next.js server
Signed httpOnly session cookie
      ↓  (later) telegram_identities
Magster students row
      ↓
courses / bundles / payment_requests / student_access
```

A Telegram user ID from the browser is never treated as authentication.

## Reused Magster systems

- `courses`, `bundles`, `bundle_courses`
- `students` (later registration via `register_student_secure`)
- `app_payment_methods`, `payment_requests`, `submit_student_payment_request`
- `student_access` and existing approval-grant triggers
- `app_settings`, `app_registration_options`, `get_app_edits_config`
- Storage buckets `payment-receipts` / `course-images` / `course-thumbnails`

## Proposed later schema (not applied)

See `supabase/proposed/`.
