"use client"

import { useState, useTransition } from "react"
import { registerAttendance } from "@/lib/actions/attendance"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock } from "lucide-react"

type Log = { id: string; type: string; timestamp: string; distance_m: number }

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })
}

function useGeolocation() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const request = () => {
    if (!navigator.geolocation) { setError("Tu navegador no soporta geolocalización"); return }
    setLoading(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      pos => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLoading(false) },
      () => { setError("No se pudo obtener tu ubicación. Verifica los permisos."); setLoading(false) },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }
  return { coords, error, loading, request }
}

export default function AsistenciaClient({ initialLogs }: { initialLogs: Log[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const { coords, error: gpsError, loading: gpsLoading, request: requestGps } = useGeolocation()

  const lastLog = initialLogs[initialLogs.length - 1]
  const isCheckedIn = lastLog?.type === "check_in"

  const totalHoy = () => {
    const ins = initialLogs.filter(l => l.type === "check_in")
    const outs = initialLogs.filter(l => l.type === "check_out")
    let mins = 0
    ins.forEach((ci, i) => {
      if (outs[i]) mins += (new Date(outs[i].timestamp).getTime() - new Date(ci.timestamp).getTime()) / 60000
    })
    if (mins === 0) return "—"
    return `${Math.floor(mins / 60)}h ${Math.floor(mins % 60)}m`
  }

  const handleMark = () => {
    if (!coords) { requestGps(); return }
    setResult(null)
    startTransition(async () => {
      const res = await registerAttendance(coords.lat, coords.lng)
      if (res.success) {
        setResult({ ok: true, msg: `${res.type === "check_in" ? "Entrada" : "Salida"} registrada a las ${formatTime(res.timestamp)} · ${res.distance_m}m de la sede` })
        router.refresh()
      } else {
        setResult({ ok: false, msg: res.error })
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Asistencia</h1>
        <p className="text-sm text-muted-foreground mt-1">Registra tu entrada y salida</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${isCheckedIn ? "bg-green-500" : "bg-muted-foreground"}`} />
              {isCheckedIn ? "En el trabajo" : "Fuera del trabajo"}
            </CardTitle>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {totalHoy()} hoy
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="w-full h-12 text-base"
            variant={isCheckedIn ? "destructive" : "default"}
            onClick={handleMark}
            disabled={isPending || gpsLoading}
          >
            <MapPin className="w-4 h-4 mr-2" />
            {gpsLoading ? "Obteniendo ubicación…" : isPending ? "Registrando…" : isCheckedIn ? "Registrar salida" : "Registrar entrada"}
          </Button>

          {!coords && !gpsLoading && (
            <p className="text-xs text-muted-foreground text-center">Se solicitará tu ubicación al marcar</p>
          )}
          {gpsError && <p className="text-sm text-destructive">{gpsError}</p>}
          {result && <p className={`text-sm ${result.ok ? "text-green-600" : "text-destructive"}`}>{result.msg}</p>}
        </CardContent>
      </Card>

      {initialLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Registros de hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {initialLogs.map(log => (
                <div key={log.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <Badge variant={log.type === "check_in" ? "default" : "secondary"}>
                    {log.type === "check_in" ? "Entrada" : "Salida"}
                  </Badge>
                  <span className="text-sm font-medium">{formatTime(log.timestamp)}</span>
                  <span className="text-xs text-muted-foreground">{log.distance_m}m de la sede</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}