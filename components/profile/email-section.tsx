// components/profile/email-section.tsx
"use client"

import { useState, useTransition } from "react"
import { updateEmail } from "@/lib/actions/profile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface Props {
  currentEmail: string
}

export function EmailSection({ currentEmail }: Props) {
  const [email, setEmail] = useState(currentEmail)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = () => {
    setError(null)
    setMessage(null)
    startTransition(async () => {
      const res = await updateEmail(email)
      if (res.success) {
        setMessage(res.message ?? "Correo actualizado")
      } else {
        setError(res.error ?? "Error desconocido")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Correo electrónico</CardTitle>
        <CardDescription>
          Al cambiarlo te enviaremos un correo de confirmación a la nueva dirección.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="profile-email">Correo</Label>
          <Input
            id="profile-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {message && <p className="text-sm text-green-700">{message}</p>}

        <Button
          onClick={handleSubmit}
          disabled={isPending || email === currentEmail}
          size="sm"
        >
          {isPending ? "Guardando…" : "Actualizar correo"}
        </Button>
      </CardContent>
    </Card>
  )
}