import type { CSSProperties, ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { MiniAppShell } from "@/components/layout/mini-app-shell";
import { TelegramProvider } from "@/components/telegram/telegram-provider";
import { APP_DESCRIPTION, APP_NAME, MAGSTER_COLORS } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: MAGSTER_COLORS.primary,
};

const telegramViewportStyle = {
  "--tg-viewport-height": "100vh",
  "--tg-viewport-stable-height": "100vh",
} as CSSProperties;

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning style={telegramViewportStyle}>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        <MiniAppShell>
          <TelegramProvider>{children}</TelegramProvider>
        </MiniAppShell>
      </body>
    </html>
  );
}