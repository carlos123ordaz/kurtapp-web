import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Icon, Badge, Button, Avatar, NameCell } from '../../../components/ui'
import type { Area, User, Sede, AttendanceRecord, SedeSnapshot } from '../../../types'
import userService from '../../usuarios/services/userService'
import areaService from '../../usuarios/services/areaService'
import sedeService from '../../sedes/services/sedeService'
import asistenciaService from '../services/asistenciaService'
import { useAuth } from '../../../context/AuthContext'
import { MapModal } from '../components/MapModal'
import { EditAttendanceModal } from '../components/EditAttendanceModal'
import { ScheduleConfigModal } from '../components/ScheduleConfigModal'
import scheduleConfigService from '../services/scheduleConfigService'

const MES_NOMBRES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const DOW_LABEL = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

type EstadoKey = 'valida' | 'invalida' | 'en-curso' | 'ausente' | 'tarde' | 'remoto' | 'finde' | 'festivo' | 'futuro'

const ESTADO_META: Record<EstadoKey, { label: string; bg: string; kind: string }> = {
  valida: { label: 'Válida', bg: 'oklch(0.78 0.13 155)', kind: 'success' },
  tarde: { label: 'Tardanza', bg: 'oklch(0.82 0.13 80)', kind: 'warning' },
  invalida: { label: 'Inválida', bg: 'oklch(0.78 0.14 25)', kind: 'danger' },
  'en-curso': { label: 'En jornada', bg: 'oklch(0.78 0.1 220)', kind: 'info' },
  remoto: { label: 'Remoto', bg: 'oklch(0.82 0.1 290)', kind: 'accent' },
  ausente: { label: 'Ausente', bg: 'oklch(0.86 0.005 250)', kind: 'neutral' },
  finde: { label: 'Fin de semana', bg: 'transparent', kind: 'ghost' },
  festivo: { label: 'Festivo', bg: 'oklch(0.93 0.04 280)', kind: 'info' },
  futuro: { label: '—', bg: 'transparent', kind: 'ghost' },
}

interface DayCell {
  dia: number
  estado: EstadoKey
  entrada?: string
  salida?: string
  horas?: number
  distancia?: number
  recordId?: string
  latitude_entrada?: number
  longitude_entrada?: number
  latitude_salida?: number
  longitude_salida?: number
  valido_entrada?: boolean
  valido_salida?: boolean
  entradaISO?: string
  salidaISO?: string
  sedeSnapshot?: SedeSnapshot
}

interface SelState {
  user: User
  cell: DayCell
  anchor: { x: number; y: number }
}

interface CellPopoverProps {
  sel: SelState
  sede?: Sede
  onClose: () => void
  onViewMap: () => void
  onEditRecord: () => void
}

const CellGlyph: React.FC<{ estado: EstadoKey }> = ({ estado }) => {
  if (estado === 'valida') return <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
  if (estado === 'invalida') return <svg width="9" height="9" viewBox="0 0 10 10"><path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
  if (estado === 'tarde') return <span style={{ fontSize: 9, fontWeight: 700, fontFamily: 'Geist Mono' }}>T</span>
  if (estado === 'en-curso') return <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block', animation: 'pulse 1.4s ease-in-out infinite' }} />
  if (estado === 'remoto') return <span style={{ fontSize: 9, fontWeight: 700, fontFamily: 'Geist Mono' }}>R</span>
  if (estado === 'ausente') return <span style={{ fontSize: 10, fontFamily: 'Geist Mono', opacity: 0.6 }}>—</span>
  if (estado === 'festivo') return <span style={{ fontSize: 9, fontWeight: 700, fontFamily: 'Geist Mono' }}>F</span>
  return null
}

