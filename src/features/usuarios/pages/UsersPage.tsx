import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Icon, Badge, Avatar, NameCell, Button } from '../../../components/ui'
import type { Area, User, Sede, Role } from '../../../types'
import userService from '../services/userService'
import sedeService from '../../sedes/services/sedeService'
import roleService from '../../roles/services/roleService'
import areaService from '../services/areaService'

const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL ?? 'http://localhost:8000'

type StatusFilter = 'activos' | 'inactivos' | 'todos'

interface UserModalProps {
  mode: 'create' | 'edit'
  user?: User
  sedes: Sede[]
  roles: Role[]
  areas: Area[]
  onClose: () => void
  onSaved: () => void
}

function isoToDisplay(iso: string): string {
  if (!iso || iso.length < 10) return ''
  return `${iso.substring(8, 10)}/${iso.substring(5, 7)}/${iso.substring(0, 4)}`
}

function displayToIso(display: string): string {
  const digits = display.replace(/\D/g, '')
  if (digits.length !== 8) return ''
  const d = digits.substring(0, 2), m = digits.substring(2, 4), y = digits.substring(4, 8)
  if (+d < 1 || +d > 31 || +m < 1 || +m > 12 || +y < 1900 || +y > 2100) return ''
  return `${y}-${m}-${d}`
}

