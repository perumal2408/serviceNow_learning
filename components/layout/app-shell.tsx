"use client";

import { useBreakpoint } from "@/lib/hooks/use-breakpoint";
import { DesktopSidebar } from "./desktop-sidebar";
import { MobileHeader } from "./mobile-header";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { TabletNav } from "./tablet-nav";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const breakpoint = useBreakpoint();

  return (
    <div className="min-h-screen bg-background">
      {breakpoint === "desktop" && (
        <div className="flex h-screen overflow-hidden">
          <DesktopSidebar />
          <main
            id="main-content"
            className="flex-1 overflow-y-auto"
            tabIndex={-1}
          >
            <div className="mx-auto max-w-7xl p-6">{children}</div>
          </main>
        </div>
      )}

      {breakpoint === "tablet" && (
        <div className="flex h-screen overflow-hidden">
          <TabletNav />
          <main
            id="main-content"
            className="flex-1 overflow-y-auto"
            tabIndex={-1}
          >
            <div className="p-4 md:p-6">{children}</div>
          </main>
        </div>
      )}

      {breakpoint === "mobile" && (
        <div className="flex flex-col min-h-screen">
          <MobileHeader />
          <main
            id="main-content"
            className="flex-1 overflow-y-auto pb-bottom-nav pt-safe"
            tabIndex={-1}
          >
            <div className={cn("p-4")}>{children}</div>
          </main>
          <MobileBottomNav />
        </div>
      )}
    </div>
  );
}
