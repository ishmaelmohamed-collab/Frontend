import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      // Frontend tests only; the backend has its own: npm run test:backend
      include: ['src/**/*.test.{ts,tsx}'],
    },
  }),
)
