"use server"

import { createClient } from "@/lib/supabase/server"
import { diasDisponibles } from "@/lib/actions/vacations-helpers"

export async function getEmployeeDashboardData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: employee } = await supabase
    .from("employees")
    .select("id, company_id, vacation_days, hire_date")
    .eq("user_id", user.id)
    .single()

  if (!employee) return null

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`
  const monthEnd = new Date(year, month, 0).toISOString().slice(0, 10)

  // Horas extras aprobadas del mes
  const { data: overtime } = await supabase
    .from("overtime_requests")
    .select("hours")
    .eq("employee_id", employee.id)
    .eq("status", "approved")
    .gte("date", monthStart)
    .lte("date", monthEnd)

  const totalOvertimeHours = overtime?.reduce((acc, r) => acc + Number(r.hours), 0) ?? 0

  // Balance de vacaciones — misma fuente que el panel admin
  const { data: approvedVacations } = await supabase
    .from("vacation_requests")
    .select("days_requested")
    .eq("employee_id", employee.id)
    .eq("status", "approved")
    .gte("start_date", `${year}-01-01`)
    .lte("start_date", `${year}-12-31`)

  const totalDays = diasDisponibles(employee.vacation_days, employee.hire_date)
  const usedDays = approvedVacations?.reduce((acc, v) => acc + v.days_requested, 0) ?? 0
  const vacationBalance = {
    total_days: totalDays,
    used_days: usedDays,
    remaining_days: totalDays - usedDays,
  }

  // Registros de asistencia del mes actual
  const { data: attendance } = await supabase
    .from("attendance_logs")
    .select("id, type, timestamp")
    .eq("employee_id", employee.id)
    .gte("timestamp", `${monthStart}T00:00:00`)
    .lte("timestamp", `${monthEnd}T23:59:59`)
    .order("timestamp", { ascending: true })

  // Vacaciones aprobadas del mes
  const { data: vacations } = await supabase
    .from("vacation_requests")
    .select("start_date, end_date, status")
    .eq("employee_id", employee.id)
    .eq("status", "approved")
    .lte("start_date", monthEnd)
    .gte("end_date", monthStart)

  return {
    totalOvertimeHours,
    vacationBalance,
    attendance: attendance ?? [],
    vacations: vacations ?? [],
    year,
    month,
  }
}