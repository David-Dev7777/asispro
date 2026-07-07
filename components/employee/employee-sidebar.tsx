"use client"

import { useState } from "react"
import { EmployeeNav } from "@/components/employee/employee-nav"
import { signOut } from "@/lib/actions/auth/signout"
import { LogOut, Briefcase, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  userBadge: React.ReactNode
}

export function EmployeeSidebar({ userBadge }: Props) {
  const [open, setOpen] = useState(false)

  const sidebarContent = (
    <>
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm">AsisPro</span>
          </div>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="border-b">
        {userBadge}
      </div>

      <EmployeeNav onNavigate={() => setOpen(false)} />

      <div className="p-4 border-t">
        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors w-full"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </>
  )

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden bg-card border shadow-sm"
        onClick={() => setOpen(true)}
      >
        <Menu className="w-4 h-4" />
      </Button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setOpen(false)} />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-card border-r flex flex-col
        transform transition-transform duration-200
        md:hidden
        ${open ? "translate-x-0" : "-translate-x-full"}
      `}>
        {sidebarContent}
      </aside>

      <aside className="hidden md:flex w-64 bg-card border-r flex-col shrink-0">
        {sidebarContent}
      </aside>
    </>
  )
}