import { useState, useMemo } from 'react'
import type { LineItem, HeaderState, AnexoState } from '../types'
import { DEPARTMENTS } from '../data/cotizacionesData'
import { brandById } from '../data/cotizacionesData'
import {
  I, CotBtn, CotBadge, BrandChip, fmtMoney, lineMath,
} from './CotShared'

interface Props {
  lines: LineItem[]
  header: HeaderState
  anexos: Record<string, AnexoState>
}

function toOfferCurrency(v: number, ccy: string, moneda: string, tcEur: number, tcUsd: number): number {
  if (moneda === ccy) return v
  if (moneda === 'US$' && ccy === 'EUR') return v * tcEur
  if (moneda === 'EUR' && ccy === 'US$') return v / tcEur
  if (moneda === 'S/.' && ccy === 'US$') return v * tcUsd
  if (moneda === 'S/.' && ccy === 'EUR') return v * tcEur * tcUsd
  if (moneda === 'US$' && ccy === 'S/.') return v / tcUsd
  if (moneda === 'EUR' && ccy === 'S/.') return v / (tcEur * tcUsd)
  return v
}

export function ScreenResumen({ lines, header }: Props) {
  const defaultCondiciones = `1. Validez de la oferta: ${header.validez || 30} días calendario desde la fecha de emisión.
2. Forma de pago: ${header.condPago || '50% adelanto contra orden de compra, 50% contra entrega'}.
3. Plazo de entrega: ${header.condEntrega || '8 a 12 semanas desde la confirmación'}.
4. Lugar de entrega: ${header.condLugar || 'Almacén Corsusa Lima'}.
5. Garantía: 12 meses desde la fecha de instalación, contra defectos de fabricación.
6. Precios expresados en ${header.moneda}, sin incluir IGV (18%).
7. Tipo de cambio referencial: 1 EUR = ${header.tcEur} USD · 1 USD = S/ ${header.tcUsd}.
8. Condiciones particulares para servicios técnicos según Anexo adjunto.`

  const [condiciones, setCondiciones] = useState(defaultCondiciones)
  const [copied, setCopied] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)

  const tcEur = parseFloat(String(header.tcEur)) || 1.08
  const tcUsd = parseFloat(String(header.tcUsd)) || 3.78

  const byBrand = useMemo(() => {
    const m: Record<string, { brand: ReturnType<typeof brandById>, lines: LineItem[], total: number, count: number }> = {}
    lines.forEach((l) => {
      const lm = lineMath(l)
      if (!lm) return
      const b = l.brand_code
      if (!m[b]) m[b] = { brand: brandById(b)!, lines: [], total: 0, count: 0 }
      m[b].lines.push(l)
      m[b].total += toOfferCurrency(lm.finalTotal, l.currency, header.moneda, tcEur, tcUsd)
      m[b].count++
    })
    return Object.values(m).sort((a, z) => z.total - a.total)
  }, [lines, header.moneda, tcEur, tcUsd])

  const byDept = useMemo(() => {
    const m: Record<string, { dept: string, total: number, count: number }> = {}
    lines.forEach((l) => {
      const lm = lineMath(l)
      if (!lm) return
      const brand = brandById(l.brand_code)
      const d = brand?.dept ?? 'GEN'
      if (!m[d]) m[d] = { dept: d, total: 0, count: 0 }
      m[d].total += toOfferCurrency(lm.finalTotal, l.currency, header.moneda, tcEur, tcUsd)
      m[d].count++
    })
    return Object.values(m).sort((a, z) => z.total - a.total)
  }, [lines, header.moneda, tcEur, tcUsd])

  const subtotal = byBrand.reduce((a, b) => a + b.total, 0)
  const igv = subtotal * 0.18
  const total = subtotal + igv

  const copyCode = () => {
    navigator.clipboard?.writeText(header.offerNo)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const nextRev = () => {
    const n = parseInt(header.rev.replace('Rev.', '')) + 1
    return `Rev.${n}`
  }

  return (
    <div className="cot-screen">
      <div className="cot-screen-cols">
        <div className="cot-screen-main">

          {/* Hero */}
          <section className="cot-card cot-resumen-hero">
            <div className="cot-rh-left">
              <div className="cot-rh-eyebrow">Cotización</div>
              <div className="cot-rh-offer mono">{header.offerNo || '—'}</div>
              <div className="cot-rh-meta">
                <span>{header.rev}</span>
                <span className="cot-dot-sep">·</span>
                <span>{header.fecha}</span>
                <span className="cot-dot-sep">·</span>
                <span>{header.tipoOferta}</span>
              </div>
              <div className="cot-rh-client">
                <I.user size={14}/>
                <div>
                  <div className="cot-rh-client-name">{header.cliente || 'Sin cliente'}</div>
                  <div className="cot-rh-client-sub">RUC {header.ruc} · {header.tipoCliente}</div>
                </div>
              </div>
            </div>
            <div className="cot-rh-right">
              <div className="cot-rh-total-lbl">Total general · {header.moneda}</div>
              <div className="cot-rh-total mono">{fmtMoney(total, header.moneda)}</div>
              <div className="cot-rh-breakdown">
                <span>Subtotal <b className="mono">{fmtMoney(subtotal, header.moneda)}</b></span>
                <span>IGV 18% <b className="mono">{fmtMoney(igv, header.moneda)}</b></span>
              </div>
            </div>
          </section>

          {/* By brand */}
          <section className="cot-card">
            <header className="cot-card-hd">
              <div>
                <h3 className="cot-card-title">Sub-total por marca</h3>
                <p className="cot-card-sub">Agrupado por fabricante para revisión rápida del mix.</p>
              </div>
            </header>
            <div className="cot-resumen-table">
              <div className="cot-rt-row cot-rt-head">
                <div>Marca</div>
                <div>Departamento</div>
                <div style={{ textAlign: 'center' }}>Líneas</div>
                <div>Participación</div>
                <div style={{ textAlign: 'right' }}>Sub-total {header.moneda}</div>
              </div>
              {byBrand.map((g) => {
                const share = subtotal > 0 ? (g.total / subtotal) * 100 : 0
                return (
                  <div className="cot-rt-row" key={g.brand?.id ?? g.lines[0]?.brand_code}>
                    <div>
                      {g.brand
                        ? <BrandChip brandId={g.brand?.id ?? ''} size="md"/>
                        : <span className="mono" style={{ fontSize: 12 }}>{g.lines[0]?.brand_code}</span>
                      }
                    </div>
                    <div>
                      <CotBadge kind="neutral">{g.brand?.dept ?? '—'}</CotBadge>
                    </div>
                    <div style={{ textAlign: 'center' }} className="mono">{g.count}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div className="cot-share-bar">
                        <div className="cot-share-fill"
                             style={{ width: `${share}%`, background: g.brand?.color ?? 'var(--cot-accent)' }}/>
                      </div>
                      <span className="mono cot-share-pct">{share.toFixed(1)}%</span>
                    </div>
                    <div style={{ textAlign: 'right' }} className="mono">{fmtMoney(g.total, header.moneda)}</div>
                  </div>
                )
              })}
              {byBrand.length === 0 && (
                <div className="cot-rt-row" style={{ color: 'var(--cot-fg-mute)', fontStyle: 'italic', fontSize: 13 }}>
                  <div>Sin líneas añadidas</div>
                  <div/><div/><div/>
                  <div style={{ textAlign: 'right' }}>{fmtMoney(0, header.moneda)}</div>
                </div>
              )}
              <div className="cot-rt-row cot-rt-total">
                <div>Sub-total</div>
                <div/>
                <div style={{ textAlign: 'center' }} className="mono">{lines.length}</div>
                <div/>
                <div style={{ textAlign: 'right' }} className="mono">{fmtMoney(subtotal, header.moneda)}</div>
              </div>
              <div className="cot-rt-row cot-rt-igv">
                <div>IGV (18%)</div>
                <div/><div/><div/>
                <div style={{ textAlign: 'right' }} className="mono">{fmtMoney(igv, header.moneda)}</div>
              </div>
              <div className="cot-rt-row cot-rt-grand">
                <div>Total general</div>
                <div/><div/><div/>
                <div style={{ textAlign: 'right' }} className="mono">{fmtMoney(total, header.moneda)}</div>
              </div>
            </div>
          </section>

          {/* By department */}
          <section className="cot-card">
            <header className="cot-card-hd">
              <div>
                <h3 className="cot-card-title">Sub-total por departamento</h3>
                <p className="cot-card-sub">Distribución por unidad de negocio para cierre comercial.</p>
              </div>
            </header>
            <div className="cot-dept-grid">
              {byDept.map((d) => {
                const share = subtotal > 0 ? (d.total / subtotal) * 100 : 0
                const dInfo = DEPARTMENTS.find((dd) => dd.id === d.dept)
                return (
                  <div className="cot-dept-card" key={d.dept}>
                    <div className="cot-dept-card-hd">
                      <div className="cot-dept-tag">{d.dept}</div>
                      <span className="mono" style={{ fontSize: 12, color: 'var(--cot-fg-mute)' }}>{share.toFixed(1)}%</span>
                    </div>
                    <div className="cot-dept-name">{dInfo?.desc || ''}</div>
                    <div className="cot-dept-amt mono">{fmtMoney(d.total, header.moneda)}</div>
                    <div className="cot-dept-foot">
                      <span style={{ fontSize: 12, color: 'var(--cot-fg-mute)' }}>{d.count} línea{d.count !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                )
              })}
              {byDept.length === 0 && (
                <div style={{ gridColumn: '1/-1', color: 'var(--cot-fg-mute)', fontStyle: 'italic', fontSize: 13, padding: '12px 0' }}>
                  Sin departamentos calculados.
                </div>
              )}
            </div>
          </section>

          {/* Condiciones comerciales */}
          <section className="cot-card">
            <header className="cot-card-hd">
              <div>
                <h3 className="cot-card-title">Condiciones comerciales</h3>
                <p className="cot-card-sub">Texto que aparece al pie de la cotización exportada.</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <CotBtn kind="ghost" size="sm" icon={I.bolt}>Plantilla</CotBtn>
                <CotBtn kind="ghost" size="sm" onClick={() => setCondiciones(defaultCondiciones)}>Restaurar</CotBtn>
              </div>
            </header>
            <div className="cot-card-body">
              <textarea
                className="cot-cond-ta"
                value={condiciones}
                onChange={(e) => setCondiciones(e.target.value)}
                rows={9}
              />
              <div className="cot-cond-foot">
                <I.info size={13}/>
                <span>Los valores entre paréntesis se resuelven dinámicamente al exportar (moneda, tipo de cambio, validez).</span>
              </div>
            </div>
          </section>

        </div>

        {/* Right aside */}
        <aside className="cot-screen-aside">
          <div className="cot-aside-card">
            <div className="cot-aside-hd">Exportar y compartir</div>

            <div className="cot-bitrix-state">
              <span className="cot-bitrix-dot"/>
              <div>
                <div className="cot-bitrix-l1">Bitrix24 · Deal sincronizado</div>
                <div className="cot-bitrix-l2">{header.offerNo}</div>
              </div>
            </div>
            <button
              className={`cot-copy-btn${copied ? ' is-copied' : ''}`}
              onClick={copyCode}
            >
              {copied
                ? <><I.check size={13}/><span>Copiado al portapapeles</span></>
                : <><I.copy size={13}/><span>Copiar código de cotización</span></>
              }
            </button>

            <div className="cot-aside-divider"/>

            <div className="cot-export-actions">
              <button className="cot-export-btn cot-export-primary" onClick={() => setExportOpen(true)}>
                <I.download size={16}/>
                <div>
                  <div className="cot-export-btn-l1">Exportar oferta</div>
                  <div className="cot-export-btn-l2">PDF, Excel o copia HTML</div>
                </div>
                <I.chevR size={14} style={{ marginLeft: 'auto', opacity: 0.5 }}/>
              </button>
              <button className="cot-export-btn">
                <I.sync size={16}/>
                <div>
                  <div className="cot-export-btn-l1">Enviar a Bitrix24</div>
                  <div className="cot-export-btn-l2">Adjuntar al deal y notificar</div>
                </div>
                <I.chevR size={14} style={{ marginLeft: 'auto', opacity: 0.5 }}/>
              </button>
              <button className="cot-export-btn">
                <I.link size={16}/>
                <div>
                  <div className="cot-export-btn-l1">Enlace seguro</div>
                  <div className="cot-export-btn-l2">Compartir con expiración</div>
                </div>
                <I.chevR size={14} style={{ marginLeft: 'auto', opacity: 0.5 }}/>
              </button>
            </div>

            <div className="cot-aside-divider"/>

            <div className="cot-aside-hd">Resumen rápido</div>
            <div className="cot-aside-rows">
              <div className="cot-aside-row"><span>Líneas</span><b className="mono">{lines.length}</b></div>
              <div className="cot-aside-row"><span>Marcas</span><b className="mono">{byBrand.length}</b></div>
              <div className="cot-aside-row"><span>Departamentos</span><b className="mono">{byDept.length}</b></div>
              <div className="cot-aside-row"><span>Servicios (Anexo)</span><b className="mono">{lines.filter((l) => l.hasAnexo).length}</b></div>
              <div className="cot-aside-row" style={{ background: 'var(--cot-accent-soft)', borderRadius: 6, padding: '4px 8px' }}>
                <span style={{ fontWeight: 600 }}>Total</span>
                <b className="mono" style={{ color: 'var(--cot-accent)' }}>{fmtMoney(total, header.moneda)}</b>
              </div>
            </div>

            <div className="cot-aside-divider"/>
            <div className="cot-aside-help">
              <I.shield size={14}/>
              <div>Al exportar, la cotización queda <b>versionada</b>: cualquier cambio posterior genera <b>{nextRev()}</b>.</div>
            </div>
          </div>
        </aside>
      </div>

      {/* Export modal */}
      {exportOpen && (
        <div className="cot-scrim" onClick={() => setExportOpen(false)}>
          <div className="cot-modal cot-modal-md" onClick={(e) => e.stopPropagation()}>
            <header className="cot-modal-hd">
              <div>
                <h3 className="cot-modal-title">Exportar cotización</h3>
                <p className="cot-modal-sub">Elige formato y configuración antes de generar el archivo.</p>
              </div>
              <button className="cot-btn cot-btn-ghost cot-btn-icon" onClick={() => setExportOpen(false)}>
                <I.x size={16}/>
              </button>
            </header>
            <div className="cot-modal-body">
              <div className="cot-export-grid">
                {[
                  { k: 'pdf', name: 'PDF profesional', desc: 'Listo para enviar al cliente, con portada y anexos.', size: '~2 páginas + anexos' },
                  { k: 'xls', name: 'Excel detallado', desc: 'Una fila por línea, con SPK, descuentos y márgenes.', size: '1 hoja por marca' },
                  { k: 'doc', name: 'Word editable', desc: 'Para personalizar manualmente antes de enviar.', size: 'Plantilla Corsusa' },
                  { k: 'html', name: 'HTML para mail', desc: 'Tabla limpia para pegar en cuerpo de correo.', size: 'Estilos inline' },
                ].map((opt) => (
                  <button key={opt.k} className="cot-export-opt">
                    <div className="cot-export-opt-ic"><I.doc size={18}/></div>
                    <div className="cot-export-opt-body">
                      <div className="cot-export-opt-name">{opt.name}</div>
                      <div className="cot-export-opt-desc">{opt.desc}</div>
                      <div className="cot-export-opt-size">{opt.size}</div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="cot-export-opts-row">
                <label className="cot-chk-row"><input type="checkbox" defaultChecked/> Incluir anexos de servicio detallados</label>
                <label className="cot-chk-row"><input type="checkbox" defaultChecked/> Mostrar precios netos (con descuentos aplicados)</label>
                <label className="cot-chk-row"><input type="checkbox"/> Incluir márgenes y utilidades (uso interno)</label>
                <label className="cot-chk-row"><input type="checkbox" defaultChecked/> Adjuntar al deal de Bitrix24</label>
              </div>
            </div>
            <footer className="cot-modal-ft">
              <CotBtn kind="ghost" onClick={() => setExportOpen(false)}>Cancelar</CotBtn>
              <CotBtn kind="primary" icon={I.download}>Generar archivo</CotBtn>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}
