/** Ley chilena: 15 días hábiles por año = 1.25 días por mes trabajado */
export function c_VacacionesAcumuladas(hireDate: string | null): number {
  if (!hireDate) return 0
  const inicio = new Date(hireDate)
  const hoy = new Date()
  if (isNaN(inicio.getTime()) || inicio > hoy) return 0
  const meses =
    (hoy.getFullYear() - inicio.getFullYear()) * 12 +
    (hoy.getMonth() - inicio.getMonth())
  return Math.floor(meses * 1.25)
}

/** Fuente única de verdad: manual si existe, si no cálculo por ley */
export function diasDisponibles(
  vacationDaysManual: number | null,
  hireDate: string | null
): number {
  return vacationDaysManual ?? c_VacacionesAcumuladas(hireDate)
}