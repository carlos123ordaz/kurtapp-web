export const PERMISSION_KEYS = [
  'dashboard',
  'usuarios',
  'sedes',
  'incidencias',
  'schedule',
  'asistencia',
  'roles',
  'vacaciones',
] as const

export type PermissionKey = typeof PERMISSION_KEYS[number]

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  dashboard: 'Dashboard',
  usuarios: 'Usuarios',
  sedes: 'Sedes',
  incidencias: 'Incidencias',
  schedule: 'Control de Actividad',
  asistencia: 'Asistencia',
  roles: 'Gestión de Roles',
  vacaciones: 'Vacaciones',
}
