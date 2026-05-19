import React, { useState, useEffect } from 'react'
import { Icon } from '../../../components/ui'
import { TIPOS, getEmp, fmtDate, fmtDias, type Solicitud, type VacEmployee } from '../data/vacacionesData'
import { EmpCell, VacAvatar, TipoChip, StatusChip } from './VacShared'

const PAGE_SIZE = 10

interface Props {
  solicitudes: Solicitud[]
  employees?: VacEmployee[]
  currentEmpId?: string | null
  isAdmin?: boolean
  onOpenRequest: (s: Solicitud) => void
  onApprove: (s: Solicitud) => void
  onReject: (s: Solicitud, motivo: string) => void
  onDelete: (s: Solicitud) => void
  onNewRequest: () => void
}

export function VacSolicitudes({ solicitudes, employees: empsProp = [], currentEmpId, isAdmin, onOpenRequest, onApprove, onReject, onDelete, onNewRequest }: Props) {
  const findEmp = (id: string | null | undefined): VacEmployee | undefined => {
    if (!id) return undefined
    return empsProp.find(e => e.id === id) ?? getEmp(id)
  }
  const [tab, setTab]           = useState<'pendiente' | 'aprobado' | 'rechazado'>('pendiente')
  const [search, setSearch]     = useState('')
  const [tipoF, setTipoF]       = useState('all')
  const [page, setPage]         = useState(1)
  const [rejectTarget, setRejectTarget] = useState<Solicitud | null>(null)
  const [rejectMotivo, setRejectMotivo] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Solicitud | null>(null)

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [tab, search, tipoF])

  const filtered = solicitudes
    .filter(s => s.estado === tab)
    .filter(s => tipoF === 'all' || s.tipo === tipoF)
    .filter(s => {
      if (!search.trim()) return true
      const emp = findEmp(s.empId)
      return emp?.name.toLowerCase().includes(search.toLowerCase())
    })
    .sort((a, b) => b.solicitada.localeCompare(a.solicitada))

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const counts = {
    pendiente: solicitudes.filter(s => s.estado === 'pendiente').length,
    aprobado:  solicitudes.filter(s => s.estado === 'aprobado').length,
    rechazado: solicitudes.filter(s => s.estado === 'rechazado').length,
  }

  const handleRejectSubmit = () => {
    if (rejectTarget && rejectMotivo.trim()) {
      onReject(rejectTarget, rejectMotivo.trim())
      setRejectTarget(null)
      setRejectMotivo('')
    }
  }

  const canApprove = (s: Solicitud) =>
    isAdmin || !s.responsableId || s.responsableId === currentEmpId

  return (
    <div className="page" style={{ gap: 18 }}>
      <div className="page__header">
        <div>
          <h1 className="page__title">Solicitudes</h1>
          <p className="page__desc">Bandeja de aprobaciones y revisión de ausencias.</p>
        </div>
        <div className="page__actions">
          <button className="btn"><Icon name="download" size={14} /> Exportar</button>
          <button className="btn btn--accent" onClick={onNewRequest}>
            <Icon name="plus" size={14} /> Nueva solicitud
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="vac-subnav" style={{ position: 'static', padding: 0, borderBottom: '1px solid var(--border)' }}>
        {(['pendiente','aprobado','rechazado'] as const).map(t => (
          <button
            key={t}
            className={`vac-tab${tab === t ? ' vac-tab--active' : ''}`}
            onClick={() => setTab(t)}
          >
            <Icon name={t === 'pendiente' ? 'clock' : t === 'aprobado' ? 'checkCircle' : 'xCircle'} size={14} />
            {t === 'pendiente' ? 'Pendientes' : t === 'aprobado' ? 'Aprobadas' : 'Rechazadas'}
            <span className="vac-tab__count">{counts[t]}</span>
          </button>
        ))}
      </div>

      <div className="card">
        {/* Filters */}
        <div className="filter-bar">
          <div className="filter-bar__search">
            <Icon name="search" size={14} />
            <input placeholder="Buscar colaborador..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="select" style={{ width: 200 }} value={tipoF} onChange={e => setTipoF(e.target.value)}>
            <option value="all">Todos los tipos</option>
            {Object.values(TIPOS).map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--fg-muted)' }}>
            {filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'}
          </span>
        </div>

        <div className="card__body--flush">
          {filtered.length === 0 && (
            <div className="empty" style={{ padding: '50px 20px' }}>
              <Icon name={tab === 'pendiente' ? 'checkCircle' : 'search'} size={28} style={{ color: 'var(--fg-muted)' }} />
              <p style={{ marginTop: 10, fontWeight: 600, color: 'var(--fg)' }}>
                {tab === 'pendiente' ? 'Sin pendientes' : 'Sin resultados'}
              </p>
              <p style={{ fontSize: 13 }}>
                {tab === 'pendiente' ? 'No hay solicitudes por revisar.' : 'Ajusta los filtros.'}
              </p>
            </div>
          )}
          {filtered.length > 0 && (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Colaborador</th>
                  <th>Tipo</th>
                  <th>Fechas</th>
                  <th>Días</th>
                  <th>Solicitada</th>
                  <th>Aprobador</th>
                  <th style={{ textAlign: 'right' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(s => {
                  const emp      = findEmp(s.empId)
                  if (!emp) return null
                  const aprobador = s.aprobador ? findEmp(s.aprobador) : null
                  const puedeAprobar = canApprove(s)
                  return (
                    <tr key={s.id} onClick={() => onOpenRequest(s)}>
                      <td><EmpCell emp={emp} /></td>
                      <td><TipoChip tipoId={s.tipo} /></td>
                      <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {fmtDate(s.desde)} <span style={{ color: 'var(--fg-faint)' }}>→</span> {fmtDate(s.hasta)}
                      </td>
                      <td style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmtDias(s.dias)}</td>
                      <td style={{ color: 'var(--fg-muted)' }}>{fmtDate(s.solicitada)}</td>
                      <td>
                        {aprobador && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <VacAvatar emp={aprobador} size="sm" />
                            <div>
                              <div style={{ fontSize: 12.5, fontWeight: 500 }}>{aprobador.name.split(' ').slice(0, 2).join(' ')}</div>
                              <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>
                                {s.responsableId ? 'Responsable' : s.nivel === 'rrhh' ? 'RR.HH.' : 'Líder'}
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                          {s.estado === 'pendiente' && (
                            puedeAprobar ? (
                              <>
                                <button className="btn btn--danger btn--sm" onClick={() => { setRejectTarget(s); setRejectMotivo('') }}>
                                  <Icon name="close" size={12} />
                                </button>
                                <button className="btn btn--accent btn--sm" onClick={() => onApprove(s)}>
                                  <Icon name="check" size={12} /> Aprobar
                                </button>
                              </>
                            ) : (
                              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)', fontStyle: 'italic' }}>
                                Pendiente de responsable
                              </span>
                            )
                          )}
                          {s.estado !== 'pendiente' && (
                            <button className="btn btn--ghost btn--sm" onClick={() => onOpenRequest(s)}>
                              Ver detalle <Icon name="chevron" size={12} />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              className="btn btn--ghost btn--icon btn--sm"
                              title="Eliminar solicitud"
                              style={{ color: 'var(--danger)' }}
                              onClick={() => setDeleteTarget(s)}
                            >
                              <Icon name="trash" size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid var(--border-soft)', fontSize: 'var(--fs-sm)' }}>
            <span style={{ color: 'var(--fg-muted)' }}>
              Página {page} de {totalPages} · {filtered.length} solicitudes
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn--ghost btn--sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                Anterior
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                .reduce<(number | '...')[]>((acc, n, i, arr) => {
                  if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('...')
                  acc.push(n)
                  return acc
                }, [])
                .map((n, i) =>
                  n === '...'
                    ? <span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: 'var(--fg-muted)' }}>…</span>
                    : <button
                        key={n}
                        className={`btn btn--ghost btn--sm${page === n ? ' btn--active' : ''}`}
                        style={page === n ? { background: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 600 } : {}}
                        onClick={() => setPage(n as number)}
                      >
                        {n}
                      </button>
                )
              }
              <button className="btn btn--ghost btn--sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de eliminación */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal__header">
              <h2 className="modal__title">Eliminar solicitud</h2>
              <button className="btn btn--ghost btn--icon" onClick={() => setDeleteTarget(null)}>
                <Icon name="close" size={18} />
              </button>
            </div>
            <div className="modal__body">
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--danger-soft)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Icon name="trash" size={16} style={{ color: 'var(--danger)' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 'var(--fs-sm)' }}>
                    ¿Eliminar la solicitud de <strong>{findEmp(deleteTarget.empId)?.name ?? '—'}</strong>?
                  </div>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)', marginTop: 6 }}>
                    Esta acción no se puede deshacer.
                    {TIPOS[deleteTarget.tipo]?.descuenta && deleteTarget.estado !== 'rechazado' && (
                      <span> El saldo descontado será revertido automáticamente.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn" onClick={() => setDeleteTarget(null)}>Cancelar</button>
              <button className="btn btn--danger" onClick={() => { onDelete(deleteTarget); setDeleteTarget(null) }}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de rechazo */}
      {rejectTarget && (
        <div className="modal-overlay" onClick={() => setRejectTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal__header">
              <h2 className="modal__title">Rechazar solicitud</h2>
              <button className="btn btn--ghost btn--icon" onClick={() => setRejectTarget(null)}>
                <Icon name="close" size={18} />
              </button>
            </div>
            <div className="modal__body">
              <div style={{ marginBottom: 12, fontSize: 'var(--fs-sm)', color: 'var(--fg-2)' }}>
                Indica el motivo del rechazo para la solicitud de{' '}
                <strong>{findEmp(rejectTarget.empId)?.name ?? '—'}</strong>.
              </div>
              <div className="field">
                <label className="field__label">Motivo de rechazo *</label>
                <textarea
                  className="textarea"
                  placeholder="Describe el motivo del rechazo…"
                  value={rejectMotivo}
                  onChange={e => setRejectMotivo(e.target.value)}
                  autoFocus
                  rows={3}
                />
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn" onClick={() => setRejectTarget(null)}>Cancelar</button>
              <button
                className="btn btn--danger"
                onClick={handleRejectSubmit}
                disabled={!rejectMotivo.trim()}
              >
                Rechazar solicitud
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
