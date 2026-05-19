import { useState, useEffect } from 'react'
import { Icon } from '../../../components/ui'
import {
  MESES_ES,
  getEmp, getArea, getTipo, fmtDateLong, isoDate, daysInMonth,
  calcDisponible, cumplioPrimerAnio, fmtDias,
  type Solicitud, type VacEmployee, type VacArea,
} from '../data/vacacionesData'
import { VacAvatar, EmpCell, TipoChip, StatusChip, SaldoBar } from './VacShared'

// ─── Employee list ────────────────────────────────────────────────────────────
interface ListProps {
  employees?: VacEmployee[]
  areas?: VacArea[]
  onOpenEmp: (id: string) => void
  onNewRequest: () => void
}

const PAGE_SIZE = 15

export function VacEmpleados({ employees: empsProp, areas = [], onOpenEmp, onNewRequest }: ListProps) {
  const [search, setSearch] = useState('')
  const [areaF,  setAreaF]  = useState('all')
  const [page,   setPage]   = useState(1)

  const empList = empsProp ?? []

  // Resetear página cuando cambia el filtro
  useEffect(() => { setPage(1) }, [search, areaF])

  const filtered = empList
    .filter(e => areaF === 'all' || e.area === areaF)
    .filter(e => !search.trim() || e.name.toLowerCase().includes(search.toLowerCase()) || e.role.toLowerCase().includes(search.toLowerCase()))

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="page" style={{ gap: 18 }}>
      <div className="page__header">
        <div>
          <h1 className="page__title">Empleados</h1>
          <p className="page__desc">Saldo de vacaciones por colaborador.</p>
        </div>
        <div className="page__actions">
          <button className="btn"><Icon name="download" size={14} /> Exportar saldos</button>
          <button className="btn btn--accent" onClick={onNewRequest}>
            <Icon name="plus" size={14} /> Nueva solicitud
          </button>
        </div>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="filter-bar__search">
            <Icon name="search" size={14} />
            <input placeholder="Buscar por nombre o cargo..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="select" style={{ width: 220 }} value={areaF} onChange={e => setAreaF(e.target.value)}>
            <option value="all">Todas las áreas</option>
            {areas.map((a, i) => <option key={`${a.id}-${i}`} value={a.id}>{a.label}</option>)}
          </select>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--fg-muted)' }}>{filtered.length} colaboradores</span>
        </div>

        <div className="card__body--flush">
          <table className="tbl">
            <thead>
              <tr>
                <th>Colaborador</th>
                <th>Área</th>
                <th>Ingreso</th>
                <th>Saldo</th>
                <th style={{ textAlign: 'right' }}>Disponible</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {paged.map(emp => {
                const area        = areas.find(a => a.id === emp.area)
                const dispo       = calcDisponible(emp)
                const sinAnio     = !cumplioPrimerAnio(emp) && !!emp.ingreso
                const critico     = !sinAnio && dispo >= 22
                return (
                  <tr key={emp.id} onClick={() => onOpenEmp(emp.id)}>
                    <td><EmpCell emp={emp} /></td>
                    <td>
                      {area && (
                        <div className="vac-area-tag">
                          <div className="vac-area-tag__swatch" style={{ background: area.color }} />
                          {area.label}
                        </div>
                      )}
                    </td>
                    <td style={{ color: emp.ingreso ? 'var(--fg-muted)' : 'var(--danger)', fontVariantNumeric: 'tabular-nums' }}>
                      {emp.ingreso ? fmtDateLong(emp.ingreso) : '— Sin fecha de ingreso'}
                      {sinAnio && <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--warning)', fontWeight: 600 }}>· &lt;1 año</span>}
                    </td>
                    <td style={{ minWidth: 160 }}>
                      <SaldoBar total={emp.saldoTotal} tomados={emp.tomados} pendientes={emp.pendientes} />
                      <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 4 }}>
                        {emp.tomados} tomados · {emp.pendientes} pendientes · de {emp.saldoTotal}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: dispo < 0 ? 'var(--danger)' : critico ? 'var(--warning)' : 'var(--fg)' }}>
                        {dispo}d
                      </div>
                      {sinAnio && dispo < 0 && <div style={{ fontSize: 11, color: 'var(--danger)' }}>Adelanto</div>}
                      {!sinAnio && critico && <div style={{ fontSize: 11, color: 'var(--warning)' }}>Por vencer</div>}
                    </td>
                    <td><Icon name="chevron" size={16} style={{ color: 'var(--fg-muted)' }} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 18px', borderTop: '1px solid var(--border-soft)',
            fontSize: 13,
          }}>
            <span style={{ color: 'var(--fg-muted)' }}>
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                className="btn btn--sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <Icon name="chevLeft" size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | 'ellipsis')[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('ellipsis')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) =>
                  p === 'ellipsis'
                    ? <span key={`e${i}`} style={{ padding: '0 4px', color: 'var(--fg-muted)' }}>…</span>
                    : <button
                        key={p}
                        className={`btn btn--sm${p === page ? ' btn--accent' : ''}`}
                        onClick={() => setPage(p as number)}
                        style={{ minWidth: 32 }}
                      >
                        {p}
                      </button>
                )}
              <button
                className="btn btn--sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <Icon name="chevron" size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Employee detail ──────────────────────────────────────────────────────────
