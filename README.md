# Bloom Nails — Booking System (demo)

Guest-facing booking flow: browse services → pick a real open time slot (checked against your Google Calendar) → confirm → confirmation email + reminder email the day before.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Prisma + PostgreSQL (driver adapter via `@prisma/adapter-pg`)
- Google Calendar API (availability + event creation)
- Resend (confirmation + reminder emails)
- Vercel Cron (daily reminder job)

## Setup

### 1. Google Calendar

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → create a new project (any name).
2. **APIs & Services → Library** → search "Google Calendar API" → Enable.
3. **APIs & Services → OAuth consent screen** → set up as "External" (or "Internal" if using Workspace), fill in app name + your email. You can leave it in "Testing" mode — no need to publish.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Authorized redirect URIs: add `http://localhost:5555/oauth2callback`
5. Copy the **Client ID** and **Client Secret** into `.env`:
   ```
   GOOGLE_CLIENT_ID="..."
   GOOGLE_CLIENT_SECRET="..."
   ```
6. Run the one-time authorization script:
   ```bash
   npx tsx scripts/get-google-refresh-token.ts
   ```
   Open the printed URL, log in with the Google account whose calendar you want to use, approve access. The script prints a `GOOGLE_REFRESH_TOKEN` — paste it into `.env`.

### 2. Resend

1. Sign up at [resend.com](https://resend.com) (free tier is enough for testing).
2. Create an API key, put it in `.env` as `RESEND_API_KEY`.
3. `RESEND_FROM_EMAIL` defaults to Resend's shared test address (`onboarding@resend.dev`), which works without any setup but only for testing. To send from your own domain, verify a domain in Resend and update `RESEND_FROM_EMAIL`.

### 3. Cron secret

Set `CRON_SECRET` in `.env` to any random string. When deployed to Vercel, Vercel Cron automatically sends this as a bearer token — set the same value in your Vercel project's environment variables.

### 4. Database

`DATABASE_URL` needs a real Postgres connection string. Easiest way to get one: `npx create-db` (free hosted Prisma Postgres, prints a `DATABASE_URL` and a claim URL — visit the claim URL to make it permanent, otherwise it expires in 24h).

## Local development

```bash
npm install
npx prisma migrate dev   # applies migrations to DATABASE_URL
npx prisma db seed       # loads sample nail salon services
npm run dev
```

## Deploy (Vercel)

1. Import this repo at [vercel.com/new](https://vercel.com/new).
2. In Project Settings → Environment Variables, set everything from `.env` (`DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_CALENDAR_ID`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CRON_SECRET`) — point `DATABASE_URL` at a permanent database (claim the `create-db` one, or use a proper Neon/Supabase project) rather than a 24h temporary one.
3. Run `npx prisma migrate deploy` against the production `DATABASE_URL` to create the tables before first use.
4. Build command is the default `next build` (already in `package.json`) — no extra config needed.
5. The reminder cron (`vercel.json` → `/api/cron/reminders`, daily at 15:00 UTC) is picked up automatically by Vercel Cron on deploy; make sure `CRON_SECRET` matches between `.env` and the Vercel project.
6. Push to `main` to trigger a deploy.

## Notes / current scope

- Guest-facing flow only — no merchant dashboard yet (add/edit services by editing `prisma/seed.ts` or directly in the DB for now).
- Business hours are hardcoded in `src/lib/availability.ts` (9am–6pm, closed Sundays) — adjust there.
- Reminder emails run once a day via `vercel.json`'s cron config, checking for bookings happening "tomorrow."
