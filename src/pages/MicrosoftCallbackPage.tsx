import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

export const MicrosoftCallbackPage = () => {
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    const refresh = searchParams.get('refresh')
    const returnUrl = searchParams.get('returnUrl')
    if (token) localStorage.setItem('accessToken', token)
    if (refresh) localStorage.setItem('refreshToken', refresh)
    window.location.replace(returnUrl || '/')
  }, [searchParams])

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 40, height: 40,
          borderRadius: 10,
          background: 'var(--fg)',
          color: 'var(--surface)',
          display: 'grid',
          placeItems: 'center',
          fontWeight: 700,
          fontSize: 18,
        }}>C</div>
        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)' }}>Autenticando con Microsoft…</div>
      </div>
    </div>
  )
}
