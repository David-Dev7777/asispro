// components/shared/user-profile-badge.tsx
import { createClient } from "@/lib/supabase/server"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0]?.toUpperCase())
    .join("") || "?"
}

export async function UserProfileBadge() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, role")
    .eq("id", user.id)
    .single()

  let displayName = profile?.full_name?.trim() || ""
  let subtitle = profile?.role === "admin" ? "Administrador" : "Empleado"

  // Los empleados llenan first_name/last_name/position en `employees` durante
  // el onboarding, no `profiles.full_name`. Si no hay full_name en profiles,
  // resolvemos el nombre desde ahí para no mostrar el badge vacío.
  if (!displayName && profile?.role === "employee") {
    const { data: employee } = await supabase
      .from("employees")
      .select("first_name, last_name, position")
      .eq("user_id", user.id)
      .single()

    if (employee) {
      displayName = `${employee.first_name} ${employee.last_name}`.trim()
      if (employee.position) subtitle = employee.position
    }
  }

  if (!displayName) displayName = user.email || "Usuario"

  return (
    <div className="flex items-center gap-3 px-2 py-2">
      <Avatar className="w-9 h-9">
        <AvatarImage src={profile?.avatar_url ?? undefined} alt={displayName} />
        <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col min-w-0">
        <p className="text-sm font-medium truncate">{displayName}</p>
        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
      </div>
    </div>
  )
}