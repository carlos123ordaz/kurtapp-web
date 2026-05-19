import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Icon, Badge, Button, Avatar, SeveridadBadge, EstadoIncidenciaBadge } from '../../../components/ui'
import type { Incidencia, User } from '../../../types'
import incidenciasService from '../services/incidenciasService'
import userService from '../../usuarios/services/userService'
import { useAuth } from '../../../context/AuthContext'

const TIPOS_INCIDENTE = [
  'Acto Inseguro / Subestandar',
  'Condicion Insegura / Subestandar',
  'Incidente de Trabajo (Sin lesion)',
  'Accidente de Trabajo',
  'Dano a la propiedad',
  'Dano ambiental',
  'Desviacion a procedimiento / estandar',
]
const GRADOS_SEVERIDAD = ['Bajo', 'Medio', 'Alto', 'Crítico']
const AREAS = [
  'Servicios', 'Proyectos', 'UN VA', 'UN AU', 'UN AI', 'QHSE',
  'Asistente de Gerencia', 'Ventas internas', 'Contabilidad y Finanzas',
  'Logistica', 'Compras e Importaciones', 'Almacen y Distribucion',
  'Gerencia', 'Operaciones', 'TD', 'Marketing', 'Administracion Financiera',
]
const MAX_IMGS = 5

interface NuevaIncidenciaModalProps {
  userId: string
  onClose: () => void
  onCreated: () => void
}

