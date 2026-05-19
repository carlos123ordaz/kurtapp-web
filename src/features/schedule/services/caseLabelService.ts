import api from '../../../config/api'
import type { CaseLabel } from '../../../types'

const caseLabelService = {
  getByMonth: (year: number, month: number, areaId?: string): Promise<CaseLabel[]> => {
    if (!areaId) return Promise.resolve([])
    return api.get(`/case-labels/month/${month}/${year}/${areaId}`).then((r) => {
      const list = ((r.data as any).data ?? []) as CaseLabel[]
      return list.map((l) => ({
        ...l,
        userId: l.userId && typeof l.userId === 'object' && '_id' in (l.userId as object)
          ? String((l.userId as { _id: unknown })._id)
          : String(l.userId ?? ''),
      }))
    })
  },

  create: (data: Omit<CaseLabel, '_id'>) =>
    api.post('/case-labels', data).then((r) => ((r.data as any).data ?? r.data) as CaseLabel),

  update: (id: string, data: Partial<CaseLabel>) =>
    api.put(`/case-labels/${id}`, data).then((r) => ((r.data as any).data ?? r.data) as CaseLabel),

  delete: (id: string) => api.delete(`/case-labels/${id}`),

  clearRange: (userId: string, areaId: string, startDate: string, endDate: string) =>
    api.post('/case-labels/clear', { userId, areaId, startDate, endDate }),

  searchCaseNumbers: (q: string): Promise<string[]> =>
    api.get('/case-labels/search', { params: { q } })
      .then((r) => ((r.data as any).data ?? []) as string[]),
}

export default caseLabelService
