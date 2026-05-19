import api from '../../../config/api'
import type { VacEmployee, VacArea, Solicitud } from '../data/vacacionesData'

const BASE = '/vacaciones'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface EmpleadoConDisponible extends VacEmployee {
  disponible: number
}

export interface DashboardStats {
  totalEmpleados: number
  pendientes: number
  aprobados: number
  rechazados: number
  diasEsteMes: number
  totalDisponibles: number
  ausenciasHoy: Solicitud[]
  recientes: Solicitud[]
  bajosaldo: EmpleadoConDisponible[]
}

export interface ReportesData {
  porTipo: Record<string, { count: number; dias: number }>
  porArea: Record<string, { count: number; dias: number }>
  porMes: Record<string, { count: number; dias: number }>
  balanceSummary: EmpleadoConDisponible[]
}

export interface TipoHabilitado {
  id: string
  enabled: boolean
}

export interface PoliticaConfig {
  diasBase:         number
  periodo:          'aniversario' | 'calendario' | 'fiscal'
  anticipacion:     number
  maxBloque:        number
  adelantar:        boolean
  doblePaso:        boolean
  autoAprobar:      boolean
  notifEmail:       boolean
  notifSlack:       boolean
  tiposHabilitados: TipoHabilitado[]
}

export interface CreateSolicitudInput {
  empId: string
  tipo: string
  desde: string
  hasta: string
  motivo: string
  responsableId?: string
  medioDia?: boolean
}

// ─── Áreas ────────────────────────────────────────────────────────────────────

export function apiGetAreas(): Promise<VacArea[]> {
  return api.get(`${BASE}/areas`).then(r => r.data)
}

// ─── Empleados ────────────────────────────────────────────────────────────────

export function apiGetEmpleados(params?: { area?: string; search?: string }): Promise<VacEmployee[]> {
  return api.get(`${BASE}/empleados`, { params }).then(r => r.data)
}

export function apiGetEmpleadoById(id: string): Promise<VacEmployee> {
  return api.get(`${BASE}/empleados/${id}`).then(r => r.data)
}

export function apiUpdateEmpleado(id: string, data: { vacSaldoTotal?: number; vacLeadId?: string | null }): Promise<VacEmployee> {
  return api.put(`${BASE}/empleados/${id}`, data).then(r => r.data)
}

export function apiGetEmpleadoHistorial(id: string): Promise<Solicitud[]> {
  return api.get(`${BASE}/empleados/${id}/historial`).then(r => r.data)
}

// ─── Solicitudes ──────────────────────────────────────────────────────────────

export function apiGetSolicitudes(params?: {
  estado?: string
  empId?: string
  tipo?: string
  desde?: string
  hasta?: string
}): Promise<Solicitud[]> {
  return api.get(`${BASE}/solicitudes`, { params }).then(r => r.data)
}

export function apiGetSolicitudById(id: string): Promise<Solicitud> {
  return api.get(`${BASE}/solicitudes/${id}`).then(r => r.data)
}

export function apiCreateSolicitud(data: CreateSolicitudInput): Promise<Solicitud> {
  return api.post(`${BASE}/solicitudes`, data).then(r => r.data)
}

export function apiAprobarSolicitud(id: string, aprobadorId?: string): Promise<Solicitud> {
  return api.put(`${BASE}/solicitudes/${id}/aprobar`, { aprobadorId }).then(r => r.data)
}

export function apiRechazarSolicitud(id: string, motivo: string): Promise<Solicitud> {
  return api.put(`${BASE}/solicitudes/${id}/rechazar`, { motivo }).then(r => r.data)
}

export function apiDeleteSolicitud(id: string): Promise<{ deleted: string }> {
  return api.delete(`${BASE}/solicitudes/${id}`).then(r => r.data)
}

// ─── Analítica ────────────────────────────────────────────────────────────────

export function apiGetDashboard(): Promise<DashboardStats> {
  return api.get(`${BASE}/dashboard`).then(r => r.data)
}

export function apiGetCalendario(year: number, month: number): Promise<Solicitud[]> {
  return api.get(`${BASE}/calendario`, { params: { year, month } }).then(r => r.data)
}

export function apiGetReportes(): Promise<ReportesData> {
  return api.get(`${BASE}/reportes`).then(r => r.data)
}

// ─── Feriados ─────────────────────────────────────────────────────────────────

export function apiGetFeriados(year?: number): Promise<Record<string, string>> {
  return api.get(`${BASE}/feriados`, { params: year ? { year } : {} }).then(r => r.data)
}

export function apiCreateFeriado(iso: string, nombre: string): Promise<{ iso: string; nombre: string }> {
  return api.post(`${BASE}/feriados`, { iso, nombre }).then(r => r.data)
}

export function apiDeleteFeriado(iso: string): Promise<{ deleted: string }> {
  return api.delete(`${BASE}/feriados/${iso}`).then(r => r.data)
}

// ─── Utilidades (admin) ───────────────────────────────────────────────────────

export function apiSeedData(force = false) {
  return api.post(`${BASE}/seed${force ? '?force=true' : ''}`).then(r => r.data)
}

// ─── Políticas ────────────────────────────────────────────────────────────────

export function apiGetPoliticas(): Promise<PoliticaConfig> {
  return api.get(`${BASE}/politicas`).then(r => r.data)
}

export function apiUpdatePoliticas(config: PoliticaConfig): Promise<PoliticaConfig> {
  return api.put(`${BASE}/politicas`, config).then(r => r.data)
}
