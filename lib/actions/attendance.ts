"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidateEmployees } from "@/lib/actions/revalidate"


// Fórmula Haversine: distancia en metros entre dos coordenadas
function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000 // radio Tierra en metros
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export type AttendanceResult =
  | { success: true; type: "check_in" | "check_out"; timestamp: string; distance_m: number }
  | { success: false; error: string }

export async function registerAttendance(
  lat: number,
  lng: number
): Promise<AttendanceResult> {
  const supabase = await createClient()

  // 1. Usuario autenticado
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: "No autenticado" }


  // 2. Obtener employee + company
  const { data: employee, error: empError } = await supabase
    .from("employees")
    .select("id, company_id")
    .eq("user_id", user.id)
    .single()
   

  if (empError || !employee) return { success: false, error: "Empleado no encontrado" }

  // 3. Configuración de la empresa (radio + coordenadas sede)
  const { data: settings, error: settingsError } = await supabase
    .from("company_settings")
    .select("geo_lat, geo_lng, geo_radius_m")
    .eq("company_id", employee.company_id)
    .single()

  if (settingsError || !settings) {
    return { success: false, error: "La empresa no tiene configuración de ubicación" }
  }

  if (!settings.geo_lat || !settings.geo_lng) {
    return { success: false, error: "La empresa no tiene coordenadas configuradas" }
  }

  // 4. Validar distancia
  const distance_m = Math.round(
    haversineDistance(lat, lng, settings.geo_lat, settings.geo_lng)
  )
  const is_valid = distance_m <= settings.geo_radius_m

  if (!is_valid) {
    return {
      success: false,
      error: `Estás a ${distance_m}m de la sede. El radio permitido es ${settings.geo_radius_m}m.`,
    }
  }

  // 5. Determinar si es check_in o check_out
  //    Si el último registro del día es check_in → registrar check_out, y viceversa
const today = new Date().toISOString().slice(0, 10)

const { data: todayLogs } = await supabase
  .from("attendance_logs")
  .select("type")
  .eq("employee_id", employee.id)
  .gte("timestamp", `${today}T00:00:00`)
  .lte("timestamp", `${today}T23:59:59`)
  .order("timestamp", { ascending: true })

// Validar que no haya completado ya su jornada (check_in + check_out)
const hasCheckIn  = todayLogs?.some(l => l.type === "check_in")
const hasCheckOut = todayLogs?.some(l => l.type === "check_out")

if (hasCheckIn && hasCheckOut) {
  return { success: false, error: "Ya completaste tu jornada de hoy" }
}

const lastLog = todayLogs?.[todayLogs.length - 1]
const type: "check_in" | "check_out" =
  !lastLog || lastLog.type === "check_out" ? "check_in" : "check_out"

  // 6. Insertar registro
  const { data: log, error: insertError } = await supabase
    .from("attendance_logs")
    .insert({
      company_id: employee.company_id,
      employee_id: employee.id,
      type,
      lat,
      lng,
      distance_m,
      is_valid,
    })
    .select("timestamp")
    .single()

  if (insertError) return { success: false, error: "Error al registrar la marcación" }

  await revalidateEmployees();

  return { success: true, type, timestamp: log.timestamp, distance_m }
}

export async function getTodayAttendance() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: employee } = await supabase
    .from("employees")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (!employee) return null

  const today = new Date().toISOString().slice(0, 10)

  const { data } = await supabase
    .from("attendance_logs")
    .select("id, type, timestamp, distance_m")
    .eq("employee_id", employee.id)
    .gte("timestamp", `${today}T00:00:00`)
    .order("timestamp", { ascending: true })

  return data ?? []
}

export async function getCompanyAttendance(date?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: employee } = await supabase
    .from("employees")
    .select("company_id")
    .eq("user_id", user.id)
    .single()

  if (!employee) return []

  const day = date ?? new Date().toISOString().slice(0, 10)

  const { data } = await supabase
    .from("attendance_logs")
    .select(`
      id, type, timestamp, distance_m, is_valid,
      employees ( id, full_name, position )
    `)
    .eq("company_id", employee.company_id)
    .gte("timestamp", `${day}T00:00:00`)
    .lte("timestamp", `${day}T23:59:59`)
    .order("timestamp", { ascending: false })

  return data ?? []
}