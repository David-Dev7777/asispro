// app/(auth)/onboarding/onboarding-admin-form.tsx
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { completeAdminOnboarding } from "@/lib/actions/onboarding"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function OnboardingAdminForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [fullName, setFullName] = useState("")
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSubmit = () => {
    if (!fullName.trim()) {
      setError("El nombre es obligatorio")
      return
    }
    setError(null)

    startTransition(async () => {
      let avatarUrl: string | null = null

      if (avatarFile) {
        setIsUploading(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          const ext = avatarFile.name.split(".").pop()
          const path = `${user.id}/avatar.${ext}`

          const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(path, avatarFile, { upsert: true })

          if (uploadError) {
            setIsUploading(false)
            setError("No se pudo subir la foto: " + uploadError.message)
            return
          }

          const { data: publicUrlData } = supabase.storage
            .from("avatars")
            .getPublicUrl(path)

          avatarUrl = publicUrlData.publicUrl
        }
        setIsUploading(false)
      }

      const res = await completeAdminOnboarding({ full_name: fullName, avatar_url: avatarUrl })
      if (res.success) {
        router.push("/admin")
      } else {
        setError(res.error ?? "Error desconocido")
      }
    })
  }

  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0]?.toUpperCase())
    .join("") || "?"

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Bienvenido</CardTitle>
          <CardDescription>
            Completa tu perfil para continuar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center gap-3">
            <Avatar className="w-20 h-20">
              <AvatarImage src={avatarPreview ?? undefined} alt="Foto de perfil" />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <Label htmlFor="avatar" className="text-sm text-muted-foreground cursor-pointer hover:underline">
              {avatarFile ? "Cambiar foto" : "Subir foto (opcional)"}
            </Label>
            <input
              id="avatar"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="space-y-1">
            <Label>Nombre completo *</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Juan Pérez"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button className="w-full" onClick={handleSubmit} disabled={isPending}>
            {isPending ? (isUploading ? "Subiendo foto…" : "Guardando…") : "Continuar"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}