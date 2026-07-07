// app/(auth)/forgot-password/page.tsx
import { Suspense } from "react"
import { ForgotPasswordForm } from "./forgot-password-form"

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Suspense fallback={null}>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  )
}