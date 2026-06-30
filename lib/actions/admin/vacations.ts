"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidateVacations } from "@/lib/actions/revalidate"

export async function getVacationRequests() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("vacation_requests")
    .select(`
      *,
      employees ( id, first_name, last_name, rut,
        departments ( id, name )
      )
    `)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data
}

export async function approveVacation(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "No autenticado" }

  const { data: admin } = await supabase
    .from("employees")
    .select("id")
    .eq("user_id", user.id)
    .single()

  const { error } = await supabase
    .from("vacation_requests")
    .update({
      status: "approved",
      approved_by: admin?.id ?? null,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) return { success: false, error: error.message }
  await revalidateVacations()
  return { success: true }
}

export async function rejectVacation(id: string, rejection_note: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("vacation_requests")
    .update({
      status: "rejected",
      rejection_note,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) return { success: false, error: error.message }
  await revalidateVacations()
  return { success: true }
}