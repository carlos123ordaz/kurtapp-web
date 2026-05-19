import api from '../../../config/api'
import type { ScheduleEntry } from '../../../types'

const scheduleService = {
  // month is 0-indexed (same as JS Date.getMonth())
  getByMonth: (year: number, month: number, areaId?: string) => {
    if (!areaId) return Promise.resolve([] as ScheduleEntry[])
    return api.get(`/assignments/month/${month}/${year}/${areaId}`).then((r) => {
      const d = r.data
      const list = (Array.isArray(d) ? d : (d.data ?? d.assignments ?? [])) as ScheduleEntry[]
      return list.map((e) => ({
        ...e,
        userId: e.userId && typeof e.userId === 'object' && '_id' in (e.userId as object)
          ? String((e.userId as { _id: unknown })._id)
          : String(e.userId ?? ''),
      }))
    })
  },

  create: (data: Omit<ScheduleEntry, '_id'>) =>
    api.post('/assignments', data).then((r) => ((r.data as any).data ?? r.data) as ScheduleEntry),

  update: (id: string, data: Partial<ScheduleEntry>) =>
    api.put(`/assignments/${id}`, data).then((r) => ((r.data as any).data ?? r.data) as ScheduleEntry),

  delete: (id: string) => api.delete(`/assignments/${id}`),

  deleteByUserAndMonth: (userId: string, month: number, year: number) =>
    api.delete(`/assignments/user/${userId}/${month}/${year}`),
}

export default scheduleService
