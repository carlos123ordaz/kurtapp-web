import React from 'react'
import { Icon } from '../../../components/ui'
import { TIPOS, MESES_ES, type Solicitud, type VacEmployee, type VacArea } from '../data/vacacionesData'
import { EmpCell, KPICard, SaldoBar } from './VacShared'

// Donut chart
interface DonutSegment { value: number; color: string }
function Donut({ segments, size = 140, thickness = 22 }: { segments: DonutSegment[]; size?: number; thickness?: number }) {
  const r = size / 2 - thickness / 2
  const c = 2 * Math.PI * r
  const total = segments.reduce((a, s) => a + s.value, 0)
  let offset = 0
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-2)" strokeWidth={thickness} />
      {segments.map((s, i) => {
        const len     = (s.value / total) * c
        const dash    = `${len} ${c - len}`
        const dashOff = -offset
        offset += len
        return (
          <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={s.color} strokeWidth={thickness}
            strokeDasharray={dash} strokeDashoffset={dashOff} strokeLinecap="butt"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
          />
        )
      })}
    </svg>
  )
}

// SVG stroke no acepta CSS vars — mapeamos los CSS vars de tipo a colores hex
const TIPO_COLORS: Record<string, string> = {
  vacaciones:         '#2563eb',
  'permiso-goce':     '#0a9d6f',
  'permiso-singoce':  '#c2750a',
  medica:             '#d4423e',
  cumple:             '#8a4ad1',
}

interface Props {
  solicitudes: Solicitud[]
  employees?: VacEmployee[]
  areas?: VacArea[]
}

