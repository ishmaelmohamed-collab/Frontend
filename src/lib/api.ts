import axios from 'axios'

/**
 * The single HTTP client. Until a backend exists, the mock API (src/mocks) answers
 * these requests inside the browser. Later: set VITE_API_URL and VITE_USE_MOCKS=false.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

let token: string | null = null
let onSignedOut: (() => void) | null = null

/** Called by the session: every request then carries the signed-in user's token. */
export function setAuth(next: string | null, signedOut: (() => void) | null = null) {
  token = next
  onSignedOut = signedOut
}

api.interceptors.request.use((config) => {
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(undefined, (error) => {
  // Token no longer valid (user deactivated, demo data reset): back to the sign-in screen.
  if (error?.response?.status === 401 && token) onSignedOut?.()
  return Promise.reject(error)
})
