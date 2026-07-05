import { getEmployees, getDepartments, getVacationsUsedThisYear } from "@/lib/actions/cached-queries"
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
  const [employees, departments, overtime, vacationsUsed] = await Promise.all([
    getEmployees(),
    getDepartments(),
    getOvertimeAprobado(),
    getVacationsUsedThisYear(),
  ])

  const usedDaysMap: Record<string, number> = {}
  for (const v of vacationsUsed) {
    usedDaysMap[v.employee_id] = (usedDaysMap[v.employee_id] ?? 0) + v.days_requested
  }

  const employeesWithOvertime = employees.map(emp => ({
    ...emp,
    overtime_requests: overtime.filter(o => o.employee_id === emp.id),
  }))

  return (
    <EmpleadosClient
      initialEmployees={employeesWithOvertime as Employee[]}
      initialDepartments={departments as Department[]}
      usedDaysMap={usedDaysMap}
    />
  )
}