import { useState, useEffect, useRef, useCallback } from 'react'
import ReactDOM from 'react-dom'
import { Icon } from '../../../components/ui'
import {
  TIPOS, getTipo,
  fmtDateLong, daysInMonth, isoDate, countWorkdays,
  calcDisponible, cumplioPrimerAnio,
  type Solicitud, type VacEmployee,
} from '../data/vacacionesData'

// ─── Mini Calendar ────────────────────────────────────────────────────────────
interface MiniCalProps {
  year: number; month: number
  rangeStart: string; rangeEnd: string
  onPickDay: (iso: string) => void
  busyDates?: Record<string, string>
}

function MiniCalendar({ year, month, rangeStart, rangeEnd, onPickDay, busyDates = {} }: MiniCalProps) {
  const first    = new Date(year, month, 1).getDay()
  const firstMon = (first + 6) % 7
  const dim      = daysInMonth(year, month)
  const cells: (number | null)[] = []
  for (let i = 0; i < firstMon; i++) cells.push(null)
  for (let d = 1; d <= dim; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const today = new Date()
  const heads = ['L','M','X','J','V','S','D']

  return (
    <div className="vac-mini-cal">
      {heads.map(h => <div key={h} className="vac-mini-cal__head">{h}</div>)}
      {cells.map((d, i) => {
        if (d === null) return <div key={i} className="vac-mini-cal__day vac-mini-cal__day--empty" />
        const iso  = isoDate(year, month, d)
        const dow  = new Date(year, month, d).getDay()
        const isWE = dow === 0 || dow === 6
        const isTod = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d
        let cls = 'vac-mini-cal__day'
        if (isWE)    cls += ' vac-mini-cal__day--weekend'
        if (isTod)   cls += ' vac-mini-cal__day--today'
        if (rangeStart && rangeEnd && iso >= rangeStart && iso <= rangeEnd) cls += ' vac-mini-cal__day--in-range'
        if (iso === rangeStart) cls += ' vac-mini-cal__day--range-start'
        if (iso === rangeEnd)   cls += ' vac-mini-cal__day--range-end'
        if (busyDates[iso])    cls += ' vac-mini-cal__day--holiday'
        return (
          <div key={i} className={cls} onClick={() => onPickDay(iso)} title={busyDates[iso]}>{d}</div>
        )
      })}
    </div>
  )
}

// ─── Type Picker ──────────────────────────────────────────────────────────────
function TypePicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div className="vac-type-picker">
      {Object.values(TIPOS).map(t => (
        <button
          key={t.id}
          type="button"
          className={`vac-type-opt${value === t.id ? ' vac-type-opt--active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          <div className="vac-type-opt__swatch" style={{ background: t.color }} />
          <div>
            <div className="vac-type-opt__label">{t.label}</div>
            <div className="vac-type-opt__meta">{t.descuenta ? 'Descuenta saldo' : t.gozaSueldo ? 'Sin descuento' : 'Sin goce'}</div>
          </div>
        </button>
      ))}
    </div>
  )
}

// ─── Searchable Employee Combo ────────────────────────────────────────────────
interface ComboProps {
  value: string
  onChange: (id: string) => void
  options: VacEmployee[]
  placeholder?: string
}

function EmpCombo({ value, onChange, options, placeholder = 'Seleccionar…' }: ComboProps) {
  const [open, setOpen]       = useState(false)
  const [search, setSearch]   = useState('')
  const [pos, setPos]         = useState<{ top: number; left: number; width: number } | null>(null)
  const triggerRef  = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef    = useRef<HTMLInputElement>(null)

  const filtered = options.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.role.toLowerCase().includes(search.toLowerCase())
  )

  const selected = options.find(e => e.id === value)

  const handleClose = useCallback(() => {
    setOpen(false)
    setSearch('')
    setPos(null)
  }, [])

  const handleOpen = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width })
    }
    setOpen(true)
    setSearch('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleSelect = useCallback((id: string) => {
    onChange(id)
    handleClose()
  }, [onChange, handleClose])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(target))
      ) {
        handleClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [handleClose])

  const dropdown = open && pos ? ReactDOM.createPortal(
    <div
      ref={dropdownRef}
      className="vac-combo__dropdown"
      style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, right: 'auto', zIndex: 1000 }}
    >
      <div className="vac-combo__search">
        <Icon name="search" size={13} style={{ color: 'var(--fg-muted)', flexShrink: 0 }} />
        <input
          ref={inputRef}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar colaborador…"
        />
      </div>
      <div className="vac-combo__list">
        {filtered.length === 0 && (
          <div className="vac-combo__empty">Sin resultados</div>
        )}
        {filtered.map(e => (
          <div
            key={e.id}
            className={`vac-combo__item${e.id === value ? ' vac-combo__item--selected' : ''}`}
            onClick={() => handleSelect(e.id)}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div>{e.name}</div>
              <div className="vac-combo__item-sub">{e.role}</div>
            </div>
            {e.id === value && <Icon name="check" size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
          </div>
        ))}
      </div>
    </div>,
    document.body
  ) : null

  return (
    <div className="vac-combo">
      <button
        ref={triggerRef}
        type="button"
        className={`vac-combo__trigger${open ? ' vac-combo__trigger--open' : ''}`}
        onClick={handleOpen}
      >
        {selected ? (
          <span style={{ flex: 1, textAlign: 'left' }}>
            <span style={{ fontWeight: 500 }}>{selected.name}</span>
            <span style={{ color: 'var(--fg-muted)', marginLeft: 6, fontSize: 'var(--fs-xs)' }}>{selected.role}</span>
          </span>
        ) : (
          <span style={{ flex: 1, color: 'var(--fg-muted)' }}>{placeholder}</span>
        )}
        <Icon name="chevron" size={14} className={`vac-combo__chevron${open ? ' vac-combo__chevron--open' : ''}`} />
      </button>
      {dropdown}
    </div>
  )
}

// ─── Request Modal ────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: Omit<Solicitud, 'id' | 'estado' | 'solicitada' | 'aprobador' | 'nivel'>) => void
  employees?: VacEmployee[]
  feriados?: Record<string, string>
}

export function RequestModal({ open, onClose, onSubmit, employees: empsProp, feriados = {} }: ModalProps) {
  const empList = empsProp ?? []
  const today   = new Date()
  const todayIso = isoDate(today.getFullYear(), today.getMonth(), today.getDate())

  // ── Animation state ──────────────────────────────────────────────────────
  const [mounted,  setMounted]  = useState(false)
  const [closing,  setClosing]  = useState(false)

  useEffect(() => {
    if (open) {
      setMounted(true)
      setClosing(false)
    } else if (mounted) {
      setClosing(true)
      const t = setTimeout(() => { setMounted(false); setClosing(false) }, 180)
      return () => clearTimeout(t)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Form state ───────────────────────────────────────────────────────────
  const [empId,         setEmpId]         = useState(() => empList[0]?.id ?? '')
  const [tipo,          setTipo]          = useState('vacaciones')
  const [desde,         setDesde]         = useState(todayIso)
  const [hasta,         setHasta]         = useState(todayIso)
  const [medioDia,      setMedioDia]      = useState(false)
  const [motivo,        setMotivo]        = useState('')
  const [responsableId, setResponsableId] = useState('')
  const [pickStage,     setPickStage]     = useState<'start' | 'end'>('start')
  const [calYear,       setCalYear]       = useState(today.getFullYear())
  const [calMonth,      setCalMonth]      = useState(today.getMonth())

  useEffect(() => {
    if (empList.length > 0 && !empId) setEmpId(empList[0].id)
  }, [empList.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setEmpId(empList[0]?.id ?? '')
      setTipo('vacaciones')
      setDesde(todayIso)
      setHasta(todayIso)
      setMedioDia(false)
      setMotivo('')
      setResponsableId('')
      setPickStage('start')
      setCalYear(today.getFullYear())
      setCalMonth(today.getMonth())
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted) return null

  const emp           = empList.find(e => e.id === empId) ?? empList[0]
  const tipoMeta      = getTipo(tipo)!
  const workdays      = countWorkdays(desde, hasta)
  const isSingleDay   = desde === hasta
  const dias          = medioDia ? (workdays >= 1 ? 0.5 : 0) : workdays
  const disponible    = emp ? calcDisponible(emp) : 0
  const menosDeUnAnio = emp ? !cumplioPrimerAnio(emp) && !!emp.ingreso : false

  const onPick = (iso: string) => {
    if (pickStage === 'start') { setDesde(iso); setHasta(iso); setPickStage('end') }
    else {
      if (iso < desde) { setDesde(iso); setHasta(desde) } else setHasta(iso)
      setPickStage('start')
      if (iso !== desde) setMedioDia(false)
    }
  }

  const prevM = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1) } else setCalMonth(calMonth - 1) }
  const nextM = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1) } else setCalMonth(calMonth + 1) }

  const submit = () => {
    onSubmit({
      empId, tipo, desde, hasta: medioDia ? desde : hasta, dias,
      medioDia: medioDia || undefined,
      motivo: motivo || tipoMeta.label,
      responsableId: responsableId || null,
    })
    onClose()
  }

  const MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  // Responsables: todos los empleados excepto el propio solicitante
  const responsableOpts = empList.filter(e => e.id !== empId)

  return (
    <div
      className={`vac-modal-overlay${closing ? ' vac-modal-overlay--closing' : ''}`}
      onClick={onClose}
    >
      <div
        className={`vac-modal${closing ? ' vac-modal--closing' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="vac-modal__head">
          <h3 className="vac-modal__title">Nueva solicitud de ausencia</h3>
          <p className="vac-modal__sub">Registra una solicitud en nombre de un colaborador. Se enviará al líder directo para aprobación.</p>
        </div>

        <div className="vac-modal__body">
          {/* Colaborador */}
          <div className="field">
            <label className="field__label">Colaborador</label>
            <EmpCombo
              value={empId}
              onChange={setEmpId}
              options={empList}
              placeholder="Seleccionar colaborador…"
            />
            <div className="field__hint">
              {menosDeUnAnio ? (
                <span style={{ color: disponible < 0 ? 'var(--danger)' : 'var(--warning)' }}>
                  Menos de 1 año — saldo disponible:{' '}
                  <strong>{disponible} días</strong>
                  {disponible < 0
                    ? ` · ${Math.abs(disponible)} días en adelanto`
                    : ' · las solicitudes contarán como adelanto'}
                </span>
              ) : (
                <>
                  Saldo disponible:{' '}
                  <strong style={{ color: disponible < 0 ? 'var(--danger)' : 'var(--fg)' }}>{disponible} días</strong>
                  {' · '}{emp?.tomados ?? 0} tomados · {emp?.pendientes ?? 0} pendientes
                </>
              )}
            </div>
          </div>

          {/* Tipo */}
          <div className="field">
            <label className="field__label">Tipo de ausencia</label>
            <TypePicker value={tipo} onChange={setTipo} />
          </div>

          {/* Fechas */}
          <div className="field">
            <label className="field__label">Fechas</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <input className="input" readOnly value={fmtDateLong(desde)} />
                <div className="field__hint">Desde</div>
              </div>
              <div>
                <input className="input" readOnly value={fmtDateLong(hasta)} />
                <div className="field__hint">Hasta</div>
              </div>
            </div>
            <div style={{ marginTop: 10, padding: 14, background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <button className="btn btn--ghost btn--sm" type="button" onClick={prevM}><Icon name="chevLeft" size={14} /></button>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{MESES_ES[calMonth]} {calYear}</span>
                <button className="btn btn--ghost btn--sm" type="button" onClick={nextM}><Icon name="chevron" size={14} /></button>
              </div>
              <MiniCalendar year={calYear} month={calMonth} rangeStart={desde} rangeEnd={hasta} onPickDay={onPick} busyDates={feriados} />
              <div className="field__hint" style={{ marginTop: 8 }}>
                {medioDia
                  ? <><strong style={{ color: 'var(--fg)' }}>½ día hábil</strong></>
                  : <>Días hábiles seleccionados: <strong style={{ color: 'var(--fg)' }}>{dias}</strong></>
                }
                {tipoMeta.descuenta && disponible - dias < 0 && (
                  <span style={{ color: menosDeUnAnio && disponible >= 0 ? 'var(--warning)' : 'var(--danger)', marginLeft: 8 }}>
                    · {menosDeUnAnio ? 'Se registrará como adelanto' : 'Excede saldo disponible'}
                  </span>
                )}
                {!medioDia && (
                  <span style={{ marginLeft: 8, color: 'var(--fg-muted)' }}>
                    {pickStage === 'start' ? '— Selecciona fecha de inicio' : '— Selecciona fecha de fin'}
                  </span>
                )}
              </div>
            </div>

            {/* Medio día */}
            {isSingleDay && workdays >= 1 && (
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, marginTop: 10,
                  padding: '10px 12px', borderRadius: 8,
                  background: medioDia ? 'var(--accent-soft)' : 'var(--surface-2)',
                  border: `1px solid ${medioDia ? 'var(--accent)' : 'var(--border)'}`,
                  cursor: 'pointer',
                }}
                onClick={() => setMedioDia(v => !v)}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                  border: `2px solid ${medioDia ? 'var(--accent)' : 'var(--border-strong)'}`,
                  background: medioDia ? 'var(--accent)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {medioDia && <Icon name="check" size={11} style={{ color: '#fff' }} />}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>Solo medio día</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                    Se descontará 0.5 días del saldo en lugar de 1 día completo
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Responsable */}
          <div className="field">
            <label className="field__label">
              Responsable de aprobar
              <span style={{ fontWeight: 400, color: 'var(--fg-muted)', marginLeft: 6 }}>— opcional</span>
            </label>
            <EmpCombo
              value={responsableId}
              onChange={setResponsableId}
              options={responsableOpts}
              placeholder="Sin responsable designado (se asigna automáticamente)"
            />
            {responsableId && (
              <div className="field__hint" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="checkCircle" size={12} style={{ color: 'var(--success)' }} />
                Solo este colaborador podrá aprobar la solicitud.
                <button
                  type="button"
                  style={{ background: 'none', border: 0, color: 'var(--fg-muted)', cursor: 'pointer', padding: 0, fontSize: 'var(--fs-xs)' }}
                  onClick={() => setResponsableId('')}
                >
                  Quitar
                </button>
              </div>
            )}
          </div>

          {/* Motivo */}
          <div className="field">
            <label className="field__label">Motivo (opcional)</label>
            <textarea className="textarea" placeholder="Describe brevemente el motivo de la ausencia" value={motivo} onChange={e => setMotivo(e.target.value)} />
          </div>
        </div>

        <div className="vac-modal__foot">
          <button className="btn" type="button" onClick={onClose}>Cancelar</button>
          <button className="btn btn--accent" type="button" onClick={submit} disabled={dias === 0}>
            Enviar solicitud
          </button>
        </div>
      </div>
    </div>
  )
}