const CellPopover = React.forwardRef<HTMLDivElement, CellPopoverProps>(({ sel, sede, onClose, onViewMap, onEditRecord }, ref) => {
  const { user, cell, anchor } = sel
  const meta = ESTADO_META[cell.estado]
  const left = Math.max(20, Math.min(window.innerWidth - 360, anchor.x - 160))
  const top = Math.min(window.innerHeight - 340, anchor.y)
  const now = new Date()
  const fecha = new Date(now.getFullYear(), now.getMonth(), cell.dia)
  const fechaStr = fecha.toLocaleDateString('es', { weekday: 'long', day: '2-digit', month: 'long' })

  return (
    <div ref={ref} className="att-pop" style={{ left, top }}>
      <div className="att-pop__arrow" style={{ left: Math.min(300, Math.max(20, anchor.x - left)) }} />
      <div className="att-pop__header">
        <Avatar name={`${user.name} ${user.lname}`} idx={0} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 'var(--fs-md)', letterSpacing: '-0.01em' }}>{user.name} {user.lname}</div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)' }}>{user.position}</div>
        </div>
        <button className="btn btn--ghost btn--icon" onClick={onClose}><Icon name="close" size={14} /></button>
      </div>
      <div className="att-pop__body">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)', textTransform: 'capitalize' }}>{fechaStr}</div>
          <Badge kind={meta.kind as never} dot={['valida', 'tarde', 'invalida', 'en-curso', 'remoto'].includes(cell.estado)}>{meta.label}</Badge>
        </div>
        {cell.estado === 'ausente' && (
          <div className="att-pop__row"><Icon name="alert" size={14} className="muted" /><span>Sin marcaciones registradas</span></div>
        )}
        {(cell.entrada || cell.salida) && (
          <>
            <div className="att-pop__grid">
              <div><div className="att-pop__label">Entrada</div><div className="att-pop__val mono">{cell.entrada ?? '—'}</div></div>
              <div><div className="att-pop__label">Salida</div><div className="att-pop__val mono">{cell.salida ?? <span style={{ color: 'var(--info)' }}>En jornada</span>}</div></div>
              <div><div className="att-pop__label">Horas</div><div className="att-pop__val mono">{cell.horas ? cell.horas + 'h' : '—'}</div></div>
            </div>
            {(() => {
              const displayNombre = sede?.nombre ?? cell.sedeSnapshot?.nombre
              const displayRadio = sede?.radio ?? cell.sedeSnapshot?.radio
              const isDeleted = !sede && !!cell.sedeSnapshot?.nombre
              return displayNombre ? (
                <div className="att-pop__row">
                  <Icon name="pin" size={14} className="muted" />
                  <span style={{ flex: 1 }}>
                    <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 500 }}>
                      {displayNombre}
                      {isDeleted && <span style={{ fontSize: 10, color: 'var(--fg-muted)', marginLeft: 6 }}>(eliminada)</span>}
                    </div>
                    {displayRadio != null && <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>Radio: <span className="mono">{displayRadio}m</span></div>}
                  </span>
                </div>
              ) : null
            })()}
            {cell.distancia != null && (
              <div className="att-pop__row">
                <Icon name="target" size={14} style={{ color: (cell.distancia > (sede?.radio ?? cell.sedeSnapshot?.radio ?? 0)) ? 'var(--danger)' : 'var(--fg-muted)' }} />
                <span style={{ fontSize: 'var(--fs-sm)' }}>
                  Distancia: <span className="mono tnum" style={{ color: (cell.distancia > (sede?.radio ?? cell.sedeSnapshot?.radio ?? 0)) ? 'var(--danger)' : 'var(--fg)', fontWeight: 500 }}>{cell.distancia}m</span>
                </span>
              </div>
            )}
          </>
        )}
      </div>
      <div className="att-pop__footer">
        {cell.recordId && (
          <>
            <Button kind="ghost" size="sm" icon="map" onClick={onViewMap}>Ver mapa</Button>
            <Button size="sm" icon="edit" onClick={onEditRecord}>Editar</Button>
          </>
        )}
      </div>
    </div>
  )
})

CellPopover.displayName = 'CellPopover'

