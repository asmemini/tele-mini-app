import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { MiniAppShell } from "@/components/layout/mini-app-shell";
import { TelegramProvider } from "@/components/telegram/telegram-provider";
import { APP_DESCRIPTION, APP_NAME, MAGSTER_COLORS } from "@/lib/brand";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

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
  themeColor: MAGSTER_COLORS.telegramChrome,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} font-sans antialiased`}>
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
