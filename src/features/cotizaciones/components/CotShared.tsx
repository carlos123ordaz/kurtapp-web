import React, { useState, useEffect, useRef } from 'react'
import type { StaffMember } from '../types'
import { brandById, skuLookup } from '../data/cotizacionesData'
import type { LineItem } from '../types'

// ─── SVG Icon ────────────────────────────────────────────────────────────────

interface IconProps {
  d: string | React.ReactNode
  size?: number
  strokeWidth?: number
  fill?: string
  style?: React.CSSProperties
  className?: string
}
function Icon({ d, size = 16, strokeWidth = 1.6, fill = 'none', style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
         strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
      {typeof d === 'string' ? <path d={d}/> : d}
    </svg>
  )
}

export const I = {
  home:     (p: Partial<IconProps>) => <Icon {...p} d="M3 11l9-8 9 8M5 10v10h14V10"/>,
  doc:      (p: Partial<IconProps>) => <Icon {...p} d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z M14 3v5h5"/>,
  list:     (p: Partial<IconProps>) => <Icon {...p} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>,
  tools:    (p: Partial<IconProps>) => <Icon {...p} d="M14.7 6.3a4 4 0 0 0-5.4 5.4l-6 6a1.4 1.4 0 0 0 2 2l6-6a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2 2.6-2.6z"/>,
  check:    (p: Partial<IconProps>) => <Icon {...p} d="M20 6L9 17l-5-5"/>,
  copy:     (p: Partial<IconProps>) => <Icon {...p} d="M8 4h10a2 2 0 0 1 2 2v10M16 8h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h8z"/>,
  download: (p: Partial<IconProps>) => <Icon {...p} d="M12 3v12M7 10l5 5 5-5M5 21h14"/>,
  search:   (p: Partial<IconProps>) => <Icon {...p} d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16zM21 21l-4.3-4.3"/>,
  sync:     (p: Partial<IconProps>) => <Icon {...p} d="M21 12a9 9 0 0 1-15.5 6.2L3 16M3 12a9 9 0 0 1 15.5-6.2L21 8M3 21v-5h5M21 3v5h-5"/>,
  bell:     (p: Partial<IconProps>) => <Icon {...p} d="M18 16v-5a6 6 0 1 0-12 0v5l-2 2h16l-2-2zM10 21a2 2 0 0 0 4 0"/>,
  plus:     (p: Partial<IconProps>) => <Icon {...p} d="M12 5v14M5 12h14"/>,
  trash:    (p: Partial<IconProps>) => <Icon {...p} d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6"/>,
  more:     (p: Partial<IconProps>) => <Icon {...p} d="M12 6h.01M12 12h.01M12 18h.01" strokeWidth={3}/>,
  chevR:    (p: Partial<IconProps>) => <Icon {...p} d="M9 6l6 6-6 6"/>,
  chevD:    (p: Partial<IconProps>) => <Icon {...p} d="M6 9l6 6 6-6"/>,
  chevL:    (p: Partial<IconProps>) => <Icon {...p} d="M15 6l-6 6 6 6"/>,
  edit:     (p: Partial<IconProps>) => <Icon {...p} d="M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>,
  dup:      (p: Partial<IconProps>) => <Icon {...p} d="M8 4h10a2 2 0 0 1 2 2v10M16 8h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h8z"/>,
  link:     (p: Partial<IconProps>) => <Icon {...p} d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>,
  cal:      (p: Partial<IconProps>) => <Icon {...p} d="M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM8 3v4M16 3v4"/>,
  warn:     (p: Partial<IconProps>) => <Icon {...p} d="M12 9v4M12 17h.01M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>,
  shield:   (p: Partial<IconProps>) => <Icon {...p} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
  logout:   (p: Partial<IconProps>) => <Icon {...p} d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>,
  user:     (p: Partial<IconProps>) => <Icon {...p} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>,
  box:      (p: Partial<IconProps>) => <Icon {...p} d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96 12 12.01l8.73-5.05M12 22.08V12"/>,
  bolt:     (p: Partial<IconProps>) => <Icon {...p} d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>,
  filter:   (p: Partial<IconProps>) => <Icon {...p} d="M22 3H2l8 9.5V19l4 2v-8.5L22 3"/>,
  x:        (p: Partial<IconProps>) => <Icon {...p} d="M18 6 6 18M6 6l12 12"/>,
  info:     (p: Partial<IconProps>) => <Icon {...p} d="M12 16v-4M12 8h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z"/>,
  refresh:  (p: Partial<IconProps>) => <Icon {...p} d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>,
  send:     (p: Partial<IconProps>) => <Icon {...p} d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>,
  save:     (p: Partial<IconProps>) => <Icon {...p} d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8"/>,
  chart:    (p: Partial<IconProps>) => <Icon {...p} d="M3 3v18h18M7 14l3-3 3 3 5-6"/>,
  tool:     (p: Partial<IconProps>) => <Icon {...p} d="M14.7 6.3a4 4 0 0 0-5.4 5.4l-6 6a1.4 1.4 0 0 0 2 2l6-6a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2 2.6-2.6z"/>,
}

