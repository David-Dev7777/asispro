"use server"

import { createClient } from "@/lib/supabase/server"

export async function getJornada(date: string) {
  const supabase = await createClient()

  const start = `${date}T00:00:00.000Z`
  const end   = `${date}T23:59:59.999Z`

  const { data, error } = await supabase
    .from("attendance_logs")
    .select(`
      id, type, timestamp, distance_m, is_valid, notes,
      employees (
        id, first_name, last_name, rut, position,
        departments ( id, name )
      )
    `)
    .gte("timestamp", start)
    .lte("timestamp", end)
    .order("timestamp", { ascending: true })

  if (error) throw error
  return data
}