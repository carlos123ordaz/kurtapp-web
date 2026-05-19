export interface TipoAusencia {
  id: string
  label: string
  color: string
  bg: string
  barCls: string
  descuenta: boolean
  gozaSueldo: boolean
}

export const TIPOS: Record<string, TipoAusencia> = {
  vacaciones:         { id: 'vacaciones',      label: 'Vacaciones',         color: 'var(--type-vacaciones)',       bg: 'var(--type-vacaciones-bg)',       barCls: 'vac',      descuenta: true,  gozaSueldo: true  },
  'permiso-goce':    { id: 'permiso-goce',    label: 'Permiso con goce',   color: 'var(--type-permiso-goce)',     bg: 'var(--type-permiso-goce-bg)',     barCls: 'pgoce',    descuenta: false, gozaSueldo: true  },
  'permiso-singoce': { id: 'permiso-singoce', label: 'Permiso sin goce',   color: 'var(--type-permiso-singoce)',  bg: 'var(--type-permiso-singoce-bg)',  barCls: 'psingoce', descuenta: false, gozaSueldo: false },
  medica:            { id: 'medica',          label: 'Licencia médica',    color: 'var(--type-medica)',           bg: 'var(--type-medica-bg)',           barCls: 'medica',   descuenta: false, gozaSueldo: true  },
  cumple:            { id: 'cumple',          label: 'Día por cumpleaños', color: 'var(--type-cumple)',           bg: 'var(--type-cumple-bg)',           barCls: 'cumple',   descuenta: false, gozaSueldo: true  },
}

export interface VacArea {
  id: string
  label: string
  color: string
}

export let AREAS: VacArea[] = []

export function setAreasCache(areas: VacArea[]): void {
  AREAS = areas
}

export interface VacEmployee {
  id: string
  name: string
  role: string
  area: string
  lead: string | null
  avatar: string
  ingreso: string
  saldoTotal: number
  tomados: number
  pendientes: number
  userId?: string | null
}

export let EMPLOYEES: VacEmployee[] = []

export function setEmployeesCache(emps: VacEmployee[]): void {
  EMPLOYEES = emps
}

export interface Solicitud {
  id: string
  empId: string
  tipo: string
  desde: string
  hasta: string
  dias: number
  medioDia?: boolean
  estado: 'pendiente' | 'aprobado' | 'rechazado'
  motivo: string
  solicitada: string
  aprobador: string
  responsableId?: string | null
  nivel?: string
  aprobada?: string
  motivoRechazo?: string
}

export let FERIADOS: Record<string, string> = {}

export function setFeriadosCache(feriados: Record<string, string>): void {
  FERIADOS = feriados
}

export const MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
export const DIAS_ES  = ['D','L','M','X','J','V','S']

export function getEmp(id: string): VacEmployee | undefined {
  return EMPLOYEES.find(e => e.id === id)
}

export function getTipo(id: string): TipoAusencia | undefined {
  return TIPOS[id]
}

export function getArea(id: string): VacArea | undefined {
  return AREAS.find(a => a.id === id)
}

export function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase()
}

export function fmtDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`
}

export function fmtDateLong(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`
}

export function daysInMonth(year: number, monthIdx: number): number {
  return new Date(year, monthIdx + 1, 0).getDate()
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function isoDate(y: number, m: number, d: number): string {
  return `${y}-${pad2(m + 1)}-${pad2(d)}`
}

export function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export function countWorkdays(desde: string, hasta: string): number {
  const a = new Date(desde + 'T12:00:00')
  const b = new Date(hasta + 'T12:00:00')
  let n = 0
  for (let d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) {
    const w = d.getDay()
    const iso = isoDate(d.getFullYear(), d.getMonth(), d.getDate())
    if (w !== 0 && w !== 6 && !FERIADOS[iso]) n++
  }
  return n
}

// Devuelve true si el empleado ya cumplió al menos 1 año desde su fecha de ingreso.
export function cumplioPrimerAnio(emp: VacEmployee): boolean {
  if (!emp.ingreso) return false
  const ingreso = new Date(emp.ingreso + 'T12:00:00')
  return (Date.now() - ingreso.getTime()) / (1000 * 60 * 60 * 24 * 365.25) >= 1
}

// Días disponibles reales: si no cumplió el año, el saldo ganado es 0 (puede ser negativo = adelanto).
export function calcDisponible(emp: VacEmployee): number {
  const saldoGanado = cumplioPrimerAnio(emp) ? emp.saldoTotal : 0
  return saldoGanado - emp.tomados - emp.pendientes
}

export function fmtDias(dias: number): string {
  return dias === 0.5 ? '½d' : `${dias}d`
}
