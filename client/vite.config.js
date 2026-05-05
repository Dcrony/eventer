import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { visualizer } from 'rollup-plugin-visualizer';


const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    react(),

    visualizer({
      open: true,
      filename: 'bundle-analysis.html',
      gzipSize: true,
      brotliSize: true,
      template: 'treemap', // or 'sunburst'
    }),

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
      workbox: {
        // INCREASE the file size limit to avoid the error
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB (up from 2 MB default)
        // Optional: Clean up old caches automatically
        cleanupOutdatedCaches: true,
        // Optional: Skip waiting for faster updates
        skipWaiting: true,
        clientsClaim: true,
        // Optional: Define which files to precache
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
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
            src: "icon.jpg",
            sizes: "192x192",
            type: "image/jpeg",
          },
          {
            src: "icon.jpg",
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
  },

  build: {
    // Increase chunk size warning limit (optional)
    chunkSizeWarningLimit: 1000, // 1000 kB (1 MB) warning threshold

    // Enable minification optimization
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      },
    },

    // Disable sourcemaps in production to reduce size (optional)
    sourcemap: false,

    rollupOptions: {
      output: {
        // Split code into smaller chunks for better performance
        manualChunks: (id) => {
          // React core libraries
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            // React Router
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            // UI libraries (if you have any)
            if (id.includes('@mui') || id.includes('@emotion') || id.includes('@radix-ui')) {
              return 'vendor-ui';
            }
            // State management
            if (id.includes('redux') || id.includes('@reduxjs') || id.includes('zustand') || id.includes('@tanstack/react-query')) {
              return 'vendor-state';
            }
            // Data fetching / utilities
            if (id.includes('axios') || id.includes('lodash') || id.includes('date-fns') || id.includes('dayjs')) {
              return 'vendor-utils';
            }
            // Charting libraries
            if (id.includes('chart.js') || id.includes('recharts') || id.includes('d3')) {
              return 'vendor-charts';
            }
            // Form handling
            if (id.includes('react-hook-form') || id.includes('formik') || id.includes('yup') || id.includes('zod')) {
              return 'vendor-forms';
            }
            // All other node_modules go to vendor
            return 'vendor';
          }
        },

        // Alternative approach if you prefer explicit chunk grouping:
        // manualChunks: {
        //   'vendor-react': ['react', 'react-dom', 'react-router-dom'],
        //   'vendor-ui': ['@mui/material', '@emotion/react'],
        //   'vendor-utils': ['axios', 'lodash', 'date-fns'],
        //   'vendor-forms': ['react-hook-form', 'yup'],
        // },

        // Optimize file naming
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },

  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: [],
  },
});