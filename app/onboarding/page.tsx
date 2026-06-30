"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createOnboardingEmployee } from "@/lib/actions/onboarding"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function OnboardingPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    rut: "",
    address: "",
  })

  const f = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = () => {
    if (!form.first_name || !form.last_name || !form.rut || !form.address) {
      setError("Todos los campos son obligatorios")
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await createOnboardingEmployee(form)
      if (res.success) {
        router.push("/empleados")
      } else {
        setError(res.error ?? "Error desconocido")
      }
    })
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Bienvenido</CardTitle>
          <CardDescription>
            Completa tu información personal para continuar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Nombre *</Label>
              <Input value={form.first_name} onChange={f("first_name")} placeholder="Juan" />
            </div>
            <div className="space-y-1">
              <Label>Apellido *</Label>
              <Input value={form.last_name} onChange={f("last_name")} placeholder="Pérez" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>RUT *</Label>
            <Input value={form.rut} onChange={f("rut")} placeholder="12.345.678-9" />
          </div>
          <div className="space-y-1">
            <Label>Dirección *</Label>
            <Input value={form.address} onChange={f("address")} placeholder="Av. Ejemplo 123" />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button className="w-full" onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Guardando…" : "Continuar"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}