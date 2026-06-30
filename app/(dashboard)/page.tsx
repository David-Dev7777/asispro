import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // el middleware ya debería filtrar esto, pero es buena práctica
  // no confiar en una sola capa de protección
  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, company_id, companies(name)")
    .eq("id", user.id)
    .single();

  // si el usuario está autenticado pero no tiene profile,
  // algo falló en el registro (trigger, etc.)
  if (error || !profile) {
    redirect("/login?error=no_profile");
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar fijo */}
      <aside className="w-64 border-r bg-white">
        {/* Acá va tu navegación: Empleados, Asistencia, etc. */}
        <div className="p-4">
          <p className="text-sm text-gray-500">{profile.companies?.name}</p>
          <p className="font-medium">{profile.full_name}</p>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}