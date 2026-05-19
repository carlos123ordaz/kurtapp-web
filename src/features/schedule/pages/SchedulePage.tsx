import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon, Button, NameCell } from '../../../components/ui'
import type { Area, User, WorkType, ScheduleEntry, CaseLabel } from '../../../types'
import userService from '../../usuarios/services/userService'
import scheduleService from '../services/scheduleService'
import workTypeService from '../services/workTypeService'
import caseLabelService from '../services/caseLabelService'
import scheduleOrderService from '../services/scheduleOrderService'
import { useAuth } from '../../../context/AuthContext'

const MES_NOMBRES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const DIA_NOMBRES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const DIA_LETRAS  = ['D', 'L', 'M', 'X', 'J', 'V', 'S']

type ScheduleMap  = Record<string, ScheduleEntry>
type CaseLabelMap = Record<string, CaseLabel>

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

function buildCaseLabelMap(labels: CaseLabel[]): CaseLabelMap {
  const map: CaseLabelMap = {}
  labels.forEach((l) => {
    const uid = normalizeUserId(l.userId)
    const cur = new Date(l.startDate)
    const end = new Date(l.endDate)
    while (cur <= end) {
      map[`${cur.getMonth()}-${cur.getFullYear()}-${cur.getDate()}-${uid}`] = { ...l, userId: uid }
      cur.setDate(cur.getDate() + 1)
    }
  })
  return map
}

// ── Case number autocomplete ──────────────────────────────────────────────────

interface CaseNumberInputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoFocus?: boolean
}

const CaseNumberInput: React.FC<CaseNumberInputProps> = ({ value, onChange, placeholder, autoFocus }) => {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchSuggestions = (q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q.trim()) { setSuggestions([]); setOpen(false); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await caseLabelService.searchCaseNumbers(q)
        setSuggestions(results)
        setOpen(results.length > 0)
        setActiveIdx(-1)
      } catch { setSuggestions([]) }
    }, 250)
  }

  const handleSelect = (s: string) => { onChange(s); setOpen(false); setSuggestions([]); setActiveIdx(-1) }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || !suggestions.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => (i < suggestions.length - 1 ? i + 1 : 0)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => (i > 0 ? i - 1 : suggestions.length - 1)) }
    else if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); handleSelect(suggestions[activeIdx]) }
    else if (e.key === 'Escape') setOpen(false)
  }

  useEffect(() => {
    const h = (e: MouseEvent) => { if (!containerRef.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <input
        className="input"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => { onChange(e.target.value); fetchSuggestions(e.target.value) }}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (value.trim() && suggestions.length > 0) setOpen(true) }}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0, zIndex: 200,
          background: 'var(--surface)', border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-sm)', boxShadow: '0 4px 20px rgba(0,0,0,0.13)', overflow: 'hidden',
        }}>
          {suggestions.map((s, i) => (
            <div key={s}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(s) }}
              onMouseEnter={() => setActiveIdx(i)}
              style={{
                padding: '8px 12px', fontSize: 'var(--fs-sm)', cursor: 'pointer',
                background: i === activeIdx ? 'var(--accent-soft)' : 'transparent',
                color: i === activeIdx ? 'var(--accent)' : 'var(--fg)',
                borderBottom: i < suggestions.length - 1 ? '1px solid var(--border-soft)' : undefined,
              }}
            >{s}</div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Work Types modal ─────────────────────────────────────────────────────────

interface WorkTypesModalProps {
  workTypes: WorkType[]
  areaId: string
  onClose: () => void
  onSaved: () => void
}

const WorkTypesModal: React.FC<WorkTypesModalProps> = ({ workTypes, areaId, onClose, onSaved }) => {
  const [editingCode, setEditingCode] = useState<string | null>(null)
  const [code, setCode] = useState(''); const [label, setLabel] = useState(''); const [color, setColor] = useState('#2563EB')
  const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const reset = () => { setCode(''); setLabel(''); setColor('#2563EB'); setEditingCode(null); setError(null) }
  const handleEdit = (wt: WorkType) => { setEditingCode(wt.code); setCode(wt.code); setLabel(wt.label); setColor(wt.color); setError(null) }

  const handleSave = async () => {
    if (!code || !label || !color) { setError('Completa todos los campos.'); return }
    setLoading(true); setError(null)
    try {
      if (editingCode) await workTypeService.update(editingCode, { label, color, areaId })
      else await workTypeService.create({ code: code.toUpperCase(), label, color, areaId })
      onSaved(); reset()
    } catch { setError('Error al guardar.') } finally { setLoading(false) }
  }

  const handleDelete = async (wtCode: string) => {
    setLoading(true)
    try { await workTypeService.delete(wtCode, areaId); onSaved(); setConfirmDelete(null) }
    catch { setError('Error al eliminar.') } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ minWidth: 480, maxWidth: 580, width: '90vw' }}>
        <div className="modal__header">
          <h2 className="modal__title">Gestionar tipos de actividad</h2>
          <button className="btn btn--ghost btn--icon" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>
        <div className="modal__body" style={{ padding: 0 }}>
          {error && <div style={{ margin: '12px 20px 0', padding: '10px 14px', background: 'var(--danger-soft)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--fs-sm)', color: 'var(--danger)' }}>{error}</div>}
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead><tr><th style={{ width: 70 }}>Código</th><th>Descripción</th><th style={{ width: 130 }}>Color</th><th style={{ width: 80, textAlign: 'right' }}>Acciones</th></tr></thead>
              <tbody>
                {workTypes.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--fg-muted)', padding: '20px 0' }}>No hay tipos configurados.</td></tr>
                ) : workTypes.map((wt) => (
                  <tr key={wt.code}>
                    <td><span className="mono" style={{ fontWeight: 700, fontSize: 12 }}>{wt.code}</span></td>
                    <td>{wt.label}</td>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 16, height: 16, borderRadius: 3, background: wt.color, border: '1px solid var(--border)', flexShrink: 0 }} /><span className="mono" style={{ fontSize: 11, color: 'var(--fg-2)' }}>{wt.color.toUpperCase()}</span></div></td>
                    <td style={{ textAlign: 'right' }}><div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}><button className="btn btn--ghost btn--icon" onClick={() => handleEdit(wt)}><Icon name="edit" size={14} /></button><button className="btn btn--ghost btn--icon" onClick={() => setConfirmDelete(wt.code)} style={{ color: 'var(--danger)' }}><Icon name="trash" size={14} /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}>
            <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 600, color: 'var(--fg-2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>{editingCode ? 'Editar tipo' : 'Nuevo tipo'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 90px', gap: 10 }}>
              <div className="field"><label className="field__label">Código</label><input className="input" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={6} placeholder="TRA" disabled={!!editingCode} /></div>
              <div className="field"><label className="field__label">Descripción</label><input className="input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ej. Trabajo en campo" /></div>
              <div className="field"><label className="field__label">Color</label><input className="input" type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ padding: '2px 4px', height: 36, cursor: 'pointer' }} /></div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button className="btn btn--primary" onClick={handleSave} disabled={loading}>{loading ? 'Guardando…' : editingCode ? 'Actualizar' : 'Agregar'}</button>
              {editingCode && <button className="btn" onClick={reset}>Cancelar</button>}
            </div>
          </div>
        </div>
        <div className="modal__footer"><button className="btn" onClick={onClose}>Cerrar</button></div>
      </div>
      {confirmDelete && (
        <div className="modal-overlay" style={{ zIndex: 52 }} onClick={(e) => { e.stopPropagation(); setConfirmDelete(null) }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 360 }}>
            <div className="modal__header"><h2 className="modal__title">Eliminar tipo</h2></div>
            <div className="modal__body"><p style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-2)', margin: 0 }}>¿Seguro que deseas eliminar el tipo <strong>{confirmDelete}</strong>?</p></div>
            <div className="modal__footer"><button className="btn" onClick={() => setConfirmDelete(null)}>Cancelar</button><button className="btn btn--danger" onClick={() => handleDelete(confirmDelete)} disabled={loading}>Eliminar</button></div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Activity assignment modal ─────────────────────────────────────────────────

