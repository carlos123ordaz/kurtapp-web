import React, { useMemo } from 'react'
import type { LineItem, AnexoState, AnexoRow } from '../types'
import { HH_TARIFFS, SEED_ANNEX } from '../data/cotizacionesData'
import { I, CotBtn, CotBadge, CotField, CotInput, fmtMoney } from './CotShared'

interface Props {
  lines: LineItem[]
  anexos: Record<string, AnexoState>
  setAnexos: (a: Record<string, AnexoState>) => void
  activeAnexoLineId: string | null
  setActiveAnexoLineId: (id: string | null) => void
}

function newAnnex(): AnexoState {
  return JSON.parse(JSON.stringify(SEED_ANNEX))
}

type AnexoGroup = 'logistica' | 'subcontratos' | 'materiales'
const UNIDAD_OPTS: Record<AnexoGroup, string[]> = {
  logistica:     ['pax', 'día', 'noche', 'glb', 'km', 'vuelo'],
  subcontratos:  ['glb', 'servicio', 'día'],
  materiales:    ['glb', 'und', 'm', 'kg', 'l'],
}

export function ScreenAnexo({ lines, anexos, setAnexos, activeAnexoLineId, setActiveAnexoLineId }: Props) {
  const svcLines = lines.filter((l) => l.hasAnexo)
  const activeId = activeAnexoLineId ?? svcLines[0]?.id ?? null
  const line     = lines.find((l) => l.id === activeId) ?? null
  const annex    = activeId ? (anexos[activeId] ?? newAnnex()) : null

  const updateAnnex = (patch: Partial<AnexoState>) => {
    if (!activeId) return
    setAnexos({ ...anexos, [activeId]: { ...(annex ?? newAnnex()), ...patch } })
  }

  const updateRow = (group: AnexoGroup, rowId: string, k: keyof AnexoRow, v: any) => {
    if (!annex) return
    const next = annex[group].map((r) => r.id === rowId ? { ...r, [k]: v } : r)
    updateAnnex({ [group]: next })
  }

  const addRow = (group: AnexoGroup) => {
    if (!annex) return
    const id = group.slice(0, 2) + Math.random().toString(36).slice(2, 6)
    updateAnnex({ [group]: [...annex[group], { id, concepto: '', cant: 1, unidad: 'glb', costo: 0, notas: '' }] })
  }

  const removeRow = (group: AnexoGroup, rowId: string) => {
    if (!annex) return
    updateAnnex({ [group]: annex[group].filter((r) => r.id !== rowId) })
  }

  const updateHH = (nivel: string, dia: string, v: number) => {
    if (!annex) return
    updateAnnex({ hh: { ...annex.hh, [nivel]: { ...annex.hh[nivel as keyof typeof annex.hh], [dia]: v } } })
  }

  const sumGroup = (group: AnexoGroup) =>
    annex ? annex[group].reduce((a, r) => a + (r.cant || 0) * (r.costo || 0), 0) : 0

  const hhBreakdown = useMemo(() => {
    if (!annex) return { rows: [], total: 0 }
    let total = 0
    const rows: { nivel: string; dia: string; hrs: number; tarifa: number; cost: number }[] = []
    Object.entries(annex.hh).forEach(([nivel, days]) => {
      Object.entries(days).forEach(([dia, hrs]) => {
        const tarifa = (HH_TARIFFS[nivel] as any)[dia] ?? 0
        const cost = (hrs || 0) * tarifa
        if (hrs > 0) rows.push({ nivel, dia, hrs, tarifa, cost })
        total += cost
      })
    })
    return { rows, total }
  }, [annex])

  const totalLogistica  = sumGroup('logistica')
  const totalSub        = sumGroup('subcontratos')
  const totalMateriales = sumGroup('materiales')
  const costoTotal      = totalLogistica + totalSub + totalMateriales + hhBreakdown.total
  const utilObj         = annex?.utilidadObjetivo ?? 28
  const precioVenta     = costoTotal > 0 ? costoTotal / (1 - utilObj / 100) : 0
  const utilidadMonto   = precioVenta - costoTotal

  const NIVEL_LABELS: Record<string, string> = {
    normal: 'Normal', intermedio: 'Intermedio', especializado: 'Especializado',
  }
  const NIVEL_DESC: Record<string, string> = {
    normal: 'Técnico de campo · soporte general',
    intermedio: 'Ingeniero junior · puesta en marcha',
    especializado: 'Especialista certificado de fábrica',
  }

  if (!line || !annex) {
    return (
      <div className="cot-screen">
        <div className="cot-anexo-empty cot-card">
          <I.tools size={36}/>
          <h3>Sin servicios para presupuestar</h3>
          <p>Agrega un ítem de servicios en la pestaña Líneas y pulsa "Anexo" para abrir su presupuesto detallado.</p>
        </div>
      </div>
    )
  }

  const ccy = line.currency

  return (
    <div className="cot-screen">
      {/* Service line tabs */}
      {svcLines.length > 1 && (
        <div className="cot-anexo-tabs">
          {svcLines.map((sl) => (
            <button key={sl.id} className={`cot-anexo-tab ${sl.id === activeId ? 'is-on' : ''}`}
                    onClick={() => setActiveAnexoLineId(sl.id)}>
              <I.tools size={13}/>
              <span>{sl.description.split('—')[1]?.trim() || sl.description}</span>
              <span className="mono" style={{ fontSize: 11, color: '#71717a' }}>{sl.sku}</span>
            </button>
          ))}
        </div>
      )}

      <div className="cot-screen-cols">
        <div className="cot-screen-main">

          {/* Header card */}
          <section className="cot-card cot-anexo-head-card">
            <div className="cot-anexo-head">
              <div className="cot-anexo-head-icon"><I.tools size={20}/></div>
              <div className="cot-anexo-head-body">
                <div className="cot-anexo-head-eyebrow">
                  Línea {String(lines.findIndex(x => x.id === activeId) + 1).padStart(2, '0')} · Anexo de servicio
                </div>
                <h3 className="cot-anexo-head-name">{line.description}</h3>
                <div className="cot-anexo-head-meta">
                  <span className="mono">{line.sku}</span>
                  <span>· Cantidad {line.qty}</span>
                  <span>· {line.currency}</span>
                  <CotBadge kind="amber">Anexo X</CotBadge>
                </div>
              </div>
              <div className="cot-anexo-kpis">
                <div className="cot-kpi">
                  <div className="cot-kpi-lbl">Costo total</div>
                  <div className="cot-kpi-val mono">{fmtMoney(costoTotal, ccy)}</div>
                </div>
                <div className="cot-kpi">
                  <div className="cot-kpi-lbl">Precio de venta</div>
                  <div className="cot-kpi-val mono cot-kpi-accent">{fmtMoney(precioVenta, ccy)}</div>
                </div>
                <div className="cot-kpi">
                  <div className="cot-kpi-lbl">Utilidad ({utilObj}%)</div>
                  <div className="cot-kpi-val mono">{fmtMoney(utilidadMonto, ccy)}</div>
                </div>
              </div>
            </div>
          </section>

          {/* Logística */}
          <AnexoSection title="Logística" subtitle="Viajes, movilidad, hospedaje y viáticos del personal."
                        total={totalLogistica} currency={ccy} onAdd={() => addRow('logistica')}
                        utilPct={costoTotal > 0 ? (totalLogistica / costoTotal) * 100 : 0}>
            <AnexoTable rows={annex.logistica} group="logistica" onChange={updateRow} onRemove={removeRow}
                        unidadOptions={UNIDAD_OPTS.logistica}/>
          </AnexoSection>

          {/* Sub-contratos */}
          <AnexoSection title="Sub-contratos" subtitle="Servicios tercerizados (grúas, andamios, certificaciones especiales)."
                        total={totalSub} currency={ccy} onAdd={() => addRow('subcontratos')}
                        utilPct={costoTotal > 0 ? (totalSub / costoTotal) * 100 : 0}>
            <AnexoTable rows={annex.subcontratos} group="subcontratos" onChange={updateRow} onRemove={removeRow}
                        unidadOptions={UNIDAD_OPTS.subcontratos}/>
          </AnexoSection>

          {/* Materiales */}
          <AnexoSection title="Materiales y consumibles" subtitle="Patrones, kits, consumibles e EPP específicos del servicio."
                        total={totalMateriales} currency={ccy} onAdd={() => addRow('materiales')}
                        utilPct={costoTotal > 0 ? (totalMateriales / costoTotal) * 100 : 0}>
            <AnexoTable rows={annex.materiales} group="materiales" onChange={updateRow} onRemove={removeRow}
                        unidadOptions={UNIDAD_OPTS.materiales}/>
          </AnexoSection>

          {/* Horas-hombre */}
          <section className="cot-card">
            <header className="cot-card-hd">
              <div>
                <h3 className="cot-card-title">Horas-hombre</h3>
                <p className="cot-card-sub">Distribuye horas por nivel técnico y tipo de día. Las tarifas son fijas por catálogo.</p>
              </div>
              <div className="cot-sect-tools">
                <span>Aporte</span>
                <b className="mono" style={{ fontSize: 12 }}>
                  {costoTotal > 0 ? `${((hhBreakdown.total / costoTotal) * 100).toFixed(0)}%` : '—'}
                </b>
              </div>
            </header>
            <div className="cot-hh-wrap">
              <table className="cot-hh-grid">
                <thead>
                  <tr>
                    <th>Nivel técnico</th>
                    <th>Tarifa USD/h</th>
                    <th>Día laboral</th>
                    <th>Sábado</th>
                    <th>Domingo / Feriado</th>
                    <th style={{ textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(HH_TARIFFS).map(([nivel, tarifas]) => {
                    const hrs = annex.hh[nivel as keyof typeof annex.hh]
                    const sub = (hrs.laboral || 0) * tarifas.laboral + (hrs.sabado || 0) * tarifas.sabado + (hrs.domingo || 0) * tarifas.domingo
                    return (
                      <tr key={nivel}>
                        <td>
                          <div className="cot-hh-nivel-name">{NIVEL_LABELS[nivel]}</div>
                          <div className="cot-hh-nivel-desc">{NIVEL_DESC[nivel]}</div>
                        </td>
                        <td>
                          <div className="cot-hh-tarifa">L · ${tarifas.laboral}</div>
                          <div className="cot-hh-tarifa">S · ${tarifas.sabado}</div>
                          <div className="cot-hh-tarifa">D · ${tarifas.domingo}</div>
                        </td>
                        {(['laboral', 'sabado', 'domingo'] as const).map((dia) => (
                          <td key={dia}>
                            <div className="cot-hh-input-wrap">
                              <input className="cot-hh-input" type="number" min="0"
                                     value={(hrs as any)[dia]}
                                     onChange={(e) => updateHH(nivel, dia, parseFloat(e.target.value) || 0)}/>
                              <span className="cot-hh-sfx">h</span>
                            </div>
                            <div className="cot-hh-sub mono">{fmtMoney(((hrs as any)[dia] || 0) * tarifas[dia], 'US$')}</div>
                          </td>
                        ))}
                        <td className="cot-hh-subt">{fmtMoney(sub, 'US$')}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5} style={{ padding: '10px 12px', color: '#71717a', fontSize: 12 }}>Total horas-hombre</td>
                    <td className="cot-hh-subt" style={{ fontWeight: 700 }}>{fmtMoney(hhBreakdown.total, 'US$')}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {/* Cálculo precio venta */}
          <section className="cot-card">
            <header className="cot-card-hd">
              <div>
                <h3 className="cot-card-title">Cálculo del precio de venta</h3>
                <p className="cot-card-sub">El precio se calcula automáticamente a partir del costo y la utilidad objetivo.</p>
              </div>
            </header>
            <div className="cot-card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16, alignItems: 'start' }}>
                <CotField label="Utilidad objetivo" span={6}>
                  <CotInput value={annex.utilidadObjetivo} mono
                             onChange={(v) => updateAnnex({ utilidadObjetivo: parseFloat(v) || 0 })}
                             suffix="%"/>
                </CotField>
                <div className="cot-pricing-formula">
                  <div className="cot-pf-row"><span>Costo total</span><b>{fmtMoney(costoTotal, ccy)}</b></div>
                  <div className="cot-pf-row"><span>+ Utilidad ({utilObj}%)</span><b>{fmtMoney(utilidadMonto, ccy)}</b></div>
                  <div className="cot-pf-row cot-pf-row-total"><span>Precio de venta</span><b>{fmtMoney(precioVenta, ccy)}</b></div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Aside */}
        <aside className="cot-screen-aside">
          <div className="cot-aside-card">
            <div className="cot-aside-hd">Composición del costo</div>
            <CostBar parts={[
              { lbl: 'Logística',     val: totalLogistica,   color: '#0F766E' },
              { lbl: 'Sub-contratos', val: totalSub,         color: '#0891b2' },
              { lbl: 'Materiales',    val: totalMateriales,  color: '#7c3aed' },
              { lbl: 'Horas-hombre',  val: hhBreakdown.total, color: '#c2410c' },
            ]} total={costoTotal} currency={ccy}/>
            <div className="cot-aside-divider"/>
            <div className="cot-aside-rows">
              <div className="cot-aside-row"><span>Logística</span><b className="mono">{fmtMoney(totalLogistica, ccy)}</b></div>
              <div className="cot-aside-row"><span>Sub-contratos</span><b className="mono">{fmtMoney(totalSub, ccy)}</b></div>
              <div className="cot-aside-row"><span>Materiales</span><b className="mono">{fmtMoney(totalMateriales, ccy)}</b></div>
              <div className="cot-aside-row"><span>Horas-hombre</span><b className="mono">{fmtMoney(hhBreakdown.total, ccy)}</b></div>
            </div>
            <div className="cot-aside-divider"/>
            <div className="cot-aside-row cot-aside-row-total"><span>Costo total</span><b className="mono">{fmtMoney(costoTotal, ccy)}</b></div>
            <div className="cot-aside-row cot-aside-row-accent"><span>Precio de venta</span><b className="mono">{fmtMoney(precioVenta, ccy)}</b></div>
            <div className="cot-aside-row"><span>Utilidad {utilObj}%</span><b className="mono">{fmtMoney(utilidadMonto, ccy)}</b></div>
            <div className="cot-aside-divider"/>
            <div className="cot-aside-help">
              <I.info size={14}/>
              <div>El <b>precio de venta</b> calculado aquí actualiza el precio de la línea <span className="mono">{line.sku}</span> en la pestaña Líneas.</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

// ─── AnexoSection ─────────────────────────────────────────────────────────────

function AnexoSection({ title, subtitle, total, currency, onAdd, utilPct, children }: {
  title: string; subtitle: string; total: number; currency: string
  onAdd: () => void; utilPct: number; children: React.ReactNode
}) {
  return (
    <section className="cot-card">
      <header className="cot-card-hd">
        <div>
          <h3 className="cot-card-title">{title}</h3>
          <p className="cot-card-sub">{subtitle}</p>
        </div>
        <div className="cot-sect-tools">
          <div className="cot-sect-total">
            <span>Subtotal</span>
            <b>{fmtMoney(total, currency)}</b>
            {utilPct > 0 && <span style={{ color: '#71717a', fontSize: 11 }}>· {utilPct.toFixed(0)}%</span>}
          </div>
          <CotBtn kind="ghost" size="sm" icon={I.plus} onClick={onAdd}>Agregar</CotBtn>
        </div>
      </header>
      {children}
    </section>
  )
}

// ─── AnexoTable ───────────────────────────────────────────────────────────────

function AnexoTable({ rows, group, onChange, onRemove, unidadOptions }: {
  rows: AnexoRow[]
  group: AnexoGroup
  onChange: (group: AnexoGroup, rowId: string, k: keyof AnexoRow, v: any) => void
  onRemove: (group: AnexoGroup, rowId: string) => void
  unidadOptions: string[]
}) {
  return (
    <div className="cot-atbl">
      <div className="cot-atbl-row cot-atbl-head">
        <div>Concepto</div>
        <div>Cantidad</div>
        <div>Unidad</div>
        <div>Costo unit.</div>
        <div>Subtotal</div>
        <div>Notas</div>
        <div/>
      </div>
      {rows.map((r) => (
        <div className="cot-atbl-row" key={r.id}>
          <div>
            <input className="cot-atbl-input" value={r.concepto}
                   onChange={(e) => onChange(group, r.id, 'concepto', e.target.value)}
                   placeholder="Describe el concepto…"/>
          </div>
          <div>
            <input className="cot-atbl-input" type="number" value={r.cant}
                   style={{ textAlign: 'right', fontFamily: 'var(--cot-font-mono)' }}
                   onChange={(e) => onChange(group, r.id, 'cant', parseFloat(e.target.value) || 0)}/>
          </div>
          <div>
            <select className="cot-atbl-sel" value={r.unidad}
                    onChange={(e) => onChange(group, r.id, 'unidad', e.target.value)}>
              {unidadOptions.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <input className="cot-atbl-input" type="number" value={r.costo}
                   style={{ textAlign: 'right', fontFamily: 'var(--cot-font-mono)' }}
                   onChange={(e) => onChange(group, r.id, 'costo', parseFloat(e.target.value) || 0)}/>
          </div>
          <div className="cot-atbl-subt">{fmtMoney((r.cant || 0) * (r.costo || 0), 'US$')}</div>
          <div>
            <input className="cot-atbl-input" value={r.notas}
                   onChange={(e) => onChange(group, r.id, 'notas', e.target.value)}
                   placeholder="—"/>
          </div>
          <div>
            <button className="cot-lr-act-btn" onClick={() => onRemove(group, r.id)}><I.trash size={13}/></button>
          </div>
        </div>
      ))}
      {rows.length === 0 && <div className="cot-atbl-empty">Sin ítems. Pulsa "Agregar" para iniciar.</div>}
    </div>
  )
}

// ─── CostBar ──────────────────────────────────────────────────────────────────

function CostBar({ parts, total, currency }: {
  parts: { lbl: string; val: number; color: string }[]
  total: number
  currency: string
}) {
  return (
    <div className="cot-cost-bar-wrap">
      <div className="cot-cost-bar">
        {parts.map((p) => {
          const w = total > 0 ? (p.val / total) * 100 : 0
          return (
            <div key={p.lbl} className="cot-cost-bar-seg"
                 style={{ width: `${w}%`, background: p.color }}
                 title={`${p.lbl} · ${fmtMoney(p.val, currency)}`}/>
          )
        })}
      </div>
      <div className="cot-cost-bar-legend">
        {parts.map((p) => (
          <div key={p.lbl} className="cot-cost-bar-row">
            <span className="cot-cost-bar-dot" style={{ background: p.color }}/>
            <span>{p.lbl}</span>
            <span>{total > 0 ? `${((p.val / total) * 100).toFixed(0)}%` : '—'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
