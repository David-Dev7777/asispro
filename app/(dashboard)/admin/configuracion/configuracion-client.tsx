"use client"

import { useState, useTransition } from "react"
import { updateCompanySettings } from "@/lib/actions/admin/company-settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MapPin, Clock, Palmtree, Ruler } from "lucide-react"
import WorkSchedulesClient from "./work-schedules-client"

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

type WorkSchedule = {
  id: string
  name: string
  work_start_time: string
  work_end_time: string
  work_days: string[]
  late_tolerance_minutes: number
  is_default: boolean
}

type DepartmentRow = {
  id: string
  name: string
  schedule_id: string | null
  work_schedules: { id: string; name: string } | null
}

interface Props {
  initialSettings: Settings
  initialSchedules: WorkSchedule[]
  initialDepartments: DepartmentRow[]
}

export default function ConfiguracionClient({ initialSettings, initialSchedules, initialDepartments }: Props) {
  // --- Geolocalización: estado y guardado independientes ---
  const [isGeoPending, startGeoTransition] = useTransition()
  const [geoSuccess, setGeoSuccess] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [geoForm, setGeoForm] = useState({
    geo_lat:      initialSettings.geo_lat?.toString() ?? "",
    geo_lng:      initialSettings.geo_lng?.toString() ?? "",
    geo_radius_m: initialSettings.geo_radius_m.toString(),
  })

  const geoField = (key: keyof typeof geoForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setGeoForm(prev => ({ ...prev, [key]: e.target.value }))
    setGeoSuccess(false)
    setGeoError(null)
  }

  const handleSaveGeo = () => {
    setGeoError(null)
    setGeoSuccess(false)
    startGeoTransition(async () => {
      const res = await updateCompanySettings({
        geo_lat:      geoForm.geo_lat ? parseFloat(geoForm.geo_lat) : null,
        geo_lng:      geoForm.geo_lng ? parseFloat(geoForm.geo_lng) : null,
        geo_radius_m: parseInt(geoForm.geo_radius_m),
      })
      if (res.success) setGeoSuccess(true)
      else setGeoError(res.error ?? "Error desconocido")
    })
  }

  // --- Políticas laborales: estado y guardado independientes ---
  const [isPoliciesPending, startPoliciesTransition] = useTransition()
  const [policiesSuccess, setPoliciesSuccess] = useState(false)
  const [policiesError, setPoliciesError] = useState<string | null>(null)
  const [policiesForm, setPoliciesForm] = useState({
    vacation_days:  initialSettings.vacation_days.toString(),
    work_hours_day: initialSettings.work_hours_day.toString(),
  })

  const policiesField = (key: keyof typeof policiesForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setPoliciesForm(prev => ({ ...prev, [key]: e.target.value }))
    setPoliciesSuccess(false)
    setPoliciesError(null)
  }

  const handleSavePolicies = () => {
    setPoliciesError(null)
    setPoliciesSuccess(false)
    startPoliciesTransition(async () => {
      const res = await updateCompanySettings({
        vacation_days:  parseInt(policiesForm.vacation_days),
        work_hours_day: parseInt(policiesForm.work_hours_day),
      })
      if (res.success) setPoliciesSuccess(true)
      else setPoliciesError(res.error ?? "Error desconocido")
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
                value={geoForm.geo_lat} onChange={geoField("geo_lat")} />
            </div>
            <div className="space-y-1">
              <Label>Longitud</Label>
              <Input type="number" step="any" placeholder="-70.6483"
                value={geoForm.geo_lng} onChange={geoField("geo_lng")} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="flex items-center gap-1">
              <Ruler className="w-3.5 h-3.5" />
              Radio permitido (metros)
            </Label>
            <Input type="number" min="50" max="5000" placeholder="200"
              value={geoForm.geo_radius_m} onChange={geoField("geo_radius_m")} />
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

          {geoError && <p className="text-sm text-destructive">{geoError}</p>}
          {geoSuccess && <p className="text-sm text-green-600">Ubicación guardada correctamente</p>}

          <Button onClick={handleSaveGeo} disabled={isGeoPending} size="sm">
            {isGeoPending ? "Guardando…" : "Guardar ubicación"}
          </Button>
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
                value={policiesForm.vacation_days} onChange={policiesField("vacation_days")} />
            </div>
            <div className="space-y-1">
              <Label className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Horas de trabajo por día
              </Label>
              <Input type="number" min="1" max="24" placeholder="8"
                value={policiesForm.work_hours_day} onChange={policiesField("work_hours_day")} />
            </div>
          </div>

          {policiesError && <p className="text-sm text-destructive">{policiesError}</p>}
          {policiesSuccess && <p className="text-sm text-green-600">Políticas guardadas correctamente</p>}

          <Button onClick={handleSavePolicies} disabled={isPoliciesPending} size="sm">
            {isPoliciesPending ? "Guardando…" : "Guardar políticas"}
          </Button>
        </CardContent>
      </Card>

      {/* Jornadas por área — ya tiene su propio guardado por acción
          (crear/editar/asignar), independiente de las cards de arriba */}
      <WorkSchedulesClient
        initialSchedules={initialSchedules}
        initialDepartments={initialDepartments}
      />
    </div>
  )
}