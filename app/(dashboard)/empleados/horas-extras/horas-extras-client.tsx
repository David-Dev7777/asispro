"use client"

import { useState, useTransition } from "react"
import { requestOvertime } from "@/lib/actions/Overtime"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"

type OvertimeRequest = {
  id: string; date: string; hours: number; origin: string
  reason: string; status: string
}

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" })
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
    pending:  { label: "Pendiente", variant: "secondary" },
    approved: { label: "Aprobado",  variant: "default" },
    rejected: { label: "Rechazado", variant: "destructive" },
  }
  const s = map[status] ?? { label: status, variant: "secondary" }
  return <Badge variant={s.variant}>{s.label}</Badge>
}

export default function HorasExtrasEmpleadoClient({ initialRequests }: { initialRequests: OvertimeRequest[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), hours: "", reason: "" })
  const [error, setError] = useState<string | null>(null)

  const totalAprobadas = initialRequests
    .filter(r => r.status === "approved")
    .reduce((acc, r) => acc + r.hours, 0)

  const handleSubmit = () => {
    setError(null)
    startTransition(async () => {
      const res = await requestOvertime({
        date: form.date,
        hours: parseFloat(form.hours),
        reason: form.reason,
      })
      if (res.success) {
        setDialogOpen(false)
        setForm({ date: new Date().toISOString().slice(0, 10), hours: "", reason: "" })
        router.refresh()
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Horas extras</h1>
          <p className="text-sm text-muted-foreground mt-1">{totalAprobadas}h aprobadas en total</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Solicitar
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Mis solicitudes</CardTitle></CardHeader>
        <CardContent>
          {initialRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Sin solicitudes registradas</p>
          ) : (
            <div className="space-y-2">
              {initialRequests.map(r => (
                <div key={r.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{formatDate(r.date)}</p>
                    <p className="text-xs text-muted-foreground">{r.reason}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{r.hours}h</span>
                    <StatusBadge status={r.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Solicitar horas extras</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Fecha</Label>
              <Input type="date" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Horas</Label>
              <Input type="number" min="0.5" max="12" step="0.5" placeholder="Ej: 2"
                value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Motivo</Label>
              <Textarea placeholder="Describe el trabajo realizado fuera de horario"
                value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={3} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Enviando…" : "Enviar solicitud"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}