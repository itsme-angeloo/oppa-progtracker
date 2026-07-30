# OPPA - Angelo's Progress OS

OPPA means **Owned Project Progress App**. It is Angelo's progress tracker for projects, activity logs, pause/resume context, rule-based next-work suggestions, and read-only share links.

## Run Locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Create `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AI_PROVIDER=none
AI_API_KEY=
```

## Database

Migrations live in `supabase/migrations`.

```bash
pnpm exec supabase db push
```
