import React from 'react'

export type BadgeKind = 'neutral' | 'success' | 'warning' | 'danger' | 'critical' | 'info' | 'accent' | 'ghost' | 'solid-success'

interface BadgeProps {
  kind?: BadgeKind
  dot?: boolean
  lg?: boolean
  children: React.ReactNode
}

export const Badge: React.FC<BadgeProps> = ({ kind = 'neutral', dot, lg, children }) => (
  <span className={`badge badge--${kind}${lg ? ' badge--lg' : ''}`}>
    {dot && <span className="badge__dot" style={{ background: 'currentColor' }} />}
    {children}
  </span>
)

export const EstadoAsistenciaBadge: React.FC<{ estado: string }> = ({ estado }) => {
  const map: Record<string, { kind: BadgeKind; label: string; dot?: boolean }> = {
    valida: { kind: 'success', label: 'Válida', dot: true },
    invalida: { kind: 'danger', label: 'Inválida', dot: true },
    'en-curso': { kind: 'info', label: 'En curso', dot: true },
    ausente: { kind: 'neutral', label: 'Ausente' },
    tarde: { kind: 'warning', label: 'Tardanza', dot: true },
    remoto: { kind: 'accent', label: 'Remoto', dot: true },
  }
  const m = map[estado] ?? map['ausente']
  return <Badge kind={m.kind} dot={m.dot}>{m.label}</Badge>
}

export const SeveridadBadge: React.FC<{ severidad: string }> = ({ severidad }) => {
  const map: Record<string, BadgeKind> = { Bajo: 'info', Medio: 'warning', Alto: 'danger', Crítico: 'critical' }
  return <Badge kind={map[severidad] ?? 'neutral'}>{severidad}</Badge>
}

export const EstadoIncidenciaBadge: React.FC<{ estado: string }> = ({ estado }) => {
  const map: Record<string, { kind: BadgeKind; label: string; dot?: boolean }> = {
    'Pendiente': { kind: 'warning', label: 'Pendiente', dot: true },
    'En Revisión': { kind: 'info', label: 'En Revisión', dot: true },
    'Resuelto': { kind: 'success', label: 'Resuelto', dot: true },
    'Cerrado': { kind: 'neutral', label: 'Cerrado' },
    pendiente: { kind: 'warning', label: 'Pendiente', dot: true },
    'en-proceso': { kind: 'info', label: 'En proceso', dot: true },
    resuelto: { kind: 'success', label: 'Resuelto', dot: true },
    cerrado: { kind: 'neutral', label: 'Cerrado' },
  }
  const m = map[estado] ?? { kind: 'neutral' as BadgeKind, label: estado }
  return <Badge kind={m.kind} dot={m.dot}>{m.label}</Badge>
}
