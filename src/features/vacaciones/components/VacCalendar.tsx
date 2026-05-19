import React, { useState } from 'react'
import { Icon } from '../../../components/ui'
import {
  TIPOS, getTipo, fmtDate,
  daysInMonth, isoDate, MESES_ES, DIAS_ES,
  type Solicitud, type VacEmployee, type VacArea,
} from '../data/vacacionesData'
import { VacAvatar, TipoChip } from './VacShared'

interface Props {
  solicitudes: Solicitud[]
  employees: VacEmployee[]
  areas: VacArea[]
  feriados: Record<string, string>
  onOpenRequest: (s: Solicitud) => void
}

const CAL_PAGE_SIZE = 15

export function VacCalendar({ solicitudes, employees, areas, feriados, onOpenRequest }: Props) {
  const today     = new Date()
  const [year,       setYear]       = useState(today.getFullYear())
  const [month,      setMonth]      = useState(today.getMonth())
  const [filterArea, setFilterArea] = useState('all')
  const [empSearch,  setEmpSearch]  = useState('')
  const [empPage,    setEmpPage]    = useState(1)

  const dim  = daysInMonth(year, month)
  const days = Array.from({ length: dim }, (_, i) => i + 1)
  const tY   = today.getFullYear()
  const tM   = today.getMonth() + 1
  const tD   = today.getDate()

  const areaFilteredEmps = filterArea === 'all'
    ? employees
    : employees.filter(e => e.area === filterArea)

  const visibleEmps = empSearch.trim()
    ? areaFilteredEmps.filter(e => e.name.toLowerCase().includes(empSearch.toLowerCase()))
    : areaFilteredEmps

  const empTotalPages = Math.max(1, Math.ceil(visibleEmps.length / CAL_PAGE_SIZE))
  const paginatedEmps = visibleEmps.slice((empPage - 1) * CAL_PAGE_SIZE, empPage * CAL_PAGE_SIZE)

  const monthStart = isoDate(year, month, 1)
  const monthEnd   = isoDate(year, month, dim)
  const visibleIds  = new Set(visibleEmps.map(e => e.id))

  const visibles = solicitudes.filter(s => {
    if (s.estado === 'rechazado') return false
    if (!visibleIds.has(s.empId)) return false
    return !(s.hasta < monthStart || s.desde > monthEnd)
  })

  const prevMonth = () => { setEmpPage(1); if (month === 0) { setMonth(11); setYear(year - 1) } else setMonth(month - 1) }
  const nextMonth = () => { setEmpPage(1); if (month === 11) { setMonth(0); setYear(year + 1) } else setMonth(month + 1) }
  const goToday   = () => { setEmpPage(1); setYear(today.getFullYear()); setMonth(today.getMonth()) }

  return (
    <div className="page" style={{ gap: 18, paddingBottom: 60 }}>
      <div className="page__header">
        <div>
          <h1 className="page__title">Calendario de ausencias</h1>
          <p className="page__desc">Vista mensual del equipo — {MESES_ES[month]} {year}</p>
        </div>
        <div className="page__actions">
          <div className="vac-date-pill">
            <button className="vac-date-pill__arrow" onClick={prevMonth}><Icon name="chevLeft" size={14} /></button>
            <span className="vac-date-pill__label">{MESES_ES[month]} {year}</span>
            <button className="vac-date-pill__arrow" onClick={nextMonth}><Icon name="chevron" size={14} /></button>
          </div>
          <button className="btn" onClick={goToday}>Hoy</button>
          <button className="btn"><Icon name="download" size={14} /> Exportar</button>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {/* Toolbar */}
        <div className="vac-cal-toolbar">
          <select className="select" style={{ width: 200 }} value={filterArea} onChange={e => { setFilterArea(e.target.value); setEmpPage(1) }}>
            <option value="all">Todas las áreas</option>
            {areas.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
          <div className="filter-bar__search" style={{ width: 200, minWidth: 0 }}>
            <Icon name="search" size={13} />
            <input
              placeholder="Buscar colaborador…"
              value={empSearch}
              onChange={e => { setEmpSearch(e.target.value); setEmpPage(1) }}
            />
          </div>
          <div className="vac-legend">
            {Object.values(TIPOS).map(t => (
              <div key={t.id} className="vac-legend-item">
                <div className="vac-legend-swatch" style={{ background: t.color }} />
                {t.label}
              </div>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{visibleEmps.length} colaboradores · {visibles.length} ausencias</span>
        </div>

        {/* Grid */}
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 280 + dim * 36 }}>
            {/* Header row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `280px repeat(${dim}, 1fr)`,
              position: 'sticky', top: 0, zIndex: 3,
              background: 'var(--surface-2)',
              borderBottom: '1px solid var(--border)',
            }}>
              <div style={{ padding: '10px 14px', fontSize: 11, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, borderRight: '1px solid var(--border-soft)' }}>
                Empleado
              </div>
              {days.map(d => {
                const dow    = new Date(year, month, d).getDay()
                const isWE   = dow === 0 || dow === 6
                const isTod  = year === tY && month === (tM - 1) && d === tD
                const isoStr = isoDate(year, month, d)
                const isFer  = !!feriados[isoStr]
                return (
                  <div key={d}
                    className={`vac-cal-day-head${isWE ? ' vac-cal-day-head--weekend' : ''}${isTod ? ' vac-cal-day-head--today' : ''}`}
                    style={{ borderRight: '1px solid var(--border-soft)' }}
                    title={isFer ? feriados[isoStr] : undefined}
                  >
                    <div>{DIAS_ES[dow]}</div>
                    <div className={`vac-cal-day-head__num${isFer ? ' vac-cal-day-head__num--holiday' : ''}`}>{d}</div>
                  </div>
                )
              })}
            </div>

            {/* Employee rows */}
            {paginatedEmps.map(emp => {
              const empReqs = visibles.filter(s => s.empId === emp.id)
              return (
                <div key={emp.id} style={{ display: 'grid', gridTemplateColumns: '280px 1fr', position: 'relative', borderBottom: '1px solid var(--border-soft)' }}>
                  <div className="vac-cal-emp">
                    <VacAvatar emp={emp} size="sm" />
                    <div>
                      <div className="vac-cal-emp__name">{emp.name}</div>
                      <div className="vac-cal-emp__role">{emp.role}</div>
                    </div>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${dim}, 1fr)`, height: 56 }}>
                      {days.map(d => {
                        const dow    = new Date(year, month, d).getDay()
                        const isWE   = dow === 0 || dow === 6
                        const isTod  = year === tY && month === (tM - 1) && d === tD
                        const isoStr = isoDate(year, month, d)
                        const isFer  = !!feriados[isoStr]
                        return (
                          <div key={d} style={{
                            background: isWE || isFer ? 'var(--bg-2)' : 'var(--surface)',
                            borderRight: '1px solid var(--border-soft)',
                            boxShadow: isTod ? 'inset 0 0 0 1px var(--accent-soft)' : 'none',
                          }} />
                        )
                      })}
                    </div>
                    {/* Absence bars overlay */}
                    {empReqs.map(s => {
                      const start = s.desde < monthStart ? 1 : Number(s.desde.slice(8, 10))
                      const end   = s.hasta > monthEnd   ? dim : Number(s.hasta.slice(8, 10))
                      const tipo    = getTipo(s.tipo)!
                      const pending = s.estado === 'pendiente'
                      const barCls  = pending ? 'vac-cal-bar vac-cal-bar--pending' : `vac-cal-bar vac-cal-bar--${tipo.barCls}`
                      const leftPct  = ((start - 1) / dim) * 100
                      const widthPct = ((end - start + 1) / dim) * 100
                      const iconName = pending ? 'clock' : tipo.id === 'medica' ? 'alert' : tipo.id === 'cumple' ? 'flag' : 'calendarCheck'
                      return (
                        <div
                          key={s.id}
                          className={barCls}
                          onClick={() => onOpenRequest(s)}
                          style={{ left: `calc(${leftPct}% + 3px)`, width: `calc(${widthPct}% - 6px)` }}
                          title={`${emp.name} — ${tipo.label} · ${s.dias}d`}
                        >
                          <Icon name={iconName} size={11} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {tipo.label}{(end - start) >= 1 ? ` · ${s.dias}d` : ''}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Paginación empleados */}
        {empTotalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid var(--border-soft)', fontSize: 'var(--fs-sm)' }}>
            <span style={{ color: 'var(--fg-muted)' }}>
              Página {empPage} de {empTotalPages} · {visibleEmps.length} colaboradores
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn--ghost btn--sm" disabled={empPage === 1} onClick={() => setEmpPage(p => p - 1)}>
                Anterior
              </button>
              {Array.from({ length: empTotalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === empTotalPages || Math.abs(n - empPage) <= 1)
                .reduce<(number | '...')[]>((acc, n, i, arr) => {
                  if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('...')
                  acc.push(n)
                  return acc
                }, [])
                .map((n, i) =>
                  n === '...'
                    ? <span key={`e-${i}`} style={{ padding: '0 4px', color: 'var(--fg-muted)' }}>…</span>
                    : <button
                        key={n}
                        className={`btn btn--ghost btn--sm${empPage === n ? ' btn--active' : ''}`}
                        style={empPage === n ? { background: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 600 } : {}}
                        onClick={() => setEmpPage(n as number)}
                      >{n}</button>
                )
              }
              <button className="btn btn--ghost btn--sm" disabled={empPage >= empTotalPages} onClick={() => setEmpPage(p => p + 1)}>
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
