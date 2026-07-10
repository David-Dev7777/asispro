import { createClient } from "@/lib/supabase/server"
import { getDepartments } from "@/lib/actions/admin/departments"
import { getJornada } from "@/lib/actions/admin/jornada"
import { getWorkSchedules } from "@/lib/actions/admin/work-schedules"
import JornadaClient from "./jornada-client"

type Department = { id: string; name: string }
type Log = {
  id: string
  type: string
  timestamp: string
  distance_m: number | null
  is_valid: boolean
  notes: string | null
  employees: {
    id: string
    first_name: string
    last_name: string
    rut: string
    position: string | null
    departments: { id: string; name: string } | null
  } | null
}
type Schedule = {
  work_start_time: string
  work_end_time: string
  work_days: string[]
  late_tolerance_minutes: number
}

const FALLBACK_SCHEDULE: Schedule = {
  work_start_time: "09:00:00",
  work_end_time: "18:00:00",
  work_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
  late_tolerance_minutes: 15,
}

export default async function JornadaPage() {
  const today = new Date().toISOString().slice(0, 10)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [departments, initialLogs, schedules] = await Promise.all([
    getDepartments(),
    getJornada(today),
    getWorkSchedules(),
  ])

  let scheduleByDepartment: Record<string, Schedule> = {}

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single()

    if (profile) {
      const { data: deptSchedules } = await supabase
        .from("departments")
        .select("id, schedule_id")
        .eq("company_id", profile.company_id)

      const schedulesById = new Map(schedules.map(s => [s.id, s]))

      scheduleByDepartment = Object.fromEntries(
        (deptSchedules ?? [])
          .filter(d => d.schedule_id && schedulesById.has(d.schedule_id))
          .map(d => [d.id, schedulesById.get(d.schedule_id!)!])
      )
    }
  }

  const defaultSchedule = schedules.find(s => s.is_default) ?? FALLBACK_SCHEDULE

  return (
    <JornadaClient
      initialDepartments={departments as Department[]}
      initialLogs={initialLogs as Log[]}
      today={today}
      defaultSchedule={defaultSchedule}
      scheduleByDepartment={scheduleByDepartment}
    />
  )
}