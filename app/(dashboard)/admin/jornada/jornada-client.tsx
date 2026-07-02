"use client"

import { useState, useEffect } from "react"
import { getJornada } from "@/lib/actions/admin/jornada"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, Clock, UserX } from "lucide-react"

type Department = { id: string; name: string }
type Log = {
  id: string
  type: string
  timestamp: string
  distance_m: number | null
  is_valid: boolean
  notes: string | null
  employees: {
    id: string
    first_name: string
    last_name: string
    rut: string
    position: string | null
    departments: { id: string; name: string } | null
  } | null
}
type Settings = {
  work_start_time: string | null
  late_tolerance_minutes: number | null
  work_days: string[] | null
}

const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

function formatTime(ts: string) {
  const date = new Date(ts)
  const h = date.getHours().toString().padStart(2, "0")
  const m = date.getMinutes().toString().padStart(2, "0")
  return `${h}:${m}`
}

function calcHoras(logs: Log[], employeeId: string) {
  const empLogs = logs.filter(l => l.employees?.id === employeeId)
  const ins = empLogs.filter(l => l.type === "check_in")
  const outs = empLogs.filter(l => l.type === "check_out")
  let mins = 0
  ins.forEach((ci, i) => {
    if (outs[i]) mins += (new Date(outs[i].timestamp).getTime() - new Date(ci.timestamp).getTime()) / 60000
  })
  if (mins === 0) return null
  return `${Math.floor(mins / 60)}h ${Math.floor(mins % 60)}m`
}

function getAttendanceStatus(
  checkIn: Log | undefined,
  workStartTime: string | null,
  toleranceMinutes: number | null
): "puntual" | "atrasado" | "ausente" {
  if (!checkIn) return "ausente"
  if (!workStartTime) return "puntual"

  const checkInDate = new Date(checkIn.timestamp)
  const [startH, startM] = workStartTime.split(":").map(Number)
  const tolerance = toleranceMinutes ?? 15

  const expectedStart = new Date(checkInDate)
  expectedStart.setHours(startH, startM, 0, 0)

  const diffMins = (checkInDate.getTime() - expectedStart.getTime()) / 60000
  return diffMins > tolerance ? "atrasado" : "puntual"
}

function AttendanceBadge({ status }: { status: "puntual" | "atrasado" | "ausente" }) {
  if (status === "puntual") return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Puntual</Badge>
  if (status === "atrasado") return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Atrasado</Badge>
  return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Ausente</Badge>
}

interface Props {
  initialDepartments: Department[]
  initialLogs: Log[]
  today: string
  settings: Settings | null
}

