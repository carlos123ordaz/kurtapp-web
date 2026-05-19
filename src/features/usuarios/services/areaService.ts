import api from '../../../config/api'
import type { Area } from '../../../types'

const areaService = {
  getAll: () =>
    api.get('/areas').then((r) => {
      const d = r.data
      return (Array.isArray(d) ? d : (d.data ?? d.areas ?? [])) as Area[]
    }),
}

export default areaService
