import { getVacationRequests } from "@/lib/actions/admin/vacations"
import VacacionesClient from "./vacaciones-client"

type VacationRequest = {
  id: string
  start_date: string
  end_date: string
  days_requested: number
  status: string
  notes: string | null
  rejection_note: string | null
  approved_at: string | null
  rejected_at: string | null
  created_at: string
  employees: {
    id: string
    first_name: string
    last_name: string
    rut: string
    departments: { id: string; name: string } | null
  } | null
  approved_by_profile: { id: string; full_name: string | null } | null
  rejected_by_profile: { id: string; full_name: string | null } | null
}


export default async function VacacionesPage() {
  const requests = await getVacationRequests()
  return <VacacionesClient initialRequests={requests as VacationRequest[]} />
}