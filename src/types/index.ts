export interface Role {
  _id: string
  name: string
  description: string
  isAdmin: boolean
  permissions: string[]
  active: boolean
}

export interface Area {
  _id: string
  name: string
}

export interface User {
  _id: string
  name: string
  lname: string
  email: string
  dni: string
  phone?: string
  photo?: string
  position?: string
  areas?: Area[]
  sede?: Sede | string
  role?: Role | string
  active?: boolean
  avatarIdx?: number
  hasEmbedding?: boolean
  ingreso?: string
}

export interface Sede {
  _id: string
  nombre: string
  direccion: string
  latitude: number
  longitude: number
  radio: number
  active: boolean
  createdAt?: string
  updatedAt?: string
}

export interface SedeSnapshot {
  nombre?: string
  latitude?: string
  longitude?: string
  radio?: number
}

export interface AttendanceRecord {
  _id: string
  usuarioId: string
  sedeId: string
  fecha: string
  entrada?: string
  entradaEstado?: 'valida' | 'invalida' | 'en-curso'
  entradaTarde?: boolean
  salida?: string
  salidaEstado?: 'valida' | 'invalida'
  horas?: number
  distancia?: number
  estado: 'valida' | 'invalida' | 'en-curso' | 'ausente' | 'tarde' | 'remoto' | 'finde' | 'festivo' | 'futuro'
  latitude_entrada?: number
  longitude_entrada?: number
  latitude_salida?: number
  longitude_salida?: number
  valido_entrada?: boolean
  valido_salida?: boolean
  entradaISO?: string
  salidaISO?: string
  sedeSnapshot?: SedeSnapshot
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export interface TimePeriod {
  start: string
  end: string
}

export interface DaySchedule {
  day: DayOfWeek
  periods: TimePeriod[]
  isWorkday: boolean
  totalHours: number
}

export interface ScheduleConfig {
  _id?: string
  userId: string
  name: string
  description?: string
  flexibleMinutes?: number
  isFlexible?: boolean
  remoteDays?: DayOfWeek[]
  weekSchedule: DaySchedule[]
  totalWeeklyHours: number
  active: boolean
}

export interface IncidenciaAsigned {
  _id: string
  name: string
  lname: string
  email?: string
}

export interface Incidencia {
  _id: string
  tipoIncidente: string
  gradoSeveridad: string
  areaAfectada?: string
  estado: string
  fecha: string
  deadline?: string
  ubicacion?: string
  descripcion?: string
  recomendacion?: string
  asigned?: IncidenciaAsigned
  user?: IncidenciaAsigned
  imagenes?: string[]
  historialEstados?: HistorialEstado[]
  sedeNombre?: string
}

export interface HistorialEstado {
  _id?: string
  actor: string
  action: string
  from?: string
  to?: string
  note?: string
  time: string
  kind?: 'create' | 'state' | 'deadline' | 'system' | 'comment'
  assignTo?: string
}

export interface WorkType {
  _id?: string
  code: string
  label: string
  color: string
  areaId?: string
}

export interface ScheduleEntry {
  _id?: string
  userId: string
  workTypeCode: string
  areaId?: string
  startDate: string
  endDate: string
  month: number
  year: number
}

export interface CaseLabel {
  _id?: string
  userId: string
  areaId?: string
  startDate: string
  endDate: string
  month: number
  year: number
  caseNumber: string
}

export type PageId = 'dashboard' | 'asistencia' | 'incidencias' | 'sedes' | 'usuarios' | 'schedule' | 'roles' | 'vacaciones' | 'cotizaciones'