export function VacReportes({ solicitudes, employees = [], areas = [] }: Props) {
  const year = new Date().getFullYear()

  const areaData = areas.map(a => {
    const emps    = employees.filter(e => e.area === a.id)
    const tomados = emps.reduce((s, e) => s + e.tomados, 0)
    const total   = emps.reduce((s, e) => s + e.saldoTotal, 0)
    return { ...a, tomados, total, count: emps.length }
  })
  const maxArea = Math.max(...areaData.map(a => a.tomados), 1)

  const tipoData = Object.values(TIPOS).map(t => {
    const reqs = solicitudes.filter(s => s.tipo === t.id && s.estado !== 'rechazado')
    const dias  = reqs.reduce((s, r) => s + r.dias, 0)
    return { ...t, value: dias, count: reqs.length }
  }).filter(t => t.value > 0)

  const totalDias = tipoData.reduce((a, t) => a + t.value, 0)

  const monthData = Array.from({ length: 12 }, (_, m) => {
    let dias = 0
    solicitudes.filter(s => s.estado !== 'rechazado').forEach(s => {
      const a = new Date(s.desde + 'T12:00:00')
      const b = new Date(s.hasta + 'T12:00:00')
      for (let d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) {
        if (d.getMonth() === m && d.getFullYear() === year && d.getDay() !== 0 && d.getDay() !== 6) dias++
      }
    })
    return { m, label: MESES_ES[m].slice(0, 3), dias }
  })
  const maxMonth = Math.max(...monthData.map(m => m.dias), 1)

  const top5 = [...employees].filter(e => e.tomados > 0).sort((a, b) => b.tomados - a.tomados).slice(0, 5)

  const totalTomados    = employees.reduce((a, e) => a + e.tomados, 0)
  const pendientesCount = solicitudes.filter(s => s.estado === 'pendiente').length
  const pendientesDias  = solicitudes.filter(s => s.estado === 'pendiente').reduce((a, s) => a + s.dias, 0)

  const aprobadas    = solicitudes.filter(s => s.estado === 'aprobado').length
  const rechazadas   = solicitudes.filter(s => s.estado === 'rechazado').length
  const totalCerradas = aprobadas + rechazadas
  const tasaAprob    = totalCerradas > 0 ? Math.round((aprobadas / totalCerradas) * 100) : 0
  const promDias     = aprobadas > 0
    ? (solicitudes.filter(s => s.estado === 'aprobado').reduce((a, s) => a + s.dias, 0) / aprobadas).toFixed(1)
    : '0'

  return (
    <div className="page" style={{ gap: 18 }}>
      <div className="page__header">
        <div>
          <h1 className="page__title">Reportes</h1>
          <p className="page__desc">Métricas y análisis del módulo de vacaciones — {year}</p>
        </div>
        <div className="page__actions">
          <select className="select" style={{ width: 140 }} defaultValue={String(year)}>
            <option>{year}</option><option>{year - 1}</option><option>{year - 2}</option>
          </select>
          <button className="btn"><Icon name="download" size={14} /> Descargar reporte</button>
        </div>
      </div>

      <div className="kpi-grid">
        <KPICard label="Días tomados YTD" value={totalTomados} sub={`acumulado ${year}`} />
        <KPICard label="Días por aprobar" value={pendientesDias} sub={`${pendientesCount} solicitudes`} />
        <KPICard label="Tasa de aprobación" value={`${tasaAprob}%`} sub={`${aprobadas} de ${totalCerradas} solicitudes`} accent="up" />
        <KPICard label="Promedio por solicitud" value={`${promDias}d`} sub="por colaborador" />
      </div>

      <div className="vac-grid-2">
        {/* Días por área */}
        <div className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Días tomados por área</h3>
              <div className="card__sub">acumulado {year}</div>
            </div>
          </div>
          <div className="card__body">
            {areaData.map(a => (
              <div key={a.id} className="vac-bar-row">
                <div className="vac-bar-row__label">
                  <div className="vac-area-tag">
                    <div className="vac-area-tag__swatch" style={{ background: a.color }} />
                    {a.label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginLeft: 19, marginTop: 2 }}>{a.count} colaboradores</div>
                </div>
                <div className="vac-bar-row__bar">
                  <div className="vac-bar-row__bar-fill" style={{ width: `${(a.tomados / maxArea) * 100}%`, background: a.color }} />
                </div>
                <div className="vac-bar-row__val">{a.tomados}d</div>
              </div>
            ))}
            <div className="divider" />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--fg-muted)' }}>
              <span>Total días tomados</span>
              <span style={{ fontWeight: 600, color: 'var(--fg)' }}>{areaData.reduce((a, x) => a + x.tomados, 0)} días</span>
            </div>
          </div>
        </div>

        {/* Distribución por tipo */}
        <div className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Distribución por tipo</h3>
              <div className="card__sub">días registrados (aprobados + pendientes)</div>
            </div>
          </div>
          <div className="card__body">
            <div className="vac-donut-wrap">
              <div className="vac-donut">
                <Donut size={140} thickness={22} segments={tipoData.map(t => ({ value: t.value, color: TIPO_COLORS[t.id] || '#999' }))} />
                <div className="vac-donut-center">
                  <div className="vac-donut-center__big">{totalDias}</div>
                  <div className="vac-donut-center__small">días totales</div>
                </div>
              </div>
              <div className="vac-donut-legend">
                {tipoData.map(t => (
                  <div key={t.id} className="vac-donut-legend__row">
                    <div className="vac-donut-legend__swatch" style={{ background: TIPO_COLORS[t.id] }} />
                    <div className="vac-donut-legend__label">{t.label}</div>
                    <div className="vac-donut-legend__count">{t.count} sol.</div>
                    <div className="vac-donut-legend__val">{t.value}d</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estacionalidad */}
      <div className="card">
        <div className="card__header">
          <div>
            <h3 className="card__title">Días tomados por mes</h3>
            <div className="card__sub">estacionalidad {year}</div>
          </div>
        </div>
        <div className="card__body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 10, alignItems: 'end', height: 160, paddingBottom: 4 }}>
            {monthData.map(m => {
              const isCurrentMonth = m.m === new Date().getMonth()
              return (
                <div key={m.m} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg)', marginBottom: 4, fontVariantNumeric: 'tabular-nums' }}>
                    {m.dias > 0 ? `${m.dias}d` : ''}
                  </div>
                  <div style={{
                    width: '60%',
                    height: `${Math.max((m.dias / maxMonth) * 100, m.dias > 0 ? 3 : 0)}%`,
                    background: isCurrentMonth ? 'var(--accent)' : 'var(--accent-soft)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s',
                  }} />
                  <div style={{ fontSize: 11, color: isCurrentMonth ? 'var(--accent)' : 'var(--fg-muted)', marginTop: 6, fontWeight: isCurrentMonth ? 600 : 400 }}>
                    {m.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Top 5 */}
      <div className="card">
        <div className="card__header"><h3 className="card__title">Top 5 colaboradores con más días tomados</h3></div>
        <div className="card__body--flush">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 50 }}>#</th>
                <th>Colaborador</th>
                <th>Área</th>
                <th style={{ width: '30%' }}>Uso del saldo</th>
                <th style={{ textAlign: 'right' }}>Tomados</th>
              </tr>
            </thead>
            <tbody>
              {top5.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--fg-muted)', fontSize: 13 }}>
                    Ningún colaborador ha tomado días aún este año.
                  </td>
                </tr>
              )}
              {top5.map((emp, i) => {
                const area = areas.find(a => a.id === emp.area)
                return (
                  <tr key={emp.id}>
                    <td style={{ fontFamily: 'Geist Mono, monospace', color: 'var(--fg-muted)' }}>{i + 1}</td>
                    <td><EmpCell emp={emp} /></td>
                    <td>
                      {area && (
                        <div className="vac-area-tag">
                          <div className="vac-area-tag__swatch" style={{ background: area.color }} />
                          {area.label}
                        </div>
                      )}
                    </td>
                    <td>
                      <SaldoBar total={emp.saldoTotal} tomados={emp.tomados} pendientes={0} />
                      <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 4 }}>
                        {Math.round((emp.tomados / emp.saldoTotal) * 100)}% del saldo
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{emp.tomados}d</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
