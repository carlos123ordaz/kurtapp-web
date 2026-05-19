import React, { useRef } from 'react'
import { Icon } from '../ui'
import { Button } from '../ui'

interface TopbarProps {
  title: string
  sub?: string | null
  right?: React.ReactNode
  onSearch?: (q: string) => void
  onMenuToggle?: () => void
}

export const Topbar: React.FC<TopbarProps> = ({ title, sub, right, onSearch, onMenuToggle }) => {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <header className="topbar">
      <Button kind="ghost" size="sm" className="btn--icon topbar__menu-btn" onClick={onMenuToggle} aria-label="Abrir menú">
        <Icon name="menu" size={18} />
      </Button>
      <div>
        <span className="topbar__title">{title}</span>
        {sub && <span className="topbar__sub">/ {sub}</span>}
      </div>
      <div className="topbar__spacer" />
      <div className="topbar__search">
        <Icon name="search" size={14} />
        <input
          ref={inputRef}
          placeholder="Buscar empleados, incidencias, sedes…"
          onChange={(e) => onSearch?.(e.target.value)}
        />
        <span className="topbar__kbd">⌘K</span>
      </div>
      {right}
      <Button kind="ghost" size="sm" className="btn--icon">
        <Icon name="bell" size={16} />
      </Button>
    </header>
  )
}
