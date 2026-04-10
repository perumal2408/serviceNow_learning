"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, Moon, Sun, Zap } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";

// Map pathnames to page titles
function getTitle(pathname: string): string {
  if (pathname.startsWith("/dashboard")) return "Dashboard";
  if (pathname.startsWith("/roadmap")) return "Roadmap";
  if (pathname.startsWith("/learn")) return "Lesson";
  if (pathname.startsWith("/practice")) return "Practice";
  if (pathname.startsWith("/profile")) return "Profile";
  return "ServiceNow Learning";
}

export function MobileHeader() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { toggleSidebar } = useUIStore();

  return (
    <header className="sticky top-0 z-40 bg-card border-b pt-safe">
      <div className="flex items-center justify-between h-14 px-4">
        <Link href="/dashboard" className="flex items-center gap-2" aria-label="Home">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-primary-foreground" aria-hidden />
          </div>
        </Link>

        <h1 className="font-semibold text-sm">{getTitle(pathname)}</h1>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" aria-hidden />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            aria-label="Open menu"
            aria-expanded={false}
          >
            <Menu className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>
    </header>
  );
}
