import api from '../../../config/api'
import type { WorkType } from '../../../types'

const workTypeService = {
  getAll: (areaId: string) =>
    api.get('/work-types', { params: { areaId } }).then((r) => {
      const d = r.data
      return (Array.isArray(d) ? d : (d.data ?? [])) as WorkType[]
    }),
  create: (data: WorkType) =>
    api.post('/work-types', data).then((r) => ((r.data as any).data ?? r.data) as WorkType),
  update: (code: string, data: Partial<WorkType>) =>
    api.put(`/work-types/${code}`, data).then((r) => ((r.data as any).data ?? r.data) as WorkType),
  delete: (code: string, areaId: string) =>
    api.delete(`/work-types/${code}`, { params: { areaId } }),
}

export default workTypeService
