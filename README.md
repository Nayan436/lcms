# LCMS – Legal Case Management System

A lawyer's daily command center. Manage clients, cases, hearings, payments, and documents — all stored locally in your browser.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Deploy to Cloudflare Pages

1. Push this repo to GitHub
2. Log in to [Cloudflare Pages](https://pages.cloudflare.com)
3. Click **Create a project → Connect to Git**
4. Select your repo
5. Set build settings:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
6. Click **Save and Deploy**

## Features

- **Dashboard** – today's schedule, next hearing countdown, quick stats, urgent tasks, pending collections
- **Clients** – full client profiles with financial summaries
- **Cases** – timeline, hearings, documents, payments, tasks, communications
- **Calendar** – FullCalendar with day/week/month/list views
- **Payments** – fee tracking, outstanding collections
- **Settings** – lawyer profile, notification preferences, data export

## Tech Stack

- React 18 + TypeScript + Vite
- TailwindCSS + Radix UI (ShadCN style)
- Dexie.js (IndexedDB) — all data stored locally, no backend needed
- FullCalendar for the calendar view
- Browser Push Notifications for hearing reminders

## Data

Demo data is auto-seeded on first launch (10 clients, 15 cases, 20 hearings, 30 timeline entries, 10 payments).
You can clear and re-seed from **Settings → Data**.
