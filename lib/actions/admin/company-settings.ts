"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getCompanySettings() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single()

  if (!profile || !["admin", "superadmin"].includes(profile.role)) return null

  const { data } = await supabase
    .from("company_settings")
    .select("*")
    .eq("company_id", profile.company_id)
    .single()

  return data ?? null
}

export async function updateCompanySettings(form: {
  geo_lat: number | null
  geo_lng: number | null
  geo_radius_m: number
  vacation_days: number
  work_hours_day: number
  work_start_time: string
  work_end_time: string
  work_days: string[]
  late_tolerance_minutes: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "No autenticado" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single()

  if (!profile || !["admin", "superadmin"].includes(profile.role)) {
    return { success: false, error: "No autorizado" }
  }

  const { error } = await supabase
    .from("company_settings")
    .update({ ...form, updated_at: new Date().toISOString() })
    .eq("company_id", profile.company_id)

  if (error) return { success: false, error: error.message }

  revalidatePath("/admin/configuracion")
  return { success: true }
}