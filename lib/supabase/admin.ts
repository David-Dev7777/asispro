import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/app/types/database.types";

// Este cliente SALTA todas las políticas RLS.
// Úsalo SOLO en Server Actions/Route Handlers, NUNCA en el cliente,
// y NUNCA lo importes en un componente con "use client".
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}