"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Palmtree, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

type AttendanceLog = { id: string; type: string; timestamp: string }
type VacationRequest = { start_date: string; end_date: string; status: string }
type VacationBalance = { total_days: number; used_days: number; remaining_days: number }

interface Props {
  data: {
    totalOvertimeHours: number
    vacationBalance: VacationBalance | null
    attendance: AttendanceLog[]
    vacations: VacationRequest[]
    year: number
    month: number
  }
}

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]
const DAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"]

function getDayStatus(
  day: number,
  month: number,
  year: number,
  attendance: AttendanceLog[],
  vacations: VacationRequest[]
): "worked" | "absent" | "vacation" | "weekend" | "future" | null {
  const date = new Date(year, month - 1, day)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dow = date.getDay()
  if (dow === 0 || dow === 6) return "weekend"

  // Verificar vacaciones ANTES de verificar si es futuro
  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  const onVacation = vacations.some(v => dateStr >= v.start_date && dateStr <= v.end_date)
  if (onVacation) return "vacation"

  if (date > today) return "future"

  const hasAttendance = attendance.some(log => {
    const logDate = new Date(log.timestamp)
    return (
      logDate.getDate() === day &&
      logDate.getMonth() === month - 1 &&
      logDate.getFullYear() === year &&
      log.type === "check_in"
    )
  })

  if (hasAttendance) return "worked"
  return "absent"
}

export default function InicioClient({ data }: Props) {
  const { totalOvertimeHours, vacationBalance, attendance, vacations, year, month } = data
  const today = new Date()
  const [calYear, setCalYear] = useState(year)
  const [calMonth, setCalMonth] = useState(month)

  const firstDay = new Date(calYear, calMonth - 1, 1).getDay()
  // Convertir domingo=0 a lunes=0
  const startOffset = firstDay === 0 ? 6 : firstDay - 1
  const daysInMonth = new Date(calYear, calMonth, 0).getDate()

  const prevMonth = () => {
    if (calMonth === 1) { setCalMonth(12); setCalYear(y => y - 1) }
    else setCalMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (calMonth === 12) { setCalMonth(1); setCalYear(y => y + 1) }
    else setCalMonth(m => m + 1)
  }

  const statusStyles: Record<string, string> = {
    worked: "bg-green-100 text-green-700 font-medium",
    absent: "bg-red-100 text-red-600 font-medium",
    vacation: "bg-blue-100 text-blue-700 font-medium",
    weekend: "text-muted-foreground",
    future: "text-muted-foreground/50",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Inicio</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {today.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Horas extras este mes</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalOvertimeHours}h</p>
            <p className="text-xs text-muted-foreground mt-1">Horas aprobadas en {MONTHS[month - 1]}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Días de vacaciones</CardTitle>
            <Palmtree className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {vacationBalance ? (
              <>
                <p className={`text-3xl font-bold ${vacationBalance.remaining_days <= 3 ? "text-red-600" : "text-green-600"}`}>
                  {vacationBalance.remaining_days}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {vacationBalance.used_days} usados de {vacationBalance.total_days} totales
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Sin información</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Calendario */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Calendario de asistencia</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={prevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium w-32 text-center">
                {MONTHS[calMonth - 1]} {calYear}
              </span>
              <Button variant="ghost" size="icon" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Días de semana */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
            ))}
          </div>

          {/* Días */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const status = getDayStatus(day, calMonth, calYear, attendance, vacations)
              const isToday = day === today.getDate() && calMonth === today.getMonth() + 1 && calYear === today.getFullYear()
              return (
                <div
                  key={day}
                  className={`
                    aspect-square flex items-center justify-center rounded-md text-sm
                    ${statusStyles[status ?? "future"] ?? ""}
                    ${isToday ? "ring-2 ring-primary ring-offset-1" : ""}
                  `}
                >
                  {day}
                </div>
              )
            })}
          </div>

          {/* Leyenda */}
          <div className="flex gap-4 mt-4 flex-wrap">
            {[
              { label: "Trabajado", className: "bg-green-100 text-green-700" },
              { label: "Falta", className: "bg-red-100 text-red-600" },
              { label: "Vacaciones", className: "bg-blue-100 text-blue-700" },
            ].map(({ label, className }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-sm ${className}`} />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}