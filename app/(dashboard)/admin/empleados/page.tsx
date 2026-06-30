import { getEmployees, getDepartments } from "@/lib/actions/cached-queries"
import EmpleadosClient from "./employees-client"

type Employee = {
  id: string
  first_name: string
  last_name: string
  rut: string
  address: string
  position: string | null
  department_id: string | null
  hour_rate: number | null
  departments: { id: string; name: string } | null
}

type Department = { id: string; name: string }

export default async function EmpleadosPage() {
  const [employees, departments] = await Promise.all([
    getEmployees(),
    getDepartments(),
  ])

  return (
    <EmpleadosClient
      initialEmployees={employees as Employee[]}
      initialDepartments={departments as Department[]}
    />
  )
}