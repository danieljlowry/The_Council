import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { ProfileSettingsPanel } from "@/components/ProfileSettingsPanel";
import type { Profile } from "@/lib/types";
import { createClient } from "@/utils/supabase/server";

type ProfileRow = {
  id: string;
  email: string | null;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
  };
}

export default async function ProfileSettingsPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) {
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

          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
            </div>
            <h1 className="mt-5 text-2xl font-semibold text-card-foreground">
              Profile not found
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              We could not find a profile row for this account yet. This can
              happen if the signup trigger did not create the matching entry in
              `public.profiles`.
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Check the Supabase trigger defined in
              `backend/prisma/sql/create_profile_on_signup.sql`, then try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const profile = mapProfile(data as ProfileRow);

  return <ProfileSettingsPanel profile={profile} authEmail={user.email} />;
}
