export type TelegramLaunchState =
  | "loading"
  | "browser"
  | "validating"
  | "authenticated"
  | "invalid"
  | "unconfigured";

export type PublicTelegramIdentity = {
  telegramUserId: number;
  firstName: string;
  lastName: string;
  username: string;
  photoUrl: string | null;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export type TelegramWebApp = {
  initData: string;
  ready: () => void;
  expand: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  disableVerticalSwipes?: () => void;
  close?: () => void;
  colorScheme?: "light" | "dark";
  platform?: string;
};
