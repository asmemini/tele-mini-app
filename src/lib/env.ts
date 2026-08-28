function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getServerEnv() {
  return {
    supabaseUrl: required("SUPABASE_URL", process.env.SUPABASE_URL),
    supabaseAnonKey: required("SUPABASE_ANON_KEY", process.env.SUPABASE_ANON_KEY),
    sessionSecret: required("SESSION_SECRET", process.env.SESSION_SECRET),
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN?.trim() || "",
    telegramAuthMaxAgeSeconds: Number(process.env.TELEGRAM_AUTH_MAX_AGE_SECONDS || 86400),
  };
}

export function isTelegramBotConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim());
}
