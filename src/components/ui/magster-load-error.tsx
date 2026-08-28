"use client";

import Link from "next/link";
import { PrimaryButton } from "@/components/ui/primary-button";

export function MagsterLoadError({
  message,
  onRetry,
  showHomeLink = true,
}: {
  message?: string;
  onRetry?: () => void;
  showHomeLink?: boolean;
}) {
  return (
    <div className="mx-5 mt-5 rounded-card border border-red-100 bg-white p-4">
      <p className="text-sm leading-6 text-muted">
        {message || "Unable to load Magster data. Please try again."}
      </p>
      <div className="mt-4">
        <PrimaryButton
          onClick={() => {
            if (onRetry) onRetry();
            else window.location.reload();
          }}
        >
          Try again
        </PrimaryButton>
      </div>
      {showHomeLink ? (
        <p className="mt-3 text-center text-[12px] text-hint">
          <Link href="/" className="underline-offset-2 hover:underline">
            Back to welcome
          </Link>
        </p>
      ) : null}
    </div>
  );
}