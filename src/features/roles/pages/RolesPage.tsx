import React, { useCallback, useEffect, useState } from 'react'
import { Icon, Badge, Button } from '../../../components/ui'
import type { Role } from '../../../types'
import roleService from '../services/roleService'
import { PERMISSION_KEYS, PERMISSION_LABELS } from '../../../config/permissions'

interface RoleModalProps {
  mode: 'create' | 'edit'
  role?: Role
  onClose: () => void
  onSaved: () => void
}

const RoleModal: React.FC<RoleModalProps> = ({ mode, role, onClose, onSaved }) => {
  const [name, setName] = useState(role?.name ?? '')
  const [description, setDescription] = useState(role?.description ?? '')
  const [isAdmin, setIsAdmin] = useState(role?.isAdmin ?? false)
  const [perms, setPerms] = useState<Set<string>>(new Set(role?.permissions ?? []))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const togglePerm = (key: string) => {
    setPerms((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const payload = { name, description, isAdmin, permissions: Array.from(perms), active: true }
      if (mode === 'create') await roleService.create(payload)
      else await roleService.update(role!._id, payload)
      onSaved()
      onClose()
    } catch {
      setError('Error al guardar el rol.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">{mode === 'create' ? 'Nuevo rol' : 'Editar rol'}</h2>
          <button className="btn btn--ghost btn--icon" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {error && (
              <div style={{ padding: '10px 14px', background: 'var(--danger-soft)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--fs-sm)', color: 'var(--danger)', display: 'flex', gap: 8 }}>
                <Icon name="alert" size={14} /> {error}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="field" style={{ gridColumn: '1/-1' }}>
                <label className="field__label">Nombre del rol *</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="p.ej. Supervisor de Operaciones" />
              </div>
              <div className="field" style={{ gridColumn: '1/-1' }}>
                <label className="field__label">Descripción</label>
                <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Breve descripción del rol y sus responsabilidades…" style={{ minHeight: 64 }} />
              </div>
            </div>

            <div className="field">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <button
                  type="button"
                  onClick={() => setIsAdmin((v) => !v)}
                  style={{
                    width: 36, height: 20,
                    borderRadius: 10,
                    background: isAdmin ? 'var(--accent)' : 'var(--border-strong)',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background 0.15s',
                    flexShrink: 0,
                  }}
                >
                  <span style={{
                    position: 'absolute',
                    top: 2, left: isAdmin ? 18 : 2,
                    width: 16, height: 16,
                    borderRadius: '50%',
                    background: 'white',
                    transition: 'left 0.15s',
                    boxShadow: 'var(--shadow-sm)',
                  }} />
                </button>
                <label className="field__label" style={{ margin: 0 }}>Rol de administrador (acceso total)</label>
              </div>
              {isAdmin && (
                <div style={{ padding: '8px 12px', background: 'var(--warning-soft)', border: '1px solid var(--warning-border)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--fs-xs)', color: 'oklch(0.48 0.13 70)' }}>
                  Los administradores tienen acceso a todos los módulos sin restricción de permisos.
                </div>
              )}
            </div>

            {!isAdmin && (
              <div className="field">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <label className="field__label" style={{ margin: 0 }}>Permisos asignados</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => setPerms(new Set(PERMISSION_KEYS))}>Todos</button>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => setPerms(new Set())}>Ninguno</button>
                  </div>
                </div>
                <div className="perm-grid">
                  {PERMISSION_KEYS.map((key) => {
                    const active = perms.has(key)
                    return (
                      <div key={key} className={`perm-item${active ? ' perm-item--active' : ''}`} onClick={() => togglePerm(key)}>
                        <div className="perm-check">
                          {active && <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                        </div>
                        <span>{PERMISSION_LABELS[key]}</span>
                      </div>
                    )
                  })}
                </div>
                <div style={{ marginTop: 8, fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)' }}>{perms.size} de {PERMISSION_KEYS.length} permisos seleccionados</div>
              </div>
            )}
          </div>
          <div className="modal__footer">
            <button type="button" className="btn" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? 'Guardando…' : mode === 'create' ? 'Crear rol' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export const RolesPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; role?: Role } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Role | null>(null)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try { setRoles(await roleService.getAll()) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = roles.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))

  const handleDelete = async (r: Role) => {
    await roleService.delete(r._id)
    setDeleteConfirm(null)
    load()
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Roles</h1>
          <div className="page__desc">Gestión de roles y permisos de acceso</div>
        </div>
        <div className="page__actions">
          <Button kind="primary" icon="plus" onClick={() => setModal({ mode: 'create' })}>Nuevo rol</Button>
        </div>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="filter-bar__search">
            <Icon name="search" size={14} className="muted" />
            <input placeholder="Buscar rol…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)' }}>{filtered.length} roles</div>
        </div>

        {loading ? (
          <div className="empty">Cargando roles…</div>
        ) : filtered.length === 0 ? (
          <div className="empty">No se encontraron roles.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Tipo</th>
                  <th>Permisos</th>
                  <th>Estado</th>
                  <th style={{ width: 80 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 6, background: r.isAdmin ? 'var(--danger-soft)' : 'var(--accent-soft)', display: 'grid', placeItems: 'center', color: r.isAdmin ? 'var(--danger)' : 'var(--accent)' }}>
                          <Icon name={r.isAdmin ? 'key' : 'shield'} size={14} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 'var(--fs-sm)' }}>{r.name}</div>
                        </div>
                      </div>
                    </td>
                    <td><span style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-2)' }}>{r.description || '—'}</span></td>
                    <td>{r.isAdmin ? <Badge kind="danger">Administrador</Badge> : <Badge kind="neutral">Estándar</Badge>}</td>
                    <td>
                      {r.isAdmin ? (
                        <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)' }}>Todos los permisos</span>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {r.permissions.slice(0, 3).map((p) => (
                            <Badge key={p} kind="accent">{PERMISSION_LABELS[p as keyof typeof PERMISSION_LABELS] ?? p}</Badge>
                          ))}
                          {r.permissions.length > 3 && (
                            <Badge kind="neutral">+{r.permissions.length - 3} más</Badge>
                          )}
                          {r.permissions.length === 0 && <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-faint)' }}>Sin permisos</span>}
                        </div>
                      )}
                    </td>
                    <td>{r.active ? <Badge kind="success" dot>Activo</Badge> : <Badge kind="neutral">Inactivo</Badge>}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn--ghost btn--icon" title="Editar" onClick={() => setModal({ mode: 'edit', role: r })}>
                          <Icon name="edit" size={14} />
                        </button>
                        <button className="btn btn--ghost btn--icon" title="Eliminar" style={{ color: 'var(--danger)' }} onClick={() => setDeleteConfirm(r)}>
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <RoleModal mode={modal.mode} role={modal.role} onClose={() => setModal(null)} onSaved={load} />
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Eliminar rol</h2>
              <button className="btn btn--ghost btn--icon" onClick={() => setDeleteConfirm(null)}><Icon name="close" size={18} /></button>
            </div>
            <div className="modal__body">
              <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-2)' }}>
                ¿Estás seguro de eliminar el rol <strong>{deleteConfirm.name}</strong>? Los usuarios con este rol perderán sus permisos.
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
              <button className="btn btn--danger" onClick={() => handleDelete(deleteConfirm)}>Eliminar rol</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
