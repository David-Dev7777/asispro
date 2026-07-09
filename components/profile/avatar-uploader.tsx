// components/profile/avatar-uploader.tsx
"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"

interface Props {
  currentAvatarUrl: string | null
  displayName: string
  onUploaded: (url: string) => void
  onUploadingChange?: (isUploading: boolean) => void
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0]?.toUpperCase())
    .join("") || "?"
}

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"]
const MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2MB

export function AvatarUploader({ currentAvatarUrl, displayName, onUploaded, onUploadingChange }: Props) {
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    // Validación en el cliente: solo para dar feedback rápido al usuario.
    // La validación real, la que importa por seguridad, está configurada
    // a nivel del bucket en Supabase (allowed_mime_types + file_size_limit),
    // porque esto de acá se puede saltar fácilmente con devtools.
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Formato no permitido. Usa PNG, JPG o WebP.")
      e.target.value = ""
      return
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("La imagen no puede pesar más de 2MB.")
      e.target.value = ""
      return
    }

    setPreview(URL.createObjectURL(file))
    onUploadingChange?.(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError("No autenticado")
      onUploadingChange?.(false)
      return
    }

    const ext = file.name.split(".").pop()
    const path = `${user.id}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setError("No se pudo subir la foto: " + uploadError.message)
      onUploadingChange?.(false)
      return
    }

    const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path)

    onUploaded(publicUrlData.publicUrl)
    onUploadingChange?.(false)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <Avatar className="w-20 h-20">
        <AvatarImage src={preview ?? undefined} alt={displayName} />
        <AvatarFallback className="text-lg">{getInitials(displayName)}</AvatarFallback>
      </Avatar>
      <Label htmlFor="avatar-uploader" className="text-sm text-muted-foreground cursor-pointer hover:underline">
        Cambiar foto
      </Label>
      <input
        id="avatar-uploader"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}