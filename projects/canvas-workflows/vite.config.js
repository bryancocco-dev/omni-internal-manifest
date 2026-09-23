import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { claudeDevProxy } from './server/claude-dev-proxy.js'

export default defineConfig({
  // claudeDevProxy is dev-only (its configureServer hook never runs during
  // `vite build`) — see server/claude-dev-proxy.js. Standing rule: never
  // start/stop/restart the dev server yourself; this registration only
  // takes effect on Bryan's own restart.
  plugins: [react(), claudeDevProxy()],
  server: { port: 8182, strictPort: true },
})
