import { getDepartments } from "@/lib/actions/admin/departments"
import { getJornada } from "@/lib/actions/admin/jornada"
import { getCompanySettings } from "@/lib/actions/admin/company-settings"
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
type Settings = {
  work_start_time: string | null
  late_tolerance_minutes: number | null
  work_days: string[] | null
}

export default async function JornadaPage() {
  const today = new Date().toISOString().slice(0, 10)
  const [departments, initialLogs, settings] = await Promise.all([
    getDepartments(),
    getJornada(today),
    getCompanySettings(),
  ])

  return (
    <JornadaClient
      initialDepartments={departments as Department[]}
      initialLogs={initialLogs as Log[]}
      today={today}
      settings={settings as Settings | null}
    />
  )
}