// app/(dashboard)/empleados/perfil/page.tsx
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { EmployeeProfileForm } from "@/components/employee/employee-profile-form"

export default async function EmpleadoPerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: employee } = await supabase
    .from("employees")
    .select("first_name, last_name, rut, address")
    .eq("user_id", user.id)
    .single()

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .single()

  if (!employee) redirect("/onboarding")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mi perfil</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Administra tu información personal, correo y contraseña.
        </p>
      </div>

      <EmployeeProfileForm
        initialFirstName={employee.first_name}
        initialLastName={employee.last_name}
        initialRut={employee.rut}
        initialAddress={employee.address}
        initialAvatarUrl={profile?.avatar_url ?? null}
        email={user.email ?? ""}
      />
    </div>
  )
}