type SaveResult =
  | { type: 'upsert'; entry: ScheduleEntry }
  | { type: 'delete'; id: string }
  | { type: 'partial-delete'; entryId: string; newSegments: ScheduleEntry[] }

interface AssignModalProps {
  users: User[]; workTypes: WorkType[]; year: number; month: number
  preUserId?: string; preDay?: number; preDayEnd?: number
  preWorkTypeCode?: string; existingEntry?: ScheduleEntry; areaId?: string
  onClose: () => void; onSaved: (result: SaveResult) => void
}

const AssignModal: React.FC<AssignModalProps> = ({
  users, workTypes, year, month, preUserId, preDay, preDayEnd, preWorkTypeCode, existingEntry, areaId, onClose, onSaved,
}) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const [userId, setUserId]       = useState(preUserId ?? existingEntry?.userId ?? '')
  const [workTypeCode, setWtCode] = useState(preWorkTypeCode ?? existingEntry?.workTypeCode ?? workTypes[0]?.code ?? '')
  const [startDay, setStartDay]   = useState(preDay ?? (existingEntry ? new Date(existingEntry.startDate).getDate() : 1))
  const [endDay, setEndDay]       = useState(preDayEnd ?? preDay ?? (existingEntry ? new Date(existingEntry.endDate).getDate() : 1))
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const formatDay = (d: number) => `${DIA_NOMBRES[new Date(year, month, d).getDay()]} ${d} de ${MES_NOMBRES[month]}`

  const handleSave = async () => {
    if (!userId || !workTypeCode) { setError('Completa todos los campos.'); return }
    if (startDay > endDay) { setError('El día inicio no puede ser mayor al día fin.'); return }
    setLoading(true); setError(null)
    try {
      const payload = { userId, workTypeCode: workTypeCode.toUpperCase(), areaId: areaId ?? '', startDate: new Date(year, month, startDay).toISOString(), endDate: new Date(year, month, endDay).toISOString(), month, year }
      const saved = existingEntry?._id ? await scheduleService.update(existingEntry._id, payload) : await scheduleService.create(payload)
      onSaved({ type: 'upsert', entry: { ...saved, userId: normalizeUserId(saved.userId) } })
      onClose()
    } catch { setError('Error al guardar la actividad.') } finally { setLoading(false) }
  }

  const handleDelete = async () => {
    if (!existingEntry?._id) return
    setLoading(true)
    try {
      const entryStart = new Date(existingEntry.startDate).getUTCDate()
      const entryEnd   = new Date(existingEntry.endDate).getUTCDate()
      if (preDay !== undefined && (entryStart !== entryEnd)) {
        // Solo elimina el día específico que se clickeó, no todo el rango
        const segs = await scheduleService.partialDelete([{
          entryId: existingEntry._id,
          datesToRemove: [new Date(year, month, preDay).toISOString()],
        }])
        onSaved({ type: 'partial-delete', entryId: existingEntry._id, newSegments: segs.map((e) => ({ ...e, userId: normalizeUserId(e.userId) })) })
      } else {
        await scheduleService.delete(existingEntry._id)
        onSaved({ type: 'delete', id: existingEntry._id })
      }
      onClose()
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ zIndex: 51 }}>
        <div className="modal__header">
          <div>
            <h2 className="modal__title">{existingEntry ? 'Editar asignación' : 'Asignar trabajo'}</h2>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-2)', marginTop: 2 }}>{MES_NOMBRES[month]} {year}</div>
          </div>
          <button className="btn btn--ghost btn--icon" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>
        <div style={{ padding: '10px 24px', background: 'var(--accent-soft)', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="calendar" size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent)', fontWeight: 500 }}>
            {startDay !== endDay ? `Del ${formatDay(startDay)} al ${formatDay(endDay)}` : formatDay(startDay)}
          </span>
        </div>
        <div className="modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <div style={{ padding: '10px 14px', background: 'var(--danger-soft)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--fs-sm)', color: 'var(--danger)' }}>{error}</div>}
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
                <button key={wt.code} type="button"
                  className={`filter-chip${workTypeCode === wt.code ? ' filter-chip--active' : ''}`}
                  onClick={() => setWtCode(wt.code)} style={{ justifyContent: 'flex-start' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: wt.color, flexShrink: 0 }} />
                  <span className="mono" style={{ fontSize: 11, fontWeight: 700, minWidth: 28 }}>{wt.code}</span>
                  <span style={{ color: 'var(--fg-2)' }}>{wt.label}</span>
                </button>
              ))}
              {workTypes.length === 0 && <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)' }}>No hay tipos configurados.</div>}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label className="field__label">Día inicio</label>
              <input className="input" type="number" min={1} max={daysInMonth} value={startDay}
                onChange={(e) => { const v = Math.max(1, Math.min(daysInMonth, +e.target.value)); setStartDay(v); if (v > endDay) setEndDay(v) }} />
              <div className="field__hint">{formatDay(startDay)}</div>
            </div>
            <div className="field">
              <label className="field__label">Día fin</label>
              <input className="input" type="number" min={startDay} max={daysInMonth} value={endDay}
                onChange={(e) => setEndDay(Math.max(startDay, Math.min(daysInMonth, +e.target.value)))} />
              <div className="field__hint">{formatDay(endDay)}</div>
            </div>
          </div>
        </div>
        <div className="modal__footer">
          {existingEntry?._id && <button className="btn btn--danger" onClick={handleDelete} disabled={loading}>Eliminar</button>}
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn--primary" onClick={handleSave} disabled={loading || workTypes.length === 0}>{loading ? 'Guardando…' : existingEntry ? 'Actualizar' : 'Guardar'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Case label modal ──────────────────────────────────────────────────────────

