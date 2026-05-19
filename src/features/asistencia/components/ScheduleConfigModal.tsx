import React, { useEffect, useState } from 'react'
import { Icon, Button } from '../../../components/ui'
import type { DayOfWeek, DaySchedule, ScheduleConfig, TimePeriod } from '../../../types'
import scheduleConfigService from '../services/scheduleConfigService'

const DAY_NAMES: Record<DayOfWeek, string> = {
  monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
  thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo',
}

const ALL_DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const DEFAULT_WEEK: DaySchedule[] = ALL_DAYS.map((day, i) => ({
  day, isWorkday: i < 5,
  periods: i < 5 ? [{ start: '09:00', end: '18:00' }] : [],
  totalHours: i < 5 ? 9 : 0,
}))

const TEMPLATES = [
  { name: 'Jornada completa (40h)', weekSchedule: ALL_DAYS.map((day, i) => ({ day, isWorkday: i < 5, periods: i < 5 ? [{ start: '09:00', end: '18:00' }] : [], totalHours: i < 5 ? 9 : 0 })) },
  { name: 'Jornada partida (40h)', weekSchedule: ALL_DAYS.map((day, i) => ({ day, isWorkday: i < 5, periods: i < 5 ? [{ start: '08:30', end: '14:00' }, { start: '15:00', end: '17:30' }] : [], totalHours: i < 5 ? 8 : 0 })) },
  { name: 'Jornada intensiva (35h)', weekSchedule: ALL_DAYS.map((day, i) => ({ day, isWorkday: i < 5, periods: i < 5 ? [{ start: '09:00', end: '16:00' }] : [], totalHours: i < 5 ? 7 : 0 })) },
]

function calcPeriodHours(p: TimePeriod): number {
  const [sh, sm] = p.start.split(':').map(Number)
  const [eh, em] = p.end.split(':').map(Number)
  return Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60)
}
function calcDayHours(periods: TimePeriod[]): number {
  return periods.reduce((s, p) => s + calcPeriodHours(p), 0)
}
function calcWeeklyHours(ws: DaySchedule[]): number {
  return ws.reduce((s, d) => s + d.totalHours, 0)
}
function formatHours(h: number): string {
  return `${Math.floor(h)}h ${Math.round((h - Math.floor(h)) * 60).toString().padStart(2, '0')}m`
}

interface ScheduleConfigModalProps {
  userId: string
  userName: string
  onClose: () => void
}

