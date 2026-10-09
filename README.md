# FloatScout

FloatScout is an open-source CS2 market watcher. Users create configurable monitors for CSFloat listings and receive matching deal alerts through Telegram and Discord.

The project is currently in the product-design stage. The first deliverable is a mocked, mobile-first dashboard in `apps/web`; it uses local sample data and does not connect to CSFloat yet.

## MVP

- Discord OAuth login with invite-only access
- Multiple named monitors per user
- Filters for skin name, price, float, discount, item type, and listing type
- Multiple Telegram and Discord destinations per monitor
- Installable Discord bot
- Telegram group connection through a one-time code
- Shared hourly monitoring or faster monitoring with a personal CSFloat API key
- Configurable polling interval with a safe server-side minimum
- Alert history, price-drop realerts, and optional quiet hours
- USD, BRL, EUR, and CNY display currencies
- Dark and light themes, with dark as the default
- English, mobile-first interface

Automatic purchasing, AI/Jev evaluation, advanced price prediction, and PWA installation are intentionally outside the first MVP.

## Planned architecture

```text
Next.js web app (Vercel)
          |
       REST API
          |
Go API + monitor worker (Google Cloud e2-micro)
          |
PostgreSQL (Neon)
          |
CSFloat API / Telegram / Discord
```

### Stack

- Web: Next.js, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Go, Gin
- API: REST
- Data access: PostgreSQL with sqlc
- Authentication: Discord OAuth
- Deployment: Vercel for the web app; Docker on a small VPS for the Go service
- License: MIT

## Repository layout

```text
apps/
  web/       # Mocked Next.js interface
index.js     # Original CSFloat proof of concept (temporary)
```

The Go backend will be added after the mocked interface establishes the main workflows and visual direction.

## Run the web mock

```bash
cd apps/web
npm install
npm run dev
```

Open `http://localhost:3000`.

## Current mock interactions

- Simulated Discord sign-in and sign-out
- Navigate every dashboard section on desktop or mobile
- Create, edit, pause, and delete monitors
- Search and filter alert history
- Connect, pause, and remove Telegram or Discord destinations
- Create, copy, and revoke single-use invites
- Change currency, timezone, theme, quiet hours, and API-key mode
- Persist mock data in the current browser

All listings, metrics, and account details are fictional sample data.
