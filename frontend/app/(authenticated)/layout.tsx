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

  const { data: councils } = await supabase
    .from("councils")
    .select("id, title, status, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const sidebarCouncils = ((councils as SidebarCouncilRow[] | null) ?? []).map(
    (council) => ({
      id: council.id,
      title: council.title,
    }),
  );

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground transition-colors md:flex-row">
      <div className="hidden md:block">
        <Sidebar councils={sidebarCouncils} />
      </div>
      <div className="relative flex h-full w-full flex-1 overflow-hidden">
        <Suspense
          fallback={
            <div className="flex flex-1 items-center justify-center bg-background transition-colors">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#002D72] border-t-transparent" />
            </div>
          }
        >
          {children}
        </Suspense>
      </div>
    </div>
  );
}
