import { buildPaymentApprovedInviteMessage } from "@/lib/telegram/approval-message";
import {
  createSingleUseChannelInvite,
  sendAndPinTelegramDirectMessage,
} from "@/lib/telegram/bot-api";
import { MagsterTables } from "@/lib/magster/tables";
import { getMagsterSupabase } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env";

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function sendChannelInvitesForApprovedPayments(studentId: number): Promise<void> {
  const env = getServerEnv();
  const botToken = env.telegramBotToken;
  if (!botToken || !studentId) return;

  const client = getMagsterSupabase();
  const { data: student, error: studentError } = await client
    .from(MagsterTables.students)
    .select("full_name, telegram_user_id")
    .eq("id", studentId)
    .maybeSingle();

  if (studentError) {
    console.warn("Could not load student for channel invite:", studentError.message);
    return;
  }

  const telegramUserId = Number(
    (student as { telegram_user_id?: unknown } | null)?.telegram_user_id,
  );
  if (!Number.isFinite(telegramUserId) || telegramUserId <= 0) return;

  const { data: payments, error: paymentError } = await client
    .from(MagsterTables.paymentRequests)
    .select("id, course_id, bundle_id, courses(title, telegram_channel_id), bundles(title, telegram_channel_id)")
    .eq("student_id", studentId)
    .eq("status", "approved");

  if (paymentError) {
    console.warn("Could not load approved payments for invite:", paymentError.message);
    return;
  }

  const fullName = String((student as { full_name?: unknown } | null)?.full_name ?? "");

  for (const row of payments ?? []) {
    const payment = row as {
      id?: unknown;
      course_id?: number | null;
      bundle_id?: number | null;
      courses?: { title?: string; telegram_channel_id?: string | null } | { title?: string; telegram_channel_id?: string | null }[] | null;
      bundles?: { title?: string; telegram_channel_id?: string | null } | { title?: string; telegram_channel_id?: string | null }[] | null;
    };
    const paymentId = Number(payment.id);
    if (!Number.isFinite(paymentId) || paymentId <= 0) continue;

    const bundle = firstRelation(payment.bundles);
    const course = firstRelation(payment.courses);
    const isBundle = Boolean(payment.bundle_id);
    const itemTitle = isBundle
      ? String(bundle?.title ?? "Bundle")
      : String(course?.title ?? "Course");
    const channelId =
      String((isBundle ? bundle?.telegram_channel_id : course?.telegram_channel_id) ?? "").trim() ||
      env.telegramChannelId;
    if (!channelId) continue;

    try {
      const inviteLink = await createSingleUseChannelInvite({
        botToken,
        channelId,
        label: `pay ${paymentId}`,
      });
      await sendAndPinTelegramDirectMessage({
        botToken,
        telegramUserId,
        text: buildPaymentApprovedInviteMessage({
          studentName: fullName,
          itemTitle,
          inviteLink,
          kind: isBundle ? "bundle" : "course",
        }),
      });
      await client.from("telegram_channel_invites").insert({
        payment_request_id: paymentId,
        student_id: studentId,
        telegram_user_id: telegramUserId,
        invite_link: inviteLink,
        status: "sent",
        course_id: payment.course_id ?? null,
        bundle_id: payment.bundle_id ?? null,
        channel_id: channelId,
      });
    } catch (error) {
      console.warn(
        "Channel invite after Telegram link failed:",
        error instanceof Error ? error.message : error,
      );
    }
  }
}
