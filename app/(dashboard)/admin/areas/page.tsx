import { getDepartments } from "@/lib/actions/admin/departments"
import AreasClient from "./areas-client"

type Department = { id: string; name: string; company_id: string }

export default async function AreasPage() {
  const departments = await getDepartments()

  return <AreasClient initialDepartments={departments as Department[]} />
}