import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Icon } from '../components/ui'

const MicrosoftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 21 21" aria-hidden="true" style={{ flexShrink: 0 }}>
    <rect x="1" y="1" width="9" height="9" fill="#F25022" />
    <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
    <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
    <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
  </svg>
)

const API_BASE = (import.meta.env.VITE_API_URL as string ?? '').replace(/\/api$/, '')

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msLoading, setMsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleMicrosoft = () => {
    setMsLoading(true)
    window.location.href = `${API_BASE}/api/auth/microsoft/login`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login(email, password)
      navigate('/')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Credenciales incorrectas. Intenta de nuevo.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'grid',
      placeItems: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36, justifyContent: 'center' }}>
          <div style={{
            width: 40, height: 40,
            borderRadius: 10,
            background: 'var(--fg)',
            color: 'var(--surface)',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 700,
            fontSize: 18,
            letterSpacing: '-0.02em',
          }}>C</div>
          <div style={{ fontWeight: 700, fontSize: 'var(--fs-xl)', letterSpacing: '-0.02em' }}>Corsusa</div>
        </div>

        <div className="card" style={{ overflow: 'visible' }}>
          <div className="card__header" style={{ borderBottom: 'none', paddingBottom: 8 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 'var(--fs-xl)', fontWeight: 600, letterSpacing: '-0.02em' }}>
                Iniciar sesión
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)' }}>
                Panel de administración Corsusa
              </p>
            </div>
          </div>

          <div className="card__body">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && (
                <div style={{
                  display: 'flex',
                  gap: 8,
                  padding: '10px 14px',
                  background: 'var(--danger-soft)',
                  border: '1px solid var(--danger-border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--fs-sm)',
                  color: 'var(--danger)',
                  alignItems: 'center',
                }}>
                  <Icon name="alert" size={14} />
                  {error}
                </div>
              )}

              <div className="field">
                <label className="field__label">Correo electrónico</label>
                <input
                  className="input"
                  type="email"
                  placeholder="usuario@corsusa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="field">
                <label className="field__label">Contraseña</label>
                <input
                  className="input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn--primary"
                disabled={loading || msLoading}
                style={{ marginTop: 4, justifyContent: 'center', padding: '10px 16px' }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}>
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    Ingresando…
                  </span>
                ) : 'Iniciar sesión'}
              </button>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-faint)', whiteSpace: 'nowrap' }}>o acceso corporativo</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>

              <button
                type="button"
                className="btn"
                disabled={loading || msLoading}
                onClick={handleMicrosoft}
                style={{ justifyContent: 'center', padding: '9px 16px', gap: 10 }}
              >
                {msLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}>
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    Conectando…
                  </span>
                ) : (
                  <>
                    <MicrosoftIcon />
                    Continuar con Microsoft
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 'var(--fs-xs)', color: 'var(--fg-faint)', marginTop: 20 }}>
          Corsusa Admin © {new Date().getFullYear()}
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
