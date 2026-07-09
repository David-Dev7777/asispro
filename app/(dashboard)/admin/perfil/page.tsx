// app/(dashboard)/admin/perfil/page.tsx
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminProfileForm } from "@/components/admin/admin-profile-form"

export default async function AdminPerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mi perfil</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Administra tu información personal, correo y contraseña.
        </p>
      </div>

      <AdminProfileForm
        initialFullName={profile?.full_name ?? ""}
        initialAvatarUrl={profile?.avatar_url ?? null}
        email={user.email ?? ""}
      />
    </div>
  )
}