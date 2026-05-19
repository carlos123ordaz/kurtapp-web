import React, { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import type { PageId } from '../../types'

interface AppShellProps {
  page: PageId
  onNav: (id: PageId) => void
  title: string
  sub?: string | null
  children: React.ReactNode
}

export const AppShell: React.FC<AppShellProps> = ({ page, onNav, title, sub, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app">
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
      <Sidebar
        active={page}
        onNav={(id) => { onNav(id); setSidebarOpen(false) }}
        open={sidebarOpen}
      />
      <main className="main">
        <Topbar title={title} sub={sub} onMenuToggle={() => setSidebarOpen(o => !o)} />
        {children}
      </main>
    </div>
  )
}
