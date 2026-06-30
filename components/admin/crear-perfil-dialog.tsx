"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"

interface Props {
  onCreated: () => void
}

export function CrearPerfilDialog({ onCreated }: Props) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({ email: "", password: "" })
  const [error, setError] = useState<string | null>(null)

  const f = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
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
        setForm({ email: "", password: "" })
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
            <DialogTitle>Crear acceso de empleado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
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
              El empleado completará su información personal al iniciar sesión por primera vez.
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