import { getMyVacationRequests, getMyVacationBalance } from "@/lib/actions/vacations"
import VacacionesEmpleadoClient from "./vacaciones-client"

export default async function VacacionesPage() {
  const [requests, balance] = await Promise.all([
    getMyVacationRequests(),
    getMyVacationBalance(),
  ])
  return <VacacionesEmpleadoClient initialRequests={requests as any[]} initialBalance={balance as any} />
}