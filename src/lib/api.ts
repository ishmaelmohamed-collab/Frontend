import axios from 'axios'

/**
 * The single HTTP client. Uses the session cookie set by the backend
 * (VITE_USE_MOCKS=false), proxied through Vite to http://localhost:8000.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})
