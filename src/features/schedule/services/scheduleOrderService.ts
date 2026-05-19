import api from '../../../config/api'

const scheduleOrderService = {
  get: (areaId: string): Promise<string[]> =>
    api.get('/schedule-order', { params: { areaId } })
      .then((r) => ((r.data as any).data ?? []) as string[]),

  save: (areaId: string, order: string[]): Promise<void> =>
    api.put('/schedule-order', { order }, { params: { areaId } }).then(() => undefined),
}

export default scheduleOrderService
