"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Plus } from "lucide-react"

interface Props {
  onCreated: () => void
}

type Role = "employee" | "admin"

export function CrearPerfilDialog({ onCreated }: Props) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({ email: "", password: "", role: "employee" as Role })
  const [error, setError] = useState<string | null>(null)

  const f = (key: "email" | "password") => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleSave = async () => {
    if (!form.email || !form.password) {
      setError("Email y contraseña son obligatorios")
      return
    }
    setError(null)
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/admin/perfiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        setOpen(false)
        setForm({ email: "", password: "", role: "employee" })
        onCreated()
      } else {
        setError(data.error ?? "Error desconocido")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4 mr-2" />
        Nuevo empleado
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Crear acceso</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Rol *</Label>
              <Select
                value={form.role}
                onValueChange={(value: Role) => setForm(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Empleado</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={f("email")}
                placeholder="juan@empresa.com" />
            </div>
            <div className="space-y-1">
              <Label>Contraseña *</Label>
              <Input type="password" value={form.password} onChange={f("password")}
                placeholder="Mínimo 6 caracteres" />
            </div>
            <p className="text-xs text-muted-foreground">
              {form.role === "employee"
                ? "El empleado completará su información personal al iniciar sesión por primera vez."
                : "El administrador tendrá acceso al panel de administración de la empresa."}
            </p>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? "Creando…" : "Crear acceso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}