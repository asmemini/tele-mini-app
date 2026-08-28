import type { ReactNode } from "react";

export function MiniAppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#DCEAFB]">
      <div className="relative mx-auto flex h-dvh min-h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-canvas shadow-[0_0_40px_rgb(37_99_235_/_0.08)]">
        {children}
      </div>
    </div>
  );
}
