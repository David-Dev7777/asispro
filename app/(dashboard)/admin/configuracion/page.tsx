import { getCompanySettings } from "@/lib/actions/admin/company-settings"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import ConfiguracionClient from "./configuracion-client"

export default async function ConfiguracionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  // Solo admin y superadmin
  if (!profile || !["admin", "superadmin"].includes(profile.role)) {
    redirect("/admin")
  }

  const settings = await getCompanySettings()
  if (!settings) return <p className="text-muted-foreground">No se pudo cargar la configuración.</p>

  return <ConfiguracionClient initialSettings={settings} />
}