interface DetalleProps {
  empId: string
  solicitudes: Solicitud[]
  onBack: () => void
  onOpenRequest: (s: Solicitud) => void
  onNewRequest: () => void
}

export function VacEmpleadoDetalle({ empId, solicitudes, onBack, onOpenRequest, onNewRequest }: DetalleProps) {
  const emp       = getEmp(empId)
  if (!emp) return null
  const area      = getArea(emp.area)
  const lead      = emp.lead ? getEmp(emp.lead) : null
  const dispo     = calcDisponible(emp)
  const sinAnio   = !cumplioPrimerAnio(emp) && !!emp.ingreso

  const empReqs = solicitudes.filter(s => s.empId === empId).sort((a, b) => b.desde.localeCompare(a.desde))

  return (
    <div className="page" style={{ gap: 18 }}>
      <div className="page__header">
        <div>
          <button className="btn btn--ghost btn--sm" onClick={onBack} style={{ marginBottom: 8 }}>
            <Icon name="chevLeft" size={14} /> Empleados
          </button>
          <h1 className="page__title">{emp.name}</h1>
          <p className="page__desc">{emp.role}{area ? ` · ${area.label}` : ''}</p>
        </div>
        <div className="page__actions">
          <button className="btn"><Icon name="edit" size={14} /> Ajustar saldo</button>
          <button className="btn btn--accent" onClick={onNewRequest}>
            <Icon name="plus" size={14} /> Registrar ausencia
          </button>
        </div>
      </div>

      {/* Profile header */}
      <div className="vac-detail-head">
        <VacAvatar emp={emp} size="xl" />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Líder directo</div>
              <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{lead ? lead.name : '—'}</div>
            </div>
            <div style={{ width: 1, height: 32, background: 'var(--border)' }} />
            <div>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Ingreso</div>
              <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{fmtDateLong(emp.ingreso)}</div>
            </div>
            <div style={{ width: 1, height: 32, background: 'var(--border)' }} />
            <div>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>ID</div>
              <div style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Geist Mono, monospace', marginTop: 2 }}>{emp.id.toUpperCase()}</div>
            </div>
          </div>
        </div>
        <button className="btn"><Icon name="info" size={14} /> Ver perfil</button>
      </div>

      {/* Stats */}
      <div className="vac-detail-stats">
        <div className="vac-stat-mini">
          <div className="vac-stat-mini__label">
            Saldo disponible
            {sinAnio && (
              <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 600, color: 'var(--warning)', background: 'var(--warning-soft)', padding: '1px 6px', borderRadius: 999, verticalAlign: 'middle' }}>
                &lt;1 año
              </span>
            )}
          </div>
          <div className="vac-stat-mini__value" style={{ color: dispo < 0 ? 'var(--danger)' : 'var(--fg)' }}>
            {dispo} <span style={{ fontSize: 14, color: 'var(--fg-muted)', fontWeight: 500 }}>/ {emp.saldoTotal}</span>
          </div>
          <div className="vac-stat-mini__sub">
            {sinAnio
              ? dispo < 0 ? `${Math.abs(dispo)} días en adelanto` : 'sin saldo hasta cumplir 1 año'
              : 'días del periodo actual'}
          </div>
        </div>
        <div className="vac-stat-mini">
          <div className="vac-stat-mini__label">Tomados</div>
          <div className="vac-stat-mini__value" style={{ color: 'var(--success)' }}>{emp.tomados}</div>
          <div className="vac-stat-mini__sub">días en el año</div>
        </div>
        <div className="vac-stat-mini">
          <div className="vac-stat-mini__label">Pendientes</div>
          <div className="vac-stat-mini__value" style={{ color: 'var(--warning)' }}>{emp.pendientes}</div>
          <div className="vac-stat-mini__sub">solicitudes por aprobar</div>
        </div>
        <div className="vac-stat-mini">
          <div className="vac-stat-mini__label">Por vencer</div>
          <div className="vac-stat-mini__value" style={{ color: !sinAnio && dispo >= 22 ? 'var(--danger)' : 'var(--fg)' }}>
            {!sinAnio && dispo >= 22 ? dispo - 12 : 0}
          </div>
          <div className="vac-stat-mini__sub">días por truncar</div>
        </div>
      </div>

      <div className="vac-grid-2">
        {/* History */}
        <div className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Historial de ausencias</h3>
              <div className="card__sub">últimas {empReqs.length}</div>
            </div>
          </div>
          <div className="card__body--flush">
            {empReqs.length === 0 ? (
              <div className="empty" style={{ padding: '40px 20px' }}>
                <p style={{ fontWeight: 600 }}>Sin historial</p>
                <p style={{ fontSize: 13 }}>No hay ausencias registradas.</p>
              </div>
            ) : (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Fechas</th>
                    <th>Días</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {empReqs.map(s => (
                    <tr key={s.id} onClick={() => onOpenRequest(s)}>
                      <td><TipoChip tipoId={s.tipo} /></td>
                      <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {fmtDateLong(s.desde).slice(0, -5)} <span style={{ color: 'var(--fg-faint)' }}>→</span> {fmtDateLong(s.hasta).slice(0, -5)}
                      </td>
                      <td style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmtDias(s.dias)}</td>
                      <td><StatusChip estado={s.estado} /></td>
                      <td><Icon name="chevron" size={14} style={{ color: 'var(--fg-muted)' }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Distribución */}
          <div className="card">
            <div className="card__header"><h3 className="card__title">Distribución de saldo</h3></div>
            <div className="card__body">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--fg-muted)', marginBottom: 8 }}>
                <span>0d</span><span>{emp.saldoTotal}d</span>
              </div>
              <SaldoBar total={emp.saldoTotal} tomados={emp.tomados} pendientes={emp.pendientes} height={12} />
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                {[
                  { label: 'Tomados',    val: emp.tomados,    color: 'var(--success)' },
                  { label: 'Pendientes', val: emp.pendientes, color: 'var(--warning)' },
                  { label: 'Disponibles', val: dispo,         color: 'var(--border-strong)' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>
                      <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: row.color, marginRight: 8 }} />
                      {row.label}
                    </span>
                    <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{row.val}d</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Año visual */}
          <div className="card">
            <div className="card__header">
              <div>
                <h3 className="card__title">Vista anual</h3>
                <div className="card__sub">año actual</div>
              </div>
            </div>
            <div className="card__body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 4 }}>
                {Array.from({ length: 12 }, (_, m) => {
                  const yr  = new Date().getFullYear()
                  const dim = daysInMonth(yr, m)
                  const mDays = Array.from({ length: dim }, (_, i) => i + 1)
                  return (
                    <div key={m}>
                      <div style={{ fontSize: 10, color: 'var(--fg-muted)', textAlign: 'center', marginBottom: 4 }}>
                        {MESES_ES[m].slice(0, 3)}
                      </div>
                      <div style={{ display: 'grid', gridTemplateRows: `repeat(${dim}, 4px)`, gap: 1 }}>
                        {mDays.map(d => {
                          const iso = isoDate(yr, m, d)
                          const req = empReqs.find(s => s.desde <= iso && s.hasta >= iso)
                          const tipo = req ? getTipo(req.tipo) : null
                          let bg = 'var(--bg-2)'
                          if (req && tipo) {
                            bg = tipo.color
                            if (req.estado === 'pendiente') bg = `repeating-linear-gradient(45deg, ${tipo.color} 0 2px, transparent 2px 4px)`
                          }
                          return <div key={d} style={{ background: bg, borderRadius: 1 }} title={iso} />
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--fg-muted)' }}>
                Cada barra representa un día. Color = tipo de ausencia.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