// ─── Btn ─────────────────────────────────────────────────────────────────────

interface BtnProps {
  kind?: 'primary' | 'ghost' | 'default' | 'danger'
  size?: 'md' | 'sm'
  icon?: (p: Partial<IconProps>) => React.ReactElement
  children?: React.ReactNode
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  title?: string
  style?: React.CSSProperties
}

export function CotBtn({ kind = 'default', size = 'md', icon: IconC, children, onClick, disabled, title, style }: BtnProps) {
  const cls = `cot-btn cot-btn-${kind} ${size === 'sm' ? 'cot-btn-sm' : ''}`
  return (
    <button className={cls} onClick={onClick} disabled={disabled} title={title} style={style}>
      {IconC && <IconC size={size === 'sm' ? 13 : 14}/>}
      {children && <span>{children}</span>}
    </button>
  )
}

// ─── Field ───────────────────────────────────────────────────────────────────

interface FieldProps {
  label: string
  required?: boolean
  hint?: string
  span?: 2 | 3 | 4 | 6 | 8 | 12
  children: React.ReactNode
}

export function CotField({ label, required, hint, span, children }: FieldProps) {
  const cls = `cot-fld ${span ? `cot-fld-${span}` : ''}`
  return (
    <div className={cls}>
      <label className="cot-fld-lbl">
        {label}
        {required && <span className="cot-fld-req">*</span>}
      </label>
      <div>{children}</div>
      {hint && <div className="cot-fld-hint">{hint}</div>}
    </div>
  )
}

// ─── Input ───────────────────────────────────────────────────────────────────

interface InputProps {
  value: string | number
  onChange?: (v: string) => void
  placeholder?: string
  type?: string
  readOnly?: boolean
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  mono?: boolean
}

export function CotInput({ value, onChange, placeholder, type = 'text', readOnly, prefix, suffix, mono }: InputProps) {
  return (
    <div className={`cot-inp-wrap ${prefix ? 'has-prefix' : ''} ${mono ? 'cot-inp-mono' : ''}`}>
      {prefix && <span className="cot-inp-pfx">{prefix}</span>}
      <input
        className="cot-inp"
        type={type}
        value={value ?? ''}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        readOnly={readOnly}
      />
      {suffix && <span className="cot-inp-sfx">{suffix}</span>}
    </div>
  )
}

// ─── Select ──────────────────────────────────────────────────────────────────

interface SelectProps {
  value: string
  onChange?: (v: string) => void
  options: (string | { value: string; label: string })[]
  placeholder?: string
}

export function CotSelect({ value, onChange, options, placeholder }: SelectProps) {
  return (
    <div className="cot-sel-wrap">
      <select className="cot-sel" value={value ?? ''} onChange={(e) => onChange?.(e.target.value)}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => {
          const v = typeof o === 'string' ? o : o.value
          const l = typeof o === 'string' ? o : o.label
          return <option key={v} value={v}>{l}</option>
        })}
      </select>
      <span className="cot-sel-arrow"><I.chevD size={12}/></span>
    </div>
  )
}

// ─── Segmented ───────────────────────────────────────────────────────────────

interface SegProps {
  value: string
  onChange?: (v: string) => void
  options: (string | { value: string; label: string })[]
}

export function CotSeg({ value, onChange, options }: SegProps) {
  return (
    <div className="cot-seg">
      {options.map((o) => {
        const v = typeof o === 'string' ? o : o.value
        const l = typeof o === 'string' ? o : o.label
        return (
          <button key={v} className={`cot-seg-btn ${value === v ? 'is-on' : ''}`} onClick={() => onChange?.(v)}>
            {l}
          </button>
        )
      })}
    </div>
  )
}

// ─── Badge ───────────────────────────────────────────────────────────────────

interface BadgeProps {
  kind?: 'neutral' | 'teal' | 'amber' | 'success' | 'danger'
  children: React.ReactNode
  style?: React.CSSProperties
}

export function CotBadge({ kind = 'neutral', children, style }: BadgeProps) {
  return <span className={`cot-bdg cot-bdg-${kind}`} style={style}>{children}</span>
}

// ─── BrandChip ───────────────────────────────────────────────────────────────

