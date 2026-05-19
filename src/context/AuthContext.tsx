import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../config/api'
import type { User, Role } from '../types'

interface AuthCtx {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isAdmin: boolean
  permissions: string[]
  hasPermission: (key: string) => boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  updateUser: (data: Partial<User>) => void
}

const AuthContext = createContext<AuthCtx | undefined>(undefined)

function decodeToken(token: string) {
  const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  const payload = JSON.parse(atob(b64.padEnd(b64.length + (4 - (b64.length % 4)) % 4, '=')))
  return { id: payload.userId ?? payload.sub }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [permissions, setPermissions] = useState<string[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const navigate = useNavigate()

  const extractPerms = (u: User) => {
    const role = u.role as Role | undefined
    if (role && typeof role === 'object') {
      setPermissions(role.permissions ?? [])
      setIsAdmin(role.isAdmin ?? false)
    } else {
      setPermissions([])
      setIsAdmin(false)
    }
  }

  const hasPermission = useCallback((key: string) => isAdmin || permissions.includes(key), [isAdmin, permissions])

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return
      const { id } = decodeToken(token)
      const { data } = await api.get(`/users/${id}`)
      setUser(data)
      extractPerms(data)
    } catch {
      logout()
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { checkAuth() }, [checkAuth])

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    const { id } = decodeToken(data.accessToken)
    const userRes = await api.get(`/users/${id}`)
    setUser(userRes.data)
    extractPerms(userRes.data)
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setUser(null)
    setPermissions([])
    setIsAdmin(false)
    navigate('/login')
  }

  const updateUser = (data: Partial<User>) => {
    if (user) setUser({ ...user, ...data })
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, isAdmin, permissions, hasPermission, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
