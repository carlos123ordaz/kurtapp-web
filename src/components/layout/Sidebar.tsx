import React from 'react'
import { Icon } from '../ui'
import { useAuth } from '../../context/AuthContext'
import type { PageId } from '../../types'

interface NavItem {
  id: PageId
  label: string
  icon: string
  badge?: string
  permission?: string
}

const NAV: NavItem[] = [
  { id: 'dashboard', label: 'Resumen', icon: 'dashboard', permission: 'dashboard' },
  { id: 'asistencia', label: 'Asistencia', icon: 'clock', permission: 'asistencia' },
  { id: 'schedule', label: 'Control actividad', icon: 'calendar', permission: 'schedule' },
  { id: 'incidencias', label: 'Incidencias', icon: 'alert', permission: 'incidencias' },
  { id: 'vacaciones', label: 'Vacaciones', icon: 'palm', permission: 'vacaciones' },
  { id: 'cotizaciones', label: 'Cotizaciones', icon: 'document', permission: 'cotizaciones' },
  { id: 'sedes', label: 'Sedes', icon: 'pin', permission: 'sedes' },
  { id: 'usuarios', label: 'Usuarios', icon: 'users', permission: 'usuarios' },
  { id: 'roles', label: 'Roles', icon: 'shield', permission: 'roles' },
]

interface SidebarProps {
  active: PageId
  onNav: (id: PageId) => void
  open?: boolean
}

function getInitials(name: string, lname: string) {
  return `${name[0] ?? ''}${lname[0] ?? ''}`.toUpperCase()
}

export const Sidebar: React.FC<SidebarProps> = ({ active, onNav, open }) => {
  const { user, hasPermission, logout } = useAuth()

  const visibleNav = NAV.filter((n) => !n.permission || hasPermission(n.permission))

  return (
    <aside className={`sidebar${open ? ' sidebar--open' : ''}`}>
      <div className="sidebar__brand">
        <div className="sidebar__logo">C</div>
        <div className="sidebar__name">Corsusa</div>
      </div>

      <nav className="sidebar__nav">
        <div className="sidebar__section-label">Operación</div>
        {visibleNav.map((n) => (
          <button
            key={n.id}
            className={`sidebar__item${active === n.id ? ' sidebar__item--active' : ''}`}
            onClick={() => onNav(n.id)}
          >
            <Icon name={n.icon} size={17} className="sidebar__icon" />
            <span>{n.label}</span>
            {n.badge && <span className="sidebar__badge">{n.badge}</span>}
          </button>
        ))}

        <div className="sidebar__section-label">Cuenta</div>
        <button className="sidebar__item" onClick={logout}>
          <Icon name="logout" size={17} className="sidebar__icon" />
          <span>Cerrar sesión</span>
        </button>
      </nav>

      {user && (
        <div className="sidebar__user">
          <div className="sidebar__avatar">
            {getInitials(user.name, user.lname)}
          </div>
          <div className="sidebar__user-info">
            <div className="sidebar__user-name">{user.name} {user.lname}</div>
            <div className="sidebar__user-role">
              {typeof user.role === 'object' && user.role !== null ? user.role.name : 'Usuario'}
            </div>
          </div>
          <Icon name="chevronDown" size={14} className="muted" />
        </div>
      )}
    </aside>
  )
}
