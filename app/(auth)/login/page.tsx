"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/auth/signin";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await login(formData);
      // si llega aquí, hubo error (el éxito hace redirect y no retorna)
      if (result && !result.success) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-[#E7E5E4] bg-white p-8 shadow-sm">
      <h1 className="font-serif text-2xl">Inicia sesión</h1>
      <p className="mt-1 text-sm text-[#78716C]">
        Entra a tu cuenta de AsisPro.
      </p>

      <form action={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-1">
          <Label htmlFor="email">Correo</Label>
          <Input id="email" name="email" type="email" required />
        </div>

        <div className="space-y-1">
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" name="password" type="password" required />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Ingresando..." : "Ingresar"}
        </Button>
      </form>

    </div>
  );
}