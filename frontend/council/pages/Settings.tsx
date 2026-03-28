"use client";

import React from "react";
import { useTheme } from "next-themes";
import { Bell, MoonStar, Shield, SunMedium, UserCog } from "lucide-react";
import { cn } from "../utils/styles";

const settingCards = [
  {
    title: "Profile",
    description: "Update your display name, identity details, and account-facing info.",
    icon: UserCog,
  },
  {
    title: "Notifications",
    description: "Choose how council updates and product messages reach you.",
    icon: Bell,
  },
  {
    title: "Privacy",
    description: "Review access, permissions, and how your workspace data is handled.",
    icon: Shield,
  },
];

export function SettingsPage() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = mounted ? resolvedTheme ?? "light" : "light";

  return (
    <div className="flex-1 h-full overflow-auto bg-background transition-colors">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6 md:p-8">
        <div className="rounded-[28px] border border-border bg-card p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Workspace Settings
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-card-foreground">
            Tune The Council
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            This settings area is ready for account, workspace, and preference controls.
            We can wire each section to real data next.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.3fr_repeat(3,1fr)]">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#002D72]/8 text-[#002D72] dark:bg-primary/15 dark:text-primary">
              <MoonStar className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-lg font-semibold text-card-foreground">Appearance</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Choose the look of your workspace. Your selection is saved for later visits.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={cn(
                  "rounded-2xl border px-4 py-4 text-left transition-all",
                  activeTheme === "light"
                    ? "border-[#002D72] bg-[#002D72]/6 shadow-sm dark:border-primary dark:bg-primary/10"
                    : "border-border bg-background hover:border-[#002D72]/30 dark:hover:border-primary/40",
                )}
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <SunMedium className="h-4 w-4" />
                  Light Mode
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Bright workspace with crisp contrast.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={cn(
                  "rounded-2xl border px-4 py-4 text-left transition-all",
                  activeTheme === "dark"
                    ? "border-[#002D72] bg-[#002D72]/6 shadow-sm dark:border-primary dark:bg-primary/10"
                    : "border-border bg-background hover:border-[#002D72]/30 dark:hover:border-primary/40",
                )}
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <MoonStar className="h-4 w-4" />
                  Night Mode
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Darker canvas for evening sessions.
                </p>
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
              Active theme:
              <span className="ml-2 font-semibold text-foreground">
                {activeTheme === "dark" ? "Night Mode" : "Light Mode"}
              </span>
            </div>
          </div>

          {settingCards.map(({ title, description, icon: Icon }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#002D72]/8 text-[#002D72] dark:bg-primary/15 dark:text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-lg font-semibold text-card-foreground">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              <button
                type="button"
                className="mt-5 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-[#002D72] hover:text-[#002D72] dark:hover:border-primary dark:hover:text-primary"
              >
                Coming Soon
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
