import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [
    react(),

    nodePolyfills({
      protocolImports: true,
    }),

    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true,
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