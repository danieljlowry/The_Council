"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Download,
  FileCode,
  FileText,
  MessageSquare,
  MoreVertical,
  PlusCircle,
  Search,
  Settings,
  Trash2,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { cn } from "@/lib/utils";
import { deleteCouncil, formatSupabaseError, getCouncil } from "@/lib/api";
import {
  downloadCouncilFinalResponse,
  resolveCouncilFinalBody,
  type CouncilDownloadFormat,
} from "@/lib/downloadCouncilFinal";
import { createClient } from "@/utils/supabase/client";

interface SidebarProps {
  councils?: { id: string; title: string }[];
  profile?:
    | {
        username: string;
        fullName: string | null;
      }
    | null;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function canDeleteCouncilId(id: string): boolean {
  return UUID_RE.test(id);
}

function deriveInitials(fullName: string | null | undefined, username: string): string {
  const source = fullName?.trim() || username.trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "PO";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function Sidebar({ councils, profile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const chats = councils ?? [];
  const [isSettingsSpinning, setIsSettingsSpinning] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [downloadBusyId, setDownloadBusyId] = useState<string | null>(null);
  const isSettingsRoute =
    pathname === "/settings" || pathname.startsWith("/settings/");
  const displayName =
    profile?.fullName?.trim() || profile?.username || "Prompt Odyssey User";
  const usernameLabel = profile?.username
    ? `@${profile.username}`
    : "Profile unavailable";
  const initials = deriveInitials(profile?.fullName, profile?.username ?? "");

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleSettingsClick = () => {
    setIsSettingsSpinning(true);
  };

  const handleDeleteCouncil = async (
    e: React.MouseEvent,
    councilId: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canDeleteCouncilId(councilId)) {
      return;
    }
    if (
      !window.confirm(
        "Delete this council and its full transcript? This cannot be undone.",
      )
    ) {
      return;
    }
    setOpenMenuId(null);
    setDeletingId(councilId);
    try {
      await deleteCouncil(councilId);
      if (pathname === `/council/${councilId}`) {
        router.push("/");
      }
      router.refresh();
    } catch (err) {
      window.alert(formatSupabaseError(err));
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownloadCouncil = async (
    councilId: string,
    format: CouncilDownloadFormat,
  ) => {
    setDownloadBusyId(councilId);
    try {
      const council = await getCouncil(councilId);
      const body = resolveCouncilFinalBody(council);
      if (!body) {
        window.alert("No final response to download yet.");
        return;
      }
      downloadCouncilFinalResponse(format, {
        title: council.title,
        topic: council.primaryPrompt,
        body,
      });
      setOpenMenuId(null);
    } catch (err) {
      window.alert(formatSupabaseError(err));
    } finally {
      setDownloadBusyId(null);
    }
  };

  useEffect(() => {
    if (!openMenuId) {
      return undefined;
    }
    const close = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest?.("[data-council-chat-menu]")) {
        return;
      }
      setOpenMenuId(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [openMenuId]);

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
          className="flex items-center gap-2 text-lg font-semibold text-[#C2410C] dark:text-[#FB923C]"
        >
          <BrandLogo size="sm" />
          Prompt Odyssey
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
          className="mt-2 flex w-full items-center gap-2 rounded-md bg-[#C2410C] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#9A3412]"
        >
          <PlusCircle className="h-4 w-4" />
          New Council
        </Link>

        <div className="mt-4 flex flex-col gap-1">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Previous council chats
          </div>
          {chats.length === 0 ? (
            <p className="rounded-md px-2 py-3 text-xs leading-relaxed text-muted-foreground">
              No councils yet. Use{" "}
              <span className="font-medium text-foreground">New Council</span>{" "}
              to start one.
            </p>
          ) : (
            chats.map((chat) => {
              const showDelete = canDeleteCouncilId(chat.id);
              const isActive = pathname === `/council/${chat.id}`;
              const isDeleting = deletingId === chat.id;

              return (
                <div
                  key={chat.id}
                  className={cn(
                    "group flex items-center gap-0.5 rounded-md pr-1 transition-colors",
                    isActive && "bg-card shadow-sm",
                  )}
                >
                  <Link
                    href={`/council/${chat.id}`}
                    className={cn(
                      "flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-card/80",
                      isActive && "font-medium",
                    )}
                  >
                    <MessageSquare className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{chat.title}</span>
                  </Link>
                  {showDelete ? (
                    <div className="relative shrink-0" data-council-chat-menu>
                      <button
                        type="button"
                        disabled={isDeleting || downloadBusyId === chat.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOpenMenuId((id) =>
                            id === chat.id ? null : chat.id,
                          );
                        }}
                        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
                        aria-expanded={openMenuId === chat.id}
                        aria-haspopup="true"
                        aria-label={`Actions for ${chat.title}`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {openMenuId === chat.id ? (
                        <div
                          className="absolute top-full right-0 z-[200] mt-1 w-52 rounded-md border border-border bg-popover py-1 text-popover-foreground shadow-lg"
                          role="menu"
                        >
                          <button
                            type="button"
                            role="menuitem"
                            disabled={isDeleting}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent disabled:opacity-50"
                            onClick={(e) => handleDeleteCouncil(e, chat.id)}
                          >
                            <Trash2 className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                            Delete
                          </button>
                          <div
                            className="my-1 border-t border-border"
                            role="presentation"
                          />
                          <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Download
                          </p>
                          <button
                            type="button"
                            role="menuitem"
                            disabled={downloadBusyId === chat.id}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent disabled:opacity-50"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              void handleDownloadCouncil(chat.id, "txt");
                            }}
                          >
                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                            Plain text (.txt)
                            <Download className="ml-auto h-3.5 w-3.5 shrink-0 opacity-60" />
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            disabled={downloadBusyId === chat.id}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent disabled:opacity-50"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              void handleDownloadCouncil(chat.id, "md");
                            }}
                          >
                            <FileCode className="h-4 w-4 shrink-0 text-muted-foreground" />
                            Markdown (.md)
                            <Download className="ml-auto h-3.5 w-3.5 shrink-0 opacity-60" />
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-sidebar-border pt-4">
        <Link
          href="/settings"
          onClick={handleSettingsClick}
          className={cn(
            "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all",
            isSettingsRoute
              ? "border-[#C2410C]/20 bg-[#C2410C]/8 text-[#C2410C] shadow-sm dark:border-[#EA580C]/30 dark:bg-[#EA580C]/15 dark:text-[#FB923C]"
              : "border-transparent bg-card text-foreground hover:border-border hover:bg-accent/50",
          )}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C2410C]/10 text-[#C2410C] dark:bg-[#EA580C]/15 dark:text-[#FB923C]">
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

        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 shadow-sm">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#C2410C]/10 text-xs font-semibold text-[#C2410C] dark:bg-[#EA580C]/15 dark:text-[#FB923C]"
            aria-hidden="true"
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {displayName}
            </p>
            <p className="truncate text-[11px] leading-tight text-muted-foreground">
              {usernameLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="shrink-0 cursor-pointer rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 active:bg-red-800"
            aria-label="Log out"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
