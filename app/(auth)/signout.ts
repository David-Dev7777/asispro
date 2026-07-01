import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"



export async function POST(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const origin = request.nextUrl.origin
  return NextResponse.redirect(new URL("/login", origin))
}