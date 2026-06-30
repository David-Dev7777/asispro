"use client"

import { useState, useTransition } from "react"
import { updateEmployee, deleteEmployee } from "@/lib/actions/admin/employees"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CrearPerfilDialog } from "@/components/admin/crear-perfil-dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, Search } from "lucide-react"
import { useRouter } from "next/navigation"

// ─── Types ────────────────────────────────────────────────────────────────────
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
  departments: { id: string; name: string } | null
}

const emptyForm = {
  first_name: "", last_name: "", rut: "", address: "",
  position: "", department_id: "", hour_rate: "",
}

interface Props {
  initialEmployees: Employee[]
  initialDepartments: Department[]
}

export default function EmpleadosClient({ initialEmployees, initialDepartments }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [isPending, startTransition] = useTransition()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filtered = initialEmployees.filter(e =>
    `${e.first_name} ${e.last_name} ${e.rut}`.toLowerCase().includes(search.toLowerCase())
  )

  const openEdit = (emp: Employee) => {
    setEditing(emp)
    setForm({
      first_name: emp.first_name,
      last_name: emp.last_name,
      rut: emp.rut,
      address: emp.address,
      position: emp.position ?? "",
      department_id: emp.department_id ?? "",
      hour_rate: emp.hour_rate?.toString() ?? "",
    })
    setFormError(null)
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!form.first_name || !form.last_name || !form.rut || !form.address) {
      setFormError("Nombre, apellido, RUT y dirección son obligatorios")
      return
    }
    if (!editing) return
    setFormError(null)
    startTransition(async () => {
      const res = await updateEmployee(editing.id, {
        first_name: form.first_name,
        last_name: form.last_name,
        rut: form.rut,
        address: form.address,
        position: form.position,
        department_id: form.department_id || null,
        hour_rate: form.hour_rate ? parseFloat(form.hour_rate) : 0,
      })
      if (res.success) {
        setDialogOpen(false)
        router.refresh()
      } else {
        setFormError(res.error ?? "Error desconocido")
      }
    })
  }

  const handleDelete = () => {
    if (!deleteId) return
    startTransition(async () => {
      await deleteEmployee(deleteId)
      setDeleteId(null)
      router.refresh()
    })
  }

  const f = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Empleados</h1>
          <p className="text-sm text-muted-foreground mt-1">{initialEmployees.length} empleados registrados</p>
        </div>
        <CrearPerfilDialog onCreated={() => router.refresh()} />
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por nombre o RUT…" className="pl-9"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>RUT</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Área</TableHead>
              <TableHead>Tarifa/hr</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                  {search ? "Sin resultados" : "No hay empleados registrados"}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(emp => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.first_name} {emp.last_name}</TableCell>
                  <TableCell className="text-muted-foreground">{emp.rut}</TableCell>
                  <TableCell>{emp.position ?? <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell>
                    {emp.departments
                      ? <Badge variant="secondary">{emp.departments.name}</Badge>
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    {emp.hour_rate
                      ? `$${emp.hour_rate.toLocaleString("es-CL")}/hr`
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(emp)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(emp.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar empleado</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1">
              <Label>Nombre *</Label>
              <Input value={form.first_name} onChange={f("first_name")} placeholder="Juan" />
            </div>
            <div className="space-y-1">
              <Label>Apellido *</Label>
              <Input value={form.last_name} onChange={f("last_name")} placeholder="Pérez" />
            </div>
            <div className="space-y-1">
              <Label>RUT *</Label>
              <Input value={form.rut} onChange={f("rut")} placeholder="12.345.678-9" />
            </div>
            <div className="space-y-1">
              <Label>Cargo</Label>
              <Input value={form.position} onChange={f("position")} placeholder="Desarrollador" />
            </div>
            <div className="space-y-1 col-span-2">
              <Label>Dirección *</Label>
              <Input value={form.address} onChange={f("address")} placeholder="Av. Ejemplo 123" />
            </div>
            <div className="space-y-1">
              <Label>Área</Label>
              <Select value={form.department_id}
                onValueChange={v => setForm(p => ({ ...p, department_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Sin área" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin área</SelectItem>
                  {initialDepartments.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Tarifa por hora ($)</Label>
              <Input type="number" value={form.hour_rate} onChange={f("hour_rate")} placeholder="5000" />
            </div>
          </div>
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "Guardando…" : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog eliminar */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar empleado?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}