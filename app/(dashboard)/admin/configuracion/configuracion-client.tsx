"use client"

import { useState, useTransition } from "react"
import { updateCompanySettings } from "@/lib/actions/admin/company-settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { MapPin, Clock, Palmtree, Ruler, CalendarDays } from "lucide-react"

type Settings = {
  id: string
  company_id: string
  geo_lat: number | null
  geo_lng: number | null
  geo_radius_m: number
  vacation_days: number
  work_hours_day: number
  work_start_time: string | null
  work_end_time: string | null
  work_days: string[] | null
  late_tolerance_minutes: number | null
}

const ALL_DAYS = [
  { key: "monday",    label: "Lunes" },
  { key: "tuesday",   label: "Martes" },
  { key: "wednesday", label: "Miércoles" },
  { key: "thursday",  label: "Jueves" },
  { key: "friday",    label: "Viernes" },
  { key: "saturday",  label: "Sábado" },
  { key: "sunday",    label: "Domingo" },
]

interface Props {
  initialSettings: Settings
}

export default function ConfiguracionClient({ initialSettings }: Props) {
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    geo_lat:                initialSettings.geo_lat?.toString() ?? "",
    geo_lng:                initialSettings.geo_lng?.toString() ?? "",
    geo_radius_m:           initialSettings.geo_radius_m.toString(),
    vacation_days:          initialSettings.vacation_days.toString(),
    work_hours_day:         initialSettings.work_hours_day.toString(),
    work_start_time:        initialSettings.work_start_time ?? "09:00",
    work_end_time:          initialSettings.work_end_time ?? "18:00",
    work_days:              initialSettings.work_days ?? ["monday","tuesday","wednesday","thursday","friday"],
    late_tolerance_minutes: initialSettings.late_tolerance_minutes?.toString() ?? "15",
  })

  const f = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }))
    setSuccess(false)
    setError(null)
  }

  const toggleDay = (day: string) => {
    setForm(prev => ({
      ...prev,
      work_days: prev.work_days.includes(day)
        ? prev.work_days.filter(d => d !== day)
        : [...prev.work_days, day],
    }))
    setSuccess(false)
    setError(null)
  }

  const handleSave = () => {
    setError(null)
    setSuccess(false)
    if (form.work_days.length === 0) {
      setError("Debes seleccionar al menos un día de trabajo")
      return
    }
    startTransition(async () => {
      const res = await updateCompanySettings({
        geo_lat:                form.geo_lat ? parseFloat(form.geo_lat) : null,
        geo_lng:                form.geo_lng ? parseFloat(form.geo_lng) : null,
        geo_radius_m:           parseInt(form.geo_radius_m),
        vacation_days:          parseInt(form.vacation_days),
        work_hours_day:         parseInt(form.work_hours_day),
        work_start_time:        form.work_start_time,
        work_end_time:          form.work_end_time,
        work_days:              form.work_days,
        late_tolerance_minutes: parseInt(form.late_tolerance_minutes),
      })
      if (res.success) {
        setSuccess(true)
      } else {
        setError(res.error ?? "Error desconocido")
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Configuración</h1>
        <p className="text-sm text-muted-foreground mt-1">Ajustes generales de la empresa</p>
      </div>

      {/* Geolocalización */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="w-4 h-4" />
            Ubicación de la sede
          </CardTitle>
          <CardDescription>
            Define las coordenadas GPS y el radio permitido para el registro de asistencia
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Latitud</Label>
              <Input type="number" step="any" placeholder="-33.4569"
                value={form.geo_lat} onChange={f("geo_lat")} />
            </div>
            <div className="space-y-1">
              <Label>Longitud</Label>
              <Input type="number" step="any" placeholder="-70.6483"
                value={form.geo_lng} onChange={f("geo_lng")} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="flex items-center gap-1">
              <Ruler className="w-3.5 h-3.5" />
              Radio permitido (metros)
            </Label>
            <Input type="number" min="50" max="5000" placeholder="200"
              value={form.geo_radius_m} onChange={f("geo_radius_m")} />
            <p className="text-xs text-muted-foreground">
              Los empleados deben estar dentro de este radio para registrar asistencia
            </p>
          </div>
          <div className="bg-muted/50 rounded-md p-3 text-xs text-muted-foreground">
            💡 Puedes obtener las coordenadas en{" "}
            <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer"
              className="underline text-primary">Google Maps</a>{" "}
            haciendo clic derecho sobre la ubicación.
          </div>
        </CardContent>
      </Card>

      {/* Jornada laboral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="w-4 h-4" />
            Jornada laboral
          </CardTitle>
          <CardDescription>
            Configura los horarios y días de trabajo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Hora de entrada</Label>
              <Input type="time" value={form.work_start_time} onChange={f("work_start_time")} />
            </div>
            <div className="space-y-1">
              <Label>Hora de salida</Label>
              <Input type="time" value={form.work_end_time} onChange={f("work_end_time")} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Tolerancia de atraso (minutos)</Label>
            <Input type="number" min="0" max="60" placeholder="15"
              value={form.late_tolerance_minutes} onChange={f("late_tolerance_minutes")} />
            <p className="text-xs text-muted-foreground">
              Minutos de gracia antes de marcar como atrasado
            </p>
          </div>

          <div className="space-y-2">
            <Label>Días de trabajo</Label>
            <div className="flex flex-wrap gap-3">
              {ALL_DAYS.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox
                    id={key}
                    checked={form.work_days.includes(key)}
                    onCheckedChange={() => toggleDay(key)}
                  />
                  <label htmlFor={key} className="text-sm cursor-pointer">{label}</label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Políticas laborales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="w-4 h-4" />
            Políticas laborales
          </CardTitle>
          <CardDescription>
            Configuración de horas y vacaciones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="flex items-center gap-1">
                <Palmtree className="w-3.5 h-3.5" />
                Días de vacaciones al año
              </Label>
              <Input type="number" min="1" max="365" placeholder="15"
                value={form.vacation_days} onChange={f("vacation_days")} />
            </div>
            <div className="space-y-1">
              <Label className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Horas de trabajo por día
              </Label>
              <Input type="number" min="1" max="24" placeholder="8"
                value={form.work_hours_day} onChange={f("work_hours_day")} />
            </div>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600">Configuración guardada correctamente</p>}

      <Button onClick={handleSave} disabled={isPending} className="w-full sm:w-auto">
        {isPending ? "Guardando…" : "Guardar configuración"}
      </Button>
    </div>
  )
}