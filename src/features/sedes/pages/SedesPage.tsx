import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GoogleMap, Marker, Circle } from '@react-google-maps/api'
import { Icon, Badge, Button } from '../../../components/ui'
import type { Sede } from '../../../types'
import sedeService, { googleMapsService, type PlaceSuggestion } from '../services/sedeService'

const RADIUS_SHORTCUTS = [50, 100, 200, 500]

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

interface SedeDrawerProps {
  mode: 'view' | 'edit' | 'create'
  sede?: Sede
  sedes: Sede[]
  onClose: () => void
  onSaved: () => void
  onSwitchEdit: () => void
}

const SedeDrawer: React.FC<SedeDrawerProps> = ({ mode, sede, sedes, onClose, onSaved, onSwitchEdit }) => {
  const [name, setName] = useState(sede?.nombre ?? '')
  const [addr, setAddr] = useState(sede?.direccion ?? '')
  const [lat, setLat] = useState(sede?.latitude ?? -12.0464)
  const [lng, setLng] = useState(sede?.longitude ?? -77.0428)
  const [radius, setRadius] = useState(sede?.radio ?? 100)
  const [active, setActive] = useState(sede?.active ?? true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [searching, setSearching] = useState(false)
  const skipSearch = useRef(false)
  const drawerMapRef = useRef<google.maps.Map | null>(null)

  const isView = mode === 'view'
  const title = mode === 'create' ? 'Nueva sede' : mode === 'edit' ? 'Editar sede' : (sede?.nombre ?? '')

  const overlapSede = useMemo(() => {
    if (isView) return null
    return sedes.find((s) => {
      if (s._id === sede?._id) return false
      return haversineDistance(lat, lng, s.latitude, s.longitude) < s.radio
    }) ?? null
  }, [lat, lng, sedes, sede, isView])

  // Autocomplete debounce
  useEffect(() => {
    if (isView) return
    if (skipSearch.current) { skipSearch.current = false; return }
    if (!addr || addr.trim().length < 3) { setSuggestions([]); setShowDropdown(false); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await googleMapsService.buscarSugerencias(addr, { lat, lng })
        setSuggestions(results)
        setShowDropdown(results.length > 0)
      } catch { /* ignore search errors */ }
      finally { setSearching(false) }
    }, 400)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addr])

  const handlePlaceSelect = async (s: PlaceSuggestion) => {
    setShowDropdown(false)
    setSearching(true)
    try {
      const details = await googleMapsService.getPlaceDetails(s.place_id)
      skipSearch.current = true
      setAddr(details.direccion)
      setLat(details.latitude)
      setLng(details.longitude)
      drawerMapRef.current?.panTo({ lat: details.latitude, lng: details.longitude })
    } catch {
      setError('No se pudo obtener la ubicación del lugar.')
    } finally {
      setSearching(false)
    }
  }

  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setLat(e.latLng.lat())
      setLng(e.latLng.lng())
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (overlapSede) {
      setError(`Las coordenadas caen dentro del radio de "${overlapSede.nombre}" (${overlapSede.radio}m).`)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const payload = { nombre: name, direccion: addr, latitude: lat, longitude: lng, radio: radius, active }
      if (mode === 'create') await sedeService.create(payload)
      else if (mode === 'edit') await sedeService.update(sede!._id, payload)
      onSaved()
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Error al guardar la sede.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      await sedeService.delete(sede!._id)
      onSaved()
      onClose()
    } catch {
      setError('Error al eliminar la sede.')
      setConfirmDelete(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <aside className="drawer">
        <div className="drawer__header">
          <div style={{ minWidth: 0, flex: 1 }}>
            {isView && sede && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Badge kind={sede.active ? 'success' : 'neutral'} dot={sede.active}>
                  {sede.active ? 'Activa' : 'Inactiva'}
                </Badge>
                <span className="mono" style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)' }}>
                  #{sede._id.slice(-8).toUpperCase()}
                </span>
              </div>
            )}
            {mode === 'edit' && sede && (
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)', marginBottom: 4, fontFamily: 'Geist Mono' }}>
                #{sede._id.slice(-8).toUpperCase()}{sede.createdAt ? ` · creada ${sede.createdAt.slice(0, 10)}` : ''}
              </div>
            )}
            <h2 style={{ margin: 0, fontSize: 'var(--fs-xl)', fontWeight: 600, letterSpacing: '-0.02em' }}>{title}</h2>
            {isView && sede && (
              <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)', marginTop: 4 }}>{sede.direccion}</div>
            )}
            {mode === 'create' && (
              <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)', marginTop: 4 }}>
                Registra una nueva ubicación física de la empresa
              </div>
            )}
          </div>
          <button className="btn btn--ghost btn--icon" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>

        <div className="drawer__body">
          {error && (
            <div style={{ padding: '10px 14px', background: 'var(--danger-soft)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--fs-sm)', color: 'var(--danger)', marginBottom: 16 }}>
              {error}
            </div>
          )}

          {confirmDelete && sede && (
            <div style={{ padding: 16, background: 'var(--danger-soft)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 'var(--fs-sm)', color: 'var(--danger)', marginBottom: 6 }}>
                ¿Eliminar esta sede?
              </div>
              <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-2)', marginBottom: 14 }}>
                Vas a eliminar <strong>{sede.nombre}</strong>. Esta acción no se puede deshacer.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn--sm" onClick={() => setConfirmDelete(false)}>Cancelar</button>
                <button className="btn btn--danger btn--sm" disabled={loading} onClick={handleDelete}>
                  <Icon name="trash" size={13} /> {loading ? 'Eliminando…' : 'Sí, eliminar'}
                </button>
              </div>
            </div>
          )}

          {isView && sede ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              {/* Mini-mapa real en modo vista */}
              <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', height: 220, border: '1px solid var(--border)' }}>
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={{ lat: sede.latitude, lng: sede.longitude }}
                  zoom={15}
                  options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false, zoomControl: false, gestureHandling: 'none' }}
                >
                  <Marker position={{ lat: sede.latitude, lng: sede.longitude }} />
                  <Circle
                    center={{ lat: sede.latitude, lng: sede.longitude }}
                    radius={sede.radio}
                    options={{ strokeColor: '#3b82f6', strokeOpacity: 0.8, strokeWeight: 2, fillColor: '#3b82f6', fillOpacity: 0.15, clickable: false }}
                  />
                </GoogleMap>
              </div>
              <div className="props">
                <div className="props__row"><span className="props__label">Dirección</span><span className="props__val">{sede.direccion}</span></div>
                <div className="props__row"><span className="props__label">Latitud</span><span className="props__val mono">{sede.latitude.toFixed(6)}°</span></div>
                <div className="props__row"><span className="props__label">Longitud</span><span className="props__val mono">{sede.longitude.toFixed(6)}°</span></div>
                <div className="props__row"><span className="props__label">Radio cobertura</span><span className="props__val"><span className="mono">{sede.radio}</span> metros</span></div>
                <div className="props__row"><span className="props__label">Estado</span><span className="props__val"><Badge kind={sede.active ? 'success' : 'neutral'} dot={sede.active}>{sede.active ? 'Activa' : 'Inactiva'}</Badge></span></div>
                <div className="props__row"><span className="props__label">Identificador</span><span className="props__val mono">#{sede._id.slice(-8).toUpperCase()}</span></div>
              </div>
              <div style={{ padding: 14, background: 'var(--accent-soft)', borderRadius: 8, border: '1px solid var(--accent-border)', fontSize: 'var(--fs-sm)', color: 'var(--fg-2)', display: 'flex', gap: 10 }}>
                <Icon name="target" size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }} />
                <div>El radio de <strong>{sede.radio}m</strong> determina si las marcaciones GPS son válidas.</div>
              </div>
            </div>
          ) : (
            <form id="sede-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div className="field">
                <label className="field__label">Nombre <span style={{ color: 'var(--fg-faint)' }}>(máx. 80)</span></label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value.slice(0, 80))} placeholder="p.ej. Sede Central Lima" maxLength={80} required autoFocus={mode === 'create'} />
                <div className="field__hint">{name.length}/80 caracteres</div>
              </div>

              {/* Campo dirección con autocomplete */}
              <div className="field" style={{ position: 'relative' }}>
                <label className="field__label">Dirección</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    value={addr}
                    onChange={(e) => setAddr(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                    placeholder="Buscar dirección…"
                    style={{ paddingLeft: 32, paddingRight: searching ? 32 : undefined }}
                    required
                    autoComplete="off"
                  />
                  <Icon name="search" size={14} className="muted" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  {searching && (
                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'Geist Mono' }}>…</span>
                  )}
                </div>
                {showDropdown && suggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-md)', zIndex: 100, maxHeight: 220, overflowY: 'auto', marginTop: 2 }}>
                    {suggestions.map((s) => (
                      <button
                        key={s.place_id}
                        type="button"
                        onMouseDown={() => handlePlaceSelect(s)}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%', textAlign: 'left', padding: '9px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--fs-sm)', color: 'var(--fg)', borderBottom: '1px solid var(--border-soft)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                      >
                        <Icon name="pin" size={13} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
                        <span style={{ lineHeight: 1.4 }}>
                          <span style={{ fontWeight: 500 }}>{s.description.split(',')[0]}</span>
                          <span style={{ color: 'var(--fg-muted)', fontSize: 'var(--fs-xs)' }}>{s.description.includes(',') ? ', ' + s.description.split(',').slice(1).join(',') : ''}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {addr && !searching && (
                  <div className="field__hint" style={{ color: 'var(--success, #16a34a)' }}>
                    {lat.toFixed(6)}, {lng.toFixed(6)}
                  </div>
                )}
              </div>

              {overlapSede && (
                <div style={{ padding: '10px 14px', background: 'oklch(0.97 0.025 75)', border: '1px solid oklch(0.84 0.07 75)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--fs-sm)', color: 'oklch(0.42 0.12 55)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <Icon name="target" size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    Esta ubicación cae dentro del radio de <strong>{overlapSede.nombre}</strong> ({overlapSede.radio}m). Ajusta el marcador para continuar.
                  </div>
                </div>
              )}

              {/* Mini-mapa real con marker arrastrable */}
              <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', height: 200, border: `1px solid ${overlapSede ? 'oklch(0.84 0.07 75)' : 'var(--border)'}` }}>
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={{ lat, lng }}
                  zoom={15}
                  onLoad={(map) => { drawerMapRef.current = map }}
                  options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false, zoomControl: true }}
                >
                  <Marker
                    position={{ lat, lng }}
                    draggable
                    onDragEnd={handleMarkerDragEnd}
                    icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png' }}
                  />
                  <Circle
                    center={{ lat, lng }}
                    radius={radius}
                    options={{ strokeColor: '#3b82f6', strokeOpacity: 0.7, strokeWeight: 2, fillColor: '#3b82f6', fillOpacity: 0.12, clickable: false }}
                  />
                </GoogleMap>
              </div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)', marginTop: -10 }}>
                Arrastra el pin para ajustar la posición exacta
              </div>

              <div className="field">
                <label className="field__label">Radio de cobertura <span style={{ color: 'var(--fg-faint)' }}>· 10–1000 m</span></label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input type="range" min={10} max={1000} step={10} value={radius} onChange={(e) => setRadius(+e.target.value)} style={{ flex: 1, accentColor: 'var(--accent)' }} />
                  <div style={{ width: 90, position: 'relative' }}>
                    <input className="input mono" type="number" min={10} max={1000} value={radius} onChange={(e) => setRadius(+e.target.value)} style={{ paddingRight: 26 }} />
                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--fg-muted)' }}>m</span>
                  </div>
                </div>
                <div className="range-shortcuts">
                  {RADIUS_SHORTCUTS.map((r) => (
                    <button key={r} type="button" className={`range-shortcut${radius === r ? ' range-shortcut--active' : ''}`} onClick={() => setRadius(r)}>{r}m</button>
                  ))}
                </div>
                <div className="field__hint">Área donde se validará la asistencia (10–1000m)</div>
              </div>
              <div className="field">
                <label className="field__label">Estado</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className={`filter-chip${active ? ' filter-chip--active' : ''}`} onClick={() => setActive(true)}>Activa</button>
                  <button type="button" className={`filter-chip${!active ? ' filter-chip--active' : ''}`} onClick={() => setActive(false)}>Inactiva</button>
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="drawer__footer">
          {isView ? (
            <>
              <button className="btn btn--danger" onClick={() => setConfirmDelete(true)} disabled={confirmDelete}>
                <Icon name="trash" size={14} /> Eliminar
              </button>
              <div style={{ flex: 1 }} />
              <button className="btn" onClick={onClose}>Cerrar</button>
              <button className="btn btn--primary" onClick={onSwitchEdit}>
                <Icon name="edit" size={14} /> Editar
              </button>
            </>
          ) : (
            <>
              <button className="btn" onClick={onClose}>Cancelar</button>
              <button type="submit" form="sede-form" className="btn btn--primary" disabled={loading || !!overlapSede}>
                {loading ? 'Guardando…' : mode === 'create' ? 'Crear sede' : 'Guardar cambios'}
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  )
}

