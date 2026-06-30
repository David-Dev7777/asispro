"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidateEmployees } from "@/lib/actions/revalidate"
import { overtimeSchema } from "@/lib/schemas"

export type OvertimeResult =
  | { success: true }
  | { success: false; error: string }

export async function requestOvertime(formData: {
  date: string
  hours: number
  reason: string
}): Promise<OvertimeResult> {
  // Validación con Zod
  const parsed = overtimeSchema.safeParse(formData)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "No autenticado" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single()
  if (!profile) return { success: false, error: "Perfil no encontrado" }

  const { data: employee } = await supabase
    .from("employees")
    .select("id")
    .eq("user_id", user.id)
    .single()
  if (!employee) return { success: false, error: "Empleado no encontrado" }

  const { error } = await supabase.from("overtime_requests").insert({
    company_id: profile.company_id,
    employee_id: employee.id,
    date: parsed.data.date,
    hours: parsed.data.hours,
    origin: "manual",
    reason: parsed.data.reason.trim(),
    status: "pending",
  })

  if (error) return { success: false, error: "Error al registrar la solicitud" }

  await revalidateEmployees()
  return { success: true }
}

export async function reviewOvertimeRequest(
  requestId: string,
  action: "approved" | "rejected",
  rejectionNote?: string
): Promise<OvertimeResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "No autenticado" }

  if (!requestId) return { success: false, error: "ID de solicitud inválido" }
  if (action === "rejected" && !rejectionNote?.trim()) {
    return { success: false, error: "El motivo de rechazo es obligatorio" }
  }

  const updateData =
    action === "approved"
      ? { status: "approved", approved_by: user.id, approved_at: new Date().toISOString() }
      : { status: "rejected", rejection_note: rejectionNote ?? "" }

  const { error } = await supabase
    .from("overtime_requests")
    .update(updateData)
    .eq("id", requestId)

  if (error) return { success: false, error: "Error al actualizar la solicitud" }

  await revalidateEmployees()
  return { success: true }
}

export async function getMyOvertimeRequests() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: employee } = await supabase
    .from("employees")
    .select("id")
    .eq("user_id", user.id)
    .single()
  if (!employee) return []

  const { data } = await supabase
    .from("overtime_requests")
    .select("id, date, hours, origin, reason, status, approved_at, rejection_note")
    .eq("employee_id", employee.id)
    .order("date", { ascending: false })

  return data ?? []
}

export async function getCompanyOvertimeRequests(status?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single()
  if (!profile) return []

  let query = supabase
    .from("overtime_requests")
    .select(`
      id, date, hours, origin, reason, status, approved_at, rejection_note,
      employees ( id, first_name, last_name, position )
    `)
    .eq("company_id", profile.company_id)
    .order("date", { ascending: false })

  if (status) query = query.eq("status", status)

  const { data } = await query
  return data ?? []
}