export function BrandChip({ brandId, size = 'sm' }: { brandId: string; size?: 'sm' | 'md' }) {
  const b = brandById(brandId)
  if (!b) return null
  return (
    <span className={`cot-brand-chip ${size === 'md' ? 'cot-brand-chip-md' : ''}`}>
      <span className="cot-brand-dot" style={{ background: b.color }}/>
      <span>{b.name}</span>
    </span>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

function nameColor(name: string) {
  const colors = ['#0F766E', '#0891b2', '#7c3aed', '#c2410c', '#1e40af', '#15803d', '#b91c1c', '#9333ea']
  let h = 0; for (const c of name) h = ((h << 5) - h + c.charCodeAt(0)) | 0
  return colors[Math.abs(h) % colors.length]
}

export function CotAvatar({ name, size = 24 }: { name: string; size?: number }) {
  if (!name) return <span className="cot-avatar cot-avatar-empty" style={{ width: size, height: size }}/>
  return (
    <span className="cot-avatar" style={{ width: size, height: size, background: nameColor(name), fontSize: size <= 24 ? 10 : 12 }}>
      {initials(name)}
    </span>
  )
}

// ─── PersonPicker ─────────────────────────────────────────────────────────────

interface PersonPickerProps {
  value: string
  onChange?: (v: string) => void
  staff: StaffMember[]
  placeholder?: string
}

export function PersonPicker({ value, onChange, staff, placeholder = 'Asignar…' }: PersonPickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const person = staff.find(s => s._id === value)

  return (
    <div ref={ref} className="cot-pp">
      <button className={`cot-pp-btn ${person ? 'has-val' : ''}`} onClick={() => setOpen(!open)}>
        {person ? (
          <>
            <CotAvatar name={person.name} size={20}/>
            <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{person.name}</span>
            <I.chevD size={12} style={{ opacity: .5, marginLeft: 'auto', flexShrink: 0 }}/>
          </>
        ) : (
          <>
            <span className="cot-pp-dot"/>
            <span className="cot-pp-placeholder">{placeholder}</span>
            <I.chevD size={12} style={{ opacity: .5, marginLeft: 'auto' }}/>
          </>
        )}
      </button>
      {open && (
        <div className="cot-pp-menu">
          {value && (
            <button className="cot-pp-item cot-pp-clear" onClick={() => { onChange?.(''); setOpen(false) }}>
              <span className="cot-pp-dot"/>
              <span>Sin asignar</span>
            </button>
          )}
          {staff.map((s) => (
            <button key={s._id} className={`cot-pp-item ${value === s._id ? 'is-on' : ''}`}
                    onClick={() => { onChange?.(s._id); setOpen(false) }}>
              <CotAvatar name={s.name} size={22}/>
              <span>{s.name}</span>
              {value === s._id && <I.check size={14} style={{ marginLeft: 'auto', color: '#0F766E' }}/>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Format helpers ───────────────────────────────────────────────────────────

export function fmtMoney(n: number | null | undefined, ccy = 'USD'): string {
  if (n == null || isNaN(n)) return '—'
  const sym = ccy === 'EUR' ? '€' : ccy === 'S/.' ? 'S/' : '$'
  return `${sym} ${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null) return '—'
  return `${Number(n).toFixed(1)}%`
}

// ─── Line math (client-side estimate) ────────────────────────────────────────

export function lineMath(line: LineItem) {
  const item = skuLookup(line.sku)
  const gross = line.listPrice * line.qty
  const afterSpk = gross * line.discountFactor
  const net = afterSpk * (1 - line.specialDiscount / 100)
  const finalPriceUnit = afterSpk * line.importFactor * line.marginFactor * (1 - line.specialDiscount / 100)
  const finalTotal = finalPriceUnit * line.qty
  return { gross, net, finalPriceUnit, finalTotal, item }
}

// ─── Status badge ────────────────────────────────────────────────────────────

const STATUS_CLS: Record<string, string> = {
  'Preparado':   'cot-status-preparado',
  'Responsable': 'cot-status-responsable',
  'Selección':   'cot-status-seleccion',
  'Data Sheets': 'cot-status-datasheets',
  'Aprobado C':  'cot-status-aprobado',
  'Servicios':   'cot-status-servicios',
  'Manager':     'cot-status-manager',
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={`cot-status ${STATUS_CLS[status] ?? 'cot-status-preparado'}`}>{status}</span>
}

// ─── Toast ────────────────────────────────────────────────────────────────────

export function CotToast({ msg, onDone }: { msg: string | null; onDone: () => void }) {
  useEffect(() => {
    if (!msg) return
    const t = setTimeout(onDone, 2800)
    return () => clearTimeout(t)
  }, [msg, onDone])
  if (!msg) return null
  return <div className="cot-toast">{msg}</div>
}
