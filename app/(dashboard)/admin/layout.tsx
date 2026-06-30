import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single()

  return (
    <div className="flex h-screen bg-muted/30">
      <AdminSidebar fullName={profile?.full_name ?? null} />

      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-4 pt-16 md:pt-8 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}