import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { EmployeeSidebar } from "@/components/employee/employee-sidebar"
import { UserProfileBadge } from "@/components/shared/user-profile-badge"

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: employee } = await supabase
    .from("employees")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (!employee) redirect("/onboarding")

  return (
    <div className="flex h-screen bg-muted/30">
      <EmployeeSidebar userBadge={<UserProfileBadge />} />

      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-4 pt-16 md:pt-8 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}