import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppShell } from './components/layout/AppShell'
import { LoginPage } from './pages/LoginPage'
import { MicrosoftCallbackPage } from './pages/MicrosoftCallbackPage'
import { DashboardPage } from './pages/DashboardPage'
import { UsersPage } from './features/usuarios/pages/UsersPage'
import { SedesPage } from './features/sedes/pages/SedesPage'
import { AsistenciaPage } from './features/asistencia/pages/AsistenciaPage'
import { IncidenciasPage } from './features/incidencias/pages/IncidenciasPage'
import { RolesPage } from './features/roles/pages/RolesPage'
import { SchedulePage } from './features/schedule/pages/SchedulePage'
import { ScheduleSummaryPage } from './features/schedule/pages/ScheduleSummaryPage'
import { VacacionesPage } from './features/vacaciones/pages/VacacionesPage'
import { CotizacionesPage } from './features/cotizaciones/pages/CotizacionesPage'
import type { PageId } from './types'

const PAGE_META: Record<PageId, { title: string; sub: string | null }> = {
  dashboard: { title: 'Resumen', sub: null },
  asistencia: { title: 'Asistencia', sub: 'Resumen diario' },
  incidencias: { title: 'Incidencias', sub: 'Todas' },
  sedes: { title: 'Sedes', sub: 'Mapa interactivo' },
  usuarios: { title: 'Usuarios', sub: 'Directorio' },
  schedule: { title: 'Control de actividades', sub: 'Calendario mensual' },
  roles: { title: 'Roles', sub: 'Gestión de permisos' },
  vacaciones: { title: 'Vacaciones', sub: 'Gestión de ausencias' },
  cotizaciones: { title: 'Cotizaciones', sub: 'Ofertas técnico-comerciales' },
}

const PAGE_ROUTE: Record<PageId, string> = {
  dashboard: '/',
  asistencia: '/asistencia',
  sedes: '/sedes',
  usuarios: '/usuarios',
  incidencias: '/incidencias',
  schedule: '/schedule',
  roles: '/roles',
  vacaciones: '/vacaciones',
  cotizaciones: '/cotizaciones',
}

const ROUTE_PAGE: Record<string, PageId> = Object.fromEntries(
  Object.entries(PAGE_ROUTE).map(([page, route]) => [route, page as PageId])
)

function AdminApp() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const pathname = location.pathname
  const currentPage = (ROUTE_PAGE[pathname] ??
    (pathname.startsWith('/schedule') ? 'schedule' : 'dashboard')) as PageId
  const meta = pathname === '/schedule/resumen'
    ? { title: 'Resumen de actividades', sub: 'Control de actividades' }
    : PAGE_META[currentPage]

  const handleNav = (id: PageId) => {
    navigate(PAGE_ROUTE[id])
  }

  useEffect(() => {
    document.documentElement.dataset.density = 'comfortable'
  }, [])

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--fg)', color: 'var(--surface)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 18 }}>C</div>
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)' }}>Cargando…</div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <AppShell page={currentPage} onNav={handleNav} title={meta.title} sub={meta.sub}>
      <Routes>
        <Route path="/" element={<DashboardPage onNav={handleNav} />} />
        <Route path="/asistencia" element={<AsistenciaPage />} />
        <Route path="/sedes" element={<SedesPage />} />
        <Route path="/usuarios" element={<UsersPage />} />
        <Route path="/incidencias" element={<IncidenciasPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/schedule/resumen" element={<ScheduleSummaryPage />} />
        <Route path="/roles" element={<RolesPage />} />
        <Route path="/vacaciones" element={<VacacionesPage />} />
        <Route path="/cotizaciones" element={<CotizacionesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<MicrosoftCallbackPage />} />
        <Route path="/*" element={<AdminApp />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
