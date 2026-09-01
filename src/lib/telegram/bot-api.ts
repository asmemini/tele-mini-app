export type TelegramInviteStatus = "sent" | "skipped" | "failed";

export type TelegramInviteResult = {
  status: TelegramInviteStatus;
  message: string;
};

type TelegramApiResponse<T> = {
  ok: boolean;
  description?: string;
  result?: T;
};

type ChatInviteLink = {
  invite_link: string;
};

function telegramApiUrl(token: string, method: string) {
  return `https://api.telegram.org/bot${token}/${method}`;
}

async function telegramPost<T>(
  token: string,
  method: string,
  body: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(telegramApiUrl(token, method), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as TelegramApiResponse<T>;
  if (!payload.ok || payload.result == null) {
    throw new Error(payload.description || `Telegram ${method} failed.`);
  }
  return payload.result;
}

export async function createSingleUseChannelInvite(input: {
  botToken: string;
  channelId: string;
  label: string;
}): Promise<string> {
  const result = await telegramPost<ChatInviteLink>(input.botToken, "createChatInviteLink", {
    chat_id: input.channelId,
    name: input.label.slice(0, 32),
    member_limit: 1,
  });
  return result.invite_link;
}

export async function sendTelegramDirectMessage(input: {
  botToken: string;
  telegramUserId: number;
  text: string;
}): Promise<void> {
  await telegramPost(input.botToken, "sendMessage", {
    chat_id: input.telegramUserId,
    text: input.text,
    disable_web_page_preview: false,
  });
}