const UserModal: React.FC<UserModalProps> = ({ mode, user, sedes, roles, areas, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: user?.name ?? '',
    lname: user?.lname ?? '',
    email: user?.email ?? '',
    dni: user?.dni ?? '',
    phone: user?.phone ?? '',
    position: user?.position ?? '',
    ingreso: user?.ingreso ? user.ingreso.substring(0, 10) : '',
    password: '',
    sedeId: user?.sede != null && typeof user.sede === 'object' ? user.sede._id : (user?.sede ?? ''),
    roleId: user?.role != null && typeof user.role === 'object' ? user.role._id : (user?.role ?? ''),
    areaIds: user?.areas?.map((a) => a._id) ?? [],
    active: user?.active ?? true,
  })
  const [ingresoDisplay, setIngresoDisplay] = useState(
    () => isoToDisplay(user?.ingreso?.substring(0, 10) ?? '')
  )
  const ingresoPickerRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // photo upload state (edit mode only)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(user?.photo ?? null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const setF = (k: string, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }))

  const handleIngresoChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').substring(0, 8)
    let display = digits
    if (digits.length > 2) display = `${digits.substring(0, 2)}/${digits.substring(2)}`
    if (digits.length > 4) display = `${digits.substring(0, 2)}/${digits.substring(2, 4)}/${digits.substring(4)}`
    setIngresoDisplay(display)
    setForm(p => ({ ...p, ingreso: displayToIso(display) }))
  }

  const toggleArea = (id: string) =>
    setForm((p) => ({
      ...p,
      areaIds: p.areaIds.includes(id) ? p.areaIds.filter((a) => a !== id) : [...p.areaIds, id],
    }))

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setPhotoError('Selecciona un archivo de imagen válido'); return }
    if (file.size > 5 * 1024 * 1024) { setPhotoError('La imagen no debe superar los 5 MB'); return }
    setPhotoError(null)
    setSelectedFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setPreviewUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleUploadPhoto = async () => {
    if (!selectedFile || !user?._id) return
    setUploadingPhoto(true)
    setPhotoError(null)
    try {
      const fd = new FormData()
      fd.append('photo', selectedFile)
      const res = await fetch(`${FASTAPI_URL}/api/users/${user._id}/photo`, { method: 'POST', body: fd })
      const json = await res.json()
      if (!json.success) throw new Error('Error al procesar la respuesta')
      setPreviewUrl(json.photo_url)
      setSelectedFile(null)
    } catch {
      setPhotoError('Error al subir la foto')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.areaIds.length === 0) { setError('Debes seleccionar al menos un área'); return }
    setLoading(true)
    setError(null)
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        lname: form.lname,
        email: form.email,
        dni: form.dni,
        phone: form.phone,
        position: form.position,
        sede: form.sedeId || undefined,
        role: form.roleId || undefined,
        areas: form.areaIds,
        active: form.active,
        ingreso: form.ingreso || undefined,
      }
      if (form.password) payload.password = form.password
      if (mode === 'create') await userService.create(payload as Partial<User>)
      else await userService.update(user!._id, payload as Partial<User>)
      onSaved()
      onClose()
    } catch {
      setError('Error al guardar. Verifica los datos e intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal modal--lg"
        style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          <h2 className="modal__title">{mode === 'create' ? 'Nuevo empleado' : 'Editar empleado'}</h2>
          <button className="btn btn--ghost btn--icon" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal__body" style={{ overflowY: 'auto', flex: 1 }}>
            {error && (
              <div style={{ padding: '10px 14px', background: 'var(--danger-soft)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--fs-sm)', color: 'var(--danger)', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
                <Icon name="alert" size={14} /> {error}
              </div>
            )}

            {/* Photo section — edit mode only */}
            {mode === 'edit' && (
              <div style={{ padding: '16px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: 20, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {previewUrl
                    ? <img src={previewUrl} alt="foto" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} />
                    : <Avatar name={`${user?.name ?? ''} ${user?.lname ?? ''}`} size="xl" />
                  }
                </div>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--fs-sm)', marginBottom: 4 }}>Foto de perfil</div>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)', marginBottom: 8 }}>Para identificación visual y reconocimiento facial.</div>
                  {selectedFile && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)', marginBottom: 4 }}>{selectedFile.name}</div>}
                  {photoError && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)', marginBottom: 4 }}>{photoError}</div>}
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFileSelect} />
                  <button type="button" className="btn" onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto}>
                    Seleccionar imagen
                  </button>
                  {selectedFile && (
                    <button type="button" className="btn btn--primary" onClick={handleUploadPhoto} disabled={uploadingPhoto}>
                      {uploadingPhoto ? 'Subiendo…' : 'Guardar foto'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Información personal */}
            <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--fg-2)', marginBottom: 12 }}>Información personal</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              <div className="field">
                <label className="field__label">Nombre *</label>
                <input className="input" value={form.name} onChange={(e) => setF('name', e.target.value)} required />
              </div>
              <div className="field">
                <label className="field__label">Apellido *</label>
                <input className="input" value={form.lname} onChange={(e) => setF('lname', e.target.value)} required />
              </div>
              <div className="field">
                <label className="field__label">DNI *</label>
                <input className="input mono" value={form.dni} onChange={(e) => setF('dni', e.target.value)} maxLength={8} pattern="\d{8}" required />
              </div>
              <div className="field">
                <label className="field__label">Teléfono</label>
                <input className="input" value={form.phone} onChange={(e) => setF('phone', e.target.value)} maxLength={9} />
              </div>
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label className="field__label">Correo *</label>
                <input className="input" type="email" value={form.email} onChange={(e) => setF('email', e.target.value)} required />
              </div>
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label className="field__label">{mode === 'create' ? 'Contraseña *' : 'Nueva contraseña'}</label>
                <input
                  className="input"
                  type="password"
                  value={form.password}
                  onChange={(e) => setF('password', e.target.value)}
                  required={mode === 'create'}
                  minLength={6}
                  placeholder={mode === 'edit' ? 'Déjalo vacío para conservar la contraseña actual' : ''}
                />
              </div>
            </div>

            {/* Información laboral */}
            <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--fg-2)', marginBottom: 12 }}>Información laboral</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label className="field__label">Cargo *</label>
                <input className="input" value={form.position} onChange={(e) => setF('position', e.target.value)} required />
              </div>
              <div className="field">
                <label className="field__label">Fecha de ingreso</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    type="text"
                    placeholder="DD/MM/YYYY"
                    maxLength={10}
                    value={ingresoDisplay}
                    onChange={(e) => handleIngresoChange(e.target.value)}
                    style={{ paddingRight: 36 }}
                  />
                  <button
                    type="button"
                    title="Abrir calendario"
                    onClick={() => ingresoPickerRef.current?.showPicker?.() ?? ingresoPickerRef.current?.click()}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 0, cursor: 'pointer', color: 'var(--fg-muted)', padding: 2, display: 'flex', alignItems: 'center' }}
                  >
                    <Icon name="calendar" size={15} />
                  </button>
                  <input
                    ref={ingresoPickerRef}
                    type="date"
                    value={form.ingreso}
                    onChange={(e) => {
                      const iso = e.target.value
                      setForm(p => ({ ...p, ingreso: iso }))
                      setIngresoDisplay(isoToDisplay(iso))
                    }}
                    style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none', top: 0, left: 0 }}
                    tabIndex={-1}
                  />
                </div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)', marginTop: 4 }}>
                  Usada para calcular el saldo de vacaciones.
                </div>
              </div>
              <div className="field">
                <label className="field__label">Sede *</label>
                <select className="select" value={form.sedeId} onChange={(e) => setF('sedeId', e.target.value)} required>
                  <option value="">Seleccionar sede</option>
                  {sedes.map((s) => <option key={s._id} value={s._id}>{s.nombre}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="field__label">Rol</label>
                <select className="select" value={form.roleId} onChange={(e) => setF('roleId', e.target.value)}>
                  <option value="">Sin rol</option>
                  {roles.map((r) => <option key={r._id} value={r._id}>{r.name}{r.isAdmin ? ' (Admin)' : ''}</option>)}
                </select>
              </div>
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label className="field__label">Áreas * <span style={{ fontWeight: 400, color: 'var(--fg-muted)' }}>— selecciona una o más</span></label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg)', minHeight: 44 }}>
                  {areas.length === 0
                    ? <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)' }}>No hay áreas disponibles</span>
                    : areas.map((a) => (
                      <button
                        key={a._id}
                        type="button"
                        className={`filter-chip${form.areaIds.includes(a._id) ? ' filter-chip--active' : ''}`}
                        onClick={() => toggleArea(a._id)}
                      >
                        {a.name}
                      </button>
                    ))
                  }
                </div>
              </div>
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label className="field__label">Estado</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className={`filter-chip${form.active ? ' filter-chip--active' : ''}`} onClick={() => setF('active', true)}>Activo</button>
                  <button type="button" className={`filter-chip${!form.active ? ' filter-chip--active' : ''}`} onClick={() => setF('active', false)}>Inactivo</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal__footer">
            <button type="button" className="btn" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? 'Guardando…' : mode === 'create' ? 'Crear empleado' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [sedes, setSedes] = useState<Sede[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('activos')
  const [areaFilter, setAreaFilter] = useState<string>('todos')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [reloadTick, setReloadTick] = useState(0)
  const pageSize = 15
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; user?: User } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{
    total_bitrix: number
    imported: number
    skipped: number
    skipped_detail: { name: string; reason: string }[]
    deactivated: number
    deactivated_detail: { name: string }[]
  } | null>(null)

  const handleSyncBitrix = async () => {
    setSyncing(true)
    try {
      const result = await userService.syncBitrix()
      setSyncResult(result)
      if (result.imported > 0 || result.deactivated > 0) triggerReload()
    } catch {
      setSyncResult({ total_bitrix: 0, imported: 0, skipped: 0, skipped_detail: [{ name: 'Error de conexión', reason: 'No se pudo contactar el servidor' }], deactivated: 0, deactivated_detail: [] })
    } finally {
      setSyncing(false)
    }
  }

  const triggerReload = useCallback(() => setReloadTick((c) => c + 1), [])

  useEffect(() => {
    Promise.all([sedeService.getAll(), roleService.getAll(), areaService.getAll()])
      .then(([s, r, a]) => { setSedes(s); setRoles(r); setAreas(a) })
  }, [])

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [search])

  const handleStatusChange = (s: StatusFilter) => { setStatusFilter(s); setPage(1) }
  const handleAreaChange = (a: string) => { setAreaFilter(a); setPage(1) }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const params: Record<string, string> = { page: String(page), limit: String(pageSize) }
    if (statusFilter !== 'todos') params.active = statusFilter === 'activos' ? 'true' : 'false'
    if (areaFilter !== 'todos') params.area = areaFilter
    if (debouncedSearch) params.search = debouncedSearch
    userService.query(params).then(({ data, total: t }) => {
      if (!cancelled) { setUsers(data); setTotal(t); setLoading(false) }
    }).catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [statusFilter, areaFilter, debouncedSearch, page, reloadTick])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const handleDelete = async (u: User) => {
    await userService.delete(u._id)
    setDeleteConfirm(null)
    triggerReload()
  }

  const getRoleName = (u: User) => (typeof u.role === 'object' && u.role ? u.role.name : undefined)
  const getAreaNames = (u: User) => u.areas?.map((a) => a.name) ?? []

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Usuarios</h1>
          <div className="page__desc">Directorio de empleados · {total} registros</div>
        </div>
        <div className="page__actions">
          <Button icon="download">Exportar</Button>
          <Button icon="refresh" onClick={handleSyncBitrix} disabled={syncing}>
            {syncing ? 'Sincronizando…' : 'Sincronizar Bitrix'}
          </Button>
          <Button kind="primary" icon="plus" onClick={() => setModal({ mode: 'create' })}>Nuevo empleado</Button>
        </div>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="filter-bar__search">
            <Icon name="search" size={14} className="muted" />
            <input placeholder="Buscar por nombre, DNI o correo…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="segmented">
            {(['activos', 'inactivos', 'todos'] as StatusFilter[]).map((s) => (
              <button key={s} className={`segmented__item${statusFilter === s ? ' segmented__item--active' : ''}`} onClick={() => handleStatusChange(s)}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          {areas.length > 0 && (
            <select
              className="select"
              style={{ minWidth: 140, fontSize: 'var(--fs-sm)' }}
              value={areaFilter}
              onChange={(e) => handleAreaChange(e.target.value)}
            >
              <option value="todos">Todas las áreas</option>
              {areas.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
            </select>
          )}
          <div style={{ marginLeft: 'auto', fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)' }}>{total} empleados</div>
        </div>

        {loading ? (
          <div className="empty">Cargando…</div>
        ) : users.length === 0 ? (
          <div className="empty">No se encontraron empleados.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>DNI</th>
                  <th>Cargo</th>
                  <th>Rol</th>
                  <th>Áreas</th>
                  <th>Contacto</th>
                  <th>Estado</th>
                  <th title="Reconocimiento facial">Facial</th>
                  <th style={{ width: 80 }}></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => {
                  const roleName = getRoleName(u)
                  const areaNames = getAreaNames(u)
                  return (
                    <tr key={u._id}>
                      <td>
                        <NameCell
                          name={`${u.name} ${u.lname}`}
                          sub={u.email}
                          avatarIdx={i}
                        />
                      </td>
                      <td><span className="mono tnum" style={{ fontSize: 'var(--fs-sm)' }}>{u.dni ?? '—'}</span></td>
                      <td><span style={{ fontSize: 'var(--fs-sm)' }}>{u.position ?? '—'}</span></td>
                      <td>
                        {roleName
                          ? <Badge kind="neutral">{roleName}</Badge>
                          : <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)' }}>—</span>
                        }
                      </td>
                      <td>
                        {areaNames.length > 0
                          ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {areaNames.map((name) => (
                                <span key={name} style={{ fontSize: 'var(--fs-xs)', padding: '2px 8px', background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: 999, whiteSpace: 'nowrap' }}>
                                  {name}
                                </span>
                              ))}
                            </div>
                          )
                          : <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)' }}>—</span>
                        }
                      </td>
                      <td><span style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-2)' }}>{u.phone ?? '—'}</span></td>
                      <td>{u.active ? <Badge kind="success" dot>Activo</Badge> : <Badge kind="neutral">Inactivo</Badge>}</td>
                      <td>
                        {u.hasEmbedding
                          ? <span title="Reconocimiento facial registrado" style={{ color: 'var(--success)', display: 'flex', justifyContent: 'center' }}><Icon name="checkCircle" size={16} /></span>
                          : <span style={{ color: 'var(--fg-muted)', display: 'flex', justifyContent: 'center' }}><Icon name="minus" size={16} /></span>
                        }
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn--ghost btn--icon" title="Editar" onClick={(e) => { e.stopPropagation(); setModal({ mode: 'edit', user: u }) }}>
                            <Icon name="edit" size={14} />
                          </button>
                          <button className="btn btn--ghost btn--icon" title="Eliminar" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(u) }}
                            style={{ color: 'var(--danger)' }}>
                            <Icon name="trash" size={14} />
                          </button>
                        </div>
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
            <span style={{ color: 'var(--fg-muted)' }}>Página {page} de {totalPages} · {total} empleados</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn--ghost btn--sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Anterior</button>
              <button className="btn btn--ghost btn--sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Siguiente</button>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <UserModal
          mode={modal.mode}
          user={modal.user}
          sedes={sedes}
          roles={roles}
          areas={areas}
          onClose={() => setModal(null)}
          onSaved={triggerReload}
        />
      )}

      {syncResult && (
        <div className="modal-overlay" onClick={() => setSyncResult(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Sincronización con Bitrix</h2>
              <button className="btn btn--ghost btn--icon" onClick={() => setSyncResult(null)}><Icon name="close" size={18} /></button>
            </div>
            <div className="modal__body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'En Bitrix', value: syncResult.total_bitrix, color: 'var(--fg)' },
                  { label: 'Importados', value: syncResult.imported, color: 'var(--success)' },
                  { label: 'Desactivados', value: syncResult.deactivated, color: 'var(--danger)' },
                  { label: 'Omitidos', value: syncResult.skipped, color: 'var(--fg-muted)' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ textAlign: 'center', padding: '14px 8px', background: 'var(--bg-2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)', marginTop: 4 }}>{label}</div>
                  </div>
                ))}
              </div>

              {syncResult.deactivated_detail.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, marginBottom: 8, color: 'var(--danger)' }}>
                    Desactivados ({syncResult.deactivated_detail.length})
                  </div>
                  <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', background: 'var(--danger-soft)' }}>
                    {syncResult.deactivated_detail.map((s, i) => (
                      <div key={i} style={{ padding: '7px 12px', borderBottom: i < syncResult.deactivated_detail.length - 1 ? '1px solid var(--danger-border)' : 'none', fontSize: 'var(--fs-sm)', color: 'var(--danger)' }}>
                        {s.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {syncResult.skipped_detail.length > 0 && (
                <div>
                  <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, marginBottom: 8 }}>Omitidos ({syncResult.skipped_detail.length})</div>
                  <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                    {syncResult.skipped_detail.map((s, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: i < syncResult.skipped_detail.length - 1 ? '1px solid var(--border-soft)' : 'none', fontSize: 'var(--fs-sm)' }}>
                        <span>{s.name}</span>
                        <span style={{ color: 'var(--fg-muted)', fontSize: 'var(--fs-xs)' }}>{s.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal__footer">
              <button className="btn btn--primary" onClick={() => setSyncResult(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Eliminar empleado</h2>
              <button className="btn btn--ghost btn--icon" onClick={() => setDeleteConfirm(null)}><Icon name="close" size={18} /></button>
            </div>
            <div className="modal__body">
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <Avatar name={`${deleteConfirm.name} ${deleteConfirm.lname}`} />
                <div>
                  <div style={{ fontWeight: 500 }}>{deleteConfirm.name} {deleteConfirm.lname}</div>
                  <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)', marginTop: 4 }}>
                    ¿Estás seguro de eliminar este empleado? Esta acción no se puede deshacer.
                  </div>
                </div>
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
              <button className="btn btn--danger" onClick={() => handleDelete(deleteConfirm)}>Eliminar empleado</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
