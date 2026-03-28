"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, PlusCircle, MessageSquare, Settings } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { cn } from "../utils/styles";

const previousChats = [
  { id: 1, title: "Analog Clock React app" },
  { id: 2, title: "Simple Design System" },
  { id: 3, title: "Figma variable planning" },
  { id: 4, title: "OKLCH token algorithm" },
  { id: 5, title: "Component naming advice" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSettingsSpinning, setIsSettingsSpinning] = React.useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleSettingsClick = () => {
    setIsSettingsSpinning(true);
  };

  React.useEffect(() => {
    if (!isSettingsSpinning) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setIsSettingsSpinning(false);
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [isSettingsSpinning]);

  return (
    <div className="flex flex-col w-[260px] h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border p-4 justify-between shrink-0 transition-colors">
      <div className="flex flex-col gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-lg text-[#002D72] dark:text-primary"
        >
          <div className="w-6 h-6 rounded bg-[#002D72] text-white flex items-center justify-center">
            C
          </div>
          The Council
        </Link>

        <div className="relative w-full rounded-full border border-border bg-card overflow-hidden flex items-center px-4 py-2 transition-colors">
          <input
            type="text"
            placeholder="Search"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <Search className="w-4 h-4 text-foreground shrink-0" />
        </div>

        <Link
          href="/new"
          className="flex items-center gap-2 px-3 py-2 w-full rounded-md bg-[#002D72] text-white font-medium text-sm hover:bg-[#002D72]/90 transition-colors mt-2"
        >
          <PlusCircle className="w-4 h-4" />
          New Council
        </Link>

        <div className="flex flex-col gap-1 mt-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Previous Debates
          </div>
          {previousChats.map((chat) => (
            <Link
              key={chat.id}
              href={`/council/${chat.id}`}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-foreground hover:bg-card transition-colors",
                pathname === `/council/${chat.id}` && "bg-card font-medium shadow-sm",
              )}
            >
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <span className="truncate">{chat.title}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-4 border-t border-sidebar-border">
        <Link
          href="/settings"
          onClick={handleSettingsClick}
          className={cn(
            "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all",
            pathname === "/settings"
              ? "border-[#002D72]/20 bg-[#002D72]/8 text-[#002D72] shadow-sm dark:border-primary/30 dark:bg-primary/15 dark:text-primary"
              : "border-transparent bg-card text-foreground hover:border-border hover:bg-accent/50",
          )}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#002D72]/10 text-[#002D72] dark:bg-primary/15 dark:text-primary">
            <Settings
              className={cn(
                "w-4 h-4 transition-transform duration-500",
                isSettingsSpinning && "rotate-180",
              )}
            />
          </div>
          <div className="flex flex-col leading-tight">
            <span>Settings</span>
            <span className="text-[11px] font-normal text-muted-foreground">
              Preferences and account
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <img
            src="/profile.png"
            alt="User"
            className="w-8 h-8 rounded-full object-cover shrink-0 bg-card"
          />
          <button
            type="button"
            onClick={handleLogout}
            className="flex-1 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm rounded-md px-3 py-1.5 transition-colors cursor-pointer"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full h-screen bg-background overflow-hidden text-foreground flex-col md:flex-row transition-colors">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex-1 flex w-full relative h-full overflow-hidden">
        {children}
      </div>
    </div>
  );
}
