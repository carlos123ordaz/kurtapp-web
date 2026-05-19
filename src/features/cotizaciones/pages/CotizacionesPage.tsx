import React, { useState, useEffect, useCallback } from 'react'
import '../cotizaciones.css'
import type { LineItem, HeaderState, AnexoState, StaffMember, QuotationListItem, OfferType, Quotation } from '../types'
import {
  apiGetQuotations, apiGetQuotation, apiCreateQuotation, apiUpdateQuotation,
  apiGenerateReference, apiGetStaff,
} from '../api/cotizacionesApi'
import { I, CotBtn, CotBadge, StatusBadge, fmtMoney, CotToast } from '../components/CotShared'
import { ScreenCabecera } from '../components/ScreenCabecera'
import { ScreenLineas } from '../components/ScreenLineas'
import { ScreenAnexo } from '../components/ScreenAnexo'
import { ScreenResumen } from '../components/ScreenResumen'

type Tab = 'cabecera' | 'lineas' | 'anexo' | 'resumen'
type View = 'list' | 'editor'

const today = new Date().toISOString().slice(0, 10)

function defaultHeader(): HeaderState {
  return {
    offerNo: '', rev: 'Rev.0', fecha: today, validez: 30, idioma: 'Español',
    tcUsd: '3.78', tcEur: '1.08', moneda: 'US$',
    tipoOferta: 'Técnico-Comercial', tipoCategoria: 'Técnico-Comercial',
    tipoCliente: '01 Cliente Final',
    cliente: '', clienteId: '', ruc: '', contacto: '', contactoCargo: '', contactoMail: '',
    proyecto: '', rfq: '',
    responsables: {},
    condPago: '50% adelanto / 50% entrega',
    condEntrega: '8-12 semanas desde confirmación',
    condLugar: 'Almacén Corsusa Lima',
    condIncoterm: 'DAP',
  }
}

function mapLinesToSections(lines: LineItem[]) {
  return [{
    name: 'Principal',
    items: lines.map((l) => ({
      description: l.description,
      brand: l.brand_code,
      sku: l.sku,
      type: l.itemType,
      quantity: l.qty,
      currency: l.currency,
      sub_items: [{
        description: l.description,
        quantity: l.qty,
        pricing: {
          list_price: l.listPrice,
          discount_factor: l.discountFactor,
          factory_discount: 0,
          import_factor: l.importFactor,
          margin_factor: l.marginFactor,
          special_discount: l.specialDiscount / 100,
          currency: l.currency,
        },
      }],
    })),
  }]
}

function mapQuotationToHeader(q: any): HeaderState {
  return {
    offerNo: q.reference ?? '',
    rev: `Rev.${q.revision ?? 0}`,
    fecha: q.issue_date?.slice(0, 10) ?? today,
    validez: q.validity_days ?? 30,
    idioma: q.language ?? 'Español',
    tcUsd: String(q.exchange_rates?.usd_to_pen ?? '3.78'),
    tcEur: String(q.exchange_rates?.eur_to_usd ?? '1.08'),
    moneda: q.currency ?? 'US$',
    tipoOferta: q.offer_type ?? 'Técnico-Comercial',
    tipoCategoria: q.category ?? 'Técnico-Comercial',
    tipoCliente: q.client_type ?? '01 Cliente Final',
    cliente: q.client_name ?? '',
    clienteId: q.client_id ?? '',
    ruc: q.client_ruc ?? '',
    contacto: q.contact_name ?? '',
    contactoCargo: q.contact_position ?? '',
    contactoMail: q.contact_email ?? '',
    proyecto: q.project_name ?? '',
    rfq: q.rfq_number ?? '',
    responsables: q.staff_roles
      ? Object.fromEntries(q.staff_roles.map((r: any) => [r.department, r.staff_id]))
      : {},
    condPago: q.payment_terms ?? '',
    condEntrega: q.delivery_time ?? '',
    condLugar: q.delivery_place ?? '',
    condIncoterm: q.incoterm ?? '',
  }
}

