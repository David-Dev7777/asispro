"use server"

import { createClient } from "@/lib/supabase/server"

export async function getJornada(date: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single()

  if (!profile) return []

  const start = `${date}T00:00:00.000Z`
  const end   = `${date}T23:59:59.999Z`

  // "employees!inner" fuerza el join para que el filtro de company_id sobre
  // la relación embebida realmente restrinja las filas devueltas — sin el
  // "!inner", PostgREST puede tratarlo como left join y no filtrar bien.
  const { data, error } = await supabase
    .from("attendance_logs")
    .select(`
      id, type, timestamp, distance_m, is_valid, notes,
      employees!inner (
        id, first_name, last_name, rut, position, company_id,
        departments ( id, name )
      )
    `)
    .eq("employees.company_id", profile.company_id)
    .gte("timestamp", start)
    .lte("timestamp", end)
    .order("timestamp", { ascending: true })

  if (error) throw error
  return data
}