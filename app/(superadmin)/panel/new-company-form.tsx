"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCompanyWithAdmin } from "@/lib/actions/superadmin";

export function NewCompanyForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await createCompanyWithAdmin(formData);
      if (!result.success) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    });
  }

  return (
    <form action={handleSubmit} className="mt-6 space-y-4">
      <div className="space-y-1">
        <Label htmlFor="company_name">Nombre de la empresa</Label>
        <Input id="company_name" name="company_name" required />
      </div>

      <div className="space-y-1">
        <Label htmlFor="admin_full_name">Nombre del admin</Label>
        <Input id="admin_full_name" name="admin_full_name" required />
      </div>

      <div className="space-y-1">
        <Label htmlFor="admin_email">Correo del admin</Label>
        <Input id="admin_email" name="admin_email" type="email" required />
      </div>

      <div className="space-y-1">
        <Label htmlFor="admin_password">Contraseña temporal</Label>
        <Input
          id="admin_password"
          name="admin_password"
          type="password"
          minLength={6}
          required
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && (
        <p className="text-sm text-green-600">
          Empresa y admin creados correctamente.
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Creando..." : "Crear empresa"}
      </Button>
    </form>
  );
}