import type { MagsterStudentIdentity } from "@/lib/magster/types";
import type { TelegramSession } from "@/lib/telegram/session";

/**
 * Future identity graph (not written in Phase 1):
 *
 * Telegram user  →  telegram_identities  →  students  →  student_access
 *
 * Magster `students` currently has no telegram_user_id column.
 * Do not spoof this link from the browser. A later SECURITY DEFINER RPC
 * or service-role server path must create the mapping after initData
 * validation and registration.
 */
export type TelegramStudentLink = {
  telegramUserId: number;
  student: MagsterStudentIdentity | null;
};

export function emptyTelegramStudentLink(
  session: TelegramSession | null,
): TelegramStudentLink | null {
  if (!session) return null;
  return {
    telegramUserId: session.telegramUserId,
    student: null,
  };
}
