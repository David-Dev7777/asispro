// app/(auth)/forgot-password/page.tsx
"use client"

import { useActionState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { forgotPassword, type ForgotPasswordState } from "@/lib/actions/auth/forgot-password"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const initialState: ForgotPasswordState = {}

const ERROR_MESSAGES: Record<string, string> = {
  link_invalido:
    "El enlace ya expiró o ya fue utilizado. Solicita uno nuevo abajo — recuerda hacer clic una sola vez en el correo más reciente.",
}

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(forgotPassword, initialState)
  const searchParams = useSearchParams()
  const errorParam = searchParams.get("error")
  const linkErrorMessage = errorParam ? ERROR_MESSAGES[errorParam] : null

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Recuperar contraseña</CardTitle>
          <CardDescription>
            Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state.success ? (
            <div className="text-sm text-green-700 bg-green-50 rounded-md px-4 py-3">
              {state.message}
            </div>
          ) : (
            <form action={formAction} className="space-y-4">
              {linkErrorMessage && (
                <div className="text-sm text-yellow-800 bg-yellow-50 rounded-md px-4 py-3">
                  {linkErrorMessage}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input id="email" name="email" type="email" placeholder="tu@empresa.cl" required />
              </div>

              {state.error && (
                <p className="text-sm text-red-600">{state.error}</p>
              )}

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Enviando…" : "Enviar enlace"}
              </Button>
            </form>
          )}

          <div className="mt-4 text-center text-sm">
            <Link href="/login" className="text-muted-foreground hover:underline">
              Volver a iniciar sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}