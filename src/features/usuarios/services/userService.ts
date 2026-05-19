import api from '../../../config/api'
import type { User } from '../../../types'

const userService = {
  getAll: () => api.get('/users').then((r) => {
    const d = r.data
    return (Array.isArray(d) ? d : (d.usuarios ?? d.data ?? [])) as User[]
  }),
  query: (params: Record<string, string>) => api.get('/users', { params }).then((r) => {
    const d = r.data
    const data = (Array.isArray(d) ? d : (d.usuarios ?? d.data ?? [])) as User[]
    const total: number = Array.isArray(d) ? data.length : (d.total ?? data.length)
    return { data, total }
  }),
  getById: (id: string) => api.get<User>(`/users/${id}`).then((r) => r.data),
  create: (data: Partial<User>) => api.post<User>('/users', data).then((r) => r.data),
  update: (id: string, data: Partial<User>) => api.put<User>(`/users/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/users/${id}`),
  syncBitrix: () => api.post<{
    total_bitrix: number
    imported: number
    skipped: number
    skipped_detail: { name: string; reason: string }[]
    deactivated: number
    deactivated_detail: { name: string }[]
  }>('/users/sync-bitrix').then((r) => r.data),
}

export default userService
