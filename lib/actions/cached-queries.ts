import { createClient } from "@/lib/supabase/server"


// ─── Helper para obtener perfil ────────────────────────────────────────────────
async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single()
  return profile ? { ...profile, userId: user.id } : null
}

// ─── Employees ────────────────────────────────────────────────────────────────
export async function getEmployees() {
  const profile = await getProfile()
  if (!profile) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from("employees")
    .select("*, departments(id, name)")
    .eq("company_id", profile.company_id)
    .order("last_name")
  return data ?? []
}

// ─── Departments ──────────────────────────────────────────────────────────────
export async function getDepartments() {
  const profile = await getProfile()
  if (!profile) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from("departments")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("name")
  return data ?? []
}

// ─── Overtime Requests ────────────────────────────────────────────────────────
export async function getOvertimeRequests() {
  const profile = await getProfile()
  if (!profile) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from("overtime_requests")
    .select(`*, employees ( id, first_name, last_name, rut, departments ( id, name ) )`)
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })
  return data ?? []
}

// ─── Vacation Requests ────────────────────────────────────────────────────────
export async function getVacationRequests() {
  const profile = await getProfile()
  if (!profile) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from("vacation_requests")
    .select(`*, employees ( id, first_name, last_name, rut, departments ( id, name ) )`)
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })
  return data ?? []
}

// ─── Today Attendance ─────────────────────────────────────────────────────────
export async function getTodayAttendance() {
  const profile = await getProfile()
  if (!profile) return []

  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)

  const { data: employee } = await supabase
    .from("employees")
    .select("id")
    .eq("user_id", profile.userId)
    .single()
  if (!employee) return []

  const { data } = await supabase
    .from("attendance_logs")
    .select("id, type, timestamp, distance_m")
    .eq("employee_id", employee.id)
    .gte("timestamp", `${today}T00:00:00`)
    .order("timestamp", { ascending: true })
  return data ?? []
}

// ─── Jornada (Admin) ──────────────────────────────────────────────────────────
export async function getJornada(date: string) {
  const profile = await getProfile()
  if (!profile) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from("attendance_logs")
    .select(`
      id, type, timestamp, distance_m, is_valid, notes,
      employees ( id, first_name, last_name, rut, position, departments ( id, name ) )
    `)
    .eq("company_id", profile.company_id)
    .gte("timestamp", `${date}T00:00:00.000Z`)
    .lte("timestamp", `${date}T23:59:59.999Z`)
    .order("timestamp", { ascending: true })
  return data ?? []
}