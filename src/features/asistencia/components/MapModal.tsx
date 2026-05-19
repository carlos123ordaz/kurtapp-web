import React from 'react'
import { useJsApiLoader, GoogleMap, Marker, Polyline } from '@react-google-maps/api'
import { Icon, Badge } from '../../../components/ui'

interface MapModalProps {
  userName: string
  dia: number
  mes: string
  latitude_entrada?: number
  longitude_entrada?: number
  latitude_salida?: number
  longitude_salida?: number
  entrada?: string
  salida?: string
  valido_entrada?: boolean
  valido_salida?: boolean
  horas?: number
  onClose: () => void
}

const GOOGLE_MAPS_API_KEY = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ?? ''

function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): string {
  const R = 6371e3
  const p1 = lat1 * Math.PI / 180, p2 = lat2 * Math.PI / 180
  const dp = (lat2 - lat1) * Math.PI / 180, dl = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2
  const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return d < 1000 ? `${d.toFixed(0)} m` : `${(d / 1000).toFixed(2)} km`
}

const MapContent: React.FC<Omit<MapModalProps, 'onClose' | 'userName' | 'dia' | 'mes'>> = ({
  latitude_entrada, longitude_entrada, latitude_salida, longitude_salida,
  entrada, salida, valido_entrada, valido_salida, horas,
}) => {
  const hasEntry = latitude_entrada != null && longitude_entrada != null
  const hasExit = latitude_salida != null && longitude_salida != null

  const center = React.useMemo(() => {
    if (hasEntry && hasExit) return { lat: (latitude_entrada! + latitude_salida!) / 2, lng: (longitude_entrada! + longitude_salida!) / 2 }
    if (hasEntry) return { lat: latitude_entrada!, lng: longitude_entrada! }
    if (hasExit) return { lat: latitude_salida!, lng: longitude_salida! }
    return { lat: -12.0464, lng: -77.0428 }
  }, [hasEntry, hasExit, latitude_entrada, longitude_entrada, latitude_salida, longitude_salida])

  const onLoad = React.useCallback((map: google.maps.Map) => {
    if (hasEntry && hasExit) {
      const bounds = new google.maps.LatLngBounds()
      bounds.extend({ lat: latitude_entrada!, lng: longitude_entrada! })
      bounds.extend({ lat: latitude_salida!, lng: longitude_salida! })
      map.fitBounds(bounds)
      google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
        if ((map.getZoom() ?? 0) > 17) map.setZoom(17)
      })
    }
  }, [hasEntry, hasExit, latitude_entrada, longitude_entrada, latitude_salida, longitude_salida])

  const polylinePath = hasEntry && hasExit
    ? [{ lat: latitude_entrada!, lng: longitude_entrada! }, { lat: latitude_salida!, lng: longitude_salida! }]
    : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stats row */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {horas != null && (
          <span style={{ padding: '4px 10px', borderRadius: 20, background: 'oklch(0.94 0.06 155)', color: 'oklch(0.35 0.1 155)', fontSize: 'var(--fs-xs)', fontWeight: 600 }}>
            {horas.toFixed(2)}h trabajadas
          </span>
        )}
        {hasEntry && hasExit && (
          <span style={{ padding: '4px 10px', borderRadius: 20, background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: 'var(--fs-xs)', fontWeight: 600 }}>
            Distancia: {calcDistance(latitude_entrada!, longitude_entrada!, latitude_salida!, longitude_salida!)}
          </span>
        )}
      </div>

      {/* Map */}
      {(hasEntry || hasExit) ? (
        <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <GoogleMap mapContainerStyle={{ width: '100%', height: 380 }} center={center} zoom={16} onLoad={onLoad}
            options={{ streetViewControl: false, mapTypeControl: true, fullscreenControl: true }}>
            {hasEntry && (
              <Marker position={{ lat: latitude_entrada!, lng: longitude_entrada! }}
                icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' }} title="Entrada" />
            )}
            {hasExit && (
              <Marker position={{ lat: latitude_salida!, lng: longitude_salida! }}
                icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' }} title="Salida" />
            )}
            {polylinePath.length === 2 && (
              <Polyline path={polylinePath} options={{ strokeColor: 'var(--accent)', strokeOpacity: 0.7, strokeWeight: 3 }} />
            )}
          </GoogleMap>
        </div>
      ) : (
        <div className="empty">Sin datos de ubicación para esta asistencia.</div>
      )}

      {/* Location details */}
      <div style={{ display: 'grid', gridTemplateColumns: hasEntry && hasExit ? '1fr 1fr' : '1fr', gap: 12 }}>
        {hasEntry && (
          <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: 'oklch(0.97 0.04 155)', border: '1px solid oklch(0.85 0.08 155)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'oklch(0.55 0.14 155)', flexShrink: 0 }} />
              <span style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>Entrada</span>
              <Badge kind={valido_entrada ? 'success' : 'danger'} dot={false}>{valido_entrada ? 'Válida' : 'Inválida'}</Badge>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 'var(--fs-xs)', color: 'var(--fg-2)', marginBottom: 4 }}>
              <Icon name="clock" size={12} /> {entrada ?? '—'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'monospace' }}>
              {latitude_entrada?.toFixed(6)}, {longitude_entrada?.toFixed(6)}
            </div>
            <a href={`https://www.google.com/maps?q=${latitude_entrada},${longitude_entrada}`} target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 11, color: 'var(--accent)', textDecoration: 'none' }}>
              <Icon name="map" size={11} /> Abrir en Maps
            </a>
          </div>
        )}
        {hasExit && (
          <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: 'oklch(0.97 0.04 25)', border: '1px solid oklch(0.85 0.08 25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'oklch(0.55 0.14 25)', flexShrink: 0 }} />
              <span style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>Salida</span>
              <Badge kind={valido_salida ? 'success' : 'danger'} dot={false}>{valido_salida ? 'Válida' : 'Inválida'}</Badge>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 'var(--fs-xs)', color: 'var(--fg-2)', marginBottom: 4 }}>
              <Icon name="clock" size={12} /> {salida ?? '—'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'monospace' }}>
              {latitude_salida?.toFixed(6)}, {longitude_salida?.toFixed(6)}
            </div>
            <a href={`https://www.google.com/maps?q=${latitude_salida},${longitude_salida}`} target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 11, color: 'var(--accent)', textDecoration: 'none' }}>
              <Icon name="map" size={11} /> Abrir en Maps
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

export const MapModal: React.FC<MapModalProps> = ({ userName, dia, mes, onClose, ...rest }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    id: 'google-map-script',
  })

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 51, margin: 0, width: 'min(96vw, 700px)' }}>
        <div className="modal__header">
          <div>
            <h2 className="modal__title">Ubicaciones de asistencia</h2>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)', marginTop: 2 }}>{userName} · {dia} de {mes}</div>
          </div>
          <button className="btn btn--ghost btn--icon" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>
        <div className="modal__body">
          {!GOOGLE_MAPS_API_KEY || loadError ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: '10px 14px', background: 'var(--warning-soft)', border: '1px solid var(--warning-border)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--fs-sm)', color: 'var(--warning)' }}>
                Configura <code>VITE_GOOGLE_MAPS_API_KEY</code> en <code>.env</code> para ver el mapa interactivo.
              </div>
              {/* Fallback: only show details + links */}
              <MapContent {...rest} />
            </div>
          ) : !isLoaded ? (
            <div className="empty">Cargando mapa…</div>
          ) : (
            <MapContent {...rest} />
          )}
        </div>
        <div className="modal__footer">
          <button className="btn" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </>
  )
}
