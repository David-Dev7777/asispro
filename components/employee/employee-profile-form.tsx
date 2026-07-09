// components/employee/employee-profile-form.tsx
"use client"

import { useState, useTransition } from "react"
import { updateEmployeeProfileInfo } from "@/lib/actions/profile"
import { AvatarUploader } from "@/components/profile/avatar-uploader"
import { EmailSection } from "@/components/profile/email-section"
import { PasswordSection } from "@/components/profile/password-section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface Props {
  initialFirstName: string
  initialLastName: string
  initialRut: string
  initialAddress: string
  initialAvatarUrl: string | null
  email: string
}

export function EmployeeProfileForm({
  initialFirstName,
  initialLastName,
  initialRut,
  initialAddress,
  initialAvatarUrl,
  email,
}: Props) {
  const [form, setForm] = useState({
    first_name: initialFirstName,
    last_name: initialLastName,
    rut: initialRut,
    address: initialAddress,
  })
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl)
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const f = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleSave = () => {
    setError(null)
    setSuccess(false)
    if (!form.first_name || !form.last_name || !form.rut || !form.address) {
      setError("Todos los campos son obligatorios")
      return
    }
    startTransition(async () => {
      const res = await updateEmployeeProfileInfo({ ...form, avatar_url: avatarUrl })
      if (res.success) {
        setSuccess(true)
      } else {
        setError(res.error ?? "Error desconocido")
      }
    })
  }

  const displayName = `${form.first_name} ${form.last_name}`.trim() || email

  return (
    <div className="space-y-6 max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información personal</CardTitle>
          <CardDescription>Tus datos y foto, visibles para tu empresa.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AvatarUploader
            currentAvatarUrl={avatarUrl}
            displayName={displayName}
            onUploaded={setAvatarUrl}
            onUploadingChange={setIsUploading}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input value={form.first_name} onChange={f("first_name")} />
            </div>
            <div className="space-y-1">
              <Label>Apellido</Label>
              <Input value={form.last_name} onChange={f("last_name")} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>RUT</Label>
            <Input value={form.rut} onChange={f("rut")} />
          </div>
          <div className="space-y-1">
            <Label>Dirección</Label>
            <Input value={form.address} onChange={f("address")} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-700">Cambios guardados.</p>}

          <Button onClick={handleSave} disabled={isPending || isUploading} size="sm">
            {isPending ? "Guardando…" : isUploading ? "Subiendo foto…" : "Guardar cambios"}
          </Button>
        </CardContent>
      </Card>

      <EmailSection currentEmail={email} />
      <PasswordSection />
    </div>
  )
}