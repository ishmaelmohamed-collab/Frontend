import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { App } from './app/App'
import { LocaleProvider } from './lib/LocaleProvider'
import { SessionProvider } from './lib/SessionProvider'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
})

/** The in-browser mock API runs until a real backend is connected (VITE_USE_MOCKS=false). */
async function startMocks() {
  if (import.meta.env.VITE_USE_MOCKS === 'false') return
  const { worker } = await import('./mocks/browser')
  await worker.start({ onUnhandledFrame: 'bypass', quiet: true })
}

startMocks().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <LocaleProvider>
        <QueryClientProvider client={queryClient}>
          <SessionProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </SessionProvider>
        </QueryClientProvider>
      </LocaleProvider>
    </StrictMode>,
  )
})
