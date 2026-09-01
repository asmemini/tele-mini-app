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
}): Promise<{ messageId: number }> {
  const result = await telegramPost<{ message_id: number }>(input.botToken, "sendMessage", {
    chat_id: input.telegramUserId,
    text: input.text,
    disable_web_page_preview: true,
  });
  return { messageId: result.message_id };
}

export async function pinTelegramChatMessage(input: {
  botToken: string;
  telegramUserId: number;
  messageId: number;
}): Promise<void> {
  await telegramPost<boolean>(input.botToken, "pinChatMessage", {
    chat_id: input.telegramUserId,
    message_id: input.messageId,
    disable_notification: false,
  });
}

export async function sendAndPinTelegramDirectMessage(input: {
  botToken: string;
  telegramUserId: number;
  text: string;
}): Promise<void> {
  const { messageId } = await sendTelegramDirectMessage(input);
  try {
    await pinTelegramChatMessage({
      botToken: input.botToken,
      telegramUserId: input.telegramUserId,
      messageId,
    });
  } catch (error) {
    console.warn(
      "Telegram pin after invite failed:",
      error instanceof Error ? error.message : error,
    );
  }
}
