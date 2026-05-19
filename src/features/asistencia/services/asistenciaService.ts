import api from '../../../config/api'
import type { AttendanceRecord, SedeSnapshot } from '../../../types'

const LIMA_TZ = 'America/Lima'

function formatLimaDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: LIMA_TZ }).format(date)
}

function formatLimaTime(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: LIMA_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

interface WebAsistencia {
  _id?: string
  user: string | { _id: string; name: string }
  sede?: string | { _id: string } | null
  entrada?: string
  salida?: string
  valido_entrada?: boolean
  valido_salida?: boolean
  horas_trabajadas?: number
  distancia?: number
  latitude_entrada?: number
  longitude_entrada?: number
  latitude_salida?: number
  longitude_salida?: number
  scheduleCompliance?: { isLateEntry?: boolean }
  sedeSnapshot?: SedeSnapshot
}

function mapRecord(a: WebAsistencia): AttendanceRecord {
  const usuarioId = typeof a.user === 'string' ? a.user : a.user._id
  const sedeId = !a.sede ? '' : typeof a.sede === 'string' ? a.sede : a.sede._id
  const entradaDate = a.entrada ? new Date(a.entrada) : null
  const salidaDate = a.salida ? new Date(a.salida) : null
  const fecha = entradaDate ? formatLimaDate(entradaDate) : ''
  const entrada = entradaDate ? formatLimaTime(entradaDate) : undefined
  const salida = salidaDate ? formatLimaTime(salidaDate) : undefined

  let estado: AttendanceRecord['estado'] = 'ausente'
  if (entradaDate && !salidaDate) {
    estado = 'en-curso'
  } else if (entradaDate && salidaDate) {
    if (!a.valido_entrada || a.valido_salida === false) estado = 'invalida'
    else if (a.scheduleCompliance?.isLateEntry) estado = 'tarde'
    else estado = 'valida'
  }

  return {
    _id: a._id ?? '',
    usuarioId,
    sedeId,
    fecha,
    entrada,
    salida,
    horas: a.horas_trabajadas,
    distancia: a.distancia,
    estado,
    latitude_entrada: a.latitude_entrada,
    longitude_entrada: a.longitude_entrada,
    latitude_salida: a.latitude_salida,
    longitude_salida: a.longitude_salida,
    valido_entrada: a.valido_entrada,
    valido_salida: a.valido_salida,
    entradaISO: a.entrada,
    salidaISO: a.salida,
    sedeSnapshot: a.sedeSnapshot,
  }
}

const asistenciaService = {
  getByMonth: async (year: number, month: number): Promise<AttendanceRecord[]> => {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    const r = await api.get('/attendance/range/dates', { params: { startDate, endDate } })
    const raw: WebAsistencia[] = Array.isArray(r.data) ? r.data : (r.data?.data ?? [])
    return raw.map(mapRecord)
  },

  update: (id: string, payload: { entrada?: string; salida?: string; valido_entrada?: boolean; valido_salida?: boolean }) =>
    api.put(`/attendance/${id}`, payload).then((r) => r.data),
}

export default asistenciaService
