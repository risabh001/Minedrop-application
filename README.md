# Minedrop Application Portal

Cloudflare Workers application portal for Minedrop International Network. The app now lives at the repository root so Cloudflare Git integration builds the project from the correct directory.

React application portal hosted as a Cloudflare Worker with static assets. Applicants authenticate through Discord, must be members of the configured guild, and can submit Builder or Developer applications. A PDF is generated in the browser. Team delivery is supported through a Discord webhook and/or a private ticket channel; applicants can receive a Discord DM. Nothing is persisted by the app. Email delivery is not implemented on Workers; submissions will report email delivery as unavailable.

## Cloudflare deployment

The intended host is `https://applications.gamer.dpdns.org`.

1. Install Node.js 20+ and run `npm ci`.
2. Authenticate Wrangler: `npx wrangler login`.
3. In the Cloudflare dashboard, create a Worker named `minedrop-application-portal` or use `npm run worker:deploy` after configuring your account. Attach the custom domain `applications.gamer.dpdns.org` under Worker → Settings → Domains & Routes. Workers custom domains manage DNS/TLS; do not create a separate DNS record pointing at a guessed target.
4. Add Worker secrets in **Settings → Variables and Secrets**: `SESSION_SECRET` (long random secret), `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_BOT_TOKEN`, `DISCORD_GUILD_ID`. Set `DISCORD_WEBHOOK_URL` and/or `DISCORD_TICKET_CATEGORY_ID`; for ticket delivery, also set `DISCORD_STAFF_ROLE_ID` (optional). Never commit secret values.
5. In Discord Developer Portal, add `https://applications.gamer.dpdns.org/api/discord/callback` as an OAuth2 redirect URL. The OAuth scope is `identify`. The bot must be able to inspect guild membership and create/send in the configured ticket category. Webhook URLs should be treated as secrets.
6. Deploy with `npm run worker:deploy`. The Worker serves the `dist` build through its `ASSETS` binding and handles `/api/discord/login`, `/api/discord/callback`, and `POST /api/applications`.

For a different domain, change the callback URL in Discord and deployment documentation to match the Worker custom domain; callback URLs are derived from the request origin.

## Local development

`npm run dev` runs only the Vite frontend. To exercise API routes, set local secrets in an ignored `.dev.vars` file and run `npm run worker:dev`. Do not use production secrets in shared or committed files. Wrangler's local mode uses the same Worker handler and static build configuration.

## Notes

- Application answers and PDFs are sent to the configured Discord destination; the application does not store them in a database.
- SMTP email was removed because Node SMTP transports are not supported in Workers. Choose a Workers-compatible email API separately if email delivery is required.
- The connected Cloudflare app tooling in this coding environment can inspect zones and DNS records but cannot upload/deploy Worker code, set secrets, or attach Worker custom domains. Deployment must be completed with Wrangler or the Cloudflare dashboard.
