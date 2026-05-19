import React, { useCallback, useEffect, useState } from 'react'
import { Icon, Badge, SeveridadBadge, EstadoIncidenciaBadge, Button } from '../components/ui'
import type { Incidencia, Sede } from '../types'
import incidenciasService, { type IncidenciasDashboardStats } from '../features/incidencias/services/incidenciasService'
import sedeService from '../features/sedes/services/sedeService'
import userService from '../features/usuarios/services/userService'
import { useAuth } from '../context/AuthContext'
import type { PageId } from '../types'

interface DashboardProps {
  onNav: (id: PageId) => void
}

function fmtFecha(fecha: string) {
  try {
    return new Date(fecha).toLocaleDateString('es', { day: '2-digit', month: 'short' })
  } catch {
    return fecha
  }
}

interface KpiCardProps {
  label: string
  value: React.ReactNode
  delta: React.ReactNode
  icon: string
  accentColor: string
  onClick?: () => void
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, delta, icon, accentColor, onClick }) => (
  <div
    className="kpi"
    onClick={onClick}
    style={{
      cursor: onClick ? 'pointer' : 'default',
      borderTop: `3px solid ${accentColor}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
      <div className="kpi__label">{label}</div>
      <div style={{ color: accentColor, opacity: 0.7, marginTop: 1 }}>
        <Icon name={icon} size={15} strokeWidth={1.75} />
      </div>
    </div>
    <div className="kpi__value tnum" style={{ marginTop: 0 }}>{value}</div>
    <div className="kpi__delta" style={{ marginTop: 8 }}>{delta}</div>
  </div>
)

export const DashboardPage: React.FC<DashboardProps> = ({ onNav }) => {
  const { user } = useAuth()
  const [incidencias, setIncidencias] = useState<Incidencia[]>([])
  const [stats, setStats] = useState<IncidenciasDashboardStats | null>(null)
  const [sedes, setSedes] = useState<Sede[]>([])
  const [userCount, setUserCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [incRecientes, incStats, s, uResult] = await Promise.all([
        incidenciasService.getAll({ limit: '6' }),        // 6 docs para la tabla
        incidenciasService.getDashboardStats(),            // aggregations para los conteos
        sedeService.getAll(),
        userService.query({ page: '1', limit: '1' }),     // page requerido para activar paginación
      ])
      setIncidencias(incRecientes.data)
      setStats(incStats)
      setSedes(s)
      setUserCount(uResult.total)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Buenos días' : now.getHours() < 18 ? 'Buenas tardes' : 'Buenas noches'
  const dateStr = now.toLocaleDateString('es', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

  const ESTADOS_CERRADOS = new Set(['cerrado', 'Cerrado', 'resuelto', 'Resuelto'])
  const abiertas = stats
    ? stats.porEstado.filter((e) => !ESTADOS_CERRADOS.has(e._id)).reduce((s, e) => s + e.count, 0)
    : 0
  const criticas = stats?.criticasAbiertas ?? 0
  const totalIncidencias = stats?.total ?? 0
  const activasSedes = sedes.filter((s) => s.active).length

  // Para el strip de severidad usamos porSeveridad del backend (sobre todas las incidencias)
  const sevCounts = {
    Crítico: stats?.porSeveridad.find((e) => e._id === 'Crítico')?.count ?? 0,
    Alto: stats?.porSeveridad.find((e) => e._id === 'Alto')?.count ?? 0,
    Medio: stats?.porSeveridad.find((e) => e._id === 'Medio')?.count ?? 0,
    Bajo: stats?.porSeveridad.find((e) => e._id === 'Bajo')?.count ?? 0,
  }
  const totalAbiertas = abiertas

  const sevColors: Record<string, string> = {
    Crítico: 'var(--critical)',
    Alto: 'var(--danger)',
    Medio: 'var(--warning)',
    Bajo: 'var(--info)',
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="page__header">
        <div>
          <h1 className="page__title">{greeting}{user ? `, ${user.name}` : ''}</h1>
          <div className="page__desc">
            Estado operativo de Corsusa — <span style={{ textTransform: 'capitalize' }}>{dateStr}</span>
          </div>
        </div>
        <button
          className="btn btn--ghost"
          onClick={load}
          style={{ gap: 6 }}
          title="Actualizar datos"
        >
          <Icon name="refresh" size={14} /> Actualizar
        </button>
      </div>

      {/* KPI grid */}
      <div className="kpi-grid">
        <KpiCard
          label="Personal registrado"
          value={loading ? '…' : userCount}
          delta={<><Icon name="arrow" size={12} style={{ color: 'var(--success)' }} /> <span style={{ color: 'var(--success)' }}>Ver asistencia</span></>}
          icon="users"
          accentColor="var(--accent)"
          onClick={() => onNav('asistencia')}
        />
        <KpiCard
          label="Incidencias abiertas"
          value={
            loading ? '…' : (
              <span style={abiertas > 0 ? { color: criticas > 0 ? 'var(--danger)' : 'var(--warning)' } : {}}>
                {abiertas}
              </span>
            )
          }
          delta={
            criticas > 0
              ? <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="alert" size={12} /> {criticas} {criticas === 1 ? 'crítica activa' : 'críticas activas'}
                </span>
              : <span style={{ color: 'var(--fg-muted)' }}>Sin incidencias críticas</span>
          }
          icon="alert"
          accentColor={criticas > 0 ? 'var(--danger)' : abiertas > 0 ? 'var(--warning)' : 'var(--success)'}
          onClick={() => onNav('incidencias')}
        />
        <KpiCard
          label="Sedes activas"
          value={
            loading ? '…' : (
              <>
                {activasSedes}
                <span style={{ color: 'var(--fg-faint)', fontSize: 'var(--fs-lg)', fontWeight: 400 }}> / {sedes.length}</span>
              </>
            )
          }
          delta={
            !loading && sedes.length > 0
              ? <span style={{ color: activasSedes === sedes.length ? 'var(--success)' : 'var(--fg-muted)' }}>
                  {activasSedes === sedes.length ? 'Todas operativas' : `${sedes.length - activasSedes} fuera de servicio`}
                </span>
              : <span style={{ color: 'var(--fg-muted)' }}>Cobertura nacional</span>
          }
          icon="pin"
          accentColor="var(--success)"
          onClick={() => onNav('sedes')}
        />
        <KpiCard
          label="Total incidencias"
          value={loading ? '…' : totalIncidencias}
          delta={
            !loading && stats
              ? <span style={{ color: 'var(--fg-muted)' }}>
                  {(stats.porEstado.find(e => e._id === 'cerrado')?.count ?? 0) +
                   (stats.porEstado.find(e => e._id === 'Cerrado')?.count ?? 0) +
                   (stats.porEstado.find(e => e._id === 'resuelto')?.count ?? 0) +
                   (stats.porEstado.find(e => e._id === 'Resuelto')?.count ?? 0)} resueltas
                </span>
              : <span style={{ color: 'var(--fg-muted)' }}>Sin registros</span>
          }
          icon="layers"
          accentColor="var(--fg-faint)"
          onClick={() => onNav('incidencias')}
        />
      </div>

      {/* Severity breakdown strip */}
      {!loading && totalAbiertas > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: 4 }}>
            Incidencias abiertas
          </span>
          {(['Crítico', 'Alto', 'Medio', 'Bajo'] as const).map((sev) =>
            sevCounts[sev] > 0 ? (
              <div key={sev} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: sevColors[sev], flexShrink: 0 }} />
                <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-2)', fontVariantNumeric: 'tabular-nums' }}>
                  <strong style={{ color: sevColors[sev] }}>{sevCounts[sev]}</strong> {sev}
                </span>
              </div>
            ) : null
          )}
          <div style={{ flex: 1 }} />
          {/* Mini bar */}
          <div style={{ display: 'flex', height: 6, width: 120, borderRadius: 4, overflow: 'hidden', gap: 1 }}>
            {(['Crítico', 'Alto', 'Medio', 'Bajo'] as const).map((sev) =>
              sevCounts[sev] > 0 ? (
                <div
                  key={sev}
                  style={{
                    flex: sevCounts[sev],
                    background: sevColors[sev],
                    minWidth: 4,
                  }}
                />
              ) : null
            )}
          </div>
        </div>
      )}

      {/* Main split */}
      <div className="split">
        {/* Incidencias recientes */}
        <div className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Incidencias recientes</h3>
              {!loading && stats && (
                <div className="card__sub" style={{ marginTop: 2 }}>
                  {abiertas > 0
                    ? `${abiertas} abierta${abiertas !== 1 ? 's' : ''} de ${totalIncidencias} total`
                    : 'Todo en orden'}
                </div>
              )}
            </div>
            <Button kind="ghost" size="sm" onClick={() => onNav('incidencias')}>
              Ver todas <Icon name="chevron" size={12} />
            </Button>
          </div>
          {loading ? (
            <div className="empty" style={{ padding: '40px 20px' }}>Cargando…</div>
          ) : totalIncidencias === 0 ? (
            <div className="empty" style={{ padding: '40px 20px' }}>
              <Icon name="checkCircle" size={32} style={{ color: 'var(--success)', marginBottom: 8 }} />
              <div>No hay incidencias registradas.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Incidencia</th>
                    <th>Sede</th>
                    <th>Fecha</th>
                    <th>Severidad</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {incidencias.slice(0, 6).map((i) => (
                    <tr key={i._id} onClick={() => onNav('incidencias')}>
                      <td>
                        <div className="name-cell__name">{i.tipoIncidente}</div>
                        {i.descripcion && (
                          <div className="name-cell__sub" style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {i.descripcion}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-2)' }}>{i.sedeNombre ?? '—'}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                          {fmtFecha(i.fecha)}
                        </div>
                      </td>
                      <td><SeveridadBadge severidad={i.gradoSeveridad} /></td>
                      <td><EstadoIncidenciaBadge estado={i.estado} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sedes */}
        <div className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Sedes</h3>
              {!loading && sedes.length > 0 && (
                <div className="card__sub" style={{ marginTop: 2 }}>
                  {activasSedes} de {sedes.length} operativas
                </div>
              )}
            </div>
            <Button kind="ghost" size="sm" onClick={() => onNav('sedes')}>
              Ver mapa <Icon name="chevron" size={12} />
            </Button>
          </div>
          <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: 0 }}>
            {loading ? (
              <div className="empty" style={{ padding: '40px 20px' }}>Cargando…</div>
            ) : sedes.length === 0 ? (
              <div className="empty" style={{ padding: '40px 20px' }}>Sin sedes registradas.</div>
            ) : (
              sedes.slice(0, 6).map((s, idx) => (
                <div
                  key={s._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 20px',
                    borderBottom: idx < Math.min(sedes.length, 6) - 1 ? '1px solid var(--border-soft)' : 'none',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: s.active ? 'var(--accent-soft)' : 'var(--bg-2)',
                    display: 'grid',
                    placeItems: 'center',
                    color: s.active ? 'var(--accent)' : 'var(--fg-faint)',
                    flexShrink: 0,
                  }}>
                    <Icon name="pin" size={15} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--fg)' }}>
                      {s.nombre}
                    </div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.direccion ?? `Radio ${s.radio}m`}
                    </div>
                  </div>
                  <Badge kind={s.active ? 'success' : 'neutral'} dot={s.active}>
                    {s.active ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
              ))
            )}
            {!loading && sedes.length > 6 && (
              <div
                style={{
                  padding: '10px 20px',
                  textAlign: 'center',
                  fontSize: 'var(--fs-xs)',
                  color: 'var(--fg-muted)',
                  borderTop: '1px solid var(--border-soft)',
                  cursor: 'pointer',
                }}
                onClick={() => onNav('sedes')}
              >
                +{sedes.length - 6} más → Ver todas
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
