import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Icon, Button, NameCell } from '../../../components/ui'
import type { Area, User, WorkType, ScheduleEntry } from '../../../types'
import userService from '../../usuarios/services/userService'
import scheduleService from '../services/scheduleService'
import workTypeService from '../services/workTypeService'
import { useAuth } from '../../../context/AuthContext'

const MES_NOMBRES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const DIA_NOMBRES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

type ScheduleMap = Record<string, ScheduleEntry>

function normalizeUserId(userId: unknown): string {
  if (userId && typeof userId === 'object' && '_id' in (userId as object)) {
    return String((userId as { _id: unknown })._id)
  }
  return String(userId ?? '')
}

function buildScheduleMap(entries: ScheduleEntry[]): ScheduleMap {
  const map: ScheduleMap = {}
  entries.forEach((e) => {
    const uid = normalizeUserId(e.userId)
    const start = new Date(e.startDate)
    const end = new Date(e.endDate)
    const cur = new Date(start)
    while (cur <= end) {
      const key = `${cur.getMonth()}-${cur.getFullYear()}-${cur.getDate()}-${uid}`
      map[key] = { ...e, userId: uid }
      cur.setDate(cur.getDate() + 1)
    }
  })
  return map
}

// ── Work Types Management Modal ──────────────────────────────────────────────

interface WorkTypesModalProps {
  workTypes: WorkType[]
  areaId: string
  onClose: () => void
  onSaved: () => void
}

