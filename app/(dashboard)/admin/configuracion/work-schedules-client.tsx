"use client"

import { useState, useTransition } from "react"
import {
  createWorkSchedule, updateWorkSchedule, deleteWorkSchedule, assignDepartmentSchedule,
} from "@/lib/actions/admin/work-schedules"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Clock, Plus, Pencil, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

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

const ALL_DAYS = [
  { key: "monday",    label: "Lun" },
  { key: "tuesday",   label: "Mar" },
  { key: "wednesday", label: "Mié" },
  { key: "thursday",  label: "Jue" },
  { key: "friday",    label: "Vie" },
  { key: "saturday",  label: "Sáb" },
  { key: "sunday",    label: "Dom" },
]

const emptyForm = {
  name: "",
  work_start_time: "09:00",
  work_end_time: "18:00",
  work_days: ["monday", "tuesday", "wednesday", "thursday", "friday"] as string[],
  late_tolerance_minutes: "15",
}

interface Props {
  initialSchedules: WorkSchedule[]
  initialDepartments: DepartmentRow[]
}

export default function WorkSchedulesClient({ initialSchedules, initialDepartments }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState<string | null>(null)

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setError(null)
    setDialogOpen(true)
  }

  const openEdit = (s: WorkSchedule) => {
    setEditingId(s.id)
    setForm({
      name: s.name,
      work_start_time: s.work_start_time.slice(0, 5),
      work_end_time: s.work_end_time.slice(0, 5),
      work_days: s.work_days,
      late_tolerance_minutes: s.late_tolerance_minutes.toString(),
    })
    setError(null)
    setDialogOpen(true)
  }

  const toggleDay = (day: string) => {
    setForm(prev => ({
      ...prev,
      work_days: prev.work_days.includes(day)
        ? prev.work_days.filter(d => d !== day)
        : [...prev.work_days, day],
    }))
  }

  const handleSave = () => {
    if (!form.name.trim()) { setError("El nombre es obligatorio"); return }
    if (form.work_days.length === 0) { setError("Selecciona al menos un día"); return }
    setError(null)

    const payload = {
      name: form.name.trim(),
      work_start_time: form.work_start_time,
      work_end_time: form.work_end_time,
      work_days: form.work_days,
      late_tolerance_minutes: parseInt(form.late_tolerance_minutes) || 0,
    }

    startTransition(async () => {
      const res = editingId
        ? await updateWorkSchedule(editingId, payload)
        : await createWorkSchedule(payload)

      if (res.success) {
        setDialogOpen(false)
        router.refresh()
      } else {
        setError(res.error ?? "Error desconocido")
      }
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm("¿Eliminar esta jornada? Las áreas que la usan quedarán con la jornada por defecto.")) return
    startTransition(async () => {
      await deleteWorkSchedule(id)
      router.refresh()
    })
  }

  const handleAssign = (departmentId: string, scheduleId: string) => {
    startTransition(async () => {
      await assignDepartmentSchedule(departmentId, scheduleId === "__default__" ? null : scheduleId)
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="w-4 h-4" />
            Jornadas laborales
          </CardTitle>
          <CardDescription>
            Crea distintas jornadas y asígnalas por área
          </CardDescription>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva jornada
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          {initialSchedules.map(s => (
            <div key={s.id} className="flex items-center justify-between border rounded-md p-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{s.name}</p>
                  {s.is_default && <Badge variant="secondary">Por defecto</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {s.work_start_time.slice(0, 5)} – {s.work_end_time.slice(0, 5)} · Tolerancia {s.late_tolerance_minutes} min ·{" "}
                  {s.work_days.length === 7 ? "Todos los días" : `${s.work_days.length} días/sem`}
                </p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => openEdit(s)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                {!s.is_default && (
                  <Button size="icon" variant="ghost" className="text-destructive"
                    onClick={() => handleDelete(s.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Asignación por área</Label>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Área</TableHead>
                  <TableHead>Jornada asignada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialDepartments.map(d => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium text-sm">{d.name}</TableCell>
                    <TableCell>
                      <Select
                        value={d.schedule_id ?? "__default__"}
                        onValueChange={(v) => handleAssign(d.id, v)}
                        disabled={isPending}
                      >
                        <SelectTrigger className="w-56">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__default__">Usar la jornada por defecto</SelectItem>
                          {initialSchedules.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar jornada" : "Nueva jornada"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Turno Despacho"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Hora de entrada</Label>
                <Input
                  type="time"
                  value={form.work_start_time}
                  onChange={(e) => setForm(prev => ({ ...prev, work_start_time: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Hora de salida</Label>
                <Input
                  type="time"
                  value={form.work_end_time}
                  onChange={(e) => setForm(prev => ({ ...prev, work_end_time: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Tolerancia de atraso (minutos)</Label>
              <Input
                type="number" min="0" max="60"
                value={form.late_tolerance_minutes}
                onChange={(e) => setForm(prev => ({ ...prev, late_tolerance_minutes: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Días de trabajo</Label>
              <div className="flex flex-wrap gap-3">
                {ALL_DAYS.map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <Checkbox
                      id={`sched-${key}`}
                      checked={form.work_days.includes(key)}
                      onCheckedChange={() => toggleDay(key)}
                    />
                    <label htmlFor={`sched-${key}`} className="text-sm cursor-pointer">{label}</label>
                  </div>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}