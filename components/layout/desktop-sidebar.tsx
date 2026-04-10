"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Code2,
  Compass,
  Home,
  Moon,
  Sun,
  User,
  Zap,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/roadmap", label: "Roadmap", icon: Compass },
  { href: "/practice", label: "Practice", icon: Code2 },
  { href: "/profile", label: "Profile", icon: User },
];

const categories = [
  { slug: "client-side-components", name: "Client-Side", color: "#6366f1" },
  { slug: "core-servicenow-apis", name: "Core APIs", color: "#0ea5e9" },
  { slug: "integration", name: "Integration", color: "#f59e0b" },
  { slug: "modern-development", name: "Modern Dev", color: "#10b981" },
  { slug: "server-side-components", name: "Server-Side", color: "#ef4444" },
  { slug: "specialized-areas", name: "Specialized", color: "#8b5cf6" },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <aside className="w-sidebar shrink-0 border-r bg-card flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="font-semibold text-sm leading-none">ServiceNow</p>
            <p className="text-xs text-muted-foreground">Learning Platform</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav aria-label="Main navigation">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors min-h-[44px]",
                    pathname.startsWith(item.href)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  aria-current={pathname.startsWith(item.href) ? "page" : undefined}
                >
                  <item.icon className="w-4 h-4 shrink-0" aria-hidden />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Separator className="my-4" />

        {/* Category quick links */}
        <div>
          <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Categories
          </p>
          <ul className="space-y-1">
            {categories.map((cat) => (
              <li key={cat.slug}>
                <Link
                  href={`/roadmap?category=${cat.slug}`}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors min-h-[44px]"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                    aria-hidden
                  />
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick progress */}
        <Separator className="my-4" />
        <div className="px-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Overall Progress</span>
            <span className="text-xs font-medium">0%</span>
          </div>
          <Progress value={0} aria-label="Overall learning progress" />
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <BookOpen className="w-3 h-3" aria-hidden />
            <span>0 / 0 lessons complete</span>
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="px-3 py-4 border-t flex items-center justify-between">
        <Link
          href="/profile"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] px-2 rounded-md hover:bg-accent"
        >
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-primary" aria-hidden />
          </div>
          <span>Account</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" aria-hidden />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" aria-hidden />
        </Button>
      </div>
    </aside>
  );
}
