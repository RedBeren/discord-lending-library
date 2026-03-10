# Discord Lending Library

A community book lending app for Discord servers. Members offer physical books they're willing to lend, and others claim them — all without leaving Discord.

Built with Next.js, Supabase, and Discord.js.

---

## How it works

1. A member runs `/offer` in Discord and picks a book (autocompletes from the library catalog, or pulls metadata from Google Books automatically).
2. The book appears as available in the web dashboard and gets announced via a webhook.
3. Another member runs `/claim` and selects the listing. Both parties receive a DM with pickup details.
4. Arrangements happen directly between members.

---

## Adding the bot to your server

No Developer Portal account needed — the bot is publicly hosted.

1. **Invite the bot** using [this link](#) *(replace with your OAuth invite URL)*. You'll see a standard Discord authorization dialog asking for the `bot` and `applications.commands` scopes with the **Send Messages** permission.
2. **Authorize** the bot for your server.
3. *(Optional)* Create a dedicated channel such as `#community-library`. In that channel's settings under **Permissions**, restrict `/offer` and `/claim` to members you want to participate — this keeps bot activity out of unrelated channels.
4. **Sign in** at the web app with your Discord account ([app URL](#)) to link your account. This is required before using `/offer` or `/claim` so the bot can DM you.

That's it. Members can start offering and claiming books immediately.

---

## Walkthrough

### Offering a book

1. In any channel where the bot is present, type `/offer`.
2. Start typing the book title in the `book` field — the autocomplete first checks the existing catalog, then falls back to Google Books.
3. Optionally add pickup notes (e.g. "Can usually meet at Milkhouse on weekends").
4. Submit. The bot confirms the listing and posts an announcement to the configured webhook channel.

### Claiming a book

1. Type `/claim` in Discord.
2. The `listing` autocomplete shows all currently available books — type to filter by title.
3. Select the book you want. The bot:
   - Marks the listing as claimed
   - Sends you a DM with the book title, author, and pickup notes
   - Sends the offerer a DM letting them know who claimed it

### Web dashboard

Members can also browse available books at the web app. Sign in with Discord (OAuth) to access the dashboard. The same Discord account used in the server is linked automatically on first sign-in.

---

## Self-hosting / development

Use this section if you want to run your own instance of the app and bot.

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- A Google Books API key (optional — improves book search results)

### Create a Discord application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) and create a new application.
2. Under **Bot**, enable the **Server Members Intent** (needed to send DMs).
3. Under **OAuth2 → URL Generator**, select the `bot` and `applications.commands` scopes plus the **Send Messages** permission. Save the generated URL — this becomes your invite link.
4. Under **OAuth2**, add your app's callback URL as a redirect: `https://your-app.vercel.app/auth/callback`.
5. In your Supabase project under **Auth → Providers → Discord**, paste in the Client ID and Client Secret from the Developer Portal.

### Setup

```bash
git clone https://github.com/your-org/discord-lending-library
cd discord-lending-library
npm install

cp .env.local.example .env.local
# Fill in all values in .env.local
```

Run the database migration against your Supabase project:

```bash
# Using the Supabase CLI
supabase db push

# Or paste supabase/migrations/0001_init.sql directly into the SQL editor
```

Register the bot's slash commands (run once, or after any command changes):

```bash
npm run bot:deploy-commands
```

Start both processes in separate terminals:

```bash
npm run dev   # Next.js web app → http://localhost:3000
npm run bot   # Discord bot
```

### Environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Public URL of the web app (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key — server/bot only, never expose to the client |
| `DISCORD_BOT_TOKEN` | Bot token from the Developer Portal |
| `DISCORD_CLIENT_ID` | Application ID |
| `DISCORD_GUILD_ID` | Guild ID for instant command updates during development (omit for global rollout) |
| `DISCORD_WEBHOOK_URL` | Webhook URL for new-listing announcements |
| `GOOGLE_BOOKS_API_KEY` | Google Books API key (optional) |

---

## Contributing

Pull requests are welcome. A few guidelines:

- **Bot changes** live in `bot/` and run as a separate Node process. Use `npm run bot` to test locally.
- **Web app changes** live in `src/` (Next.js App Router). API routes go in `src/app/api/`.
- **Database changes** require a new numbered migration file in `supabase/migrations/` and updated types in `src/lib/supabase/types.ts`.
- The bot uses the Supabase **service role key** and bypasses RLS. The web app uses the anon key and relies on RLS policies — keep these in sync when changing the data model.
- Run `npm run lint` before opening a PR.
