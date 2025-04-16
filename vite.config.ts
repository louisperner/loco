import { defineConfig } from "vite";
import { splitVendorChunkPlugin } from 'vite';
import electron from 'vite-plugin-electron/simple'
import monacoEditorPlugin from "vite-plugin-monaco-editor";
import mkcert from "vite-plugin-mkcert";
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    mkcert(), 
    monacoEditorPlugin({}), 
    splitVendorChunkPlugin(), 
    electron({
      main: {
        entry: 'electron/main.ts',
      },
      preload: {
        input: 'electron/preload.ts',
      },
      renderer: {},
    })
  ],
  resolve: {
    alias: {
      // Define explicit paths for Firebase modules
      'firebase/app': path.resolve(__dirname, 'node_modules/firebase/app/dist/esm/index.esm.js'),
      'firebase/auth': path.resolve(__dirname, 'node_modules/firebase/auth/dist/esm/index.esm.js'),
      'firebase/firestore': path.resolve(__dirname, 'node_modules/firebase/firestore/dist/esm/index.esm.js'),
      '@': path.resolve(__dirname, './src')
    }
  },
  optimizeDeps: {
    include: [
      'firebase/app',
      'firebase/auth',
      'firebase/firestore'
    ]
  },
  build: {
    commonjsOptions: {
      include: [/firebase/, /node_modules/],
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          'monaco-vendor': ['monaco-editor', '@monaco-editor/react'],
        }
      }
    },
    chunkSizeWarningLimit: 2000
  },
  server: {
    hmr: {
      protocol: 'wss',
      host: 'localhost',
      timeout: 60000 // Increase timeout to 60 seconds
    },
    proxy: {
      // Add proxy configuration if needed
    }
  }
});



