"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Copy, Mail, UserCog } from "lucide-react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { formatSupabaseError, updateProfile } from "@/lib/api";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ProfileSettingsPanelProps {
  profile: Profile;
  authEmail: string | undefined;
}

type SaveResult = {
  ok: boolean;
  message: string;
};

function deriveInitials(fullName: string, username: string): string {
  const source = fullName.trim() || username.trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "PO";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function formatMemberSince(createdAt: string): string {
  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(parsed);
}

function validateUsername(value: string): string | null {
  if (value.length < 3) {
    return "Username must be at least 3 characters.";
  }

  if (value.length > 30) {
    return "Username must be at most 30 characters.";
  }

  if (!/^[a-zA-Z0-9_]+$/.test(value)) {
    return "Only letters, numbers, and underscores are allowed.";
  }

  if (value.startsWith("_") || value.endsWith("_")) {
    return "Username cannot start or end with an underscore.";
  }

  return null;
}

export function ProfileSettingsPanel({
  profile,
  authEmail,
}: ProfileSettingsPanelProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [fullName, setFullName] = useState(profile.fullName ?? "");
  const [username, setUsername] = useState(profile.username);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<SaveResult | null>(null);

  useEffect(() => {
    setFullName(profile.fullName ?? "");
    setUsername(profile.username);
  }, [profile.fullName, profile.username]);

  useEffect(() => {
    if (!saveResult?.ok) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setSaveResult(null);
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [saveResult]);

  const normalizedFullName = fullName.trim();
  const normalizedUsername = username.trim();
  const originalFullName = profile.fullName ?? "";
  const isDirty =
    normalizedFullName !== originalFullName || normalizedUsername !== profile.username;
  const usernameError =
    normalizedUsername !== profile.username
      ? validateUsername(normalizedUsername)
      : null;

  const initials = useMemo(
    () => deriveInitials(normalizedFullName, normalizedUsername || profile.username),
    [normalizedFullName, normalizedUsername, profile.username],
  );
  const memberSince = useMemo(
    () => formatMemberSince(profile.createdAt),
    [profile.createdAt],
  );
  const email = authEmail ?? profile.email ?? "Unavailable";

  const handleCopyUserId = async () => {
    try {
      await navigator.clipboard.writeText(profile.id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("Failed to copy user ID", error);
      setCopied(false);
    }
  };

  const handleSave = async () => {
    if (!isDirty || saving || usernameError) {
      return;
    }

    setSaving(true);
    setSaveResult(null);

    try {
      const updates: Partial<Pick<Profile, "fullName" | "username">> = {};

      if (normalizedFullName !== originalFullName) {
        updates.fullName = normalizedFullName || null;
      }

      if (normalizedUsername !== profile.username) {
        updates.username = normalizedUsername;
      }

      const updated = await updateProfile(updates);
      setFullName(updated.fullName ?? "");
      setUsername(updated.username);
      setSaveResult({ ok: true, message: "Profile updated." });
      router.refresh();
    } catch (error) {
      const message = formatSupabaseError(error);
      const duplicateUsername = /duplicate key|23505/i.test(message);

      setSaveResult({
        ok: false,
        message: duplicateUsername
          ? "This username is already taken."
          : message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 h-full overflow-auto bg-background transition-colors">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6 md:p-8">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 self-start text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>

        <div className="rounded-[28px] border border-border bg-card p-6 shadow-sm md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Profile Settings
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-card-foreground">
            Your account at a glance
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Update your display name and username below while keeping your
            account-facing details in view.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#C2410C]/10 text-lg font-semibold text-[#C2410C]",
                  "dark:bg-[#EA580C]/15 dark:text-[#FB923C]",
                )}
                aria-hidden="true"
              >
                {initials}
              </div>
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C2410C]/8 text-[#C2410C] dark:bg-[#EA580C]/15 dark:text-[#FB923C]">
                  <UserCog className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-card-foreground">
                  Profile
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Edit the profile fields saved to your account. Changes apply
                  to your `public.profiles` row.
                </p>
              </div>
            </div>

            <form
              className="mt-6 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSave();
              }}
            >
              <div className="space-y-1.5">
                <label
                  htmlFor="profile-display-name"
                  className="text-sm font-medium text-foreground"
                >
                  Display name
                </label>
                <Input
                  id="profile-display-name"
                  value={fullName}
                  onChange={(event) => {
                    setFullName(event.target.value);
                    setSaveResult(null);
                  }}
                  placeholder="Display name"
                  autoComplete="name"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="profile-username"
                  className="text-sm font-medium text-foreground"
                >
                  Username
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                    @
                  </span>
                  <Input
                    id="profile-username"
                    value={username}
                    onChange={(event) => {
                      setUsername(event.target.value);
                      setSaveResult(null);
                    }}
                    className="pl-7"
                    autoComplete="username"
                    aria-describedby={usernameError ? "profile-username-error" : undefined}
                  />
                </div>
                {usernameError ? (
                  <p
                    id="profile-username-error"
                    className="text-xs text-red-600 dark:text-red-400"
                  >
                    {usernameError}
                  </p>
                ) : null}
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!isDirty || saving || Boolean(usernameError)}
                >
                  {saving ? "Saving..." : "Save changes"}
                </Button>
              </div>

              {saveResult ? (
                <div
                  role={saveResult.ok ? "status" : "alert"}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-sm",
                    saveResult.ok
                      ? "border-[#007749]/30 bg-[#007749]/10 text-foreground"
                      : "border-red-500/30 bg-red-500/10 text-foreground",
                  )}
                >
                  {saveResult.message}
                </div>
              ) : null}
            </form>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C2410C]/8 text-[#C2410C] dark:bg-[#EA580C]/15 dark:text-[#FB923C]">
              <Mail className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-lg font-semibold text-card-foreground">
              Account
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Auth-linked details are shown here for reference and support.
            </p>

            <div className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="profile-email"
                  className="text-sm font-medium text-foreground"
                >
                  Email
                </label>
                <Input id="profile-email" value={email} readOnly disabled />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="profile-member-since"
                  className="flex items-center gap-2 text-sm font-medium text-foreground"
                >
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Member since
                </label>
                <Input
                  id="profile-member-since"
                  value={memberSince}
                  readOnly
                  aria-readonly="true"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor="profile-user-id"
                    className="text-sm font-medium text-foreground"
                  >
                    User ID
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyUserId}
                    aria-label="Copy user ID to clipboard"
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors",
                      copied
                        ? "border-[#C2410C] text-[#C2410C] dark:border-[#FB923C] dark:text-[#FB923C]"
                        : "text-muted-foreground hover:border-[#C2410C] hover:text-[#C2410C] dark:hover:border-[#EA580C] dark:hover:text-[#FB923C]",
                    )}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <Input
                  id="profile-user-id"
                  value={profile.id}
                  readOnly
                  aria-readonly="true"
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
