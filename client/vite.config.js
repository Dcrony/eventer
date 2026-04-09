import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { nodePolyfills } from "vite-plugin-node-polyfills";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    react(),

    nodePolyfills({
      protocolImports: true,
    }),

    VitePWA({
      registerType: "autoUpdate",
      // Service worker off in dev — avoids noisy Workbox logs ("Router is responding to: /").
      // Test PWA with: npm run build && npm run preview
      devOptions: {
        enabled: false,
        suppressWarnings: true,
      },
      manifest: {
        name: "TickiSpot",
        short_name: "TickiSpot",
        description: "Event management and ticketing platform",
        start_url: "/",
        display: "standalone",
        background_color: "#000000",
        theme_color: "#db2777",
        icons: [
          {
            src: "/icons/icon.jpg",
            sizes: "192x192",
            type: "image/jpeg",
          },
          {
            src: "/icons/icon.jpg",
            sizes: "512x512",
            type: "image/jpeg",
          },
        ],
      },
    }),
  ],

  define: {
    global: "globalThis",
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // Your backend server
        changeOrigin: true,
        secure: false,
      }
    }
  }
});