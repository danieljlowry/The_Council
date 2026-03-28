"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { MessageSquare, PlusCircle, Search, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

interface SidebarProps {
  councils?: { id: string; title: string }[];
}

const imgShape = "/images/profile.png";

const fallbackChats = [
  { id: "1", title: "Analog Clock React app" },
  { id: "2", title: "Simple Design System" },
  { id: "3", title: "Figma variable planning" },
  { id: "4", title: "OKLCH token algorithm" },
  { id: "5", title: "Component naming advice" },
];

export function Sidebar({ councils }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const chats = councils && councils.length > 0 ? councils : fallbackChats;
  const [isSettingsSpinning, setIsSettingsSpinning] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleSettingsClick = () => {
    setIsSettingsSpinning(true);
  };

  useEffect(() => {
    if (!isSettingsSpinning) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setIsSettingsSpinning(false);
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [isSettingsSpinning]);

  return (
    <div className="flex h-full w-[260px] shrink-0 flex-col justify-between border-r border-sidebar-border bg-sidebar p-4 text-sidebar-foreground transition-colors">
      <div className="flex flex-col gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold text-[#002D72] dark:text-primary"
        >
          <div className="w-6 h-6 rounded bg-[#002D72] text-white flex items-center justify-center">
            C
          </div>
          The Council
        </Link>

        <div className="relative flex w-full items-center overflow-hidden rounded-full border border-border bg-card px-4 py-2 transition-colors">
          <input
            type="text"
            placeholder="Search"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <Search className="h-4 w-4 shrink-0 text-foreground" />
        </div>

        <Link
          href="/new"
          className="mt-2 flex w-full items-center gap-2 rounded-md bg-[#002D72] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#002D72]/90"
        >
          <PlusCircle className="h-4 w-4" />
          New Council
        </Link>

        <div className="mt-4 flex flex-col gap-1">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Previous Debates
          </div>
          {chats.map((chat) => (
            <Link
              key={chat.id}
              href={`/council/${chat.id}`}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-card",
                pathname === `/council/${chat.id}` && "bg-card font-medium shadow-sm",
              )}
            >
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{chat.title}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-sidebar-border pt-4">
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
                "h-4 w-4 transition-transform duration-500",
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
          <Image
            src={imgShape}
            alt="User"
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 rounded-full bg-card object-cover"
          />
          <button
            onClick={handleLogout}
            className="flex-1 cursor-pointer rounded-md bg-red-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-red-700 active:bg-red-800"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
