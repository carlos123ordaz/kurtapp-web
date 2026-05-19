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
  const navigate        = useNavigate()
  const [params, setParams] = useSearchParams()

  const areaId   = params.get('areaId')   ?? ''
  const areaName = params.get('areaName') ?? ''

  const [month, setMonthState] = useState(() => parseInt(params.get('month') ?? String(new Date().getMonth())))
  const [year,  setYearState]  = useState(() => parseInt(params.get('year')  ?? String(new Date().getFullYear())))

  const [users, setUsers]         = useState<User[]>([])
  const [workTypes, setWorkTypes] = useState<WorkType[]>([])
  const [entries, setEntries]     = useState<ScheduleEntry[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set())

  const prevMonth = () => {
    if (month === 0) { setYearState((y) => { const ny = y - 1; setParams((p) => { const n = new URLSearchParams(p); n.set('year', String(ny)); n.set('month', '11'); return n }, { replace: true }); return ny }); setMonthState(11) }
    else { const nm = month - 1; setMonthState(nm); setParams((p) => { const n = new URLSearchParams(p); n.set('month', String(nm)); return n }, { replace: true }) }
  }
  const nextMonth = () => {
    if (month === 11) { setYearState((y) => { const ny = y + 1; setParams((p) => { const n = new URLSearchParams(p); n.set('year', String(ny)); n.set('month', '0'); return n }, { replace: true }); return ny }); setMonthState(0) }
    else { const nm = month + 1; setMonthState(nm); setParams((p) => { const n = new URLSearchParams(p); n.set('month', String(nm)); return n }, { replace: true }) }
  }

  const toggleCol = (code: string) => setHiddenCols((prev) => { const n = new Set(prev); n.has(code) ? n.delete(code) : n.add(code); return n })

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

  const searchedUsers = useMemo(() => {
    if (!search.trim()) return filteredUsers
    const q = search.toLowerCase()
    return filteredUsers.filter((u) => `${u.name} ${u.lname}`.toLowerCase().includes(q))
  }, [filteredUsers, search])

  const scheduleMap = useMemo(() => buildScheduleMap(entries), [entries])

  const summary = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const dayList     = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    const getE = (uid: string, day: number) => scheduleMap[`${month}-${year}-${day}-${uid}`] ?? null
    return searchedUsers.map((u) => {
      const counts: Record<string, number> = {}
      dayList.forEach((d) => {
        const entry = getE(u._id, d)
        if (entry) counts[entry.workTypeCode] = (counts[entry.workTypeCode] || 0) + 1
      })
      const total = Object.entries(counts)
        .filter(([code]) => !hiddenCols.has(code))
        .reduce((a, [, n]) => a + n, 0)
      return { user: u, counts, total }
    }).filter((row) => Object.values(row.counts).some((n) => n > 0))
  }, [searchedUsers, scheduleMap, month, year, hiddenCols])

  const colTotals = useMemo(() => {
    const t: Record<string, number> = {}
    summary.forEach((row) => Object.entries(row.counts).forEach(([code, n]) => { t[code] = (t[code] || 0) + n }))
    return t
  }, [summary])

  const grandTotal = useMemo(
    () => Object.entries(colTotals).filter(([code]) => !hiddenCols.has(code)).reduce((a, [, n]) => a + n, 0),
    [colTotals, hiddenCols],
  )

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

        <div className="page__actions">
          {/* Month navigator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)', padding: 2 }}>
            <button className="btn btn--ghost btn--icon" onClick={prevMonth}>
              <Icon name="chevron" size={14} style={{ transform: 'rotate(180deg)' }} />
            </button>
            <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, padding: '0 8px', minWidth: 130, textAlign: 'center' }}>
              {MES_NOMBRES[month]} {year}
            </span>
            <button className="btn btn--ghost btn--icon" onClick={nextMonth}>
              <Icon name="chevron" size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        {/* Toolbar */}
        <div className="card__header" style={{ flexWrap: 'wrap', gap: 12 }}>
          {/* User search */}
          <div className="filter-bar__search" style={{ minWidth: 200 }}>
            <Icon name="search" size={13} className="muted" />
            <input
              placeholder="Filtrar empleados…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: 'none', border: 0, outline: 'none', width: '100%', fontSize: 'var(--fs-sm)', color: 'var(--fg)' }}
            />
          </div>

          {/* Column toggles */}
          {workTypes.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)', fontWeight: 500, marginRight: 2 }}>Columnas:</span>
              {workTypes.map((wt) => {
                const hidden = hiddenCols.has(wt.code)
                return (
                  <button
                    key={wt.code}
                    onClick={() => toggleCol(wt.code)}
                    title={hidden ? `Mostrar ${wt.label}` : `Ocultar ${wt.label} del total`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '3px 9px', borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${hidden ? 'var(--border)' : wt.color + '66'}`,
                      background: hidden ? 'var(--surface-2)' : wt.color + '18',
                      cursor: 'pointer', fontSize: 'var(--fs-xs)', fontFamily: 'Geist Mono',
                      fontWeight: 600, color: hidden ? 'var(--fg-muted)' : wt.color,
                      opacity: hidden ? 0.55 : 1, transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: hidden ? 'var(--fg-faint)' : wt.color, flexShrink: 0 }} />
                    {wt.code}
                  </button>
                )
              })}
              {hiddenCols.size > 0 && (
                <button
                  className="btn btn--ghost"
                  style={{ padding: '3px 8px', fontSize: 'var(--fs-xs)' }}
                  onClick={() => setHiddenCols(new Set())}
                >
                  Mostrar todas
                </button>
              )}
            </div>
          )}

          {summary.length > 0 && (
            <span style={{ marginLeft: 'auto', fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)' }}>
              {summary.length} empleado{summary.length !== 1 ? 's' : ''}
              {search && ` (filtrado${summary.length !== 1 ? 's' : ''})`}
            </span>
          )}
        </div>

        {loading ? (
          <div className="empty" style={{ padding: '40px 0' }}>Cargando datos…</div>
        ) : !areaId ? (
          <div className="empty" style={{ padding: '40px 0' }}>No se especificó un área.</div>
        ) : summary.length === 0 ? (
          <div className="empty" style={{ padding: '40px 0' }}>
            {search ? 'No hay empleados que coincidan con la búsqueda.' : 'No hay actividades registradas en este mes.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 48, textAlign: 'center' }}>N°</th>
                  <th style={{ minWidth: 180 }}>Usuario</th>
                  {workTypes.map((wt) => {
                    const hidden = hiddenCols.has(wt.code)
                    return (
                      <th
                        key={wt.code}
                        style={{ textAlign: 'center', minWidth: 84, padding: '10px 8px', opacity: hidden ? 0.35 : 1, transition: 'opacity 0.15s' }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 12, height: 12, borderRadius: 3, background: hidden ? 'var(--fg-faint)' : wt.color, flexShrink: 0 }} />
                          <span className="mono" style={{ fontSize: 12, fontWeight: 700 }}>{wt.code}</span>
                          <span style={{ fontSize: 10, color: 'var(--fg-2)', fontWeight: 400, maxWidth: 76, textAlign: 'center', lineHeight: 1.3 }}>{wt.label}</span>
                          {hidden && <span style={{ fontSize: 9, color: 'var(--fg-faint)', fontStyle: 'italic' }}>oculto</span>}
                        </div>
                      </th>
                    )
                  })}
                  <th style={{ textAlign: 'center', minWidth: 72, fontWeight: 700 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((row, i) => (
                  <tr key={row.user._id}>
                    <td style={{ textAlign: 'center', color: 'var(--fg-muted)', fontSize: 'var(--fs-xs)' }}>{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{row.user.name} {row.user.lname}</td>
                    {workTypes.map((wt) => {
                      const hidden = hiddenCols.has(wt.code)
                      return (
                        <td key={wt.code} style={{ textAlign: 'center', opacity: hidden ? 0.3 : 1, transition: 'opacity 0.15s' }}>
                          {row.counts[wt.code] ? (
                            <span style={{
                              display: 'inline-block', minWidth: 28, padding: '3px 10px',
                              borderRadius: 5, background: (hidden ? '#9999' : wt.color) + '22',
                              color: hidden ? 'var(--fg-muted)' : wt.color,
                              fontWeight: 700, fontSize: 'var(--fs-sm)', fontFamily: 'Geist Mono',
                              border: `1px solid ${(hidden ? '#999' : wt.color)}44`,
                            }}>
                              {row.counts[wt.code]}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--fg-faint)', fontSize: 13 }}>—</span>
                          )}
                        </td>
                      )
                    })}
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
                  {workTypes.map((wt) => {
                    const hidden = hiddenCols.has(wt.code)
                    return (
                      <td key={wt.code} style={{ textAlign: 'center', fontFamily: 'Geist Mono', fontWeight: 700, fontSize: 'var(--fs-sm)', opacity: hidden ? 0.3 : 1, transition: 'opacity 0.15s' }}>
                        {hidden ? '—' : (colTotals[wt.code] || 0)}
                      </td>
                    )
                  })}
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
