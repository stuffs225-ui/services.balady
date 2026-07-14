/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    env: {
      // Fake, non-secret placeholders so importing src/lib/supabase.ts
      // never fails in tests regardless of local .env files. Tests that
      // need real Supabase responses mock the relevant api module instead
      // of hitting this client.
      VITE_SUPABASE_URL: 'https://test-project.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'test-anon-key',
      VITE_APP_PUBLIC_URL: 'http://localhost:5173',
    },
  },
})
