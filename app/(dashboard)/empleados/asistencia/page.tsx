import { getTodayAttendance } from "@/lib/actions/attendance"
import AsistenciaClient from "./asistencia-client"

export default async function AsistenciaPage() {
  const logs = await getTodayAttendance()
  return <AsistenciaClient initialLogs={logs as any[]} />
}