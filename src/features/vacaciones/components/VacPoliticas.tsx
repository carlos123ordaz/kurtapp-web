import { useState, useEffect } from 'react'
import { Icon } from '../../../components/ui'
import { TIPOS, fmtDateLong, type VacArea } from '../data/vacacionesData'
import {
  apiGetPoliticas, apiUpdatePoliticas, apiCreateFeriado, apiDeleteFeriado,
  type PoliticaConfig,
} from '../api/vacacionesApi'

interface Props {
  areas: VacArea[]
  feriados: Record<string, string>
}

const DEFAULT_CONFIG: PoliticaConfig = {
  diasBase:     30,
  periodo:      'aniversario',
  anticipacion: 15,
  maxBloque:    15,
  adelantar:    true,
  doblePaso:    true,
  autoAprobar:  false,
  notifEmail:   true,
  notifSlack:   true,
  tiposHabilitados: Object.values(TIPOS).map(t => ({ id: t.id, enabled: true })),
}

const FER_PAGE_SIZE = 10

export function VacPoliticas({ areas, feriados }: Props) {
  const [config,         setConfig]         = useState<PoliticaConfig>(DEFAULT_CONFIG)
  const [original,       setOriginal]       = useState<PoliticaConfig>(DEFAULT_CONFIG)
  const [loading,        setLoading]        = useState(true)
  const [saving,         setSaving]         = useState(false)
  const [toast,          setToast]          = useState<string | null>(null)
  const [localFeriados,  setLocalFeriados]  = useState<Record<string, string>>(feriados)
  const [newFerIso,      setNewFerIso]      = useState('')
  const [newFerNombre,   setNewFerNombre]   = useState('')
  const [addingFer,      setAddingFer]      = useState(false)
  const [ferPage,        setFerPage]        = useState(1)

  // Sincroniza feriados prop → estado local
  useEffect(() => { setLocalFeriados(feriados); setFerPage(1) }, [feriados])

  useEffect(() => {
    apiGetPoliticas()
      .then(data => {
        const knownIds = Object.values(TIPOS).map(t => t.id)
        const stored   = data.tiposHabilitados ?? []
        const merged   = knownIds.map(id => {
          const found = stored.find(h => h.id === id)
          return found ?? { id, enabled: true }
        })
        const full = { ...DEFAULT_CONFIG, ...data, tiposHabilitados: merged }
        setConfig(full)
        setOriginal(full)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  const set = <K extends keyof PoliticaConfig>(key: K, val: PoliticaConfig[K]) =>
    setConfig(prev => ({ ...prev, [key]: val }))

  const toggleTipo = (id: string) =>
    setConfig(prev => ({
      ...prev,
      tiposHabilitados: prev.tiposHabilitados.map(t =>
        t.id === id ? { ...t, enabled: !t.enabled } : t
      ),
    }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await apiUpdatePoliticas(config)
      const full = { ...DEFAULT_CONFIG, ...updated }
      setOriginal(full)
      setToast('Cambios guardados correctamente')
    } catch {
      setToast('Error al guardar cambios')
    } finally {
      setSaving(false)
    }
  }

  const handleAddFeriado = async () => {
    if (!newFerIso || !newFerNombre.trim()) return
    setAddingFer(true)
    try {
      const doc = await apiCreateFeriado(newFerIso, newFerNombre.trim())
      setLocalFeriados(prev => ({ ...prev, [doc.iso]: doc.nombre }))
      setNewFerIso('')
      setNewFerNombre('')
      setToast('Feriado agregado')
    } catch (err: any) {
      setToast(err?.response?.data?.message ?? 'Error al agregar feriado')
    } finally {
      setAddingFer(false)
    }
  }

  const handleDeleteFeriado = async (iso: string) => {
    try {
      await apiDeleteFeriado(iso)
      setLocalFeriados(prev => {
        const next = { ...prev }
        delete next[iso]
        return next
      })
      setToast('Feriado eliminado')
    } catch {
      setToast('Error al eliminar feriado')
    }
  }

  const handleDiscard = () => setConfig(original)

  const tipos = Object.values(TIPOS).map(t => {
    const hab = config.tiposHabilitados.find(h => h.id === t.id)
    return { ...t, enabled: hab?.enabled ?? true }
  })

  const feriadosSorted  = Object.entries(localFeriados).sort(([a], [b]) => a.localeCompare(b))
  const ferTotalPages   = Math.max(1, Math.ceil(feriadosSorted.length / FER_PAGE_SIZE))
  const ferPaginated    = feriadosSorted.slice((ferPage - 1) * FER_PAGE_SIZE, ferPage * FER_PAGE_SIZE)

  if (loading) {
    return (
      <div className="page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="vac-spinner" />
      </div>
    )
  }

  return (
    <div className="page" style={{ gap: 18 }}>
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 200,
          background: 'var(--fg)', color: 'var(--bg)', borderRadius: 8,
          padding: '10px 18px', fontSize: 13, fontWeight: 500,
          boxShadow: '0 4px 16px rgba(0,0,0,.25)',
        }}>
          {toast}
        </div>
      )}

      <div className="page__header">
        <div>
          <h1 className="page__title">Políticas y configuración</h1>
          <p className="page__desc">Define cómo opera el módulo de vacaciones para toda la organización.</p>
        </div>
        <div className="page__actions">
          <button className="btn" onClick={handleDiscard} disabled={saving}>Descartar cambios</button>
          <button className="btn btn--accent" onClick={handleSave} disabled={saving}>
            <Icon name="check" size={14} /> {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      <div className="vac-grid-2" style={{ alignItems: 'start' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Política general */}
          <div className="card">
            <div className="card__header">
              <div>
                <h3 className="card__title">Política general de vacaciones</h3>
                <div className="card__sub">aplica a todos los colaboradores salvo excepciones</div>
              </div>
            </div>
            <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="field__label">Días base por año</label>
                  <input
                    className="input" type="number" min={1} max={60}
                    value={config.diasBase}
                    onChange={e => set('diasBase', +e.target.value)}
                  />
                  <div className="field__hint">Cuota anual de vacaciones por colaborador.</div>
                </div>
                <div>
                  <label className="field__label">Período de cómputo</label>
                  <select className="select" value={config.periodo} onChange={e => set('periodo', e.target.value as PoliticaConfig['periodo'])}>
                    <option value="aniversario">Aniversario de ingreso</option>
                    <option value="calendario">Año calendario</option>
                    <option value="fiscal">Año fiscal (jul–jun)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="field__label">Anticipación mínima (días)</label>
                  <input
                    className="input" type="number" min={0} max={90}
                    value={config.anticipacion}
                    onChange={e => set('anticipacion', +e.target.value)}
                  />
                  <div className="field__hint">Cuánto antes debe solicitarse una vacación.</div>
                </div>
                <div>
                  <label className="field__label">Máximo por bloque (días)</label>
                  <input
                    className="input" type="number" min={1} max={60}
                    value={config.maxBloque}
                    onChange={e => set('maxBloque', +e.target.value)}
                  />
                  <div className="field__hint">Días seguidos máximos por solicitud.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tipos habilitados */}
          <div className="card">
            <div className="card__header"><h3 className="card__title">Tipos de ausencia habilitados</h3></div>
            <div className="card__body--flush">
              {tipos.map(t => (
                <div key={t.id} className="vac-policy-row">
                  <div className="vac-legend-swatch" style={{ background: t.color, width: 14, height: 14, borderRadius: 3 }} />
                  <div className="vac-policy-row__info">
                    <div className="vac-policy-row__title">{t.label}</div>
                    <div className="vac-policy-row__desc">
                      {t.descuenta ? 'Descuenta del saldo anual' : 'No descuenta del saldo'} ·
                      {t.gozaSueldo ? ' con goce de sueldo' : ' sin goce de sueldo'}
                    </div>
                  </div>
                  <button
                    className={`vac-switch${t.enabled ? ' vac-switch--on' : ''}`}
                    onClick={() => toggleTipo(t.id)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Feriados */}
          <div className="card">
            <div className="card__header">
              <div>
                <h3 className="card__title">Feriados y días no laborables</h3>
                <div className="card__sub">calendario nacional peruano</div>
              </div>
            </div>
            <div className="card__body--flush">
              {ferPaginated.map(([iso, nombre]) => (
                <div key={iso} className="vac-policy-row">
                  <Icon name="calendar" size={16} style={{ color: 'var(--fg-muted)', flexShrink: 0 }} />
                  <div className="vac-policy-row__info">
                    <div className="vac-policy-row__title">{nombre}</div>
                    <div className="vac-policy-row__desc">{fmtDateLong(iso)}</div>
                  </div>
                  <button className="vac-muted-link" onClick={() => handleDeleteFeriado(iso)}>
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              ))}

              {/* Paginación feriados */}
              {ferTotalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid var(--border-soft)', fontSize: 'var(--fs-sm)' }}>
                  <span style={{ color: 'var(--fg-muted)' }}>Página {ferPage} de {ferTotalPages} · {feriadosSorted.length} feriados</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn--ghost btn--sm" disabled={ferPage === 1} onClick={() => setFerPage(p => p - 1)}>Anterior</button>
                    <button className="btn btn--ghost btn--sm" disabled={ferPage >= ferTotalPages} onClick={() => setFerPage(p => p + 1)}>Siguiente</button>
                  </div>
                </div>
              )}

              {/* Agregar feriado */}
              <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border-soft)', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label className="field__label" style={{ fontSize: 11 }}>Fecha (YYYY-MM-DD)</label>
                  <input
                    className="input" style={{ height: 32, fontSize: 13 }}
                    placeholder="2026-10-08"
                    value={newFerIso}
                    onChange={e => setNewFerIso(e.target.value)}
                  />
                </div>
                <div style={{ flex: 2 }}>
                  <label className="field__label" style={{ fontSize: 11 }}>Nombre del feriado</label>
                  <input
                    className="input" style={{ height: 32, fontSize: 13 }}
                    placeholder="Nombre del feriado"
                    value={newFerNombre}
                    onChange={e => setNewFerNombre(e.target.value)}
                  />
                </div>
                <button
                  className="btn btn--sm btn--accent"
                  onClick={handleAddFeriado}
                  disabled={addingFer || !newFerIso || !newFerNombre.trim()}
                >
                  <Icon name="plus" size={12} /> Agregar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Flujo de aprobación */}
          <div className="card">
            <div className="card__header"><h3 className="card__title">Flujo de aprobación</h3></div>
            <div className="card__body--flush">
              {([
                {
                  icon: 'users', title: 'Aprobación de líder directo',
                  desc: 'Cada solicitud requiere el visto bueno del líder asignado.',
                  on: true, fixed: true, onChange: undefined,
                },
                {
                  icon: 'shield', title: 'Doble paso con RR.HH.',
                  desc: 'Tras el líder, RR.HH. valida ausencias mayores a 5 días.',
                  on: config.doblePaso, fixed: false, onChange: () => set('doblePaso', !config.doblePaso),
                },
                {
                  icon: 'checkCircle', title: 'Auto-aprobar permisos cortos (≤ 1 día)',
                  desc: 'Permisos con goce de 1 día se aprueban automáticamente.',
                  on: config.autoAprobar, fixed: false, onChange: () => set('autoAprobar', !config.autoAprobar),
                },
                {
                  icon: 'calendar', title: 'Adelantar días al siguiente periodo',
                  desc: 'Permite tomar vacaciones que aún no se han devengado.',
                  on: config.adelantar, fixed: false, onChange: () => set('adelantar', !config.adelantar),
                },
              ] as const).map(row => (
                <div key={row.title} className="vac-policy-row">
                  <Icon name={row.icon} size={16} style={{ color: 'var(--fg-muted)', flexShrink: 0 }} />
                  <div className="vac-policy-row__info">
                    <div className="vac-policy-row__title">{row.title}</div>
                    <div className="vac-policy-row__desc">{row.desc}</div>
                  </div>
                  <button
                    className={`vac-switch${row.on ? ' vac-switch--on' : ''}`}
                    onClick={row.onChange}
                    disabled={row.fixed}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Notificaciones */}
          <div className="card">
            <div className="card__header"><h3 className="card__title">Notificaciones</h3></div>
            <div className="card__body--flush">
              {([
                {
                  title: 'Email al líder',
                  desc: 'Avisa cuando hay una solicitud por revisar.',
                  on: config.notifEmail, onChange: () => set('notifEmail', !config.notifEmail),
                },
                {
                  title: 'Mensaje en Slack',
                  desc: 'Notifica al canal #equipo cuando un colaborador inicia ausencia.',
                  on: config.notifSlack, onChange: () => set('notifSlack', !config.notifSlack),
                },
                {
                  title: 'Resumen diario para RR.HH.',
                  desc: 'Email con ausencias del día y solicitudes pendientes.',
                  on: true, onChange: undefined,
                },
              ] as const).map(row => (
                <div key={row.title} className="vac-policy-row">
                  <div className="vac-policy-row__info">
                    <div className="vac-policy-row__title">{row.title}</div>
                    <div className="vac-policy-row__desc">{row.desc}</div>
                  </div>
                  <button className={`vac-switch${row.on ? ' vac-switch--on' : ''}`} onClick={row.onChange} />
                </div>
              ))}
            </div>
          </div>

          {/* Excepciones por área */}
          <div className="card">
            <div className="card__header">
              <div>
                <h3 className="card__title">Excepciones de áreas</h3>
                <div className="card__sub">políticas distintas por área</div>
              </div>
            </div>
            <div className="card__body--flush">
              {areas.map(a => (
                <div key={a.id} className="vac-policy-row">
                  <div className="vac-legend-swatch" style={{ background: a.color, width: 14, height: 14, borderRadius: 3 }} />
                  <div className="vac-policy-row__info">
                    <div className="vac-policy-row__title">{a.label}</div>
                    <div className="vac-policy-row__desc">Política estándar</div>
                  </div>
                  <button className="vac-muted-link">Editar</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
