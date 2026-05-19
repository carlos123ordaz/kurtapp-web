// Quotation module types

export type ItemType = 'Consolidar' | 'DHL' | 'Reventa' | 'Servicio'
export type CotCurrency = 'US$' | 'EUR' | 'S/.'
export type PurchaseCurrency = 'EUR' | 'US$'
export type OfferType = 'Local $' | 'Local S/.' | 'FCA'
export type OfferCategory = 'Técnico-Comercial' | 'Técnica' | 'Servicio'
export type ClientType = '01 Cliente Final' | '02 Pyme' | '03 Partner' | '04 Canal' | '05 Competencia'
export type QuotationStatus = 'Preparado' | 'Responsable' | 'Selección' | 'Data Sheets' | 'Aprobado C' | 'Servicios' | 'Manager'

export interface StaffRole {
  staff_id?: string
  code?: string
  name: string
  role?: string
}

export interface Pricing {
  list_price: number
  factory_discount: number
  discount_factor: number
  purchase_price_unit: number
  sub_total_fob: number
  import_factor: number
  import_cost_unit: number
  import_cost_total: number
  cisac_cost_unit: number
  cisac_cost_total: number
  margin_factor: number
  sale_price_unit: number
  sale_price_total: number
  special_discount: number
  final_price_unit: number
  final_price_total: number
  margin_total: number
  margin_percentage: number
}

export interface CustomCost {
  label: string
  value: number
}

export interface FixedCosts {
  custom_costs: CustomCost[]
  quality_dossier: number
  guarantee_letter: number
  factoring_90d: number
  applications: number
  projects: number
  hseq: number
}

export interface SubItem {
  _id?: string
  sub_item_number: number
  description: string
  quantity: number
  product_code: string
  brand_code: string
  brand_name: string
  item_type: ItemType
  category?: string
  spk_family?: string
  currency: CotCurrency
  factory_price: number
  pricing: Partial<Pricing>
  fixed_costs: Partial<FixedCosts>
  notes: string[]
  technical_description: string[]
  validation?: 'OK' | 'ALT.' | 'Comprado'
  status?: 'Necesario' | 'Opcional' | 'Alternativa'
}

export interface QuotationItem {
  _id?: string
  item_number: number
  title: string
  subtitle?: string
  sub_items: SubItem[]
}

export interface QuotationSection {
  _id?: string
  section_number: number
  title: string
  description?: string
  items: QuotationItem[]
}

export interface ExchangeRates {
  eur_to_usd: number
  usd_to_pen: number
}

export interface QuotationTotals {
  purchase_total_usd: number
  purchase_total_eur: number
  import_cost_total: number
  cisac_cost_total: number
  custom_costs_total: number
  fixed_costs_total: number
  list_price_total: number
  discount_total: number
  final_price_total: number
  margin_percentage: number
  margin_amount: number
  breakdown: {
    products: number
    services: number
    spare_parts: number
  }
}

export interface Quotation {
  _id: string
  offer_number: string
  reference: string
  revision: string
  full_reference: string
  deal_id?: string
  template_version?: string
  client_id: string
  client_name: string
  contact_name?: string
  contact_email?: string
  prepared_by: StaffRole
  responsible: StaffRole
  approved_by?: StaffRole
  purchase_currency: PurchaseCurrency
  offer_type: OfferType
  client_type: ClientType
  offer_category: OfferCategory
  language: string
  exchange_rates: ExchangeRates
  global_discount: { type: string; percentage: number }
  commercial_conditions: {
    payment_terms?: string
    delivery_time?: string
    delivery_place?: string
    incoterm?: string
  }
  sections: QuotationSection[]
  totals: QuotationTotals
  status: QuotationStatus
  sent_at?: string
  valid_until?: string
  attachments?: { name: string; type: string; url: string }[]
  createdAt: string
  updatedAt: string
}

export interface QuotationListItem {
  _id: string
  offer_number: string
  revision: string
  full_reference: string
  client_name: string
  prepared_by: StaffRole
  responsible: StaffRole
  status: QuotationStatus
  offer_type: OfferType
  totals: { final_price_total: number; margin_percentage: number }
  createdAt: string
  updatedAt: string
}

// UI-specific line representation (flattened from sections > items > sub_items)
export interface LineItem {
  id: string
  sku: string
  brand_code: string
  brand_name: string
  description: string
  qty: number
  currency: CotCurrency
  listPrice: number
  discountFactor: number  // SPK factor (e.g. 0.85 = 15% off list)
  importFactor: number
  marginFactor: number
  specialDiscount: number  // % additional discount
  itemType: ItemType
  hasAnexo: boolean
  // Calculated (returned from API or computed locally)
  finalPriceUnit?: number
  finalPriceTotal?: number
  marginPct?: number
  cisacTotal?: number
}

// Service annex row
export interface AnexoRow {
  id: string
  concepto: string
  cant: number
  unidad: string
  costo: number
  notas: string
}

// Service annex state per line
export interface AnexoState {
  logistica: AnexoRow[]
  subcontratos: AnexoRow[]
  materiales: AnexoRow[]
  hh: {
    normal: { laboral: number; sabado: number; domingo: number }
    intermedio: { laboral: number; sabado: number; domingo: number }
    especializado: { laboral: number; sabado: number; domingo: number }
  }
  utilidadObjetivo: number
}

// Header state (UI representation)
export interface HeaderState {
  offerNo: string
  rev: string
  fecha: string
  validez: number
  idioma: string
  tcUsd: string
  tcEur: string
  moneda: CotCurrency
  tipoOferta: OfferType | string
  tipoCategoria: OfferCategory | string
  tipoCliente: string
  cliente: string
  clienteId: string
  ruc: string
  contacto: string
  contactoCargo: string
  contactoMail: string
  proyecto: string
  rfq: string
  responsables: Record<string, string>
  condPago: string
  condEntrega: string
  condLugar: string
  condIncoterm: string
}

export interface StaffMember {
  _id: string
  code?: string
  name: string
  lastname?: string
  email?: string
  department?: string
  position?: string
}

export interface Client {
  _id: string
  name: string
  ruc?: string
  contact_name?: string
  contact_email?: string
}
