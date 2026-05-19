import React, { useState, useMemo, useRef, useEffect, Fragment } from 'react'
import type { LineItem, HeaderState, CotCurrency, ItemType } from '../types'
import { BRANDS, FAMILIES, CATALOG, brandById, familyById, skuLookup } from '../data/cotizacionesData'
import type { CatalogItem } from '../data/cotizacionesData'
import {
  I, CotBtn, CotBadge, BrandChip, fmtMoney, fmtPct, lineMath,
} from './CotShared'

// ─── Catalog Modal ─────────────────────────────────────────────────────────────

function CatalogModal({ onClose, onPick }: { onClose: () => void; onPick: (c: CatalogItem) => void }) {
  const [q, setQ] = useState('')
  const [brand, setBrand] = useState('all')
  const [family, setFamily] = useState('all')

  const filtered = useMemo(() => {
    return CATALOG.filter((c) => {
      if (brand !== 'all' && c.brand !== brand) return false
      if (family !== 'all' && c.family !== family) return false
      if (q && !(c.name.toLowerCase().includes(q.toLowerCase()) || c.sku.toLowerCase().includes(q.toLowerCase()))) return false
      return true
    })
  }, [q, brand, family])

  return (
    <div className="cot-scrim" onClick={onClose}>
      <div className="cot-modal cot-modal-catalog" onClick={(e) => e.stopPropagation()}>
        <header className="cot-modal-hd">
          <div>
            <h3 className="cot-modal-title">Catálogo de productos</h3>
            <p className="cot-modal-sub">{CATALOG.length} ítems · {BRANDS.length} marcas · {FAMILIES.length} familias</p>
          </div>
          <button className="cot-btn cot-btn-ghost cot-btn-icon" onClick={onClose}><I.x size={16}/></button>
        </header>

        <div className="cot-modal-body-split">
          <aside className="cot-cat-sb">
            <div className="cot-cat-search">
              <I.search size={13}/>
              <input placeholder="Buscar SKU, nombre…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus/>
            </div>
            <div className="cot-cat-sec-lbl">Familia</div>
            <button className={`cot-cat-side-btn ${family === 'all' ? 'is-on' : ''}`} onClick={() => setFamily('all')}>
              <span className="cot-cat-side-ic">⌑</span><span>Todas</span>
              <span className="cot-cat-side-ct">{CATALOG.length}</span>
            </button>
            {FAMILIES.map((f) => {
              const ct = CATALOG.filter((c) => c.family === f.id).length
              return (
                <button key={f.id} className={`cot-cat-side-btn ${family === f.id ? 'is-on' : ''}`} onClick={() => setFamily(f.id)}>
                  <span className="cot-cat-side-ic">{f.icon}</span><span>{f.name}</span>
                  <span className="cot-cat-side-ct">{ct}</span>
                </button>
              )
            })}
            <div className="cot-cat-sec-lbl" style={{ marginTop: 12 }}>Marca</div>
            <button className={`cot-cat-side-btn ${brand === 'all' ? 'is-on' : ''}`} onClick={() => setBrand('all')}>
              <span className="cot-brand-dot" style={{ background: '#71717a' }}/><span>Todas</span>
              <span className="cot-cat-side-ct">{CATALOG.length}</span>
            </button>
            {BRANDS.map((b) => {
              const ct = CATALOG.filter((c) => c.brand === b.id).length
              return (
                <button key={b.id} className={`cot-cat-side-btn ${brand === b.id ? 'is-on' : ''}`} onClick={() => setBrand(b.id)}>
                  <span className="cot-brand-dot" style={{ background: b.color }}/><span>{b.name}</span>
                  <span className="cot-cat-side-ct">{ct}</span>
                </button>
              )
            })}
          </aside>

          <div className="cot-cat-results">
            <div className="cot-cat-results-hd">
              <div className="cot-cat-ct"><b>{filtered.length}</b> resultados</div>
            </div>
            <div className="cot-cat-grid">
              {filtered.map((c) => {
                const b = brandById(c.brand)
                return (
                  <button key={c.sku} className="cot-cat-card" onClick={() => onPick(c)}>
                    <div className="cot-cat-img">
                      <span className="cot-cat-img-lbl">{c.uom === 'SVC' ? 'SERVICIO' : 'PRODUCTO'}</span>
                    </div>
                    <div className="cot-cat-body">
                      <div className="cot-cat-brand">
                        {b && <span className="cot-brand-dot" style={{ background: b.color }}/>}
                        <span>{b?.name}</span>
                        <span>· {familyById(c.family)?.name}</span>
                      </div>
                      <div className="cot-cat-name">{c.name}</div>
                      <div className="cot-cat-foot">
                        <span className="cot-cat-sku">{c.sku}</span>
                        {c.uom === 'SVC'
                          ? <CotBadge kind="amber">Servicio</CotBadge>
                          : <span className="cot-cat-price">{fmtMoney(c.listPrice, c.currency)}</span>}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Screen Lines ─────────────────────────────────────────────────────────────

interface Props {
  lines: LineItem[]
  setLines: (l: LineItem[]) => void
  header: HeaderState
  onOpenAnexo: (id: string) => void
}

export function ScreenLineas({ lines, setLines, header, onOpenAnexo }: Props) {
  const [catOpen, setCatOpen] = useState(false)
  const [quickQ, setQuickQ] = useState('')
  const [quickOpen, setQuickOpen] = useState(false)
  const quickRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (quickRef.current && !quickRef.current.contains(e.target as Node)) setQuickOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const quickHits = useMemo(() => {
    if (!quickQ) return []
    return CATALOG.filter((c) =>
      c.name.toLowerCase().includes(quickQ.toLowerCase()) ||
      c.sku.toLowerCase().includes(quickQ.toLowerCase())
    ).slice(0, 6)
  }, [quickQ])

  const addLine = (item: CatalogItem) => {
    const brand = brandById(item.brand)
    const newLine: LineItem = {
      id: 'l' + Math.random().toString(36).slice(2, 8),
      sku: item.sku,
      brand_code: item.brand,
      brand_name: brand?.name ?? item.brand,
      description: item.name,
      qty: 1,
      currency: item.currency as CotCurrency,
      listPrice: item.listPrice,
      discountFactor: 0.85,
      importFactor: 1.25,
      marginFactor: 1.52,
      specialDiscount: 0,
      itemType: item.isService ? 'Servicio' : 'Consolidar' as ItemType,
      hasAnexo: !!item.isService,
    }
    setLines([...lines, newLine])
    setCatOpen(false)
    setQuickOpen(false)
    setQuickQ('')
  }

  const updateLine = (id: string, k: keyof LineItem, v: any) => {
    setLines(lines.map((l) => l.id === id ? { ...l, [k]: v } : l))
  }
  const removeLine = (id: string) => setLines(lines.filter((l) => l.id !== id))
  const dupLine = (l: LineItem) => setLines([...lines, { ...l, id: 'l' + Math.random().toString(36).slice(2, 8) }])

  // Group by brand
  const grouped = useMemo(() => {
    const map: Record<string, LineItem[]> = {}
    lines.forEach((l) => {
      if (!map[l.brand_code]) map[l.brand_code] = []
      map[l.brand_code].push(l)
    })
    return Object.entries(map).map(([brandId, ls]) => ({ brand: brandById(brandId), lines: ls }))
  }, [lines])

  // Totals
  const totals = useMemo(() => {
    const tcEur = parseFloat(header.tcEur) || 1.08
    const tcUsd = parseFloat(header.tcUsd) || 3.78
    let netUSD = 0, netEUR = 0, totalOffer = 0, countSvc = 0
    lines.forEach((l) => {
      const m = lineMath(l)
      if (l.currency === 'US$') netUSD += m.finalTotal
      else netEUR += m.finalTotal
      if (l.hasAnexo) countSvc++
    })
    if (header.moneda === 'US$') totalOffer = netUSD + netEUR * tcEur
    else if (header.moneda === 'EUR') totalOffer = netUSD / tcEur + netEUR
    else totalOffer = netUSD * tcUsd + netEUR * tcEur * tcUsd
    return { netUSD, netEUR, totalOffer, countSvc }
  }, [lines, header])

  return (
    <div className="cot-screen">
      <div className="cot-screen-cols">
        <div className="cot-screen-main">

          {/* Add bar */}
          <section className="cot-card cot-add-card">
            <div className="cot-add-bar">
              <div className="cot-qs-wrap" ref={quickRef}>
                <div className="cot-qs">
                  <I.search size={14}/>
                  <input
                    placeholder="Busca SKU, marca o descripción para agregar rápido…"
                    value={quickQ}
                    onChange={(e) => { setQuickQ(e.target.value); setQuickOpen(true) }}
                    onFocus={() => setQuickOpen(true)}
                  />
                </div>
                {quickOpen && quickHits.length > 0 && (
                  <div className="cot-qs-menu">
                    {quickHits.map((c) => {
                      const b = brandById(c.brand)
                      return (
                        <button key={c.sku} className="cot-qs-item" onClick={() => addLine(c)}>
                          <span className="cot-brand-dot" style={{ background: b?.color ?? '#999' }}/>
                          <div className="cot-qs-item-body">
                            <div className="cot-qs-name">{c.name}</div>
                            <div className="cot-qs-meta">
                              <span className="mono">{c.sku}</span>
                              <span>· {b?.name}</span>
                              <span>· {familyById(c.family)?.name}</span>
                            </div>
                          </div>
                          {c.uom === 'SVC'
                            ? <CotBadge kind="amber">Servicio</CotBadge>
                            : <span className="cot-qs-price">{fmtMoney(c.listPrice, c.currency)}</span>}
                          <I.plus size={14} style={{ color: '#0F766E', marginLeft: 8 }}/>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
              <div className="cot-add-actions">
                <CotBtn kind="default" icon={I.list} onClick={() => setCatOpen(true)}>Explorar catálogo</CotBtn>
                <CotBtn kind="ghost" icon={I.plus} onClick={() => {
                  const line: LineItem = {
                    id: 'l' + Math.random().toString(36).slice(2, 8),
                    sku: '', brand_code: 'CRS', brand_name: 'Libre', description: 'Ítem libre',
                    qty: 1, currency: 'US$', listPrice: 0, discountFactor: 1,
                    importFactor: 1.25, marginFactor: 1.52, specialDiscount: 0,
                    itemType: 'Consolidar', hasAnexo: false,
                  }
                  setLines([...lines, line])
                }}>Ítem libre</CotBtn>
              </div>
            </div>
            <div className="cot-add-hints">
              <span><b>{lines.length}</b> líneas</span>
              <span className="cot-dot-sep">·</span>
              <span><b>{grouped.length}</b> marcas</span>
              <span className="cot-dot-sep">·</span>
              <span><b>{totals.countSvc}</b> con Anexo de servicio</span>
            </div>
          </section>

          {/* Lines table */}
          <section className="cot-card" style={{ overflow: 'visible' }}>
            <header className="cot-card-hd">
              <div>
                <h3 className="cot-card-title">Líneas de producto</h3>
                <p className="cot-card-sub">Agrupadas por marca. Edita cantidades, precios y factores inline.</p>
              </div>
            </header>

            <div className="cot-lines-table">
              <div className="cot-lines-row cot-lines-row-head">
                <div className="cot-lr-c cot-lr-num">#</div>
                <div className="cot-lr-c">SKU / Descripción</div>
                <div className="cot-lr-c" style={{ textAlign: 'center' }}>Cant.</div>
                <div className="cot-lr-c">P. lista</div>
                <div className="cot-lr-c" style={{ textAlign: 'center' }}>F.SPK</div>
                <div className="cot-lr-c" style={{ textAlign: 'center' }}>Dcto.</div>
                <div className="cot-lr-c" style={{ textAlign: 'right' }}>Final línea</div>
                <div className="cot-lr-c"/>
              </div>

              {grouped.map((g) => (
                <Fragment key={g.brand?.id ?? 'x'}>
                  <div className="cot-group-hd">
                    <BrandChip brandId={g.brand?.id ?? ''} size="md"/>
                    {g.brand?.dept && <span className="cot-group-dept">Depto. {g.brand.dept}</span>}
                    <span className="cot-group-ct">{g.lines.length} línea{g.lines.length !== 1 ? 's' : ''}</span>
                  </div>
                  {g.lines.map((l) => {
                    const m = lineMath(l)
                    const flatIdx = lines.findIndex((x) => x.id === l.id) + 1
                    return (
                      <div key={l.id} className={`cot-lines-row ${l.hasAnexo ? 'is-svc' : ''}`}>
                        <div className="cot-lr-c cot-lr-num">{String(flatIdx).padStart(2, '0')}</div>
                        <div className="cot-lr-c cot-lr-sku-col">
                          <div className="cot-lr-name">{l.description || l.sku}</div>
                          <div className="cot-lr-sku-row">
                            {l.sku && <span className="cot-lr-sku mono">{l.sku}</span>}
                            {l.hasAnexo && (
                              <button className="cot-anexo-link" onClick={() => onOpenAnexo(l.id)}>
                                <I.tools size={11}/><span>Anexo</span>
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="cot-lr-c cot-lr-qty-col">
                          <input className="cot-lr-input" type="number" value={l.qty}
                                 onChange={(e) => updateLine(l.id, 'qty', parseFloat(e.target.value) || 0)}/>
                        </div>
                        <div className="cot-lr-c cot-lr-price-col">
                          <div className="cot-lr-price-wrap">
                            <input className="cot-lr-input" type="number" step="0.01" value={l.listPrice}
                                   onChange={(e) => updateLine(l.id, 'listPrice', parseFloat(e.target.value) || 0)}/>
                            <span className="cot-lr-ccy">{l.currency}</span>
                          </div>
                        </div>
                        <div className="cot-lr-c cot-lr-spk-col">
                          <input className="cot-lr-input" type="number" step="0.01" min="0" max="1" value={l.discountFactor}
                                 onChange={(e) => updateLine(l.id, 'discountFactor', parseFloat(e.target.value) || 0)}/>
                        </div>
                        <div className="cot-lr-c cot-lr-disc-col">
                          <input className="cot-lr-input" type="number" step="0.1" min="0" max="100" value={l.specialDiscount}
                                 onChange={(e) => updateLine(l.id, 'specialDiscount', parseFloat(e.target.value) || 0)}/>
                          <span className="cot-lr-suffix">%</span>
                        </div>
                        <div className="cot-lr-c cot-lr-net-col">
                          <div className="cot-lr-net">{fmtMoney(m.finalTotal, l.currency)}</div>
                          <div className="cot-lr-net-sub">{fmtMoney(m.finalPriceUnit, l.currency)} / un</div>
                        </div>
                        <div className="cot-lr-c cot-lr-act-col">
                          <button className="cot-lr-act-btn" title="Duplicar" onClick={() => dupLine(l)}><I.dup size={13}/></button>
                          <button className="cot-lr-act-btn" title="Eliminar" onClick={() => removeLine(l.id)}><I.trash size={13}/></button>
                        </div>
                      </div>
                    )
                  })}
                </Fragment>
              ))}

              {lines.length === 0 && (
                <div className="cot-lines-empty">
                  <I.box size={32}/>
                  <h4>Sin líneas todavía</h4>
                  <p>Usa el buscador rápido o explora el catálogo para agregar el primer ítem.</p>
                  <CotBtn kind="primary" icon={I.plus} onClick={() => setCatOpen(true)}>Agregar primer ítem</CotBtn>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Aside totals */}
        <aside className="cot-screen-aside">
          <div className="cot-aside-card cot-aside-totals">
            <div className="cot-aside-hd">Totales en vivo</div>
            <div className="cot-totals-big">
              <div className="cot-totals-big-lbl">Total oferta · {header.moneda}</div>
              <div className="cot-totals-big-val">{fmtMoney(totals.totalOffer, header.moneda)}</div>
              <div className="cot-totals-big-meta">{lines.length} líneas · {grouped.length} marcas</div>
            </div>
            <div className="cot-aside-divider"/>
            <div className="cot-aside-rows">
              <div className="cot-aside-row"><span>Subtotal USD</span><b className="mono">{fmtMoney(totals.netUSD, 'US$')}</b></div>
              <div className="cot-aside-row"><span>Subtotal EUR</span><b className="mono">{fmtMoney(totals.netEUR, 'EUR')}</b></div>
              <div className="cot-aside-row"><span>TC EUR→USD</span><b className="mono">{header.tcEur}</b></div>
              <div className="cot-aside-row"><span>TC USD→PEN</span><b className="mono">{header.tcUsd}</b></div>
            </div>
            <div className="cot-aside-divider"/>
            <div className="cot-aside-hd">Por marca</div>
            <div className="cot-aside-rows">
              {grouped.map((g) => {
                const tcEur = parseFloat(header.tcEur) || 1.08
                const subt = g.lines.reduce((acc, l) => {
                  const m = lineMath(l)
                  if (l.currency === header.moneda) return acc + m.finalTotal
                  if (l.currency === 'EUR' && header.moneda === 'US$') return acc + m.finalTotal * tcEur
                  if (l.currency === 'US$' && header.moneda === 'EUR') return acc + m.finalTotal / tcEur
                  return acc + m.finalTotal
                }, 0)
                return (
                  <div className="cot-aside-row" key={g.brand?.id ?? 'x'}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#71717a' }}>
                      {g.brand && <span className="cot-brand-dot" style={{ background: g.brand.color }}/>}
                      <span>{g.brand?.name ?? '—'}</span>
                    </span>
                    <b className="mono">{fmtMoney(subt, header.moneda)}</b>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="cot-aside-card">
            <div className="cot-aside-hd">Factores de cálculo</div>
            <div className="cot-aside-rows">
              <div className="cot-aside-row"><span>Factor importación</span><b>1.25</b></div>
              <div className="cot-aside-row"><span>Factor margen std.</span><b>1.52</b></div>
            </div>
            <div className="cot-aside-divider"/>
            <div className="cot-aside-help">
              <I.info size={14}/>
              <div>Los factores por línea (SPK, importación, margen) se configuran en la hoja Excel y se calculan en el backend.</div>
            </div>
          </div>
        </aside>
      </div>

      {catOpen && <CatalogModal onClose={() => setCatOpen(false)} onPick={addLine}/>}
    </div>
  )
}
