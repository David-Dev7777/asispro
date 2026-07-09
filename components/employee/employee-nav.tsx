"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Clock, ClipboardList, Palmtree, UserCircle } from "lucide-react"

const navItems = [
  { href: "/empleados/inicio",       label: "Inicio",       icon: LayoutDashboard },
  { href: "/empleados/asistencia",   label: "Asistencia",   icon: Clock },
  { href: "/empleados/horas-extras", label: "Horas extras", icon: ClipboardList },
  { href: "/empleados/vacaciones",   label: "Vacaciones",   icon: Palmtree },
  { href: "/empleados/perfil",        label: "Perfil",        icon: UserCircle },
]

interface Props {
  onNavigate?: () => void
}

export function EmployeeNav({ onNavigate }: Props) {
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