export default function JornadaClient({ initialDepartments, initialLogs, today, settings }: Props) {
  const [date, setDate] = useState(today)
  const [logs, setLogs] = useState<Log[]>(initialLogs)
  const [filterDep, setFilterDep] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (date === today) return
    let mounted = true
    async function load() {
      setLoading(true)
      const data = await getJornada(date)
      if (mounted) { setLogs(data as Log[]); setLoading(false) }
    }
    load()
    return () => { mounted = false }
  }, [date])

  // Verificar si el día seleccionado es día laboral
  const selectedDow = new Date(date + "T12:00:00").getDay()
  const selectedDayKey = DAY_KEYS[selectedDow]
  const isWorkDay = !settings?.work_days || settings.work_days.includes(selectedDayKey)

  const employeeMap = new Map<string, Log["employees"]>()
  logs.forEach(l => { if (l.employees && !employeeMap.has(l.employees.id)) employeeMap.set(l.employees.id, l.employees) })
  const allEmployees = Array.from(employeeMap.values())

  // Filtrar por área
  const byDep = filterDep === "all"
    ? allEmployees
    : allEmployees.filter(e => e?.departments?.id === filterDep)

  // Calcular status de cada empleado
  type EmployeeWithStatus = {
    emp: NonNullable<Log["employees"]>
    checkIn: Log | undefined
    checkOut: Log | undefined
    horas: string | null
    status: "puntual" | "atrasado" | "ausente"
  }

  const employeesWithStatus: EmployeeWithStatus[] = byDep.map(emp => {
    if (!emp) return null
    const empLogs = logs.filter(l => l.employees?.id === emp.id)
    const checkIn = empLogs.find(l => l.type === "check_in")
    const checkOut = empLogs.filter(l => l.type === "check_out").at(-1)
    const horas = calcHoras(logs, emp.id)
    const status = getAttendanceStatus(checkIn, settings?.work_start_time ?? null, settings?.late_tolerance_minutes ?? null)
    return { emp, checkIn, checkOut, horas, status }
  }).filter(Boolean) as EmployeeWithStatus[]

  // Filtrar por status
  const filtered = filterStatus === "all"
    ? employeesWithStatus
    : employeesWithStatus.filter(e => e.status === filterStatus)

  const isToday = date === today
  const checkedInIds = new Set<string>()
  if (isToday) {
    const byEmp = new Map<string, Log[]>()
    logs.forEach(l => {
      if (!l.employees) return
      const arr = byEmp.get(l.employees.id) ?? []
      arr.push(l)
      byEmp.set(l.employees.id, arr)
    })
    byEmp.forEach((empLogs, empId) => {
      const last = empLogs[empLogs.length - 1]
      if (last?.type === "check_in") checkedInIds.add(empId)
    })
  }

  const puntuales = employeesWithStatus.filter(e => e.status === "puntual").length
  const atrasados = employeesWithStatus.filter(e => e.status === "atrasado").length
  const ausentes = employeesWithStatus.filter(e => e.status === "ausente").length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Jornada</h1>
        <p className="text-sm text-muted-foreground mt-1">Seguimiento de asistencia diaria</p>
      </div>


      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full sm:w-44" />
        <Select value={filterDep} onValueChange={setFilterDep}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Todas las áreas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las áreas</SelectItem>
            {initialDepartments.map(d => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="puntual">Puntuales</SelectItem>
            <SelectItem value="atrasado">Atrasados</SelectItem>
            <SelectItem value="ausente">Ausentes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* cards igual que antes */}
      </div>

      {/* Tabla — scroll horizontal en móvil */}
      <div className="border rounded-lg bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empleado</TableHead>
              <TableHead className="hidden sm:table-cell">Área</TableHead>
              <TableHead>Entrada</TableHead>
              <TableHead className="hidden sm:table-cell">Salida</TableHead>
              <TableHead className="hidden sm:table-cell">Horas</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(({ emp, checkIn, checkOut, horas, status }) => (
              <TableRow key={emp.id}>
                <TableCell>
                  <p className="font-medium">{emp.first_name} {emp.last_name}</p>
                  <p className="text-xs text-muted-foreground">{emp.rut}</p>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {emp.departments
                    ? <Badge variant="secondary">{emp.departments.name}</Badge>
                    : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>
                  {checkIn
                    ? <span className="font-medium">{formatTime(checkIn.timestamp)}</span>
                    : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {checkOut
                    ? <span className="font-medium">{formatTime(checkOut.timestamp)}</span>
                    : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {horas
                    ? <span className="font-medium">{horas}</span>
                    : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>
                  <AttendanceBadge status={status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {!isWorkDay && (
        <p className="text-sm text-muted-foreground bg-muted/50 rounded-md px-4 py-3">
          Este día no es un día laboral según la configuración de la empresa.
        </p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Presentes</CardTitle>
            <UserCheck className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{checkedInIds.size}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Puntuales</CardTitle>
            <Clock className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{puntuales}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Atrasados</CardTitle>
            <Clock className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-yellow-600">{atrasados}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ausentes</CardTitle>
            <UserX className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-red-600">{ausentes}</p></CardContent>
        </Card>
      </div>

      {/* Tabla */}
      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empleado</TableHead>
              <TableHead>Área</TableHead>
              <TableHead>Entrada</TableHead>
              <TableHead>Salida</TableHead>
              <TableHead>Horas</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-10">Cargando…</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-10">Sin registros para esta fecha</TableCell>
              </TableRow>
            ) : (
              filtered.map(({ emp, checkIn, checkOut, horas, status }) => (
                <TableRow key={emp.id}>
                  <TableCell>
                    <p className="font-medium">{emp.first_name} {emp.last_name}</p>
                    <p className="text-xs text-muted-foreground">{emp.rut}</p>
                  </TableCell>
                  <TableCell>
                    {emp.departments
                      ? <Badge variant="secondary">{emp.departments.name}</Badge>
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    {checkIn
                      ? <span className="font-medium">{formatTime(checkIn.timestamp)}</span>
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    {checkOut
                      ? <span className="font-medium">{formatTime(checkOut.timestamp)}</span>
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    {horas
                      ? <span className="font-medium">{horas}</span>
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <AttendanceBadge status={status} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}