interface CaseLabelModalProps {
  year: number; month: number; userId: string; areaId: string
  startDay: number; endDay: number
  existingCaseNumber?: string
  onClose: () => void
  onSaved: (label: CaseLabel) => void
  onCleared: () => void
}

const CaseLabelModal: React.FC<CaseLabelModalProps> = ({
  year, month, userId, areaId, startDay, endDay, existingCaseNumber, onClose, onSaved, onCleared,
}) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const [caseNumber, setCaseNumber] = useState(existingCaseNumber ?? '')
  const [sDay, setSDay] = useState(startDay)
  const [eDay, setEDay] = useState(endDay)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formatDay = (d: number) => `${DIA_NOMBRES[new Date(year, month, d).getDay()]} ${d} de ${MES_NOMBRES[month]}`

  const handleSave = async () => {
    if (!caseNumber.trim()) { setError('Ingresa el N° de caso.'); return }
    setLoading(true); setError(null)
    try {
      const saved = await caseLabelService.create({
        userId, areaId,
        startDate: new Date(year, month, sDay).toISOString(),
        endDate:   new Date(year, month, eDay).toISOString(),
        month, year, caseNumber: caseNumber.trim(),
      })
      onSaved({ ...saved, userId: normalizeUserId(saved.userId) })
      onClose()
    } catch { setError('Error al guardar.') } finally { setLoading(false) }
  }

  const handleClear = async () => {
    setLoading(true)
    try {
      await caseLabelService.clearRange(
        userId, areaId,
        new Date(year, month, sDay).toISOString(),
        new Date(year, month, eDay).toISOString(),
      )
      onCleared()
      onClose()
    } catch { setError('Error al limpiar.') } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ zIndex: 51, maxWidth: 420 }}>
        <div className="modal__header">
          <div>
            <h2 className="modal__title">
              <Icon name="hash" size={16} style={{ marginRight: 6, verticalAlign: 'middle', color: 'var(--warning, #d97706)' }} />
              {existingCaseNumber ? 'Editar N° de caso' : 'Asignar N° de caso'}
            </h2>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-2)', marginTop: 2 }}>{MES_NOMBRES[month]} {year}</div>
          </div>
          <button className="btn btn--ghost btn--icon" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>
        <div style={{
          padding: '10px 24px', borderBottom: '1px solid var(--border-soft)',
          background: 'rgba(234,179,8,0.08)', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Icon name="calendar" size={14} style={{ color: '#d97706', flexShrink: 0 }} />
          <span style={{ fontSize: 'var(--fs-sm)', color: '#92400e', fontWeight: 500 }}>
            {sDay !== eDay ? `Del ${formatDay(sDay)} al ${formatDay(eDay)}` : formatDay(sDay)}
          </span>
        </div>
        <div className="modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <div style={{ padding: '10px 14px', background: 'var(--danger-soft)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--fs-sm)', color: 'var(--danger)' }}>{error}</div>}
          <div className="field">
            <label className="field__label">N° de caso / Proyecto</label>
            <CaseNumberInput value={caseNumber} onChange={setCaseNumber} placeholder="Ej. DSM-0491-OSRV o San Gabriel" autoFocus />
            <div className="field__hint">Este número se mostrará sobre las celdas del rango seleccionado.</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label className="field__label">Día inicio</label>
              <input className="input" type="number" min={1} max={daysInMonth} value={sDay}
                onChange={(e) => { const v = Math.max(1, Math.min(daysInMonth, +e.target.value)); setSDay(v); if (v > eDay) setEDay(v) }} />
              <div className="field__hint">{formatDay(sDay)}</div>
            </div>
            <div className="field">
              <label className="field__label">Día fin</label>
              <input className="input" type="number" min={sDay} max={daysInMonth} value={eDay}
                onChange={(e) => setEDay(Math.max(sDay, Math.min(daysInMonth, +e.target.value)))} />
              <div className="field__hint">{formatDay(eDay)}</div>
            </div>
          </div>
        </div>
        <div className="modal__footer">
          {existingCaseNumber && (
            <button className="btn btn--danger" onClick={handleClear} disabled={loading} title="Elimina el N° de caso de este rango">
              Limpiar
            </button>
          )}
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn--primary" onClick={handleSave} disabled={loading}
            style={{ background: '#d97706', borderColor: '#d97706' }}>
            {loading ? 'Guardando…' : existingCaseNumber ? 'Actualizar' : 'Asignar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Cell context menu ─────────────────────────────────────────────────────────

interface CellContextMenuProps {
  x: number; y: number; startDay: number; endDay: number
  hasActivities: boolean; loading: boolean
  onDelete: () => void; onModify: () => void; onClose: () => void
}

const CellContextMenu: React.FC<CellContextMenuProps> = ({ x, y, startDay, endDay, hasActivities, loading, onDelete, onModify, onClose }) => {
  const [confirming, setConfirming] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x, y })
  const dayCount = endDay - startDay + 1

  useEffect(() => {
    if (!menuRef.current) return
    const rect = menuRef.current.getBoundingClientRect()
    setPos({ x: Math.min(x + 8, window.innerWidth - rect.width - 12), y: Math.min(y + 8, window.innerHeight - rect.height - 12) })
  }, [x, y])

  useEffect(() => {
    const h = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) onClose() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])

  return (
    <div ref={menuRef} style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 300, background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)', boxShadow: '0 4px 24px rgba(0,0,0,0.18)', minWidth: 210, overflow: 'hidden' }}>
      <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border-soft)', fontSize: 'var(--fs-xs)', fontWeight: 600, color: 'var(--fg-2)', background: 'var(--surface-2)' }}>
        {dayCount} día{dayCount !== 1 ? 's' : ''} seleccionado{dayCount !== 1 ? 's' : ''}
      </div>
      {confirming ? (
        <div style={{ padding: '12px 14px' }}>
          <p style={{ margin: '0 0 10px', fontSize: 'var(--fs-sm)', color: 'var(--fg-2)' }}>
            ¿Eliminar <strong>{dayCount}</strong> día{dayCount !== 1 ? 's' : ''}?
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn--danger" style={{ flex: 1 }} onClick={onDelete} disabled={loading}>
              {loading ? 'Eliminando…' : 'Confirmar'}
            </button>
            <button className="btn" onClick={() => setConfirming(false)} disabled={loading}>No</button>
          </div>
        </div>
      ) : (
        <div style={{ padding: 4 }}>
          {hasActivities && (
            <button className="btn btn--ghost" style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--danger)', gap: 8, padding: '7px 10px' }} onClick={() => setConfirming(true)}>
              <Icon name="trash" size={13} />Eliminar selección
            </button>
          )}
          <button className="btn btn--ghost" style={{ width: '100%', justifyContent: 'flex-start', gap: 8, padding: '7px 10px' }} onClick={onModify}>
            <Icon name="edit" size={13} />{hasActivities ? 'Modificar' : 'Asignar'}
          </button>
          <div style={{ height: 1, background: 'var(--border-soft)', margin: '2px 4px' }} />
          <button className="btn btn--ghost" style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--fg-muted)', gap: 8, padding: '7px 10px' }} onClick={onClose}>
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

interface ModalState {
  preUserId?: string; preDay?: number; preDayEnd?: number
  preWorkTypeCode?: string; existingEntry?: ScheduleEntry
}

interface CaseModalState {
  userId: string; startDay: number; endDay: number; existingCaseNumber?: string
}

interface DragSelection { userId: string; startDay: number; endDay: number }

type ActiveMode = 'normal' | 'delete' | 'case'

export const SchedulePage: React.FC = () => {
  const { user: authUser } = useAuth()
  const navigate = useNavigate()
  const now = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [users, setUsers]           = useState<User[]>([])
  const [entries, setEntries]       = useState<ScheduleEntry[]>([])
  const [caseLabels, setCaseLabels] = useState<CaseLabel[]>([])
  const [workTypes, setWorkTypes]   = useState<WorkType[]>([])
  const [loading, setLoading]       = useState(true)
  const [modal, setModal]           = useState<ModalState | null>(null)
  const [caseModal, setCaseModal]   = useState<CaseModalState | null>(null)
  const [showWorkTypesModal, setShowWorkTypesModal] = useState(false)
  const [search, setSearch]   = useState('')
  const [mode, setMode]       = useState<ActiveMode>('normal')
  const [dragSel, setDragSel] = useState<DragSelection | null>(null)
  const dragRef = useRef<DragSelection | null>(null)

  // delete sub-state
  const [deleteSelected, setDeleteSelected] = useState<Set<string>>(new Set())
  const [deleteLoading, setDeleteLoading]   = useState(false)
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [contextMenu, setContextMenu]                 = useState<{ userId: string; startDay: number; endDay: number; x: number; y: number; hasActivities: boolean } | null>(null)
  const [contextMenuLoading, setContextMenuLoading]   = useState(false)

  const [userOrder, setUserOrder] = useState<string[]>([])
  const [rowDrag, setRowDrag]     = useState<{ dragId: string; overId: string | null } | null>(null)
  const rowDragRef = useRef<{ dragId: string; overId: string | null } | null>(null)

  const userAreas    = useMemo(() => (authUser?.areas ?? []) as Area[], [authUser])
  const selectedAreaId = userAreas[0]?._id

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [u, wt] = await Promise.all([
        userService.getAll(),
        selectedAreaId ? workTypeService.getAll(selectedAreaId) : Promise.resolve([]),
      ])
      setUsers(u); setWorkTypes(wt)
      if (selectedAreaId) {
        const [e, cl] = await Promise.all([
          scheduleService.getByMonth(year, month, selectedAreaId),
          caseLabelService.getByMonth(year, month, selectedAreaId),
        ])
        setEntries(e); setCaseLabels(cl)
      } else { setEntries([]); setCaseLabels([]) }
    } finally { setLoading(false) }
  }, [year, month, selectedAreaId])

  useEffect(() => { load() }, [load])

  const orderLoadedRef = useRef(false)

  useEffect(() => {
    if (!selectedAreaId) return
    orderLoadedRef.current = false
    scheduleOrderService.get(selectedAreaId)
      .then(saved => {
        setUserOrder(prev => {
          const base = saved.length ? saved : prev
          const kept    = base.filter(id => users.some(u => u._id === id))
          const newOnes = users.filter(u => !base.includes(u._id)).map(u => u._id)
          return [...kept, ...newOnes]
        })
      })
      .catch(() => {
        setUserOrder(prev => {
          const kept    = prev.filter(id => users.some(u => u._id === id))
          const newOnes = users.filter(u => !prev.includes(u._id)).map(u => u._id)
          return [...kept, ...newOnes]
        })
      })
      .finally(() => { orderLoadedRef.current = true })
  }, [users, selectedAreaId])

  const saveOrderDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!orderLoadedRef.current || !selectedAreaId || userOrder.length === 0) return
    if (saveOrderDebounceRef.current) clearTimeout(saveOrderDebounceRef.current)
    saveOrderDebounceRef.current = setTimeout(() => {
      scheduleOrderService.save(selectedAreaId, userOrder).catch(() => {})
    }, 800)
    return () => { if (saveOrderDebounceRef.current) clearTimeout(saveOrderDebounceRef.current) }
  }, [userOrder, selectedAreaId])

  useEffect(() => {
    const cancel = () => {
      dragRef.current = null
      setDragSel(null)
      if (rowDragRef.current) {
        const { dragId, overId } = rowDragRef.current
        rowDragRef.current = null
        setRowDrag(null)
        if (overId && dragId !== overId) {
          setUserOrder(prev => {
            const order = [...prev]
            const from  = order.indexOf(dragId)
            const to    = order.indexOf(overId)
            if (from === -1 || to === -1) return prev
            order.splice(from, 1)
            order.splice(to, 0, dragId)
            return order
          })
        }
      }
    }
    window.addEventListener('mouseup', cancel)
    return () => window.removeEventListener('mouseup', cancel)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mode !== 'normal') {
        setMode('normal'); setDeleteSelected(new Set()); setConfirmBulkDelete(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode])

  const daysInMonth  = new Date(year, month + 1, 0).getDate()
  const days         = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const filteredUsers = useMemo(() => {
    const filtered = users.filter((u) => {
      const matchSearch = !search || `${u.name} ${u.lname}`.toLowerCase().includes(search.toLowerCase())
      const matchArea   = !selectedAreaId || u.areas?.some((a) => a._id === selectedAreaId)
      return matchSearch && matchArea
    })
    return userOrder.length
      ? [...filtered].sort((a, b) => userOrder.indexOf(a._id) - userOrder.indexOf(b._id))
      : filtered
  }, [users, search, selectedAreaId, userOrder])

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear((y) => y - 1) } else setMonth((m) => m - 1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear((y) => y + 1) } else setMonth((m) => m + 1) }

  const scheduleMap  = useMemo(() => buildScheduleMap(entries),    [entries])
  const caseLabelMap = useMemo(() => buildCaseLabelMap(caseLabels), [caseLabels])
  const workTypeMap  = useMemo(() => Object.fromEntries(workTypes.map((wt) => [wt.code, wt])), [workTypes])

  const getEntry     = (uid: string, day: number) => scheduleMap[`${month}-${year}-${day}-${uid}`]  ?? null
  const getCaseLabel = (uid: string, day: number) => caseLabelMap[`${month}-${year}-${day}-${uid}`] ?? null

  const cellKey = (uid: string, day: number) => `${uid}|${day}`

  const collectCellKeysInRange = (uid: string, s: number, e: number) => {
    const keys: string[] = []
    for (let d = s; d <= e; d++) { if (getEntry(uid, d)) keys.push(cellKey(uid, d)) }
    return keys
  }

  const handleRowDragStart = (userId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const state = { dragId: userId, overId: null }
    rowDragRef.current = state
    setRowDrag(state)
  }

  const handleRowDragOver = (userId: string) => {
    if (!rowDragRef.current || rowDragRef.current.dragId === userId) return
    const state = { ...rowDragRef.current, overId: userId }
    rowDragRef.current = state
    setRowDrag(state)
  }

  const handleCellMouseDown = (u: User, day: number) => {
    const sel = { userId: u._id, startDay: day, endDay: day }
    dragRef.current = sel; setDragSel(sel)
  }

  const handleCellMouseEnter = (u: User, day: number, e: React.MouseEvent) => {
    if (!dragRef.current || e.buttons !== 1 || u._id !== dragRef.current.userId) return
    const sel = { ...dragRef.current, endDay: day }
    dragRef.current = sel; setDragSel(sel)
  }

  const handleCellMouseUp = (u: User, _day: number, ev: React.MouseEvent) => {
    if (!dragRef.current) return
    const { userId, startDay, endDay } = dragRef.current
    dragRef.current = null; setDragSel(null)
    if (u._id !== userId) return

    const s = Math.min(startDay, endDay)
    const e = Math.max(startDay, endDay)

    if (mode === 'delete') {
      const keys = collectCellKeysInRange(userId, s, e)
      if (keys.length > 0) setDeleteSelected((prev) => { const n = new Set(prev); keys.forEach((k) => n.add(k)); return n })
      return
    }

    if (mode === 'case') {
      // Detecta si hay un caso existente en el rango
      const existingCases = new Set<string>()
      for (let d = s; d <= e; d++) {
        const cl = getCaseLabel(userId, d)
        if (cl) existingCases.add(cl.caseNumber)
      }
      setCaseModal({
        userId, startDay: s, endDay: e,
        existingCaseNumber: existingCases.size === 1 ? [...existingCases][0] : undefined,
      })
      return
    }

    // Normal mode
    if (s === e) {
      const existing = getEntry(userId, s) ?? undefined
      setModal({ preUserId: userId, preDay: s, existingEntry: existing })
    } else {
      const hasActivities = Array.from({ length: e - s + 1 }, (_, i) => s + i).some((d) => !!getEntry(userId, d))
      if (!hasActivities) {
        // Celdas vacías → abrir AssignModal directamente
        setModal({ preUserId: userId, preDay: s, preDayEnd: e })
      } else {
        setContextMenu({ userId, startDay: s, endDay: e, x: ev.clientX, y: ev.clientY, hasActivities: true })
      }
    }
  }

  const handleAssignSaved = useCallback((result: SaveResult) => {
    if (result.type === 'upsert') {
      const entry = result.entry
      const ns = new Date(entry.startDate).getTime()
      const ne = new Date(entry.endDate).getTime()
      setEntries((prev) => {
        const filtered = prev.filter((e) => {
          if (normalizeUserId(e.userId) !== entry.userId) return true
          if (e._id === entry._id) return false
          const es = new Date(e.startDate).getTime(); const ee = new Date(e.endDate).getTime()
          return ee < ns || es > ne
        })
        const idx = filtered.findIndex((e) => e._id === entry._id)
        if (idx >= 0) { const n = [...filtered]; n[idx] = entry; return n }
        return [...filtered, entry]
      })
    } else if (result.type === 'partial-delete') {
      setEntries((prev) => {
        const filtered = prev.filter((e) => e._id !== result.entryId)
        return [...filtered, ...result.newSegments]
      })
    } else {
      setEntries((prev) => prev.filter((e) => e._id !== result.id))
    }
  }, [])

  const handleCaseLabelSaved = useCallback((label: CaseLabel) => {
    const ns = new Date(label.startDate).getTime()
    const ne = new Date(label.endDate).getTime()
    setCaseLabels((prev) => {
      const filtered = prev.filter((l) => {
        if (normalizeUserId(l.userId) !== label.userId) return true
        if (l._id === label._id) return false
        const ls = new Date(l.startDate).getTime(); const le = new Date(l.endDate).getTime()
        return le < ns || ls > ne
      })
      const idx = filtered.findIndex((l) => l._id === label._id)
      if (idx >= 0) { const n = [...filtered]; n[idx] = label; return n }
      return [...filtered, label]
    })
  }, [])

  const handleCaseLabelCleared = useCallback((userId: string, startDay: number, endDay: number) => {
    const ns = new Date(year, month, startDay).getTime()
    const ne = new Date(year, month, endDay).getTime()
    setCaseLabels((prev) => prev.filter((l) => {
      if (normalizeUserId(l.userId) !== userId) return true
      const ls = new Date(l.startDate).getTime(); const le = new Date(l.endDate).getTime()
      return le < ns || ls > ne
    }))
  }, [year, month])

  const handleBulkDelete = async () => {
    if (deleteSelected.size === 0) return
    const deletionsMap = new Map<string, Set<number>>()
    for (const key of deleteSelected) {
      const pi = key.indexOf('|'); const uid = key.substring(0, pi); const day = parseInt(key.substring(pi + 1))
      const entry = getEntry(uid, day); if (!entry?._id) continue
      if (!deletionsMap.has(entry._id)) deletionsMap.set(entry._id, new Set())
      deletionsMap.get(entry._id)!.add(day)
    }
    const deletions = [...deletionsMap.entries()].map(([entryId, days]) => ({
      entryId, datesToRemove: [...days].map((d) => new Date(year, month, d).toISOString()),
    }))
    if (!deletions.length) return
    setDeleteLoading(true)
    try {
      const newSegments = await scheduleService.partialDelete(deletions)
      const affectedIds = new Set(deletions.map((d) => d.entryId))
      setEntries((prev) => {
        const filtered = prev.filter((e) => !e._id || !affectedIds.has(e._id))
        return [...filtered, ...newSegments.map((e) => ({ ...e, userId: normalizeUserId(e.userId) }))]
      })
      setDeleteSelected(new Set()); setConfirmBulkDelete(false); setMode('normal')
    } catch { } finally { setDeleteLoading(false) }
  }

  const handleContextMenuDelete = async () => {
    if (!contextMenu) return
    const { userId, startDay, endDay } = contextMenu
    const deletionsMap = new Map<string, Set<number>>()
    for (let d = startDay; d <= endDay; d++) {
      const entry = getEntry(userId, d); if (!entry?._id) continue
      if (!deletionsMap.has(entry._id)) deletionsMap.set(entry._id, new Set())
      deletionsMap.get(entry._id)!.add(d)
    }
    const deletions = [...deletionsMap.entries()].map(([entryId, ds]) => ({
      entryId, datesToRemove: [...ds].map((d) => new Date(year, month, d).toISOString()),
    }))
    if (!deletions.length) { setContextMenu(null); return }
    setContextMenuLoading(true)
    try {
      const newSegments = await scheduleService.partialDelete(deletions)
      const affectedIds = new Set(deletions.map((d) => d.entryId))
      setEntries((prev) => {
        const filtered = prev.filter((e) => !e._id || !affectedIds.has(e._id))
        return [...filtered, ...newSegments.map((e) => ({ ...e, userId: normalizeUserId(e.userId) }))]
      })
      setContextMenu(null)
    } catch { } finally { setContextMenuLoading(false) }
  }

  const handleWorkTypesSaved = async () => {
    if (!selectedAreaId) return
    setWorkTypes(await workTypeService.getAll(selectedAreaId))
  }

  const setModeExclusive = (m: ActiveMode) => {
    setMode((prev) => prev === m ? 'normal' : m)
    setDeleteSelected(new Set()); setConfirmBulkDelete(false)
  }

  return (
    <div className="page" onMouseLeave={() => { dragRef.current = null; setDragSel(null) }}>
      <div className="page__header">
        <div>
          <h1 className="page__title">Control de actividades</h1>
          <div className="page__desc">Calendario mensual — {MES_NOMBRES[month]} {year}</div>
        </div>
        <div className="page__actions">
          {/* Month navigator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)', padding: 2 }}>
            <button className="btn btn--ghost btn--icon" onClick={prevMonth}><Icon name="chevron" size={14} style={{ transform: 'rotate(180deg)' }} /></button>
            <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, padding: '0 8px', minWidth: 120, textAlign: 'center' }}>{MES_NOMBRES[month]} {year}</span>
            <button className="btn btn--ghost btn--icon" onClick={nextMonth}><Icon name="chevron" size={14} /></button>
          </div>

          {/* Area badge */}
          {userAreas[0] && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', height: 36, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface-2)', fontSize: 'var(--fs-sm)', color: 'var(--fg-2)', cursor: 'not-allowed', userSelect: 'none' }}>
              <Icon name="filter" size={13} style={{ color: 'var(--fg-muted)', flexShrink: 0 }} />
              <span style={{ fontWeight: 500, color: 'var(--fg)' }}>{userAreas[0].name}</span>
            </div>
          )}

          {/* Case mode toggle */}
          <button
            className="btn"
            onClick={() => setModeExclusive('case')}
            title={mode === 'case' ? 'Salir del modo N° caso (Esc)' : 'Asignar N° de caso a celdas'}
            style={mode === 'case' ? { background: '#d97706', borderColor: '#d97706', color: 'white' } : undefined}
          >
            <Icon name="hash" size={14} />
            N° Caso
          </button>

          {/* Delete mode toggle */}
          <button
            className="btn"
            onClick={() => setModeExclusive('delete')}
            title={mode === 'delete' ? 'Salir del modo eliminar (Esc)' : 'Seleccionar actividades para eliminar'}
            style={mode === 'delete' ? { background: 'var(--danger)', borderColor: 'var(--danger)', color: 'white' } : undefined}
          >
            <Icon name="trash" size={14} />
            {mode === 'delete' ? 'Salir' : 'Seleccionar'}
          </button>

          <button
            className="btn btn--ghost"
            onClick={() => navigate(`/schedule/resumen?month=${month}&year=${year}&areaId=${selectedAreaId ?? ''}&areaName=${encodeURIComponent(userAreas[0]?.name ?? '')}`)}
            disabled={!selectedAreaId}
          >
            Ver resumen
          </button>

          <Button kind="ghost" icon="settings" onClick={() => setShowWorkTypesModal(true)}>Actividades</Button>
        </div>
      </div>

      <div className="card">
        <div className="card__header">
          <h3 className="card__title">
            Personal — {filteredUsers.length} empleado{filteredUsers.length !== 1 ? 's' : ''}
            {selectedAreaId && userAreas.find((a) => a._id === selectedAreaId) && (
              <span style={{ fontWeight: 400, color: 'var(--fg-2)', marginLeft: 6 }}>· {userAreas.find((a) => a._id === selectedAreaId)!.name}</span>
            )}
          </h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="filter-bar__search" style={{ minWidth: 200 }}>
              <Icon name="search" size={13} className="muted" />
              <input placeholder="Filtrar empleados…" value={search} onChange={(e) => setSearch(e.target.value)}
                style={{ background: 'none', border: 0, outline: 'none', width: '100%', fontSize: 'var(--fs-sm)', color: 'var(--fg)' }} />
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

        {/* Mode banners */}
        {mode === 'delete' && (
          <div style={{ padding: '8px 20px', background: 'var(--danger-soft)', borderBottom: '1px solid var(--danger-border)', fontSize: 'var(--fs-sm)', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="trash" size={13} />
            <span>Modo eliminar — arrastra sobre celdas de actividad para seleccionarlas. <kbd style={{ padding: '1px 5px', borderRadius: 3, border: '1px solid var(--danger-border)', fontFamily: 'monospace', fontSize: 11 }}>Esc</kbd> para salir.</span>
            {deleteSelected.size > 0 && <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{deleteSelected.size} día{deleteSelected.size !== 1 ? 's' : ''} seleccionado{deleteSelected.size !== 1 ? 's' : ''}</span>}
          </div>
        )}
        {mode === 'case' && (
          <div style={{ padding: '8px 20px', background: 'rgba(234,179,8,0.1)', borderBottom: '1px solid rgba(234,179,8,0.3)', fontSize: 'var(--fs-sm)', color: '#92400e', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="hash" size={13} />
            <span>Modo N° caso — arrastra sobre celdas para asignar un número de caso. <kbd style={{ padding: '1px 5px', borderRadius: 3, border: '1px solid rgba(234,179,8,0.4)', fontFamily: 'monospace', fontSize: 11 }}>Esc</kbd> para salir.</span>
          </div>
        )}

        {!selectedAreaId ? (
          <div className="empty" style={{ padding: '40px 0' }}>Selecciona un área para ver las asignaciones.</div>
        ) : loading ? (
          <div className="empty">Cargando datos…</div>
        ) : (
          <div style={{ overflowX: 'auto', userSelect: 'none' }}>
            <table className="tbl" style={{ minWidth: 1200 }}>
              <thead>
                <tr>
                  <th style={{ width: 200, position: 'sticky', left: 0, background: 'var(--surface-2)', zIndex: 1 }}>Empleado</th>
                  {days.map((d) => {
                    const wd = new Date(year, month, d).getDay()
                    const isWk    = wd === 0 || wd === 6
                    const isToday = year === now.getFullYear() && month === now.getMonth() && d === now.getDate()
                    return (
                      <th key={d} style={{ minWidth: 36, textAlign: 'center', padding: '8px 4px', background: isToday ? 'var(--accent-soft)' : isWk ? 'oklch(0.96 0.006 250)' : undefined, color: isToday ? 'var(--accent)' : isWk ? 'var(--fg-muted)' : undefined }}>
                        <div style={{ fontSize: 10, fontWeight: 500 }}>{DIA_LETRAS[wd]}</div>
                        <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 600 }}>{d}</div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan={days.length + 1} style={{ textAlign: 'center', color: 'var(--fg-muted)', padding: '32px 0' }}>No hay empleados en esta área.</td></tr>
                ) : filteredUsers.map((u, ui) => {
                  // Agrupa días consecutivos con el mismo N° de caso para colspan
                  const clGroups: Array<{ cl: CaseLabel | null; startDay: number; count: number }> = []
                  let cur: { cl: CaseLabel | null; startDay: number; count: number } | null = null
                  for (const d of days) {
                    const cl = getCaseLabel(u._id, d)
                    if (!cur) { cur = { cl, startDay: d, count: 1 } }
                    else if ((cur.cl?._id ?? null) === (cl?._id ?? null)) { cur.count++ }
                    else { clGroups.push(cur); cur = { cl, startDay: d, count: 1 } }
                  }
                  if (cur) clGroups.push(cur)

                  const dragStart = dragSel && u._id === dragSel.userId ? Math.min(dragSel.startDay, dragSel.endDay) : -1
                  const dragEnd   = dragSel && u._id === dragSel.userId ? Math.max(dragSel.startDay, dragSel.endDay) : -1

                  return (
                    <React.Fragment key={u._id}>
                      {/* ── Fila de N° de caso (celda por día para drag preciso) ── */}
                      <tr style={{ height: 0 }} onMouseEnter={() => handleRowDragOver(u._id)}>
                        <td style={{ position: 'sticky', left: 0, background: 'var(--surface)', zIndex: 1, padding: 0 }} />
                        {clGroups.flatMap((g) =>
                          Array.from({ length: g.count }, (_, i) => {
                            const d       = g.startDay + i
                            const isFirst = i === 0
                            const isLast  = i === g.count - 1
                            const hasDrag = mode === 'case' && dragStart !== -1 && d >= dragStart && d <= dragEnd
                            const bg = hasDrag
                              ? 'rgba(234,179,8,0.5)'
                              : g.cl
                                ? 'rgba(234,179,8,0.18)'
                                : mode === 'case' ? 'rgba(234,179,8,0.04)' : 'transparent'
                            return (
                              <td
                                key={`cl-${d}`}
                                style={{
                                  padding: 0, height: 14,
                                  background: bg,
                                  borderLeft:  isFirst && (!!g.cl || (hasDrag && d === dragStart)) ? '2px solid rgba(234,179,8,0.5)'  : 'none',
                                  borderRight: isLast  && (!!g.cl || (hasDrag && d === dragEnd))   ? '1px solid rgba(234,179,8,0.25)' : 'none',
                                  position: 'relative', overflow: 'visible',
                                  transition: 'background 0.05s',
                                  cursor: mode === 'case' ? 'crosshair' : 'default',
                                }}
                                onMouseDown={() => handleCellMouseDown(u, d)}
                                onMouseEnter={(e) => handleCellMouseEnter(u, d, e)}
                                onMouseUp={(ev) => handleCellMouseUp(u, d, ev)}
                                title={g.cl ? `Caso: ${g.cl.caseNumber}` : mode === 'case' ? 'Arrastra para asignar caso' : undefined}
                              >
                                {g.cl && isFirst && (
                                  <span style={{
                                    position: 'absolute', left: 0, top: 1,
                                    width: `${g.count * 36}px`,
                                    textAlign: 'center',
                                    fontSize: 8.5, fontWeight: 700, color: '#7c2d12',
                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                    pointerEvents: 'none', zIndex: 5, lineHeight: '12px',
                                  }}>
                                    {g.cl.caseNumber}
                                  </span>
                                )}
                              </td>
                            )
                          })
                        )}
                      </tr>

                      {/* ── Fila de actividades ── */}
                      <tr
                        onMouseEnter={() => handleRowDragOver(u._id)}
                        style={{
                          opacity:    rowDrag?.dragId === u._id ? 0.45 : 1,
                          boxShadow:  rowDrag?.overId === u._id ? 'inset 0 2px 0 var(--accent)' : undefined,
                          transition: 'opacity 0.1s, box-shadow 0.08s',
                        }}
                      >
                        <td style={{ position: 'sticky', left: 0, background: 'var(--surface)', zIndex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span
                              title="Arrastra para reordenar"
                              style={{
                                cursor: rowDrag ? 'grabbing' : 'grab',
                                color: 'var(--fg-faint)',
                                fontSize: 13,
                                lineHeight: 1,
                                padding: '0 2px',
                                flexShrink: 0,
                                userSelect: 'none',
                              }}
                              onMouseDown={(e) => handleRowDragStart(u._id, e)}
                            >⠿</span>
                            <NameCell name={`${u.name} ${u.lname}`} avatarIdx={ui} />
                          </div>
                        </td>
                        {days.map((d) => {
                          const wd    = new Date(year, month, d).getDay()
                          const isWk  = wd === 0 || wd === 6
                          const entry = getEntry(u._id, d)
                          const cl    = getCaseLabel(u._id, d)
                          const wt    = entry ? workTypeMap[entry.workTypeCode] : null

                          const isDeleteSel = !!entry && deleteSelected.has(cellKey(u._id, d))

                          const dragActive = dragSel !== null && u._id === dragSel.userId &&
                            d >= Math.min(dragSel.startDay, dragSel.endDay) &&
                            d <= Math.max(dragSel.startDay, dragSel.endDay)

                          const isCaseDrag     = mode === 'case'   && dragActive
                          const isActivityDrag = mode !== 'case'   && dragActive
                          const isDeleteDrag   = mode === 'delete' && dragActive

                          let abg = 'transparent', afg = 'var(--fg-faint)'
                          if (isDeleteSel)        { abg = 'var(--danger)';           afg = 'white' }
                          else if (isDeleteDrag)  { abg = 'oklch(0.75 0.12 25)';     afg = 'white' }
                          else if (isActivityDrag){ abg = 'var(--accent)';            afg = 'white' }
                          else if (isCaseDrag)    { abg = 'rgba(234,179,8,0.2)';      afg = 'var(--fg)' }
                          else if (wt)            { abg = wt.color;                   afg = 'white' }

                          const tooltip = cl
                            ? `Caso: ${cl.caseNumber}${wt ? ` | ${wt.code} — ${wt.label}` : ''}`
                            : wt
                              ? `${wt.code} — ${wt.label}`
                              : mode === 'case' ? 'Arrastra para asignar caso' : 'Clic o arrastra para asignar'

                          return (
                            <td key={d}
                              style={{ padding: '1px 2px', background: isWk ? 'oklch(0.97 0.004 250)' : undefined }}
                              onMouseDown={() => { if (mode !== 'case') handleCellMouseDown(u, d) }}
                              onMouseEnter={(e) => handleCellMouseEnter(u, d, e)}
                              onMouseUp={(ev) => { if (mode !== 'case') handleCellMouseUp(u, d, ev) }}
                              title={tooltip}
                            >
                              <div style={{
                                background: abg, color: afg,
                                fontFamily: 'Geist Mono', fontSize: 10, fontWeight: 700,
                                borderRadius: 3,
                                minHeight: 22,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer',
                                opacity: isActivityDrag ? 0.9 : isDeleteSel ? 1 : wt ? 0.9 : 1,
                                outline: isDeleteSel
                                  ? '2px solid var(--danger)'
                                  : isDeleteDrag
                                    ? '2px solid oklch(0.6 0.18 25)'
                                    : isActivityDrag
                                      ? '2px solid var(--accent)'
                                      : isCaseDrag
                                        ? '2px solid rgba(234,179,8,0.55)'
                                        : undefined,
                                transition: 'background 0.05s',
                              }}>
                                {isActivityDrag && !wt
                                  ? <span style={{ fontSize: 8 }}>●</span>
                                  : wt ? wt.code : <span style={{ fontSize: 8, opacity: 0.3 }}>+</span>
                                }
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk delete action bar */}
      {mode === 'delete' && deleteSelected.size > 0 && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', zIndex: 100 }}>
          <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 500 }}>{deleteSelected.size} día{deleteSelected.size !== 1 ? 's' : ''} seleccionado{deleteSelected.size !== 1 ? 's' : ''}</span>
          <button className="btn" onClick={() => { setDeleteSelected(new Set()); setConfirmBulkDelete(false) }}>Limpiar selección</button>
          <button className="btn btn--danger" onClick={() => setConfirmBulkDelete(true)} disabled={deleteLoading}><Icon name="trash" size={14} />Eliminar selección</button>
        </div>
      )}

      {/* Bulk delete confirm */}
      {confirmBulkDelete && (
        <div className="modal-overlay" style={{ zIndex: 102 }} onClick={() => setConfirmBulkDelete(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <div className="modal__header"><h2 className="modal__title">Eliminar actividades</h2></div>
            <div className="modal__body">
              <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-2)', margin: 0 }}>
                ¿Confirmas eliminar <strong>{deleteSelected.size} día{deleteSelected.size !== 1 ? 's' : ''}</strong>? Los rangos afectados se ajustarán automáticamente.
              </p>
            </div>
            <div className="modal__footer">
              <button className="btn" onClick={() => setConfirmBulkDelete(false)}>Cancelar</button>
              <button className="btn btn--danger" onClick={handleBulkDelete} disabled={deleteLoading}>{deleteLoading ? 'Eliminando…' : 'Eliminar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Activity modal */}
      {modal !== null && (
        <AssignModal
          users={filteredUsers} workTypes={workTypes} year={year} month={month}
          preUserId={modal.preUserId} preDay={modal.preDay} preDayEnd={modal.preDayEnd}
          preWorkTypeCode={modal.preWorkTypeCode} existingEntry={modal.existingEntry}
          areaId={selectedAreaId}
          onClose={() => setModal(null)} onSaved={handleAssignSaved}
        />
      )}

      {/* Case label modal */}
      {caseModal !== null && selectedAreaId && (
        <CaseLabelModal
          year={year} month={month}
          userId={caseModal.userId} areaId={selectedAreaId}
          startDay={caseModal.startDay} endDay={caseModal.endDay}
          existingCaseNumber={caseModal.existingCaseNumber}
          onClose={() => setCaseModal(null)}
          onSaved={handleCaseLabelSaved}
          onCleared={() => handleCaseLabelCleared(caseModal.userId, caseModal.startDay, caseModal.endDay)}
        />
      )}

      {/* Work types modal */}
      {showWorkTypesModal && selectedAreaId && (
        <WorkTypesModal workTypes={workTypes} areaId={selectedAreaId}
          onClose={() => setShowWorkTypesModal(false)} onSaved={handleWorkTypesSaved} />
      )}

      {/* Cell context menu */}
      {contextMenu !== null && (
        <CellContextMenu
          x={contextMenu.x} y={contextMenu.y}
          startDay={contextMenu.startDay} endDay={contextMenu.endDay}
          hasActivities={contextMenu.hasActivities}
          loading={contextMenuLoading}
          onDelete={handleContextMenuDelete}
          onModify={() => {
            const cm = contextMenu
            if (!cm) return
            const { userId, startDay, endDay } = cm
            const codes = new Set<string>()
            for (let d = startDay; d <= endDay; d++) { const ent = getEntry(userId, d); if (ent) codes.add(ent.workTypeCode) }
            setContextMenu(null)
            setModal({ preUserId: userId, preDay: startDay, preDayEnd: endDay, preWorkTypeCode: codes.size === 1 ? [...codes][0] : undefined })
          }}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}
