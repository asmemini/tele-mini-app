import type { MagsterStudentIdentity } from "@/lib/magster/types";
import type { TelegramSession } from "@/lib/telegram/session";

/**
 * Telegram Mini App identity is stored on Magster `students.telegram_user_id`
 * after initData HMAC verification and attach_student_telegram / link_student_telegram_by_pin.
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
