# MyHerodle / Rift Clues

Next.js party game with shared rooms backed by Supabase.

## Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- Supabase database + realtime

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template:

```bash
cp .env.example .env.local
```

3. Fill `.env.local` with your Supabase project values.

4. Run the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Required environment variables

Set these locally and in Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
LOBBY_SESSION_SECRET=
```

Optional AdSense variables:

```env
NEXT_PUBLIC_ADSENSE_CLIENT=
NEXT_PUBLIC_ADSENSE_HOME_SLOT=
```

`LOBBY_SESSION_SECRET` should be a long random value. For example:

```bash
openssl rand -base64 32
```

## Supabase setup

Create a Supabase project, then run the SQL migrations in `supabase/migrations` in chronological order.

The initial migration creates:

- `rooms`
- `players`
- indexes and constraints
- read-only RLS policies for browser clients
- realtime publication entries for both tables

The app uses `SUPABASE_SERVICE_ROLE_KEY` only on server routes for writes. Do not expose that key in the browser.

## Vercel deployment

1. Push this repository to GitHub.
2. Import the project in Vercel.
3. Keep the framework preset as Next.js.
4. Add the required environment variables in Vercel Project Settings.
5. Deploy.

Vercel should use:

- Build command: `npm run build`
- Install command: `npm install`
- Output: managed automatically by Next.js

## Production check

Before deploying, run:

```bash
npm run build
```