function buildMonthGrid(year: number, month: number, records: AttendanceRecord[], userId: string): DayCell[] {
  const today = new Date()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const date = new Date(year, month, day)
    const wd = date.getDay()
    if (wd === 0 || wd === 6) return { dia: day, estado: 'finde' }
    if (date > today) return { dia: day, estado: 'futuro' }
    const rec = records.find((r) => {
      const [, , dd] = r.fecha.split('-')
      return Number(dd) === day && r.usuarioId === userId
    })
    if (!rec) return { dia: day, estado: 'ausente' }
    return {
      dia: day,
      estado: rec.estado,
      entrada: rec.entrada,
      salida: rec.salida,
      horas: rec.horas,
      distancia: rec.distancia,
      recordId: rec._id,
      latitude_entrada: rec.latitude_entrada,
      longitude_entrada: rec.longitude_entrada,
      latitude_salida: rec.latitude_salida,
      longitude_salida: rec.longitude_salida,
      valido_entrada: rec.valido_entrada,
      valido_salida: rec.valido_salida,
      entradaISO: rec.entradaISO,
      salidaISO: rec.salidaISO,
      sedeSnapshot: rec.sedeSnapshot,
    }
  })
}

export const AsistenciaPage: React.FC = () => {
  const { user: authUser } = useAuth()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [users, setUsers] = useState<User[]>([])
  const [sedes, setSedes] = useState<Sede[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [selectedAreaId, setSelectedAreaId] = useState<string | undefined>(undefined)
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sedeFilter, setSedeFilter] = useState('todas')
  const [sel, setSel] = useState<SelState | null>(null)
  const [mapSel, setMapSel] = useState<SelState | null>(null)
  const [editSel, setEditSel] = useState<SelState | null>(null)
  const [scheduleSel, setScheduleSel] = useState<SelState | null>(null)
  const [configuredUserIds, setConfiguredUserIds] = useState<Set<string>>(new Set())
  const popRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const defaultArea = authUser?.areas?.[0]?._id
    if (defaultArea && !selectedAreaId) setSelectedAreaId(defaultArea)
  }, [authUser])

  useEffect(() => {
    areaService.getAll().then(setAreas)
  }, [])

  const loadScheduleConfigs = useCallback(() => {
    scheduleConfigService.getAll()
      .then((cfgs) => {
        const ids = cfgs
          .filter((c) => c.active)
          .map((c) => {
            // userId may be a populated object { _id, name } when returned from the API
            const uid = c.userId as unknown as { _id?: string } | string
            return typeof uid === 'string' ? uid : (uid?._id ?? '')
          })
          .filter(Boolean)
        setConfiguredUserIds(new Set(ids))
      })
      .catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [u, s, r] = await Promise.all([
        userService.getAll(),
        sedeService.getAll(),
        asistenciaService.getByMonth(year, month + 1),
      ])
      setUsers(u)
      setSedes(s)
      setRecords(r)
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => { load() }, [load])
  useEffect(() => { loadScheduleConfigs() }, [loadScheduleConfigs])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSel(null) }
    const onClick = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node) && !(e.target as Element).closest('[data-cell]')) setSel(null)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onClick)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('mousedown', onClick) }
  }, [])

  const filteredUsers = users.filter((u) => {
    if (selectedAreaId && !u.areas?.some((a) => a._id === selectedAreaId)) return false
    if (sedeFilter !== 'todas') {
      const sedeId = typeof u.sede === 'object' ? u.sede?._id : u.sede
      if (sedeId !== sedeFilter) return false
    }
    if (search) {
      const q = search.toLowerCase()
      if (!`${u.name} ${u.lname}`.toLowerCase().includes(q) && !u.dni?.includes(q)) return false
    }
    return true
  })

  const dias = Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, i) => i + 1)

  const allCells = filteredUsers.map((u) => buildMonthGrid(year, month, records, u._id))
  const stats = allCells.flat().reduce(
    (acc, c) => {
      const k = c.estado as string
      if (k in acc) acc[k as keyof typeof acc]++
      if (c.horas) acc.horas += c.horas
      return acc
    },
    { valida: 0, tarde: 0, invalida: 0, ausente: 0, remoto: 0, 'en-curso': 0, horas: 0 }
  )

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear((y) => y - 1) } else setMonth((m) => m - 1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear((y) => y + 1) } else setMonth((m) => m + 1) }

  const handleCellClick = (e: React.MouseEvent<HTMLButtonElement>, u: User, cell: DayCell) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setSel({ user: u, cell, anchor: { x: rect.left + rect.width / 2, y: rect.bottom + 8 } })
  }

  const sedeById = Object.fromEntries(sedes.map((s) => [s._id, s]))

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Asistencia</h1>
          <div className="page__desc">Calendario mensual · {MES_NOMBRES[month]} {year}</div>
        </div>
        <div className="page__actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)', padding: 2 }}>
            <button className="btn btn--ghost btn--icon" onClick={prevMonth}><Icon name="chevron" size={14} style={{ transform: 'rotate(180deg)' }} /></button>
            <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, padding: '0 8px', minWidth: 120, textAlign: 'center' }}>{MES_NOMBRES[month]} {year}</span>
            <button className="btn btn--ghost btn--icon" onClick={nextMonth}><Icon name="chevron" size={14} /></button>
          </div>
          <Button>Hoy</Button>
          <Button icon="download">Exportar</Button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi__label">Asistencias válidas</div>
          <div className="kpi__value tnum" style={{ color: 'var(--success)' }}>{stats.valida}</div>
          <div className="kpi__delta">+{stats.tarde} con tardanza</div>
        </div>
        <div className="kpi">
          <div className="kpi__label">Marcaciones inválidas</div>
          <div className="kpi__value tnum" style={{ color: 'var(--danger)' }}>{stats.invalida}</div>
          <div className="kpi__delta">Fuera del radio permitido</div>
        </div>
        <div className="kpi">
          <div className="kpi__label">Ausencias del mes</div>
          <div className="kpi__value tnum">{stats.ausente}</div>
          <div className="kpi__delta">{stats.remoto} días remotos</div>
        </div>
        <div className="kpi">
          <div className="kpi__label">Horas trabajadas</div>
          <div className="kpi__value tnum">{Math.round(stats.horas)}<span style={{ fontSize: 'var(--fs-lg)', fontWeight: 400, color: 'var(--fg-faint)' }}> h</span></div>
          <div className="kpi__delta">Acumulado del mes</div>
        </div>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="filter-bar__search">
            <Icon name="search" size={14} className="muted" />
            <input placeholder="Buscar empleado por nombre o DNI…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="select" style={{ width: 'auto' }} value={selectedAreaId ?? ''} onChange={(e) => setSelectedAreaId(e.target.value || undefined)}>
            <option value="">Todas las áreas</option>
            {areas.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
          </select>
          <select className="select" style={{ width: 'auto' }} value={sedeFilter} onChange={(e) => setSedeFilter(e.target.value)}>
            <option value="todas">Todas las sedes</option>
            {sedes.map((s) => <option key={s._id} value={s._id}>{s.nombre}</option>)}
          </select>
          <div style={{ flex: 1 }} />
          <div className="muted" style={{ fontSize: 'var(--fs-xs)' }}>{filteredUsers.length} empleados</div>
        </div>

        <div className="att-legend">
          {(['valida', 'tarde', 'invalida', 'en-curso', 'remoto', 'ausente', 'festivo'] as EstadoKey[]).map((k) => (
            <div key={k} className="att-legend__item">
              <span className="att-legend__swatch" style={{ background: ESTADO_META[k].bg }} />
              <span>{ESTADO_META[k].label}</span>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="empty">Cargando datos de asistencia…</div>
        ) : (
          <div className="att-scroll">
            <table className="att-cal">
              <colgroup>
                <col style={{ width: 240 }} />
                {dias.map((d) => <col key={d} />)}
                <col style={{ width: 80 }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="att-cal__sticky att-cal__head">Empleado</th>
                  {dias.map((d) => {
                    const wd = new Date(year, month, d).getDay()
                    const isWk = wd === 0 || wd === 6
                    const isToday = year === now.getFullYear() && month === now.getMonth() && d === now.getDate()
                    return (
                      <th key={d} className={`att-cal__day-h${isWk ? ' att-cal__day-h--wk' : ''}${isToday ? ' att-cal__day-h--today' : ''}`}>
                        <div className="att-cal__dow">{DOW_LABEL[wd]}</div>
                        <div className="att-cal__dnum">{d}</div>
                      </th>
                    )
                  })}
                  <th className="att-cal__total-h">Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, ui) => {
                  const cells = allCells[ui] ?? []
                  const totalH = cells.reduce((s, c) => s + (c.horas ?? 0), 0)
                  const sedeId = typeof u.sede === 'object' ? u.sede?._id : u.sede
                  const sede = sedeId ? sedeById[sedeId] : undefined
                  return (
                    <tr key={u._id}>
                      <td
                        className="att-cal__sticky att-cal__name"
                        style={{ cursor: 'pointer' }}
                        title="Configurar horario"
                        onClick={() => setScheduleSel({ user: u, cell: { dia: 0, estado: 'ausente' }, anchor: { x: 0, y: 0 } })}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <NameCell
                            name={`${u.name} ${u.lname}`}
                            sub={`${u.position ?? ''} · ${sede?.nombre?.split(' ').slice(-1)[0] ?? ''}`}
                            avatarIdx={ui}
                          />
                          <span
                            title={configuredUserIds.has(u._id) ? 'Horario configurado' : 'Sin horario configurado'}
                            style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: configuredUserIds.has(u._id) ? 'oklch(0.65 0.15 155)' : 'var(--border-strong)', marginLeft: 2 }}
                          />
                        </div>
                      </td>
                      {cells.map((cell) => {
                        const isSel = sel?.user._id === u._id && sel?.cell.dia === cell.dia
                        const isToday = year === now.getFullYear() && month === now.getMonth() && cell.dia === now.getDate()
                        return (
                          <td key={cell.dia} className="att-cal__cell-td">
                            <button
                              data-cell
                              className={`att-cell att-cell--${cell.estado}${isSel ? ' att-cell--sel' : ''}${isToday ? ' att-cell--today' : ''}`}
                              onClick={(e) => handleCellClick(e, u, cell)}
                              title={`${cell.dia} ${MES_NOMBRES[month]} — ${ESTADO_META[cell.estado].label}`}
                              disabled={cell.estado === 'futuro' || cell.estado === 'finde'}
                            >
                              <CellGlyph estado={cell.estado} />
                            </button>
                          </td>
                        )
                      })}
                      <td className="att-cal__total"><span className="mono tnum">{totalH.toFixed(0)}h</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {sel && (
        <CellPopover
          ref={popRef}
          sel={sel}
          sede={(() => {
            const sedeId = typeof sel.user.sede === 'object' ? sel.user.sede?._id : sel.user.sede
            return sedeId ? sedeById[sedeId] : undefined
          })()}
          onClose={() => setSel(null)}
          onViewMap={() => { setMapSel(sel); setSel(null) }}
          onEditRecord={() => { setEditSel(sel); setSel(null) }}
        />
      )}

      {mapSel && (
        <MapModal
          userName={`${mapSel.user.name} ${mapSel.user.lname}`}
          dia={mapSel.cell.dia}
          mes={MES_NOMBRES[month]}
          entrada={mapSel.cell.entrada}
          salida={mapSel.cell.salida}
          horas={mapSel.cell.horas}
          latitude_entrada={mapSel.cell.latitude_entrada}
          longitude_entrada={mapSel.cell.longitude_entrada}
          latitude_salida={mapSel.cell.latitude_salida}
          longitude_salida={mapSel.cell.longitude_salida}
          valido_entrada={mapSel.cell.valido_entrada}
          valido_salida={mapSel.cell.valido_salida}
          onClose={() => setMapSel(null)}
        />
      )}

      {editSel?.cell.recordId && (
        <EditAttendanceModal
          recordId={editSel.cell.recordId}
          userName={`${editSel.user.name} ${editSel.user.lname}`}
          dia={editSel.cell.dia}
          mes={MES_NOMBRES[month]}
          year={year}
          month={month}
          entradaTime={editSel.cell.entrada}
          salidaTime={editSel.cell.salida}
          validoEntrada={editSel.cell.valido_entrada}
          validoSalida={editSel.cell.valido_salida}
          onClose={() => setEditSel(null)}
          onSaved={load}
        />
      )}

      {scheduleSel && (
        <ScheduleConfigModal
          userId={scheduleSel.user._id}
          userName={`${scheduleSel.user.name} ${scheduleSel.user.lname}`}
          onClose={() => { setScheduleSel(null); loadScheduleConfigs() }}
        />
      )}
    </div>
  )
}