const NuevaIncidenciaModal: React.FC<NuevaIncidenciaModalProps> = ({ userId, onClose, onCreated }) => {
  const [tipoIncidente, setTipoIncidente] = useState('')
  const [gradoSeveridad, setGradoSeveridad] = useState('')
  const [areaAfectada, setAreaAfectada] = useState('')
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 16))
  const [ubicacion, setUbicacion] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [recomendacion, setRecomendacion] = useState('')
  const [imagenes, setImagenes] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    setImagenes((prev) => [...prev, ...files].slice(0, MAX_IMGS))
    e.target.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tipoIncidente || !gradoSeveridad || !areaAfectada || !ubicacion.trim() || !descripcion.trim()) {
      setError('Completa todos los campos obligatorios.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await incidenciasService.registrar({
        fecha: new Date(fecha).toISOString(),
        ubicacion: ubicacion.trim(),
        areaAfectada,
        tipoIncidente,
        gradoSeveridad,
        descripcion: descripcion.trim(),
        recomendacion: recomendacion.trim(),
        user: userId,
        imagenes,
      })
      onCreated()
      onClose()
    } catch {
      setError('Error al registrar la incidencia. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <aside className="drawer drawer--wide">
        <div className="drawer__header">
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 'var(--fs-xl)', fontWeight: 600, letterSpacing: '-0.02em' }}>
              Registrar incidencia
            </h2>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)', marginTop: 4 }}>
              Crea una incidencia manualmente desde el panel admin
            </div>
          </div>
          <button className="btn btn--ghost btn--icon" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>

        <div className="drawer__body">
          <form id="nueva-inc-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {error && (
              <div style={{ padding: '10px 14px', background: 'var(--danger-soft)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--fs-sm)', color: 'var(--danger)' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="field">
                <label className="field__label">Tipo de incidente <span style={{ color: 'var(--danger)' }}>*</span></label>
                <select className="input" value={tipoIncidente} onChange={(e) => setTipoIncidente(e.target.value)} required>
                  <option value="">Seleccionar…</option>
                  {TIPOS_INCIDENTE.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="field__label">Nivel de severidad <span style={{ color: 'var(--danger)' }}>*</span></label>
                <select className="input" value={gradoSeveridad} onChange={(e) => setGradoSeveridad(e.target.value)} required>
                  <option value="">Seleccionar…</option>
                  {GRADOS_SEVERIDAD.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="field__label">Área afectada <span style={{ color: 'var(--danger)' }}>*</span></label>
                <select className="input" value={areaAfectada} onChange={(e) => setAreaAfectada(e.target.value)} required>
                  <option value="">Seleccionar…</option>
                  {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="field__label">Fecha y hora <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input className="input" type="datetime-local" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
              </div>
            </div>

            <div className="field">
              <label className="field__label">Ubicación <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input className="input" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} placeholder="Ej. Piso 3, oficina de logística" required />
            </div>

            <div className="field">
              <label className="field__label">Descripción <span style={{ color: 'var(--danger)' }}>*</span></label>
              <textarea className="textarea" rows={4} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Describe el incidente con detalle…" required />
            </div>

            <div className="field">
              <label className="field__label">Recomendación</label>
              <textarea className="textarea" rows={3} value={recomendacion} onChange={(e) => setRecomendacion(e.target.value)} placeholder="Medidas correctivas sugeridas…" />
            </div>

            <div className="field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label className="field__label" style={{ margin: 0 }}>Evidencia fotográfica</label>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)' }}>{imagenes.length}/{MAX_IMGS}</span>
              </div>
              <button
                type="button"
                className="btn btn--ghost"
                style={{ gap: 6 }}
                disabled={imagenes.length >= MAX_IMGS}
                onClick={() => fileRef.current?.click()}
              >
                <Icon name="plus" size={14} /> Adjuntar imágenes
              </button>
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handleFiles} />
              {imagenes.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  {imagenes.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 20, fontSize: 'var(--fs-xs)' }}>
                      <Icon name="image" size={12} className="muted" />
                      <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                      <button type="button" style={{ all: 'unset', cursor: 'pointer', lineHeight: 1, color: 'var(--fg-muted)' }} onClick={() => setImagenes((prev) => prev.filter((_, j) => j !== i))}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="drawer__footer">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" form="nueva-inc-form" className="btn btn--primary" disabled={loading}>
            {loading ? 'Registrando…' : 'Registrar incidencia'}
          </button>
        </div>
      </aside>
    </>
  )
}

const SIGUIENTE_ESTADO: Record<string, string> = {
  'Pendiente': 'En Revisión',
  'En Revisión': 'Resuelto',
  'Resuelto': 'Cerrado',
}
const ESTADO_LABELS: Record<string, string> = {
  'Pendiente': 'Pendiente',
  'En Revisión': 'En Revisión',
  'Resuelto': 'Resuelto',
  'Cerrado': 'Cerrado',
}
const FILTER_TO_ESTADO: Record<string, string> = {
  pendiente: 'Pendiente',
  'en-proceso': 'En Revisión',
  resuelto: 'Resuelto',
  cerrado: 'Cerrado',
}

type FilterKey = 'todas' | 'pendiente' | 'en-proceso' | 'resuelto' | 'cerrado'

// ── CambiarEstadoModal ──────────────────────────────────────────────────────

interface CambiarEstadoModalProps {
  inc: Incidencia
  users: User[]
  onClose: () => void
  onUpdated: () => void
}

const CambiarEstadoModal: React.FC<CambiarEstadoModalProps> = ({ inc, users, onClose, onUpdated }) => {
  const esPendiente = inc.estado === 'Pendiente'
  const siguienteEstado = SIGUIENTE_ESTADO[inc.estado] ?? inc.estado

  const [asignado, setAsignado] = useState(inc.asigned?._id ?? '')
  const [deadline, setDeadline] = useState(inc.deadline ? inc.deadline.slice(0, 10) : '')
  const [notas, setNotas] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userSearch, setUserSearch] = useState(() => {
    const u = inc.asigned
    return u ? `${u.name} ${u.lname}` : ''
  })
  const [showUserDropdown, setShowUserDropdown] = useState(false)

  const filteredUsers = userSearch
    ? users.filter((u) => `${u.name} ${u.lname}`.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase()))
    : users

  const handleSelectUser = (u: User) => {
    setAsignado(u._id)
    setUserSearch(`${u.name} ${u.lname}`)
    setShowUserDropdown(false)
  }

  const handleSave = async () => {
    if (esPendiente) {
      if (!asignado) { setError('Debes asignar un responsable.'); return }
      if (!deadline) { setError('Debes definir una fecha límite.'); return }
    }
    setSaving(true)
    setError(null)
    try {
      await incidenciasService.cambiarEstado(inc._id, {
        estado: siguienteEstado,
        ...(esPendiente && { deadline: new Date(deadline), asigned: asignado }),
        notasEstado: notas,
      })
      onUpdated()
      onClose()
    } catch {
      setError('Error al actualizar el estado.')
    } finally {
      setSaving(false)
    }
  }

  const modalSx: React.CSSProperties = {
    position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-xl)', width: 480, maxWidth: '90vw', zIndex: 200,
  }

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} style={{ zIndex: 199 }} />
      <div style={modalSx}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 'var(--fs-lg)', fontWeight: 600 }}>
              {esPendiente ? 'Asignar responsable y deadline' : 'Avanzar estado de incidencia'}
            </h2>
          </div>
          <button className="btn btn--ghost btn--icon" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ padding: '10px 14px', background: 'var(--bg-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', gap: 10, fontSize: 'var(--fs-sm)' }}>
            <span style={{ fontWeight: 600 }}>{ESTADO_LABELS[inc.estado] ?? inc.estado}</span>
            <Icon name="arrow" size={13} className="muted" />
            <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{ESTADO_LABELS[siguienteEstado] ?? siguienteEstado}</span>
          </div>
          <div style={{ padding: '10px 14px', background: 'var(--accent-soft)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent-border)', fontSize: 'var(--fs-sm)', color: 'var(--fg-2)' }}>
            {esPendiente
              ? 'Para avanzar a En proceso debes asignar un responsable y definir la fecha límite de resolución.'
              : 'Verifica el avance antes de confirmar el cambio de estado.'}
          </div>
          {error && (
            <div style={{ padding: '10px 14px', background: 'var(--danger-soft)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--fs-sm)', color: 'var(--danger)' }}>
              {error}
            </div>
          )}
          {esPendiente && (
            <>
              <div className="field" style={{ position: 'relative' }}>
                <label className="field__label">Responsable <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input
                  className="input"
                  placeholder="Buscar responsable…"
                  value={userSearch}
                  autoComplete="off"
                  onChange={(e) => { setUserSearch(e.target.value); setAsignado(''); setShowUserDropdown(true) }}
                  onFocus={() => { setUserSearch(''); setShowUserDropdown(true) }}
                  onBlur={() => setTimeout(() => {
                    setShowUserDropdown(false)
                    const sel = users.find((u) => u._id === asignado)
                    setUserSearch(sel ? `${sel.name} ${sel.lname}` : '')
                  }, 150)}
                />
                {showUserDropdown && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 300, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-lg)', maxHeight: 200, overflowY: 'auto', marginTop: 2 }}>
                    {filteredUsers.length === 0 ? (
                      <div style={{ padding: '10px 14px', fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)' }}>Sin resultados</div>
                    ) : filteredUsers.map((u) => (
                      <button
                        key={u._id}
                        type="button"
                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 14px', border: 'none', cursor: 'pointer', fontSize: 'var(--fs-sm)', background: asignado === u._id ? 'var(--accent-soft)' : 'transparent', color: 'var(--fg)' }}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelectUser(u)}
                      >
                        {u.name} {u.lname}
                        {u.email && <span style={{ color: 'var(--fg-muted)', marginLeft: 8, fontSize: 'var(--fs-xs)' }}>{u.email}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="field">
                <label className="field__label">Fecha límite <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input className="input" type="date" value={deadline} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDeadline(e.target.value)} />
              </div>
            </>
          )}
          <div className="field">
            <label className="field__label">Notas del cambio</label>
            <textarea className="textarea" rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Contexto operativo, decisiones, seguimiento…" />
          </div>
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn" onClick={onClose}>Cancelar</button>
          <Button kind="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando…' : esPendiente ? 'Asignar' : 'Confirmar cambio'}
          </Button>
        </div>
      </div>
    </>
  )
}

// ── ModificarDeadlineModal ─────────────────────────────────────────────────

interface ModificarDeadlineModalProps {
  inc: Incidencia
  users: User[]
  onClose: () => void
  onUpdated: () => void
}

const ModificarDeadlineModal: React.FC<ModificarDeadlineModalProps> = ({ inc, users, onClose, onUpdated }) => {
  const [newDeadline, setNewDeadline] = useState(inc.deadline ? inc.deadline.slice(0, 10) : '')
  const [asignado, setAsignado] = useState(inc.asigned?._id ?? '')
  const [userSearch, setUserSearch] = useState(() => {
    const u = inc.asigned
    return u ? `${u.name} ${u.lname}` : ''
  })
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [notas, setNotas] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filteredUsers = userSearch
    ? users.filter((u) => `${u.name} ${u.lname}`.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase()))
    : users

  const handleSelectUser = (u: User) => {
    setAsignado(u._id)
    setUserSearch(`${u.name} ${u.lname}`)
    setShowUserDropdown(false)
  }

  const handleSave = async () => {
    if (!newDeadline) { setError('Selecciona una fecha límite.'); return }
    setSaving(true)
    setError(null)
    try {
      await incidenciasService.modificarAsignacion(inc._id, {
        asigned: asignado || null,
        newDeadline: new Date(newDeadline),
        notas,
      })
      onUpdated()
      onClose()
    } catch {
      setError('Error al actualizar la asignación.')
    } finally {
      setSaving(false)
    }
  }

  const modalSx: React.CSSProperties = {
    position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-xl)', width: 460, maxWidth: '90vw', zIndex: 200,
  }

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} style={{ zIndex: 199 }} />
      <div style={modalSx}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 'var(--fs-lg)', fontWeight: 600 }}>Editar responsable y deadline</h2>
          <button className="btn btn--ghost btn--icon" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{ padding: '10px 14px', background: 'var(--danger-soft)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--fs-sm)', color: 'var(--danger)' }}>
              {error}
            </div>
          )}
          <div className="field" style={{ position: 'relative' }}>
            <label className="field__label">Responsable</label>
            <input
              className="input"
              placeholder="Buscar responsable…"
              value={userSearch}
              autoComplete="off"
              onChange={(e) => { setUserSearch(e.target.value); setAsignado(''); setShowUserDropdown(true) }}
              onFocus={() => { setUserSearch(''); setShowUserDropdown(true) }}
              onBlur={() => setTimeout(() => {
                setShowUserDropdown(false)
                const sel = users.find((u) => u._id === asignado)
                setUserSearch(sel ? `${sel.name} ${sel.lname}` : '')
              }, 150)}
            />
            {showUserDropdown && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 300, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-lg)', maxHeight: 200, overflowY: 'auto', marginTop: 2 }}>
                {filteredUsers.length === 0 ? (
                  <div style={{ padding: '10px 14px', fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)' }}>Sin resultados</div>
                ) : filteredUsers.map((u) => (
                  <button
                    key={u._id}
                    type="button"
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 14px', border: 'none', cursor: 'pointer', fontSize: 'var(--fs-sm)', background: asignado === u._id ? 'var(--accent-soft)' : 'transparent', color: 'var(--fg)' }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectUser(u)}
                  >
                    {u.name} {u.lname}
                    {u.email && <span style={{ color: 'var(--fg-muted)', marginLeft: 8, fontSize: 'var(--fs-xs)' }}>{u.email}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="field">
            <label className="field__label">Fecha límite <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input className="input" type="date" value={newDeadline} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setNewDeadline(e.target.value)} />
          </div>
          <div className="field">
            <label className="field__label">Notas del cambio</label>
            <textarea className="textarea" rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Motivo o contexto del cambio…" />
          </div>
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn" onClick={onClose}>Cancelar</button>
          <Button kind="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      </div>
    </>
  )
}

// ── IncidenciaDetail ────────────────────────────────────────────────────────

interface IncidenciaDetailProps {
  inc: Incidencia
  users: User[]
  onClose: () => void
  onUpdated: () => void
  onOpenEstado: () => void
  onOpenDeadline: () => void
  initialTab?: 'detalle' | 'historial' | 'fotos'
}

const IncidenciaDetail: React.FC<IncidenciaDetailProps> = ({ inc, onClose, onUpdated, onOpenEstado, onOpenDeadline, initialTab = 'detalle' }) => {
  const [tab, setTab] = useState<'detalle' | 'historial' | 'fotos'>(initialTab)
  const [nota, setNota] = useState('')
  const [savingNota, setSavingNota] = useState(false)
  const [lightboxImg, setLightboxImg] = useState<string | null>(null)

  const asignado = inc.asigned
  const reportador = inc.user
  const now = new Date()
  const deadlineDate = inc.deadline ? new Date(inc.deadline) : null
  const daysLeft = deadlineDate ? Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null
  const esCerrado = inc.estado === 'Cerrado'

  const handleAddNota = async () => {
    if (!nota.trim()) return
    setSavingNota(true)
    try {
      await incidenciasService.addHistorial(inc._id, nota)
      setNota('')
      onUpdated()
    } finally {
      setSavingNota(false)
    }
  }

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <aside className="drawer drawer--wide">
        <div className="drawer__header">
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span className="mono" style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)' }}>{inc._id.slice(-8)}</span>
              <span className="dot" />
              <SeveridadBadge severidad={inc.gradoSeveridad} />
              <EstadoIncidenciaBadge estado={inc.estado} />
            </div>
            <h2 style={{ margin: 0, fontSize: 'var(--fs-xl)', fontWeight: 600, letterSpacing: '-0.02em' }}>{inc.tipoIncidente}</h2>
          </div>
          <button className="btn btn--ghost btn--icon" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>

        <div style={{ padding: '12px 24px 0', borderBottom: '1px solid var(--border-soft)' }}>
          <div className="tabs">
            {([['detalle', 'Detalle'], ['historial', `Historial · ${inc.historialEstados?.length ?? 0}`], ['fotos', `Fotos · ${inc.imagenes?.length ?? 0}`]] as [string, string][]).map(([k, l]) => (
              <button key={k} className={`tab${tab === k ? ' tab--active' : ''}`} onClick={() => setTab(k as typeof tab)}>{l}</button>
            ))}
          </div>
        </div>

        <div className="drawer__body">
          {tab === 'detalle' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              {/* Deadline + Asignación */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, padding: 16, background: 'var(--bg-2)', borderRadius: 10, border: '1px solid var(--border-soft)' }}>
                {!esCerrado && (
                  <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Asignación</span>
                    <button
                      className="btn btn--ghost btn--icon"
                      style={{ width: 24, height: 24 }}
                      title="Editar responsable y deadline"
                      onClick={onOpenDeadline}
                    >
                      <Icon name="edit" size={12} />
                    </button>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)', marginBottom: 4 }}>Deadline</div>
                  {deadlineDate ? (
                    <>
                      <div style={{ fontWeight: 600, fontSize: 'var(--fs-md)' }}>
                        {deadlineDate.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                      {daysLeft !== null && (
                        <div style={{ fontSize: 'var(--fs-xs)', color: daysLeft <= 1 ? 'var(--danger)' : daysLeft <= 3 ? 'var(--warning)' : 'var(--fg-muted)', marginTop: 2 }}>
                          {daysLeft < 0 ? `Vencido hace ${-daysLeft} días` : daysLeft === 0 ? 'Vence hoy' : `${daysLeft} días restantes`}
                        </div>
                      )}
                    </>
                  ) : (
                    <span style={{ color: 'var(--fg-muted)', fontSize: 'var(--fs-sm)' }}>
                      {inc.estado === 'Pendiente' ? 'Se definirá al asignar' : 'Sin deadline'}
                    </span>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)', marginBottom: 6 }}>Asignado a</div>
                  {asignado ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar name={`${asignado.name} ${asignado.lname}`} />
                      <div style={{ lineHeight: 1.2 }}>
                        <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 500 }}>{asignado.name} {asignado.lname}</div>
                        {asignado.email && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)' }}>{asignado.email}</div>}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)' }}>
                      {inc.estado === 'Pendiente'
                        ? 'Usa "Avanzar estado" para asignar responsable.'
                        : <Badge kind="warning">Sin asignar</Badge>}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Información</div>
                <div className="props">
                  {inc.sedeNombre && <div className="props__row"><span className="props__label">Sede</span><span className="props__val">{inc.sedeNombre}</span></div>}
                  {inc.ubicacion && <div className="props__row"><span className="props__label">Ubicación</span><span className="props__val">{inc.ubicacion}</span></div>}
                  {inc.areaAfectada && <div className="props__row"><span className="props__label">Área</span><span className="props__val">{inc.areaAfectada}</span></div>}
                  <div className="props__row"><span className="props__label">Tipo</span><span className="props__val">{inc.tipoIncidente}</span></div>
                  {reportador && (
                    <div className="props__row">
                      <span className="props__label">Reportado por</span>
                      <span className="props__val" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Avatar name={`${reportador.name} ${reportador.lname}`} />
                        {reportador.name} {reportador.lname}
                      </span>
                    </div>
                  )}
                  <div className="props__row"><span className="props__label">Fecha</span><span className="props__val mono">{new Date(inc.fecha).toLocaleString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span></div>
                </div>
              </div>

              {inc.descripcion && (
                <div>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Descripción</div>
                  <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.6, color: 'var(--fg-2)' }}>{inc.descripcion}</div>
                </div>
              )}

              {inc.recomendacion && (
                <div>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Recomendaciones</div>
                  <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.6, color: 'var(--fg-2)', padding: 14, background: 'var(--accent-soft)', borderRadius: 8, border: '1px solid var(--accent-border)' }}>{inc.recomendacion}</div>
                </div>
              )}

              {(inc.imagenes?.length ?? 0) > 0 && (
                <div>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Evidencia · {inc.imagenes!.length} fotos</div>
                  <div className="photo-grid">
                    {inc.imagenes!.map((src, i) => (
                      <div
                        key={i}
                        className="photo"
                        style={{ backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center', cursor: 'zoom-in' }}
                        onClick={() => src && setLightboxImg(src)}
                      >
                        {!src && <span className="photo__label">IMG_{i + 1}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'historial' && (
            <div className="timeline">
              {(inc.historialEstados ?? []).map((h, i) => {
                const actor = h.actor ?? (h.user ? `${h.user.name} ${h.user.lname}` : 'Sistema')
                const time = h.time ?? (h.fecha ? new Date(h.fecha).toLocaleString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '')
                const note = h.note ?? h.notas
                const action = h.action ?? (h.estado ? `→ ${h.estado}` : 'Nota')
                const kind = h.kind ?? (i === 0 ? 'create' : h.estado ? 'state' : 'comment')
                const isResuelto = h.to === 'Resuelto' || h.estado === 'Resuelto'
                return (
                <div key={i} className="timeline__item">
                  <div className={`timeline__dot${kind === 'create' ? ' timeline__dot--accent' : (kind === 'state' && isResuelto) ? ' timeline__dot--success' : ''}`}>
                    <Icon name={kind === 'create' ? 'flag' : kind === 'state' ? 'activity' : kind === 'deadline' ? 'clock' : 'edit'} size={14} />
                  </div>
                  <div className="timeline__body">
                    <div className="timeline__head">
                      <span className="timeline__actor">{actor}</span>
                      <span className="timeline__action">{action}</span>
                      {h.from && h.to && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-xs)' }}>
                          <code style={{ background: 'var(--bg-2)', padding: '1px 6px', borderRadius: 3, fontFamily: 'Geist Mono', color: 'var(--fg-muted)' }}>{h.from}</code>
                          <Icon name="arrow" size={11} className="muted" />
                          <code style={{ background: 'var(--accent-soft)', padding: '1px 6px', borderRadius: 3, fontFamily: 'Geist Mono', color: 'var(--accent)' }}>{h.to}</code>
                        </span>
                      )}
                      <span className="timeline__time mono">{time}</span>
                    </div>
                    {note && <div className="timeline__note">{note}</div>}
                  </div>
                </div>
                )
              })}
              <div style={{ marginTop: 6, padding: 14, border: '1px dashed var(--border-strong)', borderRadius: 8 }}>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)', marginBottom: 8 }}>Agregar nota al historial</div>
                <textarea className="textarea" placeholder="Escribe una nota auditable…" style={{ minHeight: 60 }} value={nota} onChange={(e) => setNota(e.target.value)} />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <Button kind="primary" size="sm" onClick={handleAddNota} disabled={savingNota || !nota.trim()}>
                    {savingNota ? 'Guardando…' : 'Guardar nota'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {tab === 'fotos' && (
            <div className="photo-grid">
              {(inc.imagenes ?? []).map((src, i) => (
                <div
                  key={i}
                  className="photo"
                  style={{ backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center', aspectRatio: 'auto', height: 160, cursor: 'zoom-in' }}
                  onClick={() => src && setLightboxImg(src)}
                />
              ))}
              {(inc.imagenes?.length ?? 0) === 0 && <div className="empty" style={{ gridColumn: '1/-1' }}>Sin fotos adjuntas</div>}
            </div>
          )}
        </div>

        <div className="drawer__footer">
          <button className="btn" onClick={onClose}>Cerrar</button>
          <div style={{ flex: 1 }} />
          {!esCerrado && (
            <Button kind="primary" icon="activity" onClick={onOpenEstado}>
              {inc.estado === 'Pendiente' ? 'Asignar y avanzar' : 'Avanzar estado'}
            </Button>
          )}
        </div>
      </aside>

      {lightboxImg && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setLightboxImg(null)}
        >
          <img
            src={lightboxImg}
            alt="Evidencia"
            style={{ maxWidth: '92vw', maxHeight: '92vh', objectFit: 'contain', borderRadius: 8, boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontSize: 22, cursor: 'pointer', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
            onClick={() => setLightboxImg(null)}
          >×</button>
        </div>
      )}
    </>
  )
}

export const IncidenciasPage: React.FC = () => {
  const { user: authUser } = useAuth()
  const [incidencias, setIncidencias] = useState<Incidencia[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterKey>('todas')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [reloadTick, setReloadTick] = useState(0)
  const pageSize = 15
  const [sel, setSel] = useState<Incidencia | null>(null)
  const [selTab, setSelTab] = useState<'detalle' | 'historial' | 'fotos'>('detalle')
  const [showForm, setShowForm] = useState(false)
  const [estadoInc, setEstadoInc] = useState<Incidencia | null>(null)
  const [deadlineInc, setDeadlineInc] = useState<Incidencia | null>(null)

  const openDetail = (inc: Incidencia, tab: 'detalle' | 'historial' | 'fotos' = 'detalle') => {
    setSel(inc)
    setSelTab(tab)
  }

  const openEstadoModal = (inc: Incidencia) => {
    if (inc.estado === 'Cerrado') return
    setEstadoInc(inc)
  }

  const triggerReload = useCallback(() => setReloadTick((c) => c + 1), [])

  useEffect(() => {
    userService.getAll().then(setUsers)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [search])

  const handleFilterChange = (f: FilterKey) => { setFilter(f); setPage(1) }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const params: Record<string, string> = { page: String(page), limit: String(pageSize) }
    if (filter !== 'todas') params.estado = FILTER_TO_ESTADO[filter]
    if (debouncedSearch) params.search = debouncedSearch
    incidenciasService.getAll(params).then(({ data, total: t }) => {
      if (!cancelled) { setIncidencias(data); setTotal(t); setLoading(false) }
    }).catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [filter, debouncedSearch, page, reloadTick])

  const now = new Date()
  const abiertas = incidencias.filter((i) => i.estado === 'Pendiente' || i.estado === 'En Revisión').length
  const criticas = incidencias.filter((i) => i.gradoSeveridad === 'Crítico' && i.estado !== 'Cerrado').length
  const vencenSemana = incidencias.filter((i) => {
    if (!i.deadline) return false
    const dl = new Date(i.deadline)
    const days = Math.ceil((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return days >= 0 && days <= 7 && i.estado !== 'Cerrado' && i.estado !== 'Resuelto'
  }).length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Incidencias QHSE</h1>
          <div className="page__desc">Registro, seguimiento y resolución</div>
        </div>
        <div className="page__actions">
          <Button icon="bell">Recordatorios</Button>
          <Button kind="primary" icon="plus" onClick={() => setShowForm(true)} disabled={!authUser}>Nueva incidencia</Button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi"><div className="kpi__label">Abiertas</div><div className="kpi__value tnum">{abiertas}</div><div className="kpi__delta">En esta página</div></div>
        <div className="kpi"><div className="kpi__label">Críticas activas</div><div className="kpi__value tnum" style={{ color: 'var(--critical)' }}>{criticas}</div><div className="kpi__delta">Requieren atención inmediata</div></div>
        <div className="kpi"><div className="kpi__label">Vencen esta semana</div><div className="kpi__value tnum" style={{ color: 'var(--warning)' }}>{vencenSemana}</div><div className="kpi__delta">Próximos 7 días</div></div>
        <div className="kpi"><div className="kpi__label">Total registradas</div><div className="kpi__value tnum">{total}</div><div className="kpi__delta">{filter !== 'todas' ? `Filtrado: ${filter}` : 'Todos los estados'}</div></div>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="filter-bar__search">
            <Icon name="search" size={14} className="muted" />
            <input placeholder="Buscar por título o ID…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="segmented">
            {(['todas', 'pendiente', 'en-proceso', 'resuelto', 'cerrado'] as FilterKey[]).map((k) => {
              const labels: Record<FilterKey, string> = { todas: 'Todas', pendiente: 'Pendientes', 'en-proceso': 'En proceso', resuelto: 'Resueltas', cerrado: 'Cerradas' }
              return <button key={k} className={`segmented__item${filter === k ? ' segmented__item--active' : ''}`} onClick={() => handleFilterChange(k)}>{labels[k]}</button>
            })}
          </div>
        </div>

        {loading ? (
          <div className="empty">Cargando incidencias…</div>
        ) : incidencias.length === 0 ? (
          <div className="empty">No se encontraron incidencias.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Tipo de incidente</th>
                  <th>Fecha</th>
                  <th>Ubicación</th>
                  <th>Severidad</th>
                  <th>Estado</th>
                  <th>Asignado</th>
                  <th>Deadline</th>
                  <th>Reportado por</th>
                </tr>
              </thead>
              <tbody>
                {incidencias.map((i) => {
                  const dl = i.deadline ? new Date(i.deadline) : null
                  const daysLeft = dl ? Math.ceil((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null
                  const overdue = daysLeft !== null && daysLeft < 0
                  const fechaInc = new Date(i.fecha)
                  return (
                    <tr key={i._id} onClick={() => openDetail(i)} style={{ cursor: 'pointer' }}>
                      <td>
                        <div className="name-cell__name">{i.tipoIncidente}</div>
                        {i.areaAfectada && <div className="name-cell__sub">{i.areaAfectada}</div>}
                      </td>
                      <td>
                        <div className="mono tnum" style={{ fontSize: 'var(--fs-sm)', fontWeight: 500 }}>
                          {fechaInc.toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </div>
                        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)' }}>
                          {fechaInc.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 'var(--fs-sm)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {i.ubicacion ?? '—'}
                        </div>
                      </td>
                      <td><SeveridadBadge severidad={i.gradoSeveridad} /></td>
                      <td>
                        <button
                          style={{ all: 'unset', cursor: i.estado !== 'Cerrado' ? 'pointer' : 'default' }}
                          title={i.estado !== 'Cerrado' ? (i.estado === 'Pendiente' ? 'Asignar responsable y avanzar' : 'Avanzar estado') : 'Incidencia cerrada'}
                          onClick={(e) => { e.stopPropagation(); openEstadoModal(i) }}
                        >
                          <EstadoIncidenciaBadge estado={i.estado} />
                        </button>
                      </td>
                      <td>
                        {i.asigned ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Avatar name={`${i.asigned.name} ${i.asigned.lname}`} />
                            <span style={{ fontSize: 'var(--fs-sm)' }}>{i.asigned.name} {i.asigned.lname}</span>
                          </div>
                        ) : <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)' }}>Sin asignar</span>}
                      </td>
                      <td>
                        {dl ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 8, border: `1px solid ${overdue ? 'var(--danger-border)' : 'var(--border)'}`, background: overdue ? 'var(--danger-soft)' : 'var(--bg-2)', color: overdue ? 'var(--danger)' : 'var(--fg-2)' }}>
                            <Icon name="clock" size={12} />
                            <span className="mono tnum" style={{ fontSize: 'var(--fs-xs)', fontWeight: 600 }}>
                              {dl.toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </span>
                          </div>
                        ) : <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)' }}>—</span>}
                      </td>
                      <td>
                        {i.user ? (
                          <div>
                            <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 500 }}>{i.user.name} {i.user.lname}</div>
                            {i.user.email && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)' }}>{i.user.email}</div>}
                          </div>
                        ) : <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)' }}>—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid var(--border-soft)', fontSize: 'var(--fs-sm)' }}>
            <span style={{ color: 'var(--fg-muted)' }}>Página {page} de {totalPages} · {total} registros</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn--ghost btn--sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Anterior</button>
              <button className="btn btn--ghost btn--sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Siguiente</button>
            </div>
          </div>
        )}
      </div>

      {sel && (
        <IncidenciaDetail
          inc={sel}
          users={users}
          onClose={() => setSel(null)}
          onUpdated={triggerReload}
          initialTab={selTab}
          onOpenEstado={() => openEstadoModal(sel)}
          onOpenDeadline={() => setDeadlineInc(sel)}
        />
      )}

      {estadoInc && (
        <CambiarEstadoModal
          inc={estadoInc}
          users={users}
          onClose={() => setEstadoInc(null)}
          onUpdated={() => { triggerReload(); setEstadoInc(null); setSel(null) }}
        />
      )}

      {deadlineInc && (
        <ModificarDeadlineModal
          inc={deadlineInc}
          users={users}
          onClose={() => setDeadlineInc(null)}
          onUpdated={() => { triggerReload(); setDeadlineInc(null) }}
        />
      )}

      {showForm && authUser && (
        <NuevaIncidenciaModal
          userId={authUser._id}
          onClose={() => setShowForm(false)}
          onCreated={triggerReload}
        />
      )}
    </div>
  )
}
