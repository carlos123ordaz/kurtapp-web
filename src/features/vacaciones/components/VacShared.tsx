import React, { useEffect } from 'react'
import { Icon } from '../../../components/ui'
import { type VacEmployee, type TipoAusencia, getTipo, initials } from '../data/vacacionesData'

// ─── Avatar ──────────────────────────────────────────────────────────────────
interface AvatarProps { emp: VacEmployee; size?: 'sm' | 'md' | 'lg' | 'xl' }
export function VacAvatar({ emp, size = 'md' }: AvatarProps) {
  return (
    <div
      className={`vac-av vac-av--${size}`}
      style={{ background: emp.avatar }}
    >
      {initials(emp.name)}
    </div>
  )
}

// ─── Employee cell ────────────────────────────────────────────────────────────
interface EmpCellProps { emp: VacEmployee; sub?: boolean; onClick?: () => void }
export function EmpCell({ emp, sub = true, onClick }: EmpCellProps) {
  return (
    <div className="vac-emp-cell" onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      <VacAvatar emp={emp} />
      <div>
        <div className="vac-emp-cell__name">{emp.name}</div>
        {sub && <div className="vac-emp-cell__role">{emp.role}</div>}
      </div>
    </div>
  )
}

// ─── Chips ────────────────────────────────────────────────────────────────────
export function TipoChip({ tipoId }: { tipoId: string }) {
  const t: TipoAusencia | undefined = getTipo(tipoId)
  if (!t) return null
  return (
    <span className={`vac-chip vac-chip--${tipoId}`}>
      <span className="vac-chip__dot" />
      {t.label}
    </span>
  )
}

export function StatusChip({ estado }: { estado: string }) {
  const labels: Record<string, string> = { pendiente: 'Pendiente', aprobado: 'Aprobado', rechazado: 'Rechazado' }
  return <span className={`vac-chip vac-chip--${estado}`}>{labels[estado] ?? estado}</span>
}

// ─── Saldo bar ────────────────────────────────────────────────────────────────
interface SaldoBarProps { total: number; tomados: number; pendientes: number; height?: number }
export function SaldoBar({ total, tomados, pendientes, height = 8 }: SaldoBarProps) {
  const tomPct = (tomados / total) * 100
  const penPct = (pendientes / total) * 100
  return (
    <div className="vac-saldo-bar" style={{ height }}>
      <div className="vac-saldo-fill--ok" style={{ width: `${tomPct}%` }} />
      <div className="vac-saldo-fill--pending" style={{ width: `${penPct}%` }} />
    </div>
  )
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
interface KPICardProps { label: string; value: string | number; sub?: string; accent?: 'up' | 'down'; sparkline?: string }
export function KPICard({ label, value, sub, accent, sparkline }: KPICardProps) {
  return (
    <div className="kpi" style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="kpi__label">{label}</div>
      <div className="kpi__value">{value}</div>
      {sub && (
        <div className={`kpi__delta${accent ? ` kpi__delta--${accent}` : ''}`}>{sub}</div>
      )}
      {sparkline && (
        <svg className="vac-kpi-spark" width="80" height="28" viewBox="0 0 80 28" fill="none">
          <polyline points={sparkline} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  )
}

// ─── Sub-navigation ───────────────────────────────────────────────────────────
type VacView = 'dashboard' | 'calendario' | 'solicitudes' | 'empleados' | 'empleado-detalle' | 'reportes' | 'politicas'

interface SubNavProps { current: VacView; setCurrent: (v: VacView) => void; pendientes: number }
export function VacSubNav({ current, setCurrent, pendientes }: SubNavProps) {
  const tabs: { id: VacView; label: string; icon: string; count?: number }[] = [
    { id: 'dashboard',   label: 'Resumen',     icon: 'grid'     },
    { id: 'calendario',  label: 'Calendario',  icon: 'calendar' },
    { id: 'solicitudes', label: 'Solicitudes', icon: 'list',     count: pendientes },
    { id: 'empleados',   label: 'Empleados',   icon: 'users'    },
    { id: 'reportes',    label: 'Reportes',    icon: 'chart'    },
    { id: 'politicas',   label: 'Políticas',   icon: 'settings' },
  ]
  return (
    <div className="vac-subnav">
      {tabs.map(t => {
        const active = current === t.id || (t.id === 'empleados' && current === 'empleado-detalle')
        return (
          <button
            key={t.id}
            className={`vac-tab${active ? ' vac-tab--active' : ''}`}
            onClick={() => setCurrent(t.id)}
          >
            <Icon name={t.icon} size={14} />
            {t.label}
            {t.count != null && t.count > 0 && (
              <span className="vac-tab__count">{t.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── Toast ───────────────────────────────────────────────────────────────────
interface ToastProps { msg: string | null; onDone: () => void }
export function VacToast({ msg, onDone }: ToastProps) {
  useEffect(() => {
    if (!msg) return
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [msg, onDone])
  if (!msg) return null
  return (
    <div className="vac-toast-stack">
      <div className="vac-toast">
        <Icon name="checkCircle" size={16} className="vac-toast__icon" />
        <span>{msg}</span>
      </div>
    </div>
  )
}

export type { VacView }
