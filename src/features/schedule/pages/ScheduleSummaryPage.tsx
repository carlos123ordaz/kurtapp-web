import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Icon } from '../../../components/ui'
import type { User, WorkType, ScheduleEntry } from '../../../types'
import userService from '../../usuarios/services/userService'
import scheduleService from '../services/scheduleService'
import workTypeService from '../services/workTypeService'

const MES_NOMBRES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

type ScheduleMap = Record<string, ScheduleEntry>

function normalizeUserId(userId: unknown): string {
  if (userId && typeof userId === 'object' && '_id' in (userId as object))
    return String((userId as { _id: unknown })._id)
  return String(userId ?? '')
}

function buildScheduleMap(entries: ScheduleEntry[]): ScheduleMap {
  const map: ScheduleMap = {}
  entries.forEach((e) => {
    const uid = normalizeUserId(e.userId)
    const cur = new Date(e.startDate)
    const end = new Date(e.endDate)
    while (cur <= end) {
      map[`${cur.getMonth()}-${cur.getFullYear()}-${cur.getDate()}-${uid}`] = { ...e, userId: uid }
      cur.setDate(cur.getDate() + 1)
    }
  })
  return map
}

export const ScheduleSummaryPage: React.FC = () => {
  const navigate     = useNavigate()
  const [params]     = useSearchParams()

  const month    = parseInt(params.get('month')    ?? String(new Date().getMonth()))
  const year     = parseInt(params.get('year')     ?? String(new Date().getFullYear()))
  const areaId   = params.get('areaId')   ?? ''
  const areaName = params.get('areaName') ?? ''

  const [users, setUsers]         = useState<User[]>([])
  const [workTypes, setWorkTypes] = useState<WorkType[]>([])
  const [entries, setEntries]     = useState<ScheduleEntry[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    if (!areaId) { setLoading(false); return }
    setLoading(true)
    Promise.all([
      userService.getAll(),
      workTypeService.getAll(areaId),
      scheduleService.getByMonth(year, month, areaId),
    ]).then(([u, wt, e]) => {
      setUsers(u); setWorkTypes(wt); setEntries(e)
    }).finally(() => setLoading(false))
  }, [month, year, areaId])

  const filteredUsers = useMemo(
    () => users.filter((u) => !areaId || u.areas?.some((a) => a._id === areaId)),
    [users, areaId],
  )

  const scheduleMap = useMemo(() => buildScheduleMap(entries), [entries])

  const summary = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const dayList     = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    const getE = (uid: string, day: number) => scheduleMap[`${month}-${year}-${day}-${uid}`] ?? null
    return filteredUsers.map((u) => {
      const counts: Record<string, number> = {}
      let total = 0
      dayList.forEach((d) => {
        const entry = getE(u._id, d)
        if (entry) { counts[entry.workTypeCode] = (counts[entry.workTypeCode] || 0) + 1; total++ }
      })
      return { user: u, counts, total }
    }).filter((row) => row.total > 0)
  }, [filteredUsers, scheduleMap, month, year])

  const colTotals = useMemo(() => {
    const t: Record<string, number> = {}
    summary.forEach((row) => Object.entries(row.counts).forEach(([code, n]) => { t[code] = (t[code] || 0) + n }))
    return t
  }, [summary])

  const grandTotal = Object.values(colTotals).reduce((a, b) => a + b, 0)

  return (
    <div className="page">
      <div className="page__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="btn btn--ghost btn--icon"
            onClick={() => navigate('/schedule')}
            title="Volver al calendario"
          >
            <Icon name="chevron" size={18} style={{ transform: 'rotate(180deg)' }} />
          </button>
          <div>
            <h1 className="page__title">Resumen de actividades</h1>
            <div className="page__desc">
              {MES_NOMBRES[month]} {year}
              {areaName && <span style={{ color: 'var(--fg-muted)', marginLeft: 8 }}>· {areaName}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty" style={{ padding: '40px 0' }}>Cargando datos…</div>
        ) : !areaId ? (
          <div className="empty" style={{ padding: '40px 0' }}>No se especificó un área.</div>
        ) : summary.length === 0 ? (
          <div className="empty" style={{ padding: '40px 0' }}>No hay actividades registradas en este mes.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 48, textAlign: 'center' }}>N°</th>
                  <th style={{ minWidth: 180 }}>Usuario</th>
                  {workTypes.map((wt) => (
                    <th key={wt.code} style={{ textAlign: 'center', minWidth: 84, padding: '10px 8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 12, height: 12, borderRadius: 3, background: wt.color, flexShrink: 0 }} />
                        <span className="mono" style={{ fontSize: 12, fontWeight: 700 }}>{wt.code}</span>
                        <span style={{ fontSize: 10, color: 'var(--fg-2)', fontWeight: 400, maxWidth: 76, textAlign: 'center', lineHeight: 1.3 }}>{wt.label}</span>
                      </div>
                    </th>
                  ))}
                  <th style={{ textAlign: 'center', minWidth: 72, fontWeight: 700 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((row, i) => (
                  <tr key={row.user._id}>
                    <td style={{ textAlign: 'center', color: 'var(--fg-muted)', fontSize: 'var(--fs-xs)' }}>{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{row.user.name} {row.user.lname}</td>
                    {workTypes.map((wt) => (
                      <td key={wt.code} style={{ textAlign: 'center' }}>
                        {row.counts[wt.code] ? (
                          <span style={{
                            display: 'inline-block', minWidth: 28, padding: '3px 10px',
                            borderRadius: 5, background: wt.color + '22', color: wt.color,
                            fontWeight: 700, fontSize: 'var(--fs-sm)', fontFamily: 'Geist Mono',
                            border: `1px solid ${wt.color}44`,
                          }}>
                            {row.counts[wt.code]}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--fg-faint)', fontSize: 13 }}>—</span>
                        )}
                      </td>
                    ))}
                    <td style={{ textAlign: 'center', fontWeight: 700, fontFamily: 'Geist Mono', fontSize: 'var(--fs-sm)' }}>
                      {row.total}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--surface-2)' }}>
                  <td colSpan={2} style={{ padding: '10px 16px', fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--fg-2)', textAlign: 'right' }}>
                    Total
                  </td>
                  {workTypes.map((wt) => (
                    <td key={wt.code} style={{ textAlign: 'center', fontFamily: 'Geist Mono', fontWeight: 700, fontSize: 'var(--fs-sm)' }}>
                      {colTotals[wt.code] || 0}
                    </td>
                  ))}
                  <td style={{ textAlign: 'center', fontFamily: 'Geist Mono', fontWeight: 700, fontSize: 'var(--fs-sm)' }}>
                    {grandTotal}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
