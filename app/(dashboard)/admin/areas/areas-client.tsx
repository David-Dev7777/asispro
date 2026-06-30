"use client"

import { useState, useTransition } from "react"
import { createDepartment, updateDepartment, deleteDepartment } from "@/lib/actions/admin/departments"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

type Department = { id: string; name: string; company_id: string }

interface Props {
  initialDepartments: Department[]
}

export default function AreasClient({ initialDepartments }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Department | null>(null)
  const [name, setName] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const openCreate = () => {
    setEditing(null)
    setName("")
    setFormError(null)
    setDialogOpen(true)
  }

  const openEdit = (dep: Department) => {
    setEditing(dep)
    setName(dep.name)
    setFormError(null)
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!name.trim()) { setFormError("El nombre es obligatorio"); return }
    setFormError(null)
    startTransition(async () => {
      const res = editing
        ? await updateDepartment(editing.id, name.trim())
        : await createDepartment(name.trim())
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
      await deleteDepartment(deleteId)
      setDeleteId(null)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Áreas</h1>
          <p className="text-sm text-muted-foreground mt-1">{initialDepartments.length} áreas registradas</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva área
        </Button>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialDepartments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground py-10">
                  No hay áreas registradas
                </TableCell>
              </TableRow>
            ) : (
              initialDepartments.map(dep => (
                <TableRow key={dep.id}>
                  <TableCell className="font-medium">{dep.name}</TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(dep)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(dep.id)}>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar área" : "Nueva área"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Nombre *</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Recursos Humanos"
              onKeyDown={e => e.key === "Enter" && handleSave()}
            />
            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "Guardando…" : editing ? "Guardar cambios" : "Crear área"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar área?</AlertDialogTitle>
            <AlertDialogDescription>
              Los empleados asignados a esta área quedarán sin área asignada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}