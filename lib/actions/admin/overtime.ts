"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidateOvertime } from "@/lib/actions/revalidate"


export async function getOvertimeRequests() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single()

  if (!profile) return []

  const { data } = await supabase
    .from("overtime_requests")
    .select(`
      *,
      employees ( id, first_name, last_name, rut,
        departments ( id, name )
      )
    `)
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })

  return data ?? []
}

export async function approveOvertime(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "No autenticado" }

  const { data: admin } = await supabase
    .from("employees")
    .select("id")
    .eq("user_id", user.id)
    .single()

  const { error } = await supabase
    .from("overtime_requests")
    .update({
      status: "approved",
      approved_by: admin?.id ?? null,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) return { success: false, error: error.message }
  await revalidateOvertime()
  return { success: true }
}

export async function rejectOvertime(id: string, rejection_note: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("overtime_requests")
    .update({
      status: "rejected",
      rejection_note,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) return { success: false, error: error.message }
  await revalidateOvertime()
  return { success: true }
}