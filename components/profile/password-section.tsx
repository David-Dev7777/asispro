// components/profile/password-section.tsx
"use client"

import { useState, useTransition } from "react"
import { updatePassword } from "@/lib/actions/profile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const emptyForm = { currentPassword: "", newPassword: "", confirmNewPassword: "" }

export function PasswordSection() {
  const [form, setForm] = useState(emptyForm)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const f = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = () => {
    setError(null)
    setSuccess(false)

    if (!form.currentPassword || !form.newPassword || !form.confirmNewPassword) {
      setError("Todos los campos son obligatorios")
      return
    }
    if (form.newPassword !== form.confirmNewPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    startTransition(async () => {
      const res = await updatePassword(form)
      if (res.success) {
        setSuccess(true)
        setForm(emptyForm)
      } else {
        setError(res.error ?? "Error desconocido")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Contraseña</CardTitle>
        <CardDescription>Por seguridad, pedimos tu contraseña actual para confirmar el cambio.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="current-password">Contraseña actual</Label>
          <Input
            id="current-password"
            type="password"
            value={form.currentPassword}
            onChange={f("currentPassword")}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="new-password">Nueva contraseña</Label>
          <Input
            id="new-password"
            type="password"
            value={form.newPassword}
            onChange={f("newPassword")}
            minLength={8}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="confirm-new-password">Confirmar nueva contraseña</Label>
          <Input
            id="confirm-new-password"
            type="password"
            value={form.confirmNewPassword}
            onChange={f("confirmNewPassword")}
            minLength={8}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-green-700">Contraseña actualizada.</p>}

        <Button onClick={handleSubmit} disabled={isPending} size="sm">
          {isPending ? "Guardando…" : "Actualizar contraseña"}
        </Button>
      </CardContent>
    </Card>
  )
}