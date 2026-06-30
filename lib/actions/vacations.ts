"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidateEmployees } from "@/lib/actions/revalidate"
import { vacationSchema } from "@/lib/schemas"

export type VacationResult =
  | { success: true }
  | { success: false; error: string }

function businessDaysBetween(start: string, end: string): number {
  const startDate = new Date(start)
  const endDate = new Date(end)
  let count = 0
  const current = new Date(startDate)
  while (current <= endDate) {
    const day = current.getDay()
    if (day !== 0 && day !== 6) count++
    current.setDate(current.getDate() + 1)
  }
  return count
}

async function getVacationBalance(employeeId: string, companyId: string) {
  const supabase = await createClient()
  const year = new Date().getFullYear()

  const [{ data: settings }, { data: approved }] = await Promise.all([
    supabase.from("company_settings").select("vacation_days").eq("company_id", companyId).single(),
    supabase.from("vacation_requests").select("days_requested")
      .eq("employee_id", employeeId).eq("status", "approved")
      .gte("start_date", `${year}-01-01`).lte("start_date", `${year}-12-31`),
  ])

  const totalDays = settings?.vacation_days ?? 15
  const usedDays = approved?.reduce((acc, v) => acc + v.days_requested, 0) ?? 0
  return { total_days: totalDays, used_days: usedDays, remaining_days: totalDays - usedDays, year }
}

export async function requestVacation(formData: {
  start_date: string
  end_date: string
  notes?: string
}): Promise<VacationResult> {
  // Validación con Zod
  const parsed = vacationSchema.safeParse(formData)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "No autenticado" }

  const { data: employee } = await supabase
    .from("employees").select("id, company_id").eq("user_id", user.id).single()
  if (!employee) return { success: false, error: "Empleado no encontrado" }

  const days_requested = businessDaysBetween(parsed.data.start_date, parsed.data.end_date)
  if (days_requested === 0) return { success: false, error: "El rango seleccionado no incluye días hábiles" }

  const balance = await getVacationBalance(employee.id, employee.company_id)
  if (days_requested > balance.remaining_days) {
    return { success: false, error: `No tienes suficientes días disponibles. Tienes ${balance.remaining_days} día(s) y solicitas ${days_requested}.` }
  }

  const { data: overlapping } = await supabase
    .from("vacation_requests").select("id")
    .eq("employee_id", employee.id)
    .in("status", ["pending", "approved"])
    .lte("start_date", parsed.data.end_date)
    .gte("end_date", parsed.data.start_date)
  if (overlapping && overlapping.length > 0) {
    return { success: false, error: "Ya tienes vacaciones solicitadas en ese período" }
  }

  const { error } = await supabase.from("vacation_requests").insert({
    company_id: employee.company_id,
    employee_id: employee.id,
    start_date: parsed.data.start_date,
    end_date: parsed.data.end_date,
    days_requested,
    notes: parsed.data.notes?.trim(),
    status: "pending",
  })
  if (error) return { success: false, error: "Error al registrar la solicitud" }

  await revalidateEmployees()
  return { success: true }
}

export async function reviewVacationRequest(
  requestId: string,
  action: "approved" | "rejected",
  rejectionNote?: string
): Promise<VacationResult> {
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

  const { error } = await supabase.from("vacation_requests").update(updateData).eq("id", requestId)
  if (error) return { success: false, error: "Error al actualizar la solicitud" }

  await revalidateEmployees()
  return { success: true }
}

export async function getMyVacationRequests() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: employee } = await supabase.from("employees").select("id").eq("user_id", user.id).single()
  if (!employee) return []

  const { data } = await supabase
    .from("vacation_requests")
    .select("id, start_date, end_date, days_requested, status, notes, approved_at, rejection_note")
    .eq("employee_id", employee.id)
    .order("created_at", { ascending: false })
  return data ?? []
}

export async function getMyVacationBalance() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: employee } = await supabase.from("employees").select("id, company_id").eq("user_id", user.id).single()
  if (!employee) return null

  return getVacationBalance(employee.id, employee.company_id)
}

export async function getCompanyVacationRequests(status?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single()
  if (!profile) return []

  let query = supabase
    .from("vacation_requests")
    .select(`id, start_date, end_date, days_requested, status, notes, approved_at, rejection_note,
      employees ( id, first_name, last_name, position )`)
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })

  if (status) query = query.eq("status", status)
  const { data } = await query
  return data ?? []
}