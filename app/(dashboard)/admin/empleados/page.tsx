import { getEmployees, getDepartments } from "@/lib/actions/cached-queries"
import { getOvertimeAprobado } from "@/lib/actions/admin/employees"
import EmpleadosClient from "./employees-client"

type Department = { id: string; name: string }
type Employee = {
  id: string
  first_name: string
  last_name: string
  rut: string
  address: string
  position: string | null
  department_id: string | null
  hour_rate: number | null
  hire_date: string | null
  vacation_days: number | null
  departments: { id: string; name: string } | null
  overtime_requests: { hours: number; status: string }[]
}

export default async function EmpleadosPage() {
  const [employees, departments, overtime] = await Promise.all([
    getEmployees(),
    getDepartments(),
    getOvertimeAprobado(),
  ])

  const employeesWithOvertime = employees.map(emp => ({
    ...emp,
    overtime_requests: overtime.filter(o => o.employee_id === emp.id),
  }))

  return (
    <EmpleadosClient
      initialEmployees={employeesWithOvertime as Employee[]}
      initialDepartments={departments as Department[]}
    />
  )
}