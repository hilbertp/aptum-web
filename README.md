# APTUM Web

Longevity-first, fully free fitness and training web app.

This repository contains the web-native MVP for the APTUM fitness app. The app is client-first, runs entirely in the browser, and syncs user-owned data to the athlete’s Google Drive App Folder. AI features are BYOK (bring your own key).

Scaffold
- Vite + React + TypeScript + TailwindCSS
- Zustand state management
- Zod schemas for product contracts (Plan / Session / Recovery / Blocker)
- IndexedDB persistence wrapper and export/import pipeline
- DriveSyncService skeleton for Google Drive App Folder replication
- PWA setup (vite-plugin-pwa)

Getting started
- Node 18+ (Node 20+ recommended)
- npm install
- npm run dev

Environment
- Copy .env.example to .env and fill values
  - VITE_GOOGLE_CLIENT_ID – OAuth Client ID (Web) for Google Identity Services
  - VITE_GOOGLE_DRIVE_SCOPES – default: https://www.googleapis.com/auth/drive.appdata

Docs
- See /docs for PRD/ASA/TIG summaries and schemas

License
Apache-2.0
