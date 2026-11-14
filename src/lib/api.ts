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
