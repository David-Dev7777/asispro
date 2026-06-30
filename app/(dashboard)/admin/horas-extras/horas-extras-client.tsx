"use client"

import { useState, useTransition } from "react"
import { approveOvertime, rejectOvertime } from "@/lib/actions/admin/overtime"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Check, X } from "lucide-react"
import { useRouter } from "next/navigation"

type OvertimeRequest = {
  id: string
  date: string
  hours: number
  origin: string
  reason: string | null
  status: string
  rejection_note: string | null
  approved_at: string | null
  created_at: string
  employees: {
    id: string
    first_name: string
    last_name: string
    rut: string
    departments: { id: string; name: string } | null
  } | null
}

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" })
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    pending:  { label: "Pendiente", className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100" },
    approved: { label: "Aprobado",  className: "bg-green-100 text-green-700 hover:bg-green-100" },
    rejected: { label: "Rechazado", className: "bg-red-100 text-red-700 hover:bg-red-100" },
  }
  const s = map[status] ?? { label: status, className: "" }
  return <Badge className={s.className}>{s.label}</Badge>
}

interface Props {
  initialRequests: OvertimeRequest[]
}

export default function HorasExtrasClient({ initialRequests }: Props) {
  const router = useRouter()
  const [filterStatus, setFilterStatus] = useState("pending")
  const [isPending, startTransition] = useTransition()
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState("")
  const [rejectError, setRejectError] = useState<string | null>(null)

  const filtered = filterStatus === "all"
    ? initialRequests
    : initialRequests.filter(r => r.status === filterStatus)

  const pendingCount = initialRequests.filter(r => r.status === "pending").length

  const handleApprove = (id: string) => {
    startTransition(async () => {
      await approveOvertime(id)
      router.refresh()
    })
  }

  const handleReject = () => {
    if (!rejectId) return
    if (!rejectNote.trim()) { setRejectError("El motivo de rechazo es obligatorio"); return }
    setRejectError(null)
    startTransition(async () => {
      await rejectOvertime(rejectId, rejectNote.trim())
      setRejectId(null)
      setRejectNote("")
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Horas extras</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {pendingCount > 0
              ? <span className="text-yellow-600 font-medium">{pendingCount} solicitudes pendientes</span>
              : "Sin solicitudes pendientes"
            }
          </p>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="approved">Aprobadas</SelectItem>
            <SelectItem value="rejected">Rechazadas</SelectItem>
            <SelectItem value="all">Todas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empleado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Horas</TableHead>
              <TableHead>Origen</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                  Sin solicitudes
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(r => (
                <TableRow key={r.id}>
                  <TableCell>
                    <p className="font-medium">{r.employees?.first_name} {r.employees?.last_name}</p>
                    {r.employees?.departments && (
                      <p className="text-xs text-muted-foreground">{r.employees.departments.name}</p>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(r.date)}</TableCell>
                  <TableCell className="font-medium">{r.hours}h</TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.origin === "automatic" ? "Automático" : "Manual"}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="truncate text-sm text-muted-foreground">{r.reason ?? "—"}</p>
                    {r.rejection_note && (
                      <p className="text-xs text-red-600 mt-0.5">Rechazo: {r.rejection_note}</p>
                    )}
                  </TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell>
                    {r.status === "pending" && (
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleApprove(r.id)} disabled={isPending}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => { setRejectId(r.id); setRejectNote(""); setRejectError(null) }}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!rejectId} onOpenChange={open => !open && setRejectId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rechazar solicitud</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Motivo del rechazo *</Label>
            <Textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)}
              placeholder="Explica el motivo del rechazo…" rows={3} />
            {rejectError && <p className="text-sm text-destructive">{rejectError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleReject} disabled={isPending}>
              {isPending ? "Rechazando…" : "Rechazar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}