import {
  createSingleUseChannelInvite,
  sendTelegramDirectMessage,
} from "@/lib/telegram/bot-api";
import { MagsterTables } from "@/lib/magster/tables";
import { getMagsterSupabase } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env";

function inviteMessage(studentName: string, inviteLink: string) {
  const name = studentName.trim() || "there";
  return [
    `Hi ${name}, your Magster payment was approved.`,
    "Here is your one-time private channel invite:",
    inviteLink,
    "This link works for a single join. Open it in Telegram to get access.",
  ].join("\n\n");
}

export async function sendChannelInvitesForApprovedPayments(studentId: number): Promise<void> {
  const env = getServerEnv();
  const botToken = env.telegramBotToken;
  const channelId = env.telegramChannelId;
  if (!botToken || !channelId || !studentId) return;

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
    .select("id")
    .eq("student_id", studentId)
    .eq("status", "approved");

  if (paymentError) {
    console.warn("Could not load approved payments for invite:", paymentError.message);
    return;
  }

  const fullName = String((student as { full_name?: unknown } | null)?.full_name ?? "");

  for (const row of payments ?? []) {
    const paymentId = Number((row as { id?: unknown }).id);
    if (!Number.isFinite(paymentId) || paymentId <= 0) continue;
    try {
      const inviteLink = await createSingleUseChannelInvite({
        botToken,
        channelId,
        label: `pay ${paymentId}`,
      });
      await sendTelegramDirectMessage({
        botToken,
        telegramUserId,
        text: inviteMessage(fullName, inviteLink),
      });
      await client.from("telegram_channel_invites").insert({
        payment_request_id: paymentId,
        student_id: studentId,
        telegram_user_id: telegramUserId,
        invite_link: inviteLink,
        status: "sent",
      });
    } catch (error) {
      console.warn(
        "Channel invite after Telegram link failed:",
        error instanceof Error ? error.message : error,
      );
    }
  }
}
