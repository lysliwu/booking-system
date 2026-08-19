# Bloom Nails — Booking System (demo)

Guest-facing booking flow: browse services → pick a real open time slot (checked against your Google Calendar) → confirm → confirmation email + reminder email the day before.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Prisma + SQLite (`dev.db`)
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

## Local development

```bash
npm install
npx prisma db seed   # loads sample nail salon services
npm run dev
```

## Notes / current scope

- Guest-facing flow only — no merchant dashboard yet (add/edit services by editing `prisma/seed.ts` or directly in the DB for now).
- Business hours are hardcoded in `src/lib/availability.ts` (9am–6pm, closed Sundays) — adjust there.
- Reminder emails run once a day via `vercel.json`'s cron config, checking for bookings happening "tomorrow."
