import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { createClient } from "@/utils/supabase/server";

type SidebarCouncilRow = {
  id: string;
  title: string;
  status: string;
  created_at: string;
};

type SidebarProfileRow = {
  username: string;
  full_name: string | null;
};

export default async function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: councils }, { data: profileData }] = await Promise.all([
    supabase
      .from("councils")
      .select("id, title, status, created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("username, full_name")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const sidebarCouncils = ((councils as SidebarCouncilRow[] | null) ?? []).map(
    (council) => ({
      id: council.id,
      title: council.title,
    }),
  );
  const sidebarProfileRow = (profileData as SidebarProfileRow | null) ?? null;
  const sidebarProfile = sidebarProfileRow
    ? {
        username: sidebarProfileRow.username,
        fullName: sidebarProfileRow.full_name,
      }
    : null;

  return (
    <div className="flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-background text-foreground transition-colors md:flex-row">
      <div className="hidden min-h-0 md:block">
        <Sidebar councils={sidebarCouncils} profile={sidebarProfile} />
      </div>
      <div className="relative flex h-full min-h-0 w-full flex-1 overflow-hidden">
        <Suspense
          fallback={
            <div className="flex flex-1 items-center justify-center bg-background transition-colors">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#C2410C] border-t-transparent" />
            </div>
          }
        >
          {children}
        </Suspense>
      </div>
    </div>
  );
}