export const SedesPage: React.FC = () => {
  const [sedes, setSedes] = useState<Sede[]>([])
  const [selId, setSelId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [drawer, setDrawer] = useState<{ mode: 'view' | 'edit' | 'create'; sede?: Sede } | null>(null)
  const [loading, setLoading] = useState(true)
  const mapRef = useRef<google.maps.Map | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await sedeService.getAll()
      setSedes(data)
      if (!selId && data.length > 0) setSelId(data[0]._id)
    } finally {
      setLoading(false)
    }
  }, [selId])

  useEffect(() => { load() }, [])

  const filtered = sedes.filter((s) =>
    (s.nombre ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (s.direccion ?? '').toLowerCase().includes(search.toLowerCase())
  )
  const selected = sedes.find((s) => s._id === selId)
  const activas = sedes.filter((s) => s.active).length

  const mapCenter = selected
    ? { lat: selected.latitude, lng: selected.longitude }
    : sedes.length > 0
      ? { lat: sedes[0].latitude, lng: sedes[0].longitude }
      : { lat: -12.0464, lng: -77.0428 }

  const handleMapLoad = (map: google.maps.Map) => {
    mapRef.current = map
    if (sedes.length > 1) {
      const bounds = new google.maps.LatLngBounds()
      sedes.forEach((s) => bounds.extend({ lat: s.latitude, lng: s.longitude }))
      map.fitBounds(bounds)
    }
  }

  const handleMarkerClick = (id: string) => {
    setSelId(id)
    const sede = sedes.find((s) => s._id === id)
    if (sede && mapRef.current) {
      mapRef.current.panTo({ lat: sede.latitude, lng: sede.longitude })
    }
  }

  return (
    <div className="page page--flush">
      <div className="sites">
        <div className="sites__list">
          <div className="sites__list-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <h1 style={{ margin: 0, fontSize: 'var(--fs-2xl)', fontWeight: 600, letterSpacing: '-0.02em' }}>Sedes</h1>
              <Button kind="primary" icon="plus" size="sm" onClick={() => setDrawer({ mode: 'create' })}>Nueva</Button>
            </div>
            <div className="sites__counts">
              <span><span className="sites__count-num">{sedes.length}</span>totales</span>
              <span className="dot" />
              <span><span className="sites__count-num">{activas}</span>activas</span>
              <span className="dot" />
              <span><span className="sites__count-num">{sedes.length - activas}</span>inactivas</span>
            </div>
            <div className="sites__search">
              <Icon name="search" size={14} className="muted" />
              <input placeholder="Buscar por nombre o dirección…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="sites__items">
            {loading ? (
              <div className="empty">Cargando…</div>
            ) : filtered.map((s) => (
              <div key={s._id} className={`site-item${selId === s._id ? ' site-item--active' : ''}`} onClick={() => setSelId(s._id)}>
                <div className="site-item__icon"><Icon name="pin" size={16} /></div>
                <div className="site-item__body">
                  <div className="site-item__name">
                    {s.nombre}
                    {!s.active && <Badge kind="neutral">Inactiva</Badge>}
                  </div>
                  <div className="site-item__addr">{s.direccion}</div>
                  <div className="site-item__meta">
                    <span>{s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}</span>
                    <span className="radius-chip"><Icon name="target" size={10} /> {s.radio}m</span>
                  </div>
                </div>
              </div>
            ))}
            {!loading && filtered.length === 0 && <div className="empty">Sin resultados</div>}
          </div>
        </div>

        {/* Map */}
        <div className="map-wrap" style={{ position: 'relative', overflow: 'hidden' }}>
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={mapCenter}
            zoom={14}
            onLoad={handleMapLoad}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: true,
              zoomControl: true,
            }}
          >
            {sedes.map((s) => (
              <React.Fragment key={s._id}>
                <Marker
                  position={{ lat: s.latitude, lng: s.longitude }}
                  onClick={() => handleMarkerClick(s._id)}
                  icon={{
                    url: s.active
                      ? 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                      : 'http://maps.google.com/mapfiles/ms/icons/grey.png',
                  }}
                  title={s.nombre}
                />
                <Circle
                  center={{ lat: s.latitude, lng: s.longitude }}
                  radius={s.radio}
                  options={{
                    strokeColor: s._id === selId ? '#3b82f6' : '#94a3b8',
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: s._id === selId ? '#3b82f6' : '#94a3b8',
                    fillOpacity: 0.15,
                    clickable: false,
                  }}
                />
              </React.Fragment>
            ))}
          </GoogleMap>

          {selected && (
            <div style={{ position: 'absolute', top: 18, left: 18, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, boxShadow: 'var(--shadow-md)', minWidth: 260, maxWidth: 320, zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 'var(--fs-md)', fontWeight: 600, letterSpacing: '-0.01em' }}>{selected.nombre}</div>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)', marginTop: 3 }}>{selected.direccion}</div>
                </div>
                <Badge kind={selected.active ? 'success' : 'neutral'} dot={selected.active}>{selected.active ? 'Activa' : 'Inactiva'}</Badge>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-soft)', fontSize: 'var(--fs-xs)' }}>
                <div>
                  <div style={{ color: 'var(--fg-muted)' }}>Radio</div>
                  <div className="mono" style={{ fontWeight: 500, marginTop: 2 }}>{selected.radio} m</div>
                </div>
                <div>
                  <div style={{ color: 'var(--fg-muted)' }}>Coordenadas</div>
                  <div className="mono" style={{ fontWeight: 500, marginTop: 2 }}>{selected.latitude.toFixed(4)}, {selected.longitude.toFixed(4)}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                <Button size="sm" icon="list" onClick={() => setDrawer({ mode: 'view', sede: selected })}>Ver detalle</Button>
                <Button size="sm" icon="edit" onClick={() => setDrawer({ mode: 'edit', sede: selected })}>Editar</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {drawer && (
        <SedeDrawer
          mode={drawer.mode}
          sede={drawer.sede}
          sedes={sedes}
          onClose={() => setDrawer(null)}
          onSaved={load}
          onSwitchEdit={() => setDrawer({ mode: 'edit', sede: drawer.sede })}
        />
      )}
    </div>
  )
}
