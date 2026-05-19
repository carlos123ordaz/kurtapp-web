import { useState } from 'react'
import { Icon } from '../../../components/ui'
import {
  getEmp, getArea, getTipo, fmtDateLong,
  calcDisponible, cumplioPrimerAnio,
  type Solicitud, type VacEmployee,
} from '../data/vacacionesData'
import { VacAvatar, TipoChip, StatusChip, SaldoBar } from './VacShared'

interface Props {
  solicitud: Solicitud | null
  employees?: VacEmployee[]
  onClose: () => void
  onApprove: (s: Solicitud) => void
  onReject: (s: Solicitud, motivo: string) => void
  currentEmpId?: string | null
  isAdmin?: boolean
}

export function RequestDrawer({ solicitud, employees: empsProp = [], onClose, onApprove, onReject, currentEmpId, isAdmin }: Props) {
  const [rejecting, setRejecting] = useState(false)
  const [motivoRechazo, setMotivoRechazo] = useState('')

  if (!solicitud) return null

  const findEmp = (id: string | null | undefined): VacEmployee | undefined => {
    if (!id) return undefined
    return empsProp.find(e => e.id === id) ?? getEmp(id)
  }

  const canApprove = isAdmin || !solicitud.responsableId || solicitud.responsableId === currentEmpId

  const emp      = findEmp(solicitud.empId)
  if (!emp) return null
  const area     = getArea(emp.area) ?? { label: emp.area, color: '#6b7280' }
  const tipo     = getTipo(solicitud.tipo)!
  const aprobador    = solicitud.aprobador ? findEmp(solicitud.aprobador) : null
  const dispo        = calcDisponible(emp)
  const menosDeUnAnio = !cumplioPrimerAnio(emp) && !!emp.ingreso

  const handleReject = () => {
    onReject(solicitud, motivoRechazo || 'Rechazado por el aprobador')
    setRejecting(false)
    setMotivoRechazo('')
    onClose()
  }

  const handleApprove = () => {
    onApprove(solicitud)
    onClose()
  }

  const steps = [
    {
      icon: 'plus' as const,
      label: 'Solicitud creada',
      sub: fmtDateLong(solicitud.solicitada),
      done: true,
    },
    {
      icon: 'users' as const,
      label: aprobador ? `${aprobador.name.split(' ').slice(0, 2).join(' ')} (Líder)` : 'Aprobación de líder',
      sub: solicitud.estado === 'aprobado' || solicitud.estado === 'rechazado'
        ? solicitud.estado === 'aprobado' ? 'Aprobado' : 'Rechazado'
        : 'Pendiente de revisión',
      done: solicitud.estado !== 'pendiente',
      rejected: solicitud.estado === 'rechazado',
    },
    {
      icon: 'shield' as const,
      label: 'Validación RR.HH.',
      sub: solicitud.nivel === 'rrhh' && solicitud.estado === 'aprobado'
        ? 'Aprobado'
        : solicitud.dias > 5 ? 'Requerida (> 5 días)' : 'No requerida',
      done: solicitud.nivel === 'rrhh' && solicitud.estado === 'aprobado',
      skipped: solicitud.dias <= 5,
    },
  ]

  return (
    <>
      <div className="vac-drawer-overlay" onClick={onClose} />
      <div className="vac-drawer">
        {/* Header */}
        <div className="vac-drawer__head">
          <button className="btn btn--ghost btn--sm" onClick={onClose}>
            <Icon name="close" size={14} /> Cerrar
          </button>
          <span style={{ fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'Geist Mono, monospace' }}>
            #{solicitud.id.toUpperCase()}
          </span>
        </div>

        <div className="vac-drawer__body">
          {/* Employee */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '4px 0 20px' }}>
            <VacAvatar emp={emp} size="xl" />
            <div>
              <div style={{ fontSize: 17, fontWeight: 700 }}>{emp.name}</div>
              <div style={{ fontSize: 13, color: 'var(--fg-muted)', marginTop: 2 }}>{emp.role}</div>
              <div className="vac-area-tag" style={{ marginTop: 6 }}>
                <div className="vac-area-tag__swatch" style={{ background: area.color }} />
                {area.label}
              </div>
            </div>
          </div>

          {/* Type + Status */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <TipoChip tipoId={solicitud.tipo} />
            <StatusChip estado={solicitud.estado} />
          </div>

          {/* Date grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Desde',       val: fmtDateLong(solicitud.desde) },
              { label: 'Hasta',       val: fmtDateLong(solicitud.hasta) },
              {
                label: solicitud.medioDia ? 'Duración' : 'Días hábiles',
                val: solicitud.medioDia ? '½ día' : `${solicitud.dias} días`,
              },
            ].map(c => (
              <div key={c.label} style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 4 }}>{c.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{c.val}</div>
              </div>
            ))}
          </div>

          {/* Saldo */}
          {tipo.descuenta && (
            <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '12px 14px', border: '1px solid var(--border)', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--fg-muted)', fontWeight: 600 }}>Saldo del colaborador</div>
                {menosDeUnAnio && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--warning)', background: 'var(--warning-soft)', padding: '1px 7px', borderRadius: 999 }}>
                    Menos de 1 año
                  </span>
                )}
              </div>
              <SaldoBar total={emp.saldoTotal} tomados={emp.tomados} pendientes={emp.pendientes} />
              <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 6 }}>
                {emp.tomados} tomados · {emp.pendientes} pendientes ·{' '}
                <strong style={{ color: dispo - solicitud.dias < 0 ? 'var(--danger)' : 'var(--fg)' }}>
                  {dispo - solicitud.dias}
                </strong>{' '}
                quedarán disponibles
                {menosDeUnAnio && dispo - solicitud.dias < 0 && (
                  <span style={{ color: 'var(--warning)', marginLeft: 4 }}>(adelanto)</span>
                )}
              </div>
            </div>
          )}

          {/* Motivo */}
          <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '12px 14px', border: '1px solid var(--border)', marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--fg-muted)', fontWeight: 600, marginBottom: 4 }}>Motivo</div>
            <div style={{ fontSize: 13 }}>{solicitud.motivo}</div>
          </div>

          {/* Approval flow */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--fg-muted)', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Flujo de aprobación</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, position: 'relative' }}>
                  {/* Connector line */}
                  {i < steps.length - 1 && (
                    <div style={{
                      position: 'absolute', left: 15, top: 32, bottom: -8,
                      width: 2, background: step.done ? 'var(--success)' : 'var(--border)',
                    }} />
                  )}
                  {/* Icon bubble */}
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: step.rejected ? 'var(--danger-soft)' : step.done ? 'var(--success-soft)' : step.skipped ? 'var(--bg-2)' : 'var(--surface-2)',
                    border: `2px solid ${step.rejected ? 'var(--danger)' : step.done ? 'var(--success)' : 'var(--border)'}`,
                    color: step.rejected ? 'var(--danger)' : step.done ? 'var(--success)' : 'var(--fg-muted)',
                    zIndex: 1,
                  }}>
                    <Icon name={step.rejected ? 'close' : step.done ? 'check' : step.icon} size={13} />
                  </div>
                  {/* Text */}
                  <div style={{ paddingBottom: i < steps.length - 1 ? 16 : 0, paddingTop: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: step.skipped ? 'var(--fg-muted)' : 'var(--fg)' }}>{step.label}</div>
                    <div style={{ fontSize: 12, color: step.rejected ? 'var(--danger)' : 'var(--fg-muted)', marginTop: 1 }}>{step.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reject sub-form */}
          {rejecting && (
            <div style={{ background: 'var(--danger-soft, #fef2f2)', borderRadius: 8, padding: 14, border: '1px solid var(--danger)', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--danger)', marginBottom: 8 }}>Motivo del rechazo</div>
              <textarea
                className="textarea"
                placeholder="Describe el motivo del rechazo (opcional)"
                value={motivoRechazo}
                onChange={e => setMotivoRechazo(e.target.value)}
                style={{ marginBottom: 10 }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn--sm" onClick={() => setRejecting(false)}>Cancelar</button>
                <button className="btn btn--danger btn--sm" onClick={handleReject}>Confirmar rechazo</button>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {solicitud.estado === 'pendiente' && !rejecting && canApprove && (
          <div className="vac-drawer__foot">
            <button className="btn btn--danger" onClick={() => setRejecting(true)}>
              <Icon name="close" size={14} /> Rechazar
            </button>
            <button className="btn btn--accent" onClick={handleApprove}>
              <Icon name="check" size={14} /> Aprobar solicitud
            </button>
          </div>
        )}
      </div>
    </>
  )
}
