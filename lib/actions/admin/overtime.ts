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
      ),
      approved_by_profile:profiles!overtime_requests_approved_by_fkey ( id, full_name ),
      rejected_by_profile:profiles!overtime_requests_rejected_by_fkey ( id, full_name )
    `)
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })

  return data ?? []
}

export async function approveOvertime(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "No autenticado" }

  // approved_by referencia profiles(id), que es el mismo id que auth.users.id
  // — no hay que buscar nada en employees, quien aprueba es siempre un admin.
  const { error } = await supabase
    .from("overtime_requests")
    .update({
      status: "approved",
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      rejected_by: null,
      rejected_at: null,
      rejection_note: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) return { success: false, error: error.message }
  await revalidateOvertime()
  return { success: true }
}

export async function rejectOvertime(id: string, rejection_note: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "No autenticado" }

  const { error } = await supabase
    .from("overtime_requests")
    .update({
      status: "rejected",
      rejection_note,
      rejected_by: user.id,
      rejected_at: new Date().toISOString(),
      approved_by: null,
      approved_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) return { success: false, error: error.message }
  await revalidateOvertime()
  return { success: true }
}