function mapQuotationToLines(q: any): LineItem[] {
  const lines: LineItem[] = []
  ;(q.sections ?? []).forEach((sec: any) => {
    (sec.items ?? []).forEach((item: any) => {
      (item.sub_items ?? []).forEach((si: any, idx: number) => {
        lines.push({
          id: `${item._id ?? item.sku ?? ''}-${idx}`,
          sku: item.sku ?? '',
          brand_code: item.brand ?? '',
          brand_name: item.brand ?? '',
          description: si.description ?? item.description ?? '',
          qty: si.quantity ?? 1,
          currency: si.pricing?.currency ?? item.currency ?? 'US$',
          listPrice: si.pricing?.list_price ?? 0,
          discountFactor: si.pricing?.discount_factor ?? 0.85,
          importFactor: si.pricing?.import_factor ?? 1.25,
          marginFactor: si.pricing?.margin_factor ?? 1.52,
          specialDiscount: (si.pricing?.special_discount ?? 0) * 100,
          itemType: item.type ?? 'Reventa',
          hasAnexo: false,
        })
      })
    })
  })
  return lines
}

export function CotizacionesPage() {
  const [view, setView] = useState<View>('list')
  const [tab, setTab] = useState<Tab>('cabecera')

  const [quotations, setQuotations] = useState<QuotationListItem[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const [header, setHeader] = useState<HeaderState>(defaultHeader)
  const [lines, setLines] = useState<LineItem[]>([])
  const [anexos, setAnexos] = useState<Record<string, AnexoState>>({})
  const [activeAnexoLineId, setActiveAnexoLineId] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const loadList = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiGetQuotations({ search, limit: 50 })
      setQuotations(res.data)
    } catch {
      showToast('Error al cargar cotizaciones')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    loadList()
  }, [loadList])

  useEffect(() => {
    apiGetStaff().then(setStaff).catch(() => {})
  }, [])

  const openNew = async () => {
    const h = defaultHeader()
    try {
      const ref = await apiGenerateReference()
      h.offerNo = ref.reference
    } catch { /* use empty */ }
    setHeader(h)
    setLines([])
    setAnexos({})
    setActiveAnexoLineId(null)
    setEditingId(null)
    setTab('cabecera')
    setView('editor')
  }

  const openEdit = async (id: string) => {
    setLoading(true)
    try {
      const q = await apiGetQuotation(id)
      setHeader(mapQuotationToHeader(q))
      setLines(mapQuotationToLines(q))
      setAnexos({})
      setActiveAnexoLineId(null)
      setEditingId(id)
      setTab('cabecera')
      setView('editor')
    } catch {
      showToast('Error al cargar la cotización')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        reference: header.offerNo,
        revision: String(parseInt(header.rev.replace('Rev.', '')) || 0),
        issue_date: header.fecha,
        validity_days: header.validez,
        language: header.idioma,
        currency: header.moneda,
        offer_type: header.tipoOferta as OfferType,
        category: header.tipoCategoria,
        client_type: header.tipoCliente,
        client_name: header.cliente,
        client_id: header.clienteId,
        client_ruc: header.ruc,
        contact_name: header.contacto,
        contact_position: header.contactoCargo,
        contact_email: header.contactoMail,
        project_name: header.proyecto,
        rfq_number: header.rfq,
        incoterm: header.condIncoterm,
        payment_terms: header.condPago,
        delivery_time: header.condEntrega,
        delivery_place: header.condLugar,
        exchange_rates: {
          usd_to_pen: parseFloat(String(header.tcUsd)) || 3.78,
          eur_to_usd: parseFloat(String(header.tcEur)) || 1.08,
        },
        staff_roles: Object.entries(header.responsables).map(([dept, sid]) => ({
          department: dept, staff_id: sid,
        })),
        sections: mapLinesToSections(lines),
      }
      if (editingId) {
        await apiUpdateQuotation(editingId, payload as unknown as Partial<Quotation>)
        showToast('Cotización actualizada')
      } else {
        const created = await apiCreateQuotation(payload as unknown as Partial<Quotation>)
        setEditingId(created._id)
        showToast('Cotización guardada')
      }
      loadList()
    } catch {
      showToast('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    setView('list')
    setTab('cabecera')
  }

  // ─── List view ───────────────────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <div className="cot-module">
        <div className="cot-list-pg">
          <div className="cot-list-hd">
            <div>
              <h2 className="cot-page-title">Cotizaciones</h2>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--cot-fg-mute)' }}>Gestión de ofertas técnico-comerciales</p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div className="cot-search">
                <I.search size={14}/>
                <input
                  placeholder="Buscar por oferta, cliente o proyecto…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <CotBtn kind="primary" icon={I.plus} onClick={openNew}>Nueva cotización</CotBtn>
            </div>
          </div>

          {loading ? (
            <div className="cot-loading"><div className="cot-spinner"/></div>
          ) : quotations.length === 0 ? (
            <div className="cot-empty">
              <I.doc size={32} style={{ opacity: 0.2 }}/>
              <p>No hay cotizaciones. <button style={{ background: 'none', border: 0, color: 'var(--cot-accent)', cursor: 'pointer', padding: 0, fontSize: 'inherit' }} onClick={openNew}>Crear la primera</button></p>
            </div>
          ) : (
            <div className="cot-table-wrap">
              <table className="cot-table">
                <thead>
                  <tr>
                    <th>Referencia</th>
                    <th>Cliente</th>
                    <th>Proyecto</th>
                    <th>Moneda</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th/>
                  </tr>
                </thead>
                <tbody>
                  {quotations.map((q) => (
                    <tr key={q._id} onClick={() => openEdit(q._id)}>
                      <td>
                        <span className="cot-ref">{q.reference}</span>{' '}
                        <span style={{ fontSize: 11, color: 'var(--cot-fg-mute)' }}>{q.revision !== undefined ? `Rev.${q.revision}` : ''}</span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{q.client_name}</td>
                      <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.project_name}</td>
                      <td><CotBadge kind="teal">{q.currency}</CotBadge></td>
                      <td className="mono">{q.totals ? fmtMoney((q.totals as any).grand_total ?? 0, q.currency) : '—'}</td>
                      <td><StatusBadge status={q.status}/></td>
                      <td style={{ color: 'var(--cot-fg-mute)', fontSize: 12 }}>{q.issue_date?.slice(0, 10) ?? '—'}</td>
                      <td>
                        <CotBtn kind="ghost" size="sm" icon={I.edit} onClick={(e) => { e.stopPropagation(); openEdit(q._id) }}/>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {toast && <CotToast msg={toast} onDone={() => setToast(null)}/>}
      </div>
    )
  }

  // ─── Editor view ─────────────────────────────────────────────────────────────
  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'cabecera', label: 'Cabecera', icon: <I.doc size={14}/> },
    { id: 'lineas',   label: 'Líneas',   icon: <I.list size={14}/> },
    { id: 'anexo',    label: 'Anexo',    icon: <I.tool size={14}/> },
    { id: 'resumen',  label: 'Resumen',  icon: <I.chart size={14}/> },
  ]

  return (
    <div className="cot-module">
      {/* Editor top bar */}
      <div className="cot-editor-bar">
        <div className="cot-editor-bar-left">
          <button className="cot-editor-back" onClick={handleBack}>
            <I.chevL size={14}/>
            <span>Volver</span>
          </button>
          <div className="cot-editor-id">
            <span className="mono" style={{ fontWeight: 600 }}>{header.offerNo || 'Nueva cotización'}</span>
            {header.rev && <CotBadge kind="neutral">{header.rev}</CotBadge>}
          </div>
        </div>
        <div className="cot-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`cot-tab${tab === t.id ? ' is-on' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
        <div className="cot-editor-bar-right">
          <CotBtn kind="ghost" size="sm" onClick={handleBack}>Cancelar</CotBtn>
          <CotBtn kind="primary" size="sm" icon={I.save} onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </CotBtn>
        </div>
      </div>

      {/* Tab content */}
      {tab === 'cabecera' && (
        <ScreenCabecera data={header} setData={setHeader} staff={staff}/>
      )}
      {tab === 'lineas' && (
        <ScreenLineas
          lines={lines}
          setLines={setLines}
          header={header}
          onOpenAnexo={(id) => { setActiveAnexoLineId(id); setTab('anexo') }}
        />
      )}
      {tab === 'anexo' && (
        <ScreenAnexo
          lines={lines}
          anexos={anexos}
          setAnexos={setAnexos}
          activeAnexoLineId={activeAnexoLineId}
          setActiveAnexoLineId={setActiveAnexoLineId}
        />
      )}
      {tab === 'resumen' && (
        <ScreenResumen lines={lines} header={header} anexos={anexos}/>
      )}

      {toast && <CotToast msg={toast} onDone={() => setToast(null)}/>}
    </div>
  )
}
