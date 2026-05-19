import api from '../../../config/api'
import type { Quotation, QuotationListItem, StaffMember, Client } from '../types'

const BASE = '/quotations'

// ─── Quotations ─────────────────────────────────────────────────────────────

export interface QuotationsFilter {
  search?: string
  status?: string
  client_id?: string
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export function apiGetQuotations(params?: QuotationsFilter): Promise<PaginatedResponse<QuotationListItem>> {
  return api.get(BASE, { params }).then(r => r.data)
}

export function apiGetQuotation(id: string): Promise<Quotation> {
  return api.get(`${BASE}/${id}`).then(r => r.data.data ?? r.data)
}

export function apiCreateQuotation(data: Partial<Quotation>): Promise<Quotation> {
  return api.post(BASE, data).then(r => r.data.data ?? r.data)
}

export function apiUpdateQuotation(id: string, data: Partial<Quotation>): Promise<Quotation> {
  return api.put(`${BASE}/${id}`, data).then(r => r.data.data ?? r.data)
}

export function apiDeleteQuotation(id: string): Promise<{ message: string }> {
  return api.delete(`${BASE}/${id}`).then(r => r.data.data ?? r.data)
}

export function apiCreateRevision(id: string): Promise<Quotation> {
  return api.post(`${BASE}/${id}/revision`).then(r => r.data.data ?? r.data)
}

export function apiRecalculate(id: string): Promise<Quotation> {
  return api.post(`${BASE}/${id}/recalculate`).then(r => r.data.data ?? r.data)
}

export function apiGenerateReference(): Promise<{ reference: string; full_reference: string }> {
  return api.get(`${BASE}/generate-reference`).then(r => r.data.data ?? r.data)
}

// ─── Staff ───────────────────────────────────────────────────────────────────

export function apiGetStaff(): Promise<StaffMember[]> {
  return api.get('/staff').then(r => {
    const payload = r.data?.data ?? r.data
    return Array.isArray(payload) ? payload : []
  })
}

// ─── Clients ─────────────────────────────────────────────────────────────────

export function apiGetClients(search?: string): Promise<Client[]> {
  return api.get('/clients', { params: search ? { search } : {} }).then(r => {
    const payload = r.data?.data ?? r.data
    return Array.isArray(payload) ? payload : []
  })
}
