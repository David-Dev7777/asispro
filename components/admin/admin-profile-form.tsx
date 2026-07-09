// components/admin/admin-profile-form.tsx
"use client"

import { useState, useTransition } from "react"
import { updateAdminProfileInfo } from "@/lib/actions/profile"
import { AvatarUploader } from "@/components/profile/avatar-uploader"
import { EmailSection } from "@/components/profile/email-section"
import { PasswordSection } from "@/components/profile/password-section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface Props {
  initialFullName: string
  initialAvatarUrl: string | null
  email: string
}

export function AdminProfileForm({ initialFullName, initialAvatarUrl, email }: Props) {
  const [fullName, setFullName] = useState(initialFullName)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl)
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSave = () => {
    setError(null)
    setSuccess(false)
    if (!fullName.trim()) {
      setError("El nombre es obligatorio")
      return
    }
    startTransition(async () => {
      const res = await updateAdminProfileInfo({ full_name: fullName, avatar_url: avatarUrl })
      if (res.success) {
        setSuccess(true)
      } else {
        setError(res.error ?? "Error desconocido")
      }
    })
  }

  return (
    <div className="space-y-6 max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información personal</CardTitle>
          <CardDescription>Tu nombre y foto, visibles en el panel de administración.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AvatarUploader
            currentAvatarUrl={avatarUrl}
            displayName={fullName || email}
            onUploaded={setAvatarUrl}
            onUploadingChange={setIsUploading}
          />

          <div className="space-y-1">
            <Label htmlFor="full-name">Nombre completo</Label>
            <Input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
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