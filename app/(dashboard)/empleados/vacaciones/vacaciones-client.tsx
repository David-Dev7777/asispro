"use client"

import { useState, useTransition } from "react"
import { requestVacation } from "@/lib/actions/vacations"
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

type VacationRequest = {
  id: string; start_date: string; end_date: string
  days_requested: number; status: string; notes?: string
}
type VacationBalance = { total_days: number; used_days: number; remaining_days: number }

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

interface Props {
  initialRequests: VacationRequest[]
  initialBalance: VacationBalance | null
}

export default function VacacionesEmpleadoClient({ initialRequests, initialBalance }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ start_date: "", end_date: "", notes: "" })
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = () => {
    setError(null)
    startTransition(async () => {
      const res = await requestVacation(form)
      if (res.success) {
        setDialogOpen(false)
        setForm({ start_date: "", end_date: "", notes: "" })
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
          <h1 className="text-2xl font-semibold">Vacaciones</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestiona tus días de vacaciones</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Solicitar
        </Button>
      </div>

      {/* Balance */}
      {initialBalance && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Días totales", value: initialBalance.total_days, color: "" },
            { label: "Días usados",  value: initialBalance.used_days,  color: "text-muted-foreground" },
            { label: "Disponibles",  value: initialBalance.remaining_days,
              color: initialBalance.remaining_days <= 3 ? "text-red-600" : "text-green-600" },
          ].map(({ label, value, color }) => (
            <Card key={label}>
              <CardContent className="pt-6 text-center">
                <p className={`text-3xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Historial */}
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
                    <p className="text-sm font-medium">
                      {formatDate(r.start_date)} → {formatDate(r.end_date)}
                    </p>
                    {r.notes && <p className="text-xs text-muted-foreground">{r.notes}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{r.days_requested}d</span>
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
          <DialogHeader><DialogTitle>Solicitar vacaciones</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Desde</Label>
              <Input type="date" value={form.start_date}
                onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Hasta</Label>
              <Input type="date" value={form.end_date}
                onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Notas (opcional)</Label>
              <Textarea placeholder="Información adicional para tu jefatura"
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
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