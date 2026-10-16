# FloatScout

FloatScout is an open-source CS2 market watcher. Users create configurable monitors for CSFloat listings and receive matching deal alerts through Telegram and Discord.

The project currently has a mobile-first dashboard in `apps/web`, a Go REST API in `apps/api`, and a real PostgreSQL-backed monitor CRUD. The remaining dashboard areas and CSFloat integration are still mocked.

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
  api/       # Go/Gin API, PostgreSQL schema, and sqlc queries
  web/       # Next.js interface
compose.yaml # Local API and PostgreSQL environment
index.js     # Original CSFloat proof of concept (temporary)
```

## Run the API and database

Docker is the only local requirement:

```bash
docker compose up --build -d
curl http://localhost:8080/health
```

The local PostgreSQL instance is exposed on port `5433` to avoid conflicts with a default installation on `5432`. Stop the services with:

```bash
docker compose down
```

Generate the Go database layer after changing SQL queries or migrations:

```bash
docker run --rm --user "$(id -u):$(id -g)" -v "$PWD/apps/api:/src" -w /src sqlc/sqlc:1.31.1 generate
```

## Run the web app

```bash
cd apps/web
npm install
npm run dev
```

Open `http://localhost:3000`. The app uses `http://localhost:8080` by default; copy `apps/web/.env.example` to `apps/web/.env.local` when you need another API URL.

## Current interactions

- Simulated Discord sign-in and sign-out
- Navigate every dashboard section on desktop or mobile
- Check the real API and database health
- Create, edit, pause, and delete PostgreSQL-backed monitors
- Search and filter alert history
- Connect, pause, and remove Telegram or Discord destinations
- Create, copy, and revoke single-use invites
- Change currency, timezone, theme, quiet hours, and API-key mode
- Persist mock data in the current browser

Listings, metrics, destinations, invites, and account details are still fictional sample data.

## Roadmap

- [x] Mobile-first interface and visual system
- [x] Go/Gin API foundation with PostgreSQL and sqlc
- [x] Database migrations executed as a separate service
- [x] Neon production database provisioned and migrated
- [x] Real health status in the dashboard
- [x] Real monitor CRUD: create, list, edit, pause, and delete
- [ ] Discord OAuth and invite-only access
- [ ] Real Discord and Telegram destinations
- [ ] CSFloat ingestion and filter worker
- [ ] Alert delivery, history, and price-drop realerts
- [ ] Quiet hours, currencies, and personal CSFloat API keys in the backend
- [ ] Production deployment and observability
