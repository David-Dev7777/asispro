"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Users, Building2, Clock, ClipboardList, Palmtree, Settings,
} from "lucide-react"

const navItems = [
  { href: "/admin/empleados",     label: "Empleados",     icon: Users },
  { href: "/admin/areas",         label: "Áreas",         icon: Building2 },
  { href: "/admin/jornada",       label: "Jornada",       icon: Clock },
  { href: "/admin/horas-extras",  label: "Horas extras",  icon: ClipboardList },
  { href: "/admin/vacaciones",    label: "Vacaciones",    icon: Palmtree },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings },
]

interface Props {
  onNavigate?: () => void
}

export function AdminNav({ onNavigate }: Props) {
  const pathname = usePathname()
  return (
    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}