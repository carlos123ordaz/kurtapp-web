import React, { useState } from 'react'
import { Icon } from '../../../components/ui'
import asistenciaService from '../services/asistenciaService'

interface EditAttendanceModalProps {
  recordId: string
  userName: string
  dia: number
  mes: string
  year: number
  month: number
  entradaTime?: string   // HH:mm
  salidaTime?: string    // HH:mm
  validoEntrada?: boolean
  validoSalida?: boolean
  onClose: () => void
  onSaved: () => void
}

export const EditAttendanceModal: React.FC<EditAttendanceModalProps> = ({
  recordId, userName, dia, mes, year, month,
  entradaTime, salidaTime, validoEntrada, validoSalida,
  onClose, onSaved,
}) => {
  const [entrada, setEntrada] = useState(entradaTime ?? '')
  const [salida, setSalida] = useState(salidaTime ?? '')
  const [validaEntrada, setValidaEntrada] = useState(validoEntrada ?? true)
  const [validaSalida, setValidaSalida] = useState(validoSalida ?? true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const buildISO = (time: string): string => {
    const [h, m] = time.split(':').map(Number)
    // Build the ISO string in Lima timezone (UTC-5) explicitly to avoid browser TZ drift
    const limaISO = `${year}-${String(month + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00-05:00`
    return new Date(limaISO).toISOString()
  }

  const handleSave = async () => {
    setError(null)
    setLoading(true)
    try {
      const payload: Record<string, unknown> = {
        valido_entrada: validaEntrada,
        valido_salida: validaSalida,
      }
      if (entrada) payload.entrada = buildISO(entrada)
      if (salida) payload.salida = buildISO(salida)
      await asistenciaService.update(recordId, payload as any)
      onSaved()
      onClose()
    } catch {
      setError('Error al guardar los cambios.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 51, margin: 0, maxWidth: 420 }}>
        <div className="modal__header">
          <div>
            <h2 className="modal__title">Editar marcación</h2>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)', marginTop: 2 }}>{userName} · {dia} de {mes}</div>
          </div>
          <button className="btn btn--ghost btn--icon" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>
        <div className="modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{ padding: '10px 14px', background: 'var(--danger-soft)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--fs-sm)', color: 'var(--danger)' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label className="field__label">Hora entrada</label>
              <input className="input" type="time" value={entrada} onChange={(e) => setEntrada(e.target.value)} />
            </div>
            <div className="field">
              <label className="field__label">Hora salida</label>
              <input className="input" type="time" value={salida} onChange={(e) => setSalida(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 'var(--fs-sm)' }}>
              <input type="checkbox" checked={validaEntrada} onChange={(e) => setValidaEntrada(e.target.checked)} />
              Entrada válida
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 'var(--fs-sm)' }}>
              <input type="checkbox" checked={validaSalida} onChange={(e) => setValidaSalida(e.target.checked)} />
              Salida válida
            </label>
          </div>
        </div>
        <div className="modal__footer">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn--primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </>
  )
}
