function required(name: string, value: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/** Dynamic lookup so Next.js does not bake an empty TELEGRAM_BOT_TOKEN into the Vercel build. */
function runtimeEnv(name: string): string {
  return String((process.env as Record<string, string | undefined>)[name] ?? "").trim();
}

export function getServerEnv() {
  return {
    supabaseUrl: required("SUPABASE_URL", runtimeEnv("SUPABASE_URL")),
    supabaseAnonKey: required("SUPABASE_ANON_KEY", runtimeEnv("SUPABASE_ANON_KEY")),
    sessionSecret: required("SESSION_SECRET", runtimeEnv("SESSION_SECRET")),
    telegramBotToken: runtimeEnv("TELEGRAM_BOT_TOKEN"),
    telegramChannelId: runtimeEnv("TELEGRAM_CHANNEL_ID"),
    telegramAuthMaxAgeSeconds: Number(runtimeEnv("TELEGRAM_AUTH_MAX_AGE_SECONDS") || "86400"),
  };
}

export function isTelegramBotConfigured(): boolean {
  return Boolean(runtimeEnv("TELEGRAM_BOT_TOKEN"));
}
