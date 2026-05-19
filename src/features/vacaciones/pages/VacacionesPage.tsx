import { useState, useCallback, useEffect } from 'react'
import '../vacaciones.css'
import { useAuth } from '../../../context/AuthContext'
import {
  setEmployeesCache, setAreasCache, setFeriadosCache,
  type Solicitud, type VacEmployee, type VacArea,
} from '../data/vacacionesData'
import { VacSubNav, VacToast, type VacView } from '../components/VacShared'
import { VacDashboard } from '../components/VacDashboard'
import { VacCalendar } from '../components/VacCalendar'
import { VacSolicitudes } from '../components/VacSolicitudes'
import { VacEmpleados, VacEmpleadoDetalle } from '../components/VacEmpleados'
import { VacReportes } from '../components/VacReportes'
import { VacPoliticas } from '../components/VacPoliticas'
import { RequestModal } from '../components/RequestModal'
import { RequestDrawer } from '../components/RequestDrawer'
import {
  apiGetEmpleados,
  apiGetSolicitudes,
  apiGetAreas,
  apiGetFeriados,
  apiCreateSolicitud,
  apiAprobarSolicitud,
  apiRechazarSolicitud,
  apiDeleteSolicitud,
} from '../api/vacacionesApi'

export function VacacionesPage() {
  const { user: authUser, isAdmin } = useAuth()
  const [view,         setView]         = useState<VacView>('dashboard')
  const [solicitudes,  setSolicitudes]  = useState<Solicitud[]>([])
  const [employees,    setEmployees]    = useState<VacEmployee[]>([])
  const [areas,        setAreas]        = useState<VacArea[]>([])
  const [feriados,     setFeriados]     = useState<Record<string, string>>({})
  const [loading,      setLoading]      = useState(true)
  const [openReq,      setOpenReq]      = useState<Solicitud | null>(null)
  const [newReqOpen,   setNewReqOpen]   = useState(false)
  const [toast,        setToast]        = useState<string | null>(null)
  const [detailEmpId,  setDetailEmpId]  = useState<string | null>(null)

  // ─── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true)
    Promise.all([apiGetEmpleados(), apiGetSolicitudes(), apiGetAreas(), apiGetFeriados()])
      .then(([emps, sols, areasData, feriadosData]) => {
        setEmployeesCache(emps)
        setAreasCache(areasData)
        setFeriadosCache(feriadosData)
        setEmployees(emps)
        setSolicitudes(sols)
        setAreas(areasData)
        setFeriados(feriadosData)
      })
      .finally(() => setLoading(false))
  }, [])

  const showToast = useCallback((msg: string) => setToast(msg), [])

  // ─── Acciones ───────────────────────────────────────────────────────────────
  const handleApprove = useCallback(async (s: Solicitud) => {
    try {
      const updated = await apiAprobarSolicitud(s.id)
      setSolicitudes(prev => prev.map(r => r.id === s.id ? updated : r))
      apiGetEmpleados().then(emps => { setEmployeesCache(emps); setEmployees(emps) })
      showToast('Solicitud aprobada')
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? 'Error al aprobar')
    }
  }, [showToast])

  const handleDelete = useCallback(async (s: Solicitud) => {
    try {
      await apiDeleteSolicitud(s.id)
      setSolicitudes(prev => prev.filter(r => r.id !== s.id))
      apiGetEmpleados().then(emps => { setEmployeesCache(emps); setEmployees(emps) })
      showToast('Solicitud eliminada')
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? 'Error al eliminar')
    }
  }, [showToast])

  const handleReject = useCallback(async (s: Solicitud, motivo: string) => {
    try {
      const updated = await apiRechazarSolicitud(s.id, motivo)
      setSolicitudes(prev => prev.map(r => r.id === s.id ? updated : r))
      apiGetEmpleados().then(emps => { setEmployeesCache(emps); setEmployees(emps) })
      showToast('Solicitud rechazada')
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? 'Error al rechazar')
    }
  }, [showToast])

  const handleSubmit = useCallback(async (
    data: Omit<Solicitud, 'id' | 'estado' | 'solicitada' | 'aprobador' | 'nivel'>
  ) => {
    try {
      const nueva = await apiCreateSolicitud({
        empId:         data.empId,
        tipo:          data.tipo,
        desde:         data.desde,
        hasta:         data.hasta,
        motivo:        data.motivo || data.tipo,
        responsableId: data.responsableId || undefined,
        medioDia:      data.medioDia || undefined,
      })
      setSolicitudes(prev => [nueva, ...prev])
      apiGetEmpleados().then(emps => { setEmployeesCache(emps); setEmployees(emps) })
      showToast('Solicitud enviada correctamente')
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? 'Error al crear solicitud')
    }
  }, [showToast])

  const handleGoTo = useCallback((v: VacView, payload?: string) => {
    if (v === 'empleado-detalle' && payload) setDetailEmpId(payload)
    setView(v)
  }, [])

  const handleOpenEmp    = (id: string) => { setDetailEmpId(id); setView('empleado-detalle') }
  const handleBackToEmps = () => { setDetailEmpId(null); setView('empleados') }
  const handleOpenRequest = (s: Solicitud) => setOpenReq(s)

  const pendientes = solicitudes.filter(s => s.estado === 'pendiente').length
  const currentEmpId = employees.find(e => e.userId === authUser?._id)?.id ?? null

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 16 }}>
        <div className="vac-spinner" />
        <span style={{ color: 'var(--fg-muted)', fontSize: 14 }}>Cargando módulo de vacaciones…</span>
      </div>
    )
  }

  // ─── Vistas ─────────────────────────────────────────────────────────────────
  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return (
          <VacDashboard
            solicitudes={solicitudes}
            employees={employees}
            onOpenRequest={handleOpenRequest}
            onNewRequest={() => setNewReqOpen(true)}
            onGoTo={handleGoTo}
          />
        )
      case 'calendario':
        return (
          <VacCalendar
            solicitudes={solicitudes}
            employees={employees}
            areas={areas}
            feriados={feriados}
            onOpenRequest={handleOpenRequest}
          />
        )
      case 'solicitudes':
        return (
          <VacSolicitudes
            solicitudes={solicitudes}
            employees={employees}
            currentEmpId={currentEmpId}
            isAdmin={isAdmin}
            onOpenRequest={handleOpenRequest}
            onApprove={handleApprove}
            onReject={handleReject}
            onDelete={handleDelete}
            onNewRequest={() => setNewReqOpen(true)}
          />
        )
      case 'empleados':
        return (
          <VacEmpleados
            employees={employees}
            areas={areas}
            onOpenEmp={handleOpenEmp}
            onNewRequest={() => setNewReqOpen(true)}
          />
        )
      case 'empleado-detalle':
        return detailEmpId ? (
          <VacEmpleadoDetalle
            empId={detailEmpId}
            solicitudes={solicitudes}
            onBack={handleBackToEmps}
            onOpenRequest={handleOpenRequest}
            onNewRequest={() => setNewReqOpen(true)}
          />
        ) : null
      case 'reportes':
        return <VacReportes solicitudes={solicitudes} employees={employees} areas={areas} />
      case 'politicas':
        return <VacPoliticas areas={areas} feriados={feriados} />
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <VacSubNav current={view} setCurrent={setView} pendientes={pendientes} />
      <div style={{ flex: 1, overflow: 'auto' }}>
        {renderView()}
      </div>

      <RequestModal
        open={newReqOpen}
        employees={employees}
        feriados={feriados}
        onClose={() => setNewReqOpen(false)}
        onSubmit={handleSubmit}
      />

      <RequestDrawer
        solicitud={openReq}
        employees={employees}
        onClose={() => setOpenReq(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        currentEmpId={currentEmpId}
        isAdmin={isAdmin}
      />

      <VacToast msg={toast} onDone={() => setToast(null)} />
    </div>
  )
}
