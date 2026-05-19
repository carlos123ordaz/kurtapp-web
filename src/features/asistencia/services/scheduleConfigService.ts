import api from '../../../config/api'
import type { ScheduleConfig } from '../../../types'

const scheduleConfigService = {
  getAll: () =>
    api.get('/schedule-configs').then((r) => r.data.data as ScheduleConfig[]),
  getByUser: (userId: string) =>
    api.get(`/schedule-configs/user/${userId}`).then((r) => r.data.data as ScheduleConfig | null),
  create: (data: Omit<ScheduleConfig, '_id'>) =>
    api.post('/schedule-configs', data).then((r) => r.data.data as ScheduleConfig),
  update: (id: string, data: Partial<ScheduleConfig>) =>
    api.put(`/schedule-configs/${id}`, data).then((r) => r.data.data as ScheduleConfig),
  delete: (id: string) => api.delete(`/schedule-configs/${id}`),
}

export default scheduleConfigService
