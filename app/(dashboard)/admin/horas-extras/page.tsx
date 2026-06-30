import { getOvertimeRequests } from "@/lib/actions/admin/overtime"
import HorasExtrasClient from "./horas-extras-client"

type OvertimeRequest = {
  id: string
  date: string
  hours: number
  origin: string
  reason: string | null
  status: string
  rejection_note: string | null
  approved_at: string | null
  created_at: string
  employees: {
    id: string
    first_name: string
    last_name: string
    rut: string
    departments: { id: string; name: string } | null
  } | null
}

export default async function HorasExtrasPage() {
  const requests = await getOvertimeRequests()
  return <HorasExtrasClient initialRequests={requests as OvertimeRequest[]} />
}