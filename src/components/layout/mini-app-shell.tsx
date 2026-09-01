import type { ReactNode } from "react";

export function MiniAppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#ECEFF3]">
      <div className="relative mx-auto flex h-dvh min-h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-canvas">
        {children}
      </div>
    </div>
  );
}
