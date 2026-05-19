import axios from 'axios'

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000') + '/api'

const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const orig = error.config
    if (error.response?.status === 401 && !orig._retry) {
      orig._retry = true
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) throw new Error('No refresh token')
        const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken })
        const { accessToken } = res.data
        localStorage.setItem('accessToken', accessToken)
        orig.headers.Authorization = `Bearer ${accessToken}`
        return api(orig)
      } catch {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default api
