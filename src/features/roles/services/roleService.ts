import api from '../../../config/api'
import type { Role } from '../../../types'

const roleService = {
  getAll: () => api.get('/roles').then((r) => {
    const d = r.data
    return (Array.isArray(d) ? d : (d.roles ?? d.data ?? [])) as Role[]
  }),
  getById: (id: string) => api.get<Role>(`/roles/${id}`).then((r) => r.data),
  create: (data: Partial<Role>) => api.post<Role>('/roles', data).then((r) => r.data),
  update: (id: string, data: Partial<Role>) => api.put<Role>(`/roles/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/roles/${id}`),
}

export default roleService
