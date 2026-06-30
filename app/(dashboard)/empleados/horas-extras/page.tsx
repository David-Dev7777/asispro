import { getMyOvertimeRequests } from "@/lib/actions/Overtime"
import HorasExtrasEmpleadoClient from "./horas-extras-client"

export default async function HorasExtrasPage() {
  const requests = await getMyOvertimeRequests()
  return <HorasExtrasEmpleadoClient initialRequests={requests as any[]} />
}