export const ScheduleConfigModal: React.FC<ScheduleConfigModalProps> = ({ userId, userName, onClose }) => {
  const [existing, setExisting] = useState<ScheduleConfig | null>(null)
  const [loadingCfg, setLoadingCfg] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('Jornada completa (40h)')
  const [description, setDescription] = useState('')
  const [isFlexible, setIsFlexible] = useState(true)
  const [flexibleMinutes, setFlexibleMinutes] = useState(30)
  const [remoteDays, setRemoteDays] = useState<DayOfWeek[]>([])
  const [weekSchedule, setWeekSchedule] = useState<DaySchedule[]>(DEFAULT_WEEK)

  useEffect(() => {
    scheduleConfigService.getByUser(userId)
      .then((cfg) => {
        if (cfg) {
          setExisting(cfg)
          setName(cfg.name)
          setDescription(cfg.description ?? '')
          setIsFlexible(cfg.isFlexible ?? true)
          setFlexibleMinutes(cfg.flexibleMinutes ?? 30)
          setRemoteDays(cfg.remoteDays ?? [])
          setWeekSchedule(cfg.weekSchedule)
        }
      })
      .catch(() => setError('Error al cargar la configuración del usuario.'))
      .finally(() => setLoadingCfg(false))
  }, [userId])

  const applyTemplate = (tplName: string) => {
    const tpl = TEMPLATES.find((t) => t.name === tplName)
    if (!tpl) return
    setName(tpl.name)
    setWeekSchedule(tpl.weekSchedule.map((d) => ({ ...d, periods: d.periods.map((p) => ({ ...p })) })))
  }

  const toggleDay = (i: number) => {
    setWeekSchedule((prev) => {
      const next = [...prev]
      const d = { ...next[i] }
      if (d.isWorkday) { d.isWorkday = false; d.periods = []; d.totalHours = 0 }
      else { d.isWorkday = true; d.periods = [{ start: '09:00', end: '18:00' }]; d.totalHours = 9 }
      next[i] = d; return next
    })
  }

  const changePeriod = (di: number, pi: number, field: 'start' | 'end', val: string) => {
    setWeekSchedule((prev) => {
      const next = [...prev]
      const d = { ...next[di] }
      const periods = d.periods.map((p, idx) => idx === pi ? { ...p, [field]: val } : p)
      d.periods = periods; d.totalHours = calcDayHours(periods)
      next[di] = d; return next
    })
  }

  const addPeriod = (di: number) => {
    setWeekSchedule((prev) => {
      const next = [...prev]
      const d = { ...next[di] }
      d.periods = [...d.periods, { start: '09:00', end: '18:00' }]
      d.totalHours = calcDayHours(d.periods); next[di] = d; return next
    })
  }

  const removePeriod = (di: number, pi: number) => {
    setWeekSchedule((prev) => {
      const next = [...prev]
      const d = { ...next[di] }
      d.periods = d.periods.filter((_, i) => i !== pi)
      d.totalHours = calcDayHours(d.periods); d.isWorkday = d.periods.length > 0
      next[di] = d; return next
    })
  }

  const copyToWeekdays = (srcIdx: number) => {
    setWeekSchedule((prev) => prev.map((d, i) => {
      if (i === srcIdx || i > 4) return d
      const src = prev[srcIdx]
      return { ...d, periods: src.periods.map((p) => ({ ...p })), isWorkday: src.isWorkday, totalHours: src.totalHours }
    }))
  }

  const toggleRemoteDay = (day: DayOfWeek) => {
    setRemoteDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day])
  }

  const handleSave = async () => {
    if (!name.trim()) { setError('El nombre es requerido.'); return }
    setSaving(true); setError(null)
    try {
      const totalWeeklyHours = calcWeeklyHours(weekSchedule)
      const payload = { userId, name: name.trim(), description: description.trim(), isFlexible, flexibleMinutes, remoteDays, weekSchedule, totalWeeklyHours, active: true }
      if (existing?._id) await scheduleConfigService.update(existing._id, payload)
      else await scheduleConfigService.create(payload)
      onClose()
    } catch {
      setError('Error al guardar la configuración.')
    } finally {
      setSaving(false)
    }
  }

  const totalWeeklyHours = calcWeeklyHours(weekSchedule)
  const activeDays = weekSchedule.filter((d) => d.isWorkday).length

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 51, margin: 0, width: 'min(96vw, 920px)', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="modal__header">
          <div>
            <h2 className="modal__title">Configuración de horario</h2>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)', marginTop: 2 }}>{userName}</div>
          </div>
          <button className="btn btn--ghost btn--icon" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {error && (
            <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--danger-soft)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--fs-sm)', color: 'var(--danger)' }}>
              {error}
            </div>
          )}

          {loadingCfg ? (
            <div className="empty">Cargando configuración…</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 300px) minmax(0, 1fr)', gap: 20 }}>

              {/* Left panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* General config */}
                <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                  <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--fg-2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
                    Configuración general
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {!existing && (
                      <div className="field">
                        <label className="field__label">Plantilla</label>
                        <select className="select" value={TEMPLATES.some((t) => t.name === name) ? name : ''} onChange={(e) => applyTemplate(e.target.value)}>
                          <option value="">Personalizado</option>
                          {TEMPLATES.map((t) => <option key={t.name} value={t.name}>{t.name}</option>)}
                        </select>
                      </div>
                    )}
                    <div className="field">
                      <label className="field__label">Nombre</label>
                      <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Jornada partida 40h" />
                    </div>
                    <div className="field">
                      <label className="field__label">Descripción</label>
                      <textarea className="input" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Resumen del horario" style={{ resize: 'vertical' }} />
                    </div>

                    {/* Flexibility */}
                    <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)' }}>
                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                        <div>
                          <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600 }}>Flexibilidad</div>
                          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)' }}>Tolerancia sin incidencia</div>
                        </div>
                        <input type="checkbox" checked={isFlexible} onChange={(e) => setIsFlexible(e.target.checked)} />
                      </label>
                      {isFlexible && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                          <input className="input" type="number" min={0} max={120} value={flexibleMinutes} onChange={(e) => setFlexibleMinutes(Math.max(0, +e.target.value))} style={{ width: 80 }} />
                          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-2)' }}>min de tolerancia</span>
                        </div>
                      )}
                    </div>

                    {/* Remote days */}
                    <div className="field">
                      <label className="field__label">Días remotos</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                        {ALL_DAYS.map((day) => (
                          <label key={day} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 'var(--fs-xs)', padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border)', background: remoteDays.includes(day) ? 'var(--accent-soft)' : 'var(--surface)', color: remoteDays.includes(day) ? 'var(--accent)' : 'var(--fg-2)' }}>
                            <input type="checkbox" checked={remoteDays.includes(day)} onChange={() => toggleRemoteDay(day)} style={{ display: 'none' }} />
                            {DAY_NAMES[day].slice(0, 3)}
                          </label>
                        ))}
                      </div>
                      <div className="field__hint">En días remotos no se valida GPS.</div>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)' }}>
                  <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--fg-2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Resumen</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      ['Horas/semana', formatHours(totalWeeklyHours)],
                      ['Días activos', String(activeDays)],
                      ['Modo', isFlexible ? 'Flexible' : 'Fijo'],
                      ['Remotos', remoteDays.length ? remoteDays.map((d) => DAY_NAMES[d].slice(0, 3)).join(', ') : 'Ninguno'],
                    ].map(([label, val]) => (
                      <div key={label} style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)' }}>{label}</div>
                        <div style={{ fontWeight: 700, fontSize: 'var(--fs-sm)', marginTop: 2 }}>{val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right panel - weekly editor */}
              <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)' }}>
                <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--fg-2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
                  Editor semanal
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="tbl" style={{ minWidth: 520 }}>
                    <thead>
                      <tr>
                        <th style={{ width: 32 }}></th>
                        <th style={{ width: 100 }}>Día</th>
                        <th>Períodos</th>
                        <th style={{ width: 60 }}>Horas</th>
                        <th style={{ width: 110 }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weekSchedule.map((day, di) => (
                        <tr key={day.day} style={{ background: day.isWorkday ? undefined : 'var(--surface-2)' }}>
                          <td style={{ textAlign: 'center' }}>
                            <input type="checkbox" checked={day.isWorkday} onChange={() => toggleDay(di)} />
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>{DAY_NAMES[day.day]}</div>
                            <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{day.isWorkday ? 'Activo' : 'Libre'}</div>
                          </td>
                          <td>
                            {day.isWorkday ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {day.periods.map((p, pi) => (
                                  <div key={pi} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                                    <input className="input" type="time" value={p.start} onChange={(e) => changePeriod(di, pi, 'start', e.target.value)} style={{ width: 100, padding: '2px 6px' }} />
                                    <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)' }}>a</span>
                                    <input className="input" type="time" value={p.end} onChange={(e) => changePeriod(di, pi, 'end', e.target.value)} style={{ width: 100, padding: '2px 6px' }} />
                                    {day.periods.length > 1 && (
                                      <button className="btn btn--ghost btn--icon" onClick={() => removePeriod(di, pi)} style={{ width: 22, height: 22, minWidth: 0 }}>
                                        <Icon name="close" size={10} />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)' }}>Sin jornada</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ fontWeight: 700, fontSize: 'var(--fs-sm)' }}>
                              {day.isWorkday ? formatHours(day.totalHours) : '—'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                              <button className="btn btn--ghost" style={{ fontSize: 11, padding: '2px 8px', height: 26 }} onClick={() => addPeriod(di)} disabled={!day.isWorkday}>
                                <Icon name="plus" size={11} /> Período
                              </button>
                              <button className="btn btn--ghost" style={{ fontSize: 11, padding: '2px 8px', height: 26 }} onClick={() => copyToWeekdays(di)} disabled={!day.isWorkday} title="Copiar a L-V">
                                <Icon name="layers" size={11} /> Copiar L-V
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal__footer" style={{ justifyContent: 'space-between' }}>
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-2)' }}>
            Total semanal: <strong>{formatHours(totalWeeklyHours)}</strong>
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={onClose}>Cancelar</button>
            <Button kind="primary" onClick={handleSave} disabled={saving || loadingCfg}>
              {saving ? 'Guardando…' : existing ? 'Actualizar' : 'Guardar'}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