const WorkTypesModal: React.FC<WorkTypesModalProps> = ({ workTypes, areaId, onClose, onSaved }) => {
  const [editingCode, setEditingCode] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [label, setLabel] = useState('')
  const [color, setColor] = useState('#2563EB')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const resetForm = () => {
    setCode(''); setLabel(''); setColor('#2563EB'); setEditingCode(null); setError(null)
  }

  const handleEdit = (wt: WorkType) => {
    setEditingCode(wt.code)
    setCode(wt.code)
    setLabel(wt.label)
    setColor(wt.color)
    setError(null)
  }

  const handleSave = async () => {
    if (!code || !label || !color) { setError('Completa todos los campos.'); return }
    setLoading(true)
    setError(null)
    try {
      if (editingCode) {
        await workTypeService.update(editingCode, { label, color, areaId })
      } else {
        await workTypeService.create({ code: code.toUpperCase(), label, color, areaId })
      }
      onSaved()
      resetForm()
    } catch {
      setError('Error al guardar el tipo de actividad.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (wtCode: string) => {
    setLoading(true)
    setError(null)
    try {
      await workTypeService.delete(wtCode, areaId)
      onSaved()
      setConfirmDelete(null)
    } catch {
      setError('Error al eliminar el tipo de actividad.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ minWidth: 480, maxWidth: 580, width: '90vw' }}>
        <div className="modal__header">
          <h2 className="modal__title">Gestionar tipos de actividad</h2>
          <button className="btn btn--ghost btn--icon" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>
        <div className="modal__body" style={{ padding: 0 }}>
          {error && (
            <div style={{ margin: '12px 20px 0', padding: '10px 14px', background: 'var(--danger-soft)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--fs-sm)', color: 'var(--danger)' }}>
              {error}
            </div>
          )}
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 70 }}>Código</th>
                  <th>Descripción</th>
                  <th style={{ width: 130 }}>Color</th>
                  <th style={{ width: 80, textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {workTypes.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--fg-muted)', padding: '20px 0' }}>
                      No hay tipos configurados.
                    </td>
                  </tr>
                ) : workTypes.map((wt) => (
                  <tr key={wt.code}>
                    <td>
                      <span className="mono" style={{ fontWeight: 700, fontSize: 12 }}>{wt.code}</span>
                    </td>
                    <td>{wt.label}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 16, height: 16, borderRadius: 3, background: wt.color, border: '1px solid var(--border)', flexShrink: 0 }} />
                        <span className="mono" style={{ fontSize: 11, color: 'var(--fg-2)' }}>{wt.color.toUpperCase()}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button className="btn btn--ghost btn--icon" onClick={() => handleEdit(wt)} title="Editar">
                          <Icon name="edit" size={14} />
                        </button>
                        <button
                          className="btn btn--ghost btn--icon"
                          onClick={() => setConfirmDelete(wt.code)}
                          title="Eliminar"
                          style={{ color: 'var(--danger)' }}
                        >
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}>
            <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 600, color: 'var(--fg-2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
              {editingCode ? 'Editar tipo' : 'Nuevo tipo'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 90px', gap: 10 }}>
              <div className="field">
                <label className="field__label">Código</label>
                <input className="input" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={6} placeholder="TRA" disabled={!!editingCode} />
              </div>
              <div className="field">
                <label className="field__label">Descripción</label>
                <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ej. Trabajo en campo" />
              </div>
              <div className="field">
                <label className="field__label">Color</label>
                <input className="input" type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ padding: '2px 4px', height: 36, cursor: 'pointer' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button className="btn btn--primary" onClick={handleSave} disabled={loading}>
                {loading ? 'Guardando…' : editingCode ? 'Actualizar' : 'Agregar'}
              </button>
              {editingCode && <button className="btn" onClick={resetForm}>Cancelar</button>}
            </div>
          </div>
        </div>
        <div className="modal__footer">
          <button className="btn" onClick={onClose}>Cerrar</button>
        </div>
      </div>

      {confirmDelete && (
        <div className="modal-overlay" style={{ zIndex: 52 }} onClick={(e) => { e.stopPropagation(); setConfirmDelete(null) }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 360 }}>
            <div className="modal__header">
              <h2 className="modal__title">Eliminar tipo</h2>
            </div>
            <div className="modal__body">
              <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-2)', margin: 0 }}>
                ¿Seguro que deseas eliminar el tipo <strong>{confirmDelete}</strong>? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="modal__footer">
              <button className="btn" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn btn--danger" onClick={() => handleDelete(confirmDelete)} disabled={loading}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Assignment modal ─────────────────────────────────────────────────────────

type SaveResult =
  | { type: 'upsert'; entry: ScheduleEntry }
  | { type: 'delete'; id: string }

interface AssignModalProps {
  users: User[]
  workTypes: WorkType[]
  year: number
  month: number
  preUserId?: string
  preDay?: number
  preDayEnd?: number
  existingEntry?: ScheduleEntry
  areaId?: string
  onClose: () => void
  onSaved: (result: SaveResult) => void
}

const AssignModal: React.FC<AssignModalProps> = ({
  users, workTypes, year, month, preUserId, preDay, preDayEnd, existingEntry, areaId, onClose, onSaved,
}) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const [userId, setUserId] = useState(preUserId ?? existingEntry?.userId ?? '')
  const [workTypeCode, setWorkTypeCode] = useState(existingEntry?.workTypeCode ?? workTypes[0]?.code ?? '')
  const [startDay, setStartDay] = useState(
    preDay ?? (existingEntry ? new Date(existingEntry.startDate).getDate() : 1)
  )
  const [endDay, setEndDay] = useState(
    preDayEnd ?? preDay ?? (existingEntry ? new Date(existingEntry.endDate).getDate() : 1)
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formatDay = (d: number) => {
    const wd = new Date(year, month, d).getDay()
    return `${DIA_NOMBRES[wd]} ${d} de ${MES_NOMBRES[month]}`
  }

  const handleSave = async () => {
    if (!userId || !workTypeCode) { setError('Completa todos los campos.'); return }
    if (startDay > endDay) { setError('El día inicio no puede ser mayor al día fin.'); return }
    setLoading(true)
    setError(null)
    try {
      const payload = {
        userId,
        workTypeCode: workTypeCode.toUpperCase(),
        areaId: areaId ?? '',
        startDate: new Date(year, month, startDay).toISOString(),
        endDate: new Date(year, month, endDay).toISOString(),
        month,
        year,
      }
      const saved = existingEntry?._id
        ? await scheduleService.update(existingEntry._id, payload)
        : await scheduleService.create(payload)
      onSaved({ type: 'upsert', entry: { ...saved, userId: normalizeUserId(saved.userId) } })
      onClose()
    } catch {
      setError('Error al guardar la actividad.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!existingEntry?._id) return
    setLoading(true)
    try {
      await scheduleService.delete(existingEntry._id)
      onSaved({ type: 'delete', id: existingEntry._id })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const isRange = startDay !== endDay

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ zIndex: 51 }}>
        <div className="modal__header">
          <div>
            <h2 className="modal__title">{existingEntry ? 'Editar asignación' : 'Asignar trabajo'}</h2>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-2)', marginTop: 2 }}>
              {MES_NOMBRES[month]} {year}
            </div>
          </div>
          <button className="btn btn--ghost btn--icon" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>

        {/* Date range banner */}
        <div style={{ padding: '10px 24px', background: 'var(--accent-soft)', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="calendar" size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent)', fontWeight: 500 }}>
            {isRange
              ? `Del ${formatDay(startDay)} al ${formatDay(endDay)}`
              : formatDay(startDay)
            }
          </span>
        </div>

        <div className="modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{ padding: '10px 14px', background: 'var(--danger-soft)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--fs-sm)', color: 'var(--danger)' }}>
              {error}
            </div>
          )}

          <div className="field">
            <label className="field__label">Empleado</label>
            <select className="select" value={userId} onChange={(e) => setUserId(e.target.value)} disabled={!!preUserId}>
              <option value="">Seleccionar empleado…</option>
              {users.map((u) => <option key={u._id} value={u._id}>{u.name} {u.lname}</option>)}
            </select>
          </div>

          <div className="field">
            <label className="field__label">Tipo de trabajo</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {workTypes.map((wt) => (
                <button
                  key={wt.code}
                  type="button"
                  className={`filter-chip${workTypeCode === wt.code ? ' filter-chip--active' : ''}`}
                  onClick={() => setWorkTypeCode(wt.code)}
                  style={{ justifyContent: 'flex-start' }}
                >
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: wt.color, flexShrink: 0 }} />
                  <span className="mono" style={{ fontSize: 11, fontWeight: 700, minWidth: 28 }}>{wt.code}</span>
                  <span style={{ color: 'var(--fg-2)' }}>{wt.label}</span>
                </button>
              ))}
              {workTypes.length === 0 && (
                <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)' }}>No hay tipos de trabajo configurados.</div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label className="field__label">Día inicio</label>
              <input
                className="input"
                type="number"
                min={1}
                max={daysInMonth}
                value={startDay}
                onChange={(e) => {
                  const v = Math.max(1, Math.min(daysInMonth, +e.target.value))
                  setStartDay(v)
                  if (v > endDay) setEndDay(v)
                }}
              />
              <div className="field__hint">{formatDay(startDay)}</div>
            </div>
            <div className="field">
              <label className="field__label">Día fin</label>
              <input
                className="input"
                type="number"
                min={startDay}
                max={daysInMonth}
                value={endDay}
                onChange={(e) => setEndDay(Math.max(startDay, Math.min(daysInMonth, +e.target.value)))}
              />
              <div className="field__hint">{formatDay(endDay)}</div>
            </div>
          </div>
        </div>

        <div className="modal__footer">
          {existingEntry?._id && (
            <button className="btn btn--danger" onClick={handleDelete} disabled={loading}>Eliminar</button>
          )}
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn--primary" onClick={handleSave} disabled={loading || workTypes.length === 0}>
            {loading ? 'Guardando…' : existingEntry ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

interface ModalState {
  preUserId?: string
  preDay?: number
  preDayEnd?: number
  existingEntry?: ScheduleEntry
}

interface DragSelection {
  userId: string
  startDay: number
  endDay: number
}

export const SchedulePage: React.FC = () => {
  const { user: authUser } = useAuth()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [users, setUsers] = useState<User[]>([])
  const [entries, setEntries] = useState<ScheduleEntry[]>([])
  const [workTypes, setWorkTypes] = useState<WorkType[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<ModalState | null>(null)
  const [showWorkTypesModal, setShowWorkTypesModal] = useState(false)
  const [search, setSearch] = useState('')
  const [dragSel, setDragSel] = useState<DragSelection | null>(null)
  const dragRef = useRef<DragSelection | null>(null)

  const userAreas = useMemo(() => (authUser?.areas ?? []) as Area[], [authUser])
  const selectedAreaId = userAreas[0]?._id

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [u, wt] = await Promise.all([
        userService.getAll(),
        selectedAreaId ? workTypeService.getAll(selectedAreaId) : Promise.resolve([]),
      ])
      setUsers(u)
      setWorkTypes(wt)

      if (selectedAreaId) {
        const e = await scheduleService.getByMonth(year, month, selectedAreaId)
        setEntries(e)
      } else {
        setEntries([])
      }
    } finally {
      setLoading(false)
    }
  }, [year, month, selectedAreaId])

  useEffect(() => { load() }, [load])

  // Cancel drag if mouse is released outside the table
  useEffect(() => {
    const cancel = () => {
      dragRef.current = null
      setDragSel(null)
    }
    window.addEventListener('mouseup', cancel)
    return () => window.removeEventListener('mouseup', cancel)
  }, [])

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = !search || `${u.name} ${u.lname}`.toLowerCase().includes(search.toLowerCase())
      const matchesArea = !selectedAreaId || u.areas?.some((a) => a._id === selectedAreaId)
      return matchesSearch && matchesArea
    })
  }, [users, search, selectedAreaId])

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear((y) => y - 1) } else setMonth((m) => m - 1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear((y) => y + 1) } else setMonth((m) => m + 1) }

  const scheduleMap = useMemo(() => buildScheduleMap(entries), [entries])
  const workTypeMap = useMemo(
    () => Object.fromEntries(workTypes.map((wt) => [wt.code, wt])),
    [workTypes]
  )

  const getEntry = (uid: string, day: number) =>
    scheduleMap[`${month}-${year}-${day}-${uid}`] ?? null

  const handleCellMouseDown = (u: User, day: number, isWk: boolean) => {
    if (isWk) return
    const sel = { userId: u._id, startDay: day, endDay: day }
    dragRef.current = sel
    setDragSel(sel)
  }

  const handleCellMouseEnter = (u: User, day: number, isWk: boolean, e: React.MouseEvent) => {
    if (!dragRef.current || e.buttons !== 1 || isWk || u._id !== dragRef.current.userId) return
    const sel = { ...dragRef.current, endDay: day }
    dragRef.current = sel
    setDragSel(sel)
  }

  const handleCellMouseUp = (u: User, _day: number, isWk: boolean) => {
    if (!dragRef.current) return
    const { userId, startDay, endDay } = dragRef.current
    dragRef.current = null
    setDragSel(null)
    if (isWk || u._id !== userId) return

    const actualStart = Math.min(startDay, endDay)
    const actualEnd = Math.max(startDay, endDay)

    if (actualStart === actualEnd) {
      const existing = getEntry(userId, actualStart) ?? undefined
      setModal({ preUserId: userId, preDay: actualStart, existingEntry: existing })
    } else {
      setModal({ preUserId: userId, preDay: actualStart, preDayEnd: actualEnd })
    }
  }

  const handleAssignSaved = useCallback((result: SaveResult) => {
    if (result.type === 'upsert') {
      const entry = result.entry
      setEntries((prev) => {
        const idx = prev.findIndex((e) => e._id === entry._id)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = entry
          return next
        }
        return [...prev, entry]
      })
    } else {
      setEntries((prev) => prev.filter((e) => e._id !== result.id))
    }
  }, [])

  const handleWorkTypesSaved = async () => {
    if (!selectedAreaId) return
    const wt = await workTypeService.getAll(selectedAreaId)
    setWorkTypes(wt)
  }

  return (
    <div className="page" onMouseLeave={() => { dragRef.current = null; setDragSel(null) }}>
      <div className="page__header">
        <div>
          <h1 className="page__title">Control de actividades</h1>
          <div className="page__desc">Calendario mensual — {MES_NOMBRES[month]} {year}</div>
        </div>
        <div className="page__actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)', padding: 2 }}>
            <button className="btn btn--ghost btn--icon" onClick={prevMonth}>
              <Icon name="chevron" size={14} style={{ transform: 'rotate(180deg)' }} />
            </button>
            <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, padding: '0 8px', minWidth: 120, textAlign: 'center' }}>
              {MES_NOMBRES[month]} {year}
            </span>
            <button className="btn btn--ghost btn--icon" onClick={nextMonth}>
              <Icon name="chevron" size={14} />
            </button>
          </div>

          {userAreas[0] && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '0 12px', height: 36, borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)', background: 'var(--surface-2)',
              fontSize: 'var(--fs-sm)', color: 'var(--fg-2)',
              cursor: 'not-allowed', userSelect: 'none',
            }}>
              <Icon name="filter" size={13} style={{ color: 'var(--fg-muted)', flexShrink: 0 }} />
              <span style={{ fontWeight: 500, color: 'var(--fg)' }}>{userAreas[0].name}</span>
            </div>
          )}

          <Button kind="ghost" icon="settings" onClick={() => setShowWorkTypesModal(true)}>Actividades</Button>
        </div>
      </div>

      <div className="card">
        <div className="card__header">
          <h3 className="card__title">
            Personal — {filteredUsers.length} empleado{filteredUsers.length !== 1 ? 's' : ''}
            {selectedAreaId && userAreas.find((a) => a._id === selectedAreaId) && (
              <span style={{ fontWeight: 400, color: 'var(--fg-2)', marginLeft: 6 }}>
                · {userAreas.find((a) => a._id === selectedAreaId)!.name}
              </span>
            )}
          </h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="filter-bar__search" style={{ minWidth: 200 }}>
              <Icon name="search" size={13} className="muted" />
              <input
                placeholder="Filtrar empleados…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ background: 'none', border: 0, outline: 'none', width: '100%', fontSize: 'var(--fs-sm)', color: 'var(--fg)' }}
              />
            </div>
            {workTypes.map((wt) => (
              <div key={wt.code} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 'var(--fs-xs)', color: 'var(--fg-2)' }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: wt.color, opacity: 0.85 }} />
                <span className="mono" style={{ fontWeight: 600 }}>{wt.code}</span>
                <span>{wt.label}</span>
              </div>
            ))}
          </div>
        </div>

        {!selectedAreaId ? (
          <div className="empty" style={{ padding: '40px 0' }}>
            Selecciona un área para ver las asignaciones.
          </div>
        ) : loading ? (
          <div className="empty">Cargando datos…</div>
        ) : (
          <div style={{ overflowX: 'auto', userSelect: 'none' }}>
            <table className="tbl" style={{ minWidth: 1200 }}>
              <thead>
                <tr>
                  <th style={{ width: 220, position: 'sticky', left: 0, background: 'var(--surface-2)', zIndex: 1 }}>Empleado</th>
                  {days.map((d) => {
                    const wd = new Date(year, month, d).getDay()
                    const isWk = wd === 0 || wd === 6
                    const isToday = year === now.getFullYear() && month === now.getMonth() && d === now.getDate()
                    return (
                      <th key={d} style={{
                        minWidth: 36, textAlign: 'center', padding: '8px 4px',
                        background: isToday ? 'var(--accent-soft)' : isWk ? 'oklch(0.97 0.005 250)' : undefined,
                        color: isToday ? 'var(--accent)' : undefined,
                      }}>
                        <div style={{ fontSize: 10, color: isToday ? 'var(--accent)' : 'var(--fg-faint)', fontWeight: 500 }}>
                          {['D', 'L', 'M', 'X', 'J', 'V', 'S'][wd]}
                        </div>
                        <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 600 }}>{d}</div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={days.length + 1} style={{ textAlign: 'center', color: 'var(--fg-muted)', padding: '32px 0' }}>
                      No hay empleados en esta área.
                    </td>
                  </tr>
                ) : filteredUsers.map((u, ui) => (
                  <tr key={u._id}>
                    <td style={{ position: 'sticky', left: 0, background: 'var(--surface)', zIndex: 1 }}>
                      <NameCell name={`${u.name} ${u.lname}`} sub={u.position} avatarIdx={ui} />
                    </td>
                    {days.map((d) => {
                      const wd = new Date(year, month, d).getDay()
                      const isWk = wd === 0 || wd === 6
                      const entry = getEntry(u._id, d)
                      const wt = entry ? workTypeMap[entry.workTypeCode] : null

                      const isDragSelected = dragSel !== null &&
                        u._id === dragSel.userId &&
                        d >= Math.min(dragSel.startDay, dragSel.endDay) &&
                        d <= Math.max(dragSel.startDay, dragSel.endDay)

                      return (
                        <td
                          key={d}
                          style={{ padding: 2, textAlign: 'center', background: isWk ? 'oklch(0.97 0.005 250)' : undefined }}
                          onMouseDown={() => handleCellMouseDown(u, d, isWk)}
                          onMouseEnter={(e) => handleCellMouseEnter(u, d, isWk, e)}
                          onMouseUp={() => handleCellMouseUp(u, d, isWk)}
                        >
                          {!isWk && (
                            <div
                              title={wt ? `${wt.code} — ${wt.label}` : 'Clic o arrastra para asignar'}
                              style={{
                                background: isDragSelected
                                  ? 'var(--accent)'
                                  : wt ? wt.color : 'transparent',
                                color: isDragSelected || wt ? 'white' : 'var(--fg-faint)',
                                fontFamily: 'Geist Mono',
                                fontSize: 10,
                                fontWeight: 700,
                                padding: '4px 0',
                                borderRadius: 3,
                                opacity: isDragSelected ? 0.85 : wt ? 0.9 : 1,
                                cursor: 'pointer',
                                minHeight: 22,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                outline: isDragSelected ? '2px solid var(--accent)' : undefined,
                                transition: 'background 0.05s',
                              }}
                            >
                              {isDragSelected && !wt
                                ? <span style={{ fontSize: 8 }}>●</span>
                                : wt ? wt.code : <span style={{ fontSize: 8, opacity: 0.4 }}>+</span>
                              }
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal !== null && (
        <AssignModal
          users={filteredUsers}
          workTypes={workTypes}
          year={year}
          month={month}
          preUserId={modal.preUserId}
          preDay={modal.preDay}
          preDayEnd={modal.preDayEnd}
          existingEntry={modal.existingEntry}
          areaId={selectedAreaId}
          onClose={() => setModal(null)}
          onSaved={handleAssignSaved}
        />
      )}

      {showWorkTypesModal && selectedAreaId && (
        <WorkTypesModal
          workTypes={workTypes}
          areaId={selectedAreaId}
          onClose={() => setShowWorkTypesModal(false)}
          onSaved={handleWorkTypesSaved}
        />
      )}
    </div>
  )
}
