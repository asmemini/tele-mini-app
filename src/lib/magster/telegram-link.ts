import { MagsterRpc } from "@/lib/magster/tables";
import { getServerEnv, isTelegramBotConfigured } from "@/lib/env";
import { sendChannelInvitesForApprovedPayments } from "@/lib/telegram/channel-invite";
import {
  createTelegramSession,
  readTelegramSession,
  writeTelegramSession,
  type TelegramSession,
} from "@/lib/telegram/session";
import { TelegramInitDataError, validateTelegramInitData } from "@/lib/telegram/validate";
import { getMagsterSupabase } from "@/lib/supabase/server";

export type AttachTelegramLinkResult =
  | { ok: true }
  | { ok: false; code: string; message: string };

export type LinkExistingResult =
  | { ok: true; studentId: number }
  | { ok: false; code: string; message: string };

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

async function resolveVerifiedTelegramSession(
  initData?: string | null,
): Promise<TelegramSession | null> {
  const raw = initData?.trim() ?? "";
  if (raw) {
    if (!isTelegramBotConfigured()) {
      console.warn("Telegram initData was sent but TELEGRAM_BOT_TOKEN is not set on the Mini App server.");
    } else {
      try {
        const env = getServerEnv();
        const validated = validateTelegramInitData(
          raw,
          env.telegramBotToken,
          env.telegramAuthMaxAgeSeconds,
        );
        const session = createTelegramSession(validated.user);
        await writeTelegramSession(session);
        return session;
      } catch (error) {
        const code = error instanceof TelegramInitDataError ? error.code : "invalid";
        console.warn("Telegram initData could not be verified:", code);
      }
    }
  }

  return readTelegramSession();
}

export async function syncTelegramSessionFromInitData(initData?: string | null) {
  return resolveVerifiedTelegramSession(initData);
}

/**
 * Links a verified Telegram identity to a Magster student. Identity comes from
 * the signed httpOnly session cookie, or from HMAC-validated WebApp initData
 * on the same request (Telegram WebView often drops cookies).
 *
 * The student id comes from this server's own signed app session / just-created
 * registration, never from the browser. The DB write is a SECURITY DEFINER RPC.
 */
export async function attachTelegramToStudent(
  studentId: number,
  deviceId: string,
  initData?: string | null,
): Promise<AttachTelegramLinkResult> {
  const session = await resolveVerifiedTelegramSession(initData);
  if (!session) {
    console.warn("Telegram identity not linked: no verified Mini App initData for student", studentId);
    return { ok: true };
  }

  const { data, error } = await getMagsterSupabase().rpc(
    MagsterRpc.attachStudentTelegram,
    {
      p_student_id: studentId,
      p_device_id: deviceId,
      p_telegram_user_id: session.telegramUserId,
      p_telegram_username: session.username || null,
      p_telegram_first_name: session.firstName || null,
      p_telegram_last_name: session.lastName || null,
    },
  );

  if (error) {
    console.error("attach_student_telegram failed:", error.message, {
      studentId,
    });
    return { ok: false, code: "rpc_error", message: error.message };
  }

  const map = asRecord(data);

  if (map.success === true) {
    await sendChannelInvitesForApprovedPayments(studentId);
    return { ok: true };
  }

  const code = String(map.error ?? "unknown");
  console.warn("attach_student_telegram rejected:", code, map.detail, {
    studentId,
  });
  return { ok: false, code, message: String(map.detail ?? code) };
}

/**
 * Identifies an EXISTING student by phone + PIN and links the verified Telegram
 * identity to that exact student, all in one server-side call.
 *
 * Security: two independent, server-validated gates are required before the link
 * is written:
 *   1. Telegram identity from HMAC-validated initData (this request) or the
 *      signed session cookie created after the same check.
 *   2. The phone + PIN are verified by the SECURITY DEFINER RPC server-side
 *      (same PIN check the Flutter app uses). A phone number alone is never
 *      trusted and never enough to attach Telegram.
 *
 * The RPC intentionally does not rebind the student's device.
 */
export async function linkTelegramToExistingStudent(input: {
  phone: string;
  pin: string;
  initData?: string | null;
}): Promise<LinkExistingResult> {
  const session = await resolveVerifiedTelegramSession(input.initData);
  if (!session) {
    return {
      ok: false,
      code: "telegram_unverified",
      message: "Telegram identity is not verified. Open Magster from Telegram, not a browser tab.",
    };
  }

  const { data, error } = await getMagsterSupabase().rpc(
    MagsterRpc.linkStudentTelegramByPin,
    {
      p_phone: input.phone,
      p_pin: input.pin,
      p_telegram_user_id: session.telegramUserId,
      p_telegram_username: session.username || null,
      p_telegram_first_name: session.firstName || null,
      p_telegram_last_name: session.lastName || null,
    },
  );

  if (error) {
    console.error("link_student_telegram_by_pin failed:", error.message);
    return { ok: false, code: "server_error", message: "Could not link your account." };
  }

  const map = asRecord(data);
  if (map.success === true) {
    const studentId = Number(map.student_id);
    if (Number.isFinite(studentId) && studentId > 0) {
      await sendChannelInvitesForApprovedPayments(studentId);
      return { ok: true, studentId };
    }
    return { ok: false, code: "server_error", message: "Could not link your account." };
  }

  const code = String(map.error ?? "unknown");
  console.warn("link_student_telegram_by_pin rejected:", code, map.detail);
  return { ok: false, code, message: String(map.detail ?? code) };
}
