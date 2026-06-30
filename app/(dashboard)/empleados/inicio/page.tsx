import { getEmployeeDashboardData } from "@/lib/actions/employee/dashboard"
import InicioClient from "./inicio-client"

export default async function InicioPage() {
  const data = await getEmployeeDashboardData()
  if (!data) return <p className="text-muted-foreground">No se pudo cargar la información.</p>
  return <InicioClient data={data} />
}