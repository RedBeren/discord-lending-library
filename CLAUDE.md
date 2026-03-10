# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Book Lending App — Project Context

## Stack
- Next.js (App Router) + TypeScript
- Supabase (Postgres + Auth + RLS)
- Deployed on Vercel
- Discord OAuth for member login
- Discord.js for the bot (separate process from the web app)

## Development Commands

```bash
npm run dev       # Start Next.js dev server
npm run build     # Production build
npm run lint      # ESLint
npm run bot       # Start Discord bot (expected: node bot/index.js or ts-node)
```

Tests will use Vitest or Jest — run with `npm test` once configured.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # Server-only, never expose to client
DISCORD_BOT_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_WEBHOOK_URL=
GOOGLE_BOOKS_API_KEY=
```

## Project Structure

```
src/
  app/              # Next.js App Router pages and API routes
    auth/callback/  # Discord OAuth callback handler
    api/            # Server-side API routes
  lib/
    supabase/       # Supabase client (browser + server variants)
bot/                # Discord bot — runs as a separate Node process
supabase/
  migrations/       # SQL migrations (RLS policies, pg_trgm, etc.)
```

## Architecture Decisions
- Discord bot and web app share the same Supabase database
- Members authenticate via Discord OAuth (user IDs stored for DMs)
- `pg_trgm` enabled for fuzzy book title matching
- Google Books API used for book metadata (ISBN, cover, rating)
- MIT license

## Key Patterns
- Supabase has two client variants: a browser client (`createBrowserClient`) and a server client (`createServerClient`) using cookies — never use the browser client in Server Components or API routes
- All database access goes through RLS; the service role key is only used in the bot and trusted server routes
- Discord OAuth callback exchanges the code for a session and upserts the member record (discord_id, discord_username) into the `members` table

## Data Model
- `books` table: id, title, author, isbn_13, cover_url, avg_rating, description, year_published, google_id
- `listings` table: id, book_id, offered_by (member_id), status, created_at, pickup_notes
- `claims` table: id, listing_id, claimant_member_id, claimed_at
- `members` table: id, discord_id, discord_username

## Bot Commands
- `/offer` — autocomplete against books table, falls back to Google Books API
- `/claim` — autocomplete against available listings, DMs both parties on claim

## Notifications
- Discord webhooks preferred over Twilio SMS (free, members already there)
- Twilio SMS is a future nice-to-have
