import { Icon } from '../../../components/ui'
import {
  getEmp, fmtDate, addDays, isoDate,
  calcDisponible, cumplioPrimerAnio,
  type Solicitud, type VacEmployee,
} from '../data/vacacionesData'
import { VacAvatar, EmpCell, TipoChip, SaldoBar, KPICard, type VacView } from './VacShared'

interface Props {
  solicitudes: Solicitud[]
  onOpenRequest: (s: Solicitud) => void
  onNewRequest: () => void
  onGoTo: (v: VacView, payload?: string) => void
  employees?: VacEmployee[]
}

export function VacDashboard({ solicitudes, onOpenRequest, onNewRequest, onGoTo, employees: empsProp }: Props) {
  const empList = empsProp ?? []
  const todayDate = new Date()
  const TODAY = isoDate(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate())

  const findEmp = (id: string) => empList.find(e => e.id === id) ?? getEmp(id)

  const pendientes = solicitudes.filter(s => s.estado === 'pendiente')
  const aprobadas  = solicitudes.filter(s => s.estado === 'aprobado')
  const totalDiasPend = pendientes.reduce((a, s) => a + s.dias, 0)
  const ausenciasHoy  = aprobadas.filter(s => s.desde <= TODAY && s.hasta >= TODAY)
  const proximas = aprobadas
    .filter(s => s.desde > TODAY)
    .sort((a, b) => a.desde.localeCompare(b.desde))
    .slice(0, 5)
  const vencen = empList.filter(e => cumplioPrimerAnio(e) && calcDisponible(e) >= 22).slice(0, 4)

  return (
    <div className="page" style={{ gap: 18 }}>
      {/* Header */}
      <div className="page__header">
        <div>
          <h1 className="page__title">Vacaciones</h1>
          <p className="page__desc">Panel general — gestiona ausencias, saldos y solicitudes de toda la organización.</p>
        </div>
        <div className="page__actions">
          <button className="btn" onClick={() => onGoTo('calendario')}>
            <Icon name="calendar" size={14} /> Ver calendario
          </button>
          <button className="btn btn--accent" onClick={onNewRequest}>
            <Icon name="plus" size={14} /> Nueva solicitud
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <KPICard label="Solicitudes pendientes" value={pendientes.length}
          sub={`${totalDiasPend} días por aprobar`} accent="down"
          sparkline="0,18 10,14 20,16 30,9 40,12 50,7 60,10 70,6 80,8" />
        <KPICard label="Empleados ausentes hoy" value={ausenciasHoy.length}
          sub={`de ${empList.length} colaboradores`}
          sparkline="0,16 10,12 20,14 30,11 40,10 50,13 60,8 70,9 80,11" />
        <KPICard label="Días tomados este año" value={empList.reduce((a, e) => a + e.tomados, 0)}
          sub="acumulado 2026" accent="up"
          sparkline="0,28 10,24 20,22 30,18 40,14 50,12 60,10 70,8 80,5" />
        <KPICard label="Saldo total disponible" value={empList.reduce((a, e) => a + Math.max(0, calcDisponible(e)), 0)}
          sub="días en la org."
          sparkline="0,8 10,10 20,12 30,16 40,18 50,22 60,25 70,28 80,30" />
      </div>

      {/* Solicitudes pendientes + Ausentes hoy / Próximas */}
      <div className="vac-grid-2">
        <div className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Solicitudes pendientes</h3>
              <div className="card__sub">requieren aprobación del líder o RR.HH.</div>
            </div>
            <button className="btn btn--ghost btn--sm" onClick={() => onGoTo('solicitudes')}>
              Ver todas <Icon name="arrow" size={12} />
            </button>
          </div>
          <div className="card__body--flush">
            {pendientes.length === 0 && (
              <div className="empty" style={{ padding: '40px 20px' }}>
                <Icon name="checkCircle" size={26} style={{ color: 'var(--success)' }} />
                <p style={{ marginTop: 10, fontWeight: 600 }}>Todo al día</p>
                <p style={{ fontSize: 13 }}>No hay solicitudes pendientes.</p>
              </div>
            )}
            {pendientes.slice(0, 5).map(s => {
              const emp = findEmp(s.empId)
              if (!emp) return null
              return (
                <div key={s.id} className="vac-req-row" onClick={() => onOpenRequest(s)} style={{ cursor: 'pointer' }}>
                  <VacAvatar emp={emp} />
                  <div className="vac-req-meta">
                    <div className="vac-req-line1">
                      <span className="vac-req-name">{emp.name}</span>
                      <TipoChip tipoId={s.tipo} />
                      <span className="vac-chip">{s.nivel === 'rrhh' ? 'RR.HH.' : 'Líder'}</span>
                    </div>
                    <div className="vac-req-dates">
                      {fmtDate(s.desde)} → {fmtDate(s.hasta)} · {s.dias}d · solicitada {fmtDate(s.solicitada)}
                    </div>
                  </div>
                  <Icon name="chevron" size={16} style={{ color: 'var(--fg-muted)', flexShrink: 0 }} />
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="card">
            <div className="card__header">
              <h3 className="card__title">Ausentes hoy</h3>
              <span className="vac-chip">{fmtDate(TODAY)}</span>
            </div>

            <div className="card__body--flush">
              {ausenciasHoy.length === 0 && (
                <div style={{ padding: '20px 18px', color: 'var(--fg-muted)', fontSize: 13 }}>Sin ausencias hoy.</div>
              )}
              {ausenciasHoy.map(s => {
                const emp = findEmp(s.empId)
                if (!emp) return null
                return (
                  <div key={s.id} className="vac-req-row" style={{ padding: '10px 16px' }}>
                    <VacAvatar emp={emp} size="sm" />
                    <div className="vac-req-meta">
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{emp.name}</div>
                      <div className="vac-req-dates">Regresa {fmtDate(addDays(s.hasta, 1))}</div>
                    </div>
                    <TipoChip tipoId={s.tipo} />
                  </div>
                )
              })}
            </div>
          </div>

          <div className="card">
            <div className="card__header">
              <h3 className="card__title">Próximas ausencias</h3>
              <button className="btn btn--ghost btn--sm" onClick={() => onGoTo('calendario')}>Calendario</button>
            </div>
            <div className="card__body--flush">
              {proximas.map(s => {
                const emp = findEmp(s.empId)
                if (!emp) return null
                return (
                  <div key={s.id} className="vac-req-row" style={{ padding: '10px 16px' }}>
                    <VacAvatar emp={emp} size="sm" />
                    <div className="vac-req-meta">
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{emp.name}</div>
                      <div className="vac-req-dates">{fmtDate(s.desde)} → {fmtDate(s.hasta)} · {s.dias}d</div>
                    </div>
                    <TipoChip tipoId={s.tipo} />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Saldos + Por vencer */}
      <div className="vac-grid-2">
        <div className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Saldos del equipo</h3>
              <div className="card__sub">Transformación Digital</div>
            </div>
            <button className="btn btn--ghost btn--sm" onClick={() => onGoTo('empleados')}>Ver todos</button>
          </div>
          <div className="card__body--flush">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Colaborador</th>
                  <th>Saldo</th>
                  <th style={{ textAlign: 'right' }}>Disponible</th>
                </tr>
              </thead>
              <tbody>
                {empList.filter(e => e.area === 'td').map(emp => {
                  const dispo   = calcDisponible(emp)
                  const sinAnio = !cumplioPrimerAnio(emp) && !!emp.ingreso
                  return (
                    <tr key={emp.id} onClick={() => onGoTo('empleado-detalle', emp.id)} style={{ cursor: 'pointer' }}>
                      <td><EmpCell emp={emp} sub={false} /></td>
                      <td>
                        <SaldoBar total={emp.saldoTotal} tomados={emp.tomados} pendientes={emp.pendientes} />
                        <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 4 }}>
                          {emp.tomados} tomados · {emp.pendientes} pendientes
                          {sinAnio && <span style={{ color: 'var(--warning)', marginLeft: 4 }}>(adelanto)</span>}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: dispo < 0 ? 'var(--danger)' : 'var(--fg)' }}>{dispo}d</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Por vencer</h3>
              <div className="card__sub">días que prescriben pronto</div>
            </div>
          </div>
          <div className="card__body--flush">
            {vencen.map(emp => {
              const dispo = calcDisponible(emp)
              return (
                <div key={emp.id} className="vac-req-row" onClick={() => onGoTo('empleado-detalle', emp.id)} style={{ cursor: 'pointer' }}>
                  <VacAvatar emp={emp} size="sm" />
                  <div className="vac-req-meta">
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{emp.name}</div>
                    <div className="vac-req-dates">{dispo} días por vencer en agosto 2026</div>
                  </div>
                  <span className="vac-chip vac-chip--pendiente" style={{ gap: 4, fontSize: 11 }}>
                    <Icon name="alert" size={10} /> Crítico
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
