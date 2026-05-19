import api from '../../../config/api'
import type { Incidencia } from '../../../types'

export interface IncidenciasDashboardStats {
  total: number
  porEstado: { _id: string; count: number }[]
  porSeveridad: { _id: string; count: number }[]
  porTipo: { _id: string; count: number }[]
  criticasAbiertas: number
  vencidas: number
  tiempoPromedioResolucion: number
}

const incidenciasService = {
  getAll: (params?: Record<string, string>) =>
    api.get('/incidencias', { params }).then((r) => {
      const d = r.data
      const data = (Array.isArray(d) ? d : (d.incidencias ?? d.data ?? [])) as Incidencia[]
      const total: number = Array.isArray(d) ? data.length : (d.total ?? data.length)
      return { data, total }
    }),
  getDashboardStats: (params?: Record<string, string>) =>
    api.get<IncidenciasDashboardStats>('/incidencias/dashboard-stats', { params }).then((r) => r.data),
  getById: (id: string) => api.get<Incidencia>(`/incidencias/${id}`).then((r) => r.data),
  create: (data: Partial<Incidencia>) => api.post<Incidencia>('/incidencias', data).then((r) => r.data),
  registrar: (payload: {
    fecha: string
    ubicacion: string
    areaAfectada: string
    tipoIncidente: string
    gradoSeveridad: string
    descripcion: string
    recomendacion: string
    user: string
    imagenes: File[]
  }) => {
    const fd = new FormData()
    fd.append('fecha', payload.fecha)
    fd.append('ubicacion', payload.ubicacion)
    fd.append('areaAfectada', payload.areaAfectada)
    fd.append('tipoIncidente', payload.tipoIncidente)
    fd.append('gradoSeveridad', payload.gradoSeveridad)
    fd.append('descripcion', payload.descripcion)
    fd.append('recomendacion', payload.recomendacion)
    fd.append('user', payload.user)
    payload.imagenes.forEach((f) => fd.append('imagenes', f))
    return api.post<Incidencia>('/incidencias', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data)
  },
  update: (id: string, data: Partial<Incidencia>) =>
    api.put<Incidencia>(`/incidencias/${id}`, data).then((r) => r.data),
  cambiarEstado: (id: string, data: { estado: string; deadline?: Date | null; asigned?: string | null; notasEstado?: string }) =>
    api.put(`/incidencias/${id}`, {
      estado: data.estado,
      ...(data.deadline !== undefined && { deadline: data.deadline }),
      ...(data.asigned !== undefined && { asigned: data.asigned }),
      notasEstado: data.notasEstado,
    }).then((r) => r.data),
  modificarDeadline: (id: string, data: { newDeadline: Date; notasDeadline?: string }) =>
    api.put(`/incidencias/${id}`, {
      newDeadline: data.newDeadline,
      notasDeadline: data.notasDeadline,
    }).then((r) => r.data),
  modificarAsignacion: (id: string, data: { asigned?: string | null; newDeadline?: Date; notas?: string }) =>
    api.put(`/incidencias/${id}`, {
      ...(data.asigned !== undefined && { asigned: data.asigned }),
      ...(data.newDeadline !== undefined && { newDeadline: data.newDeadline }),
      notasDeadline: data.notas ?? '',
    }).then((r) => r.data),
  addHistorial: (id: string, nota: string) =>
    api.post(`/incidencias/${id}/historial`, { nota }).then((r) => r.data),
}

export default incidenciasService
