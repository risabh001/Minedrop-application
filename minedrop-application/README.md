# Minedrop International Network — Application Portal

Applicants sign in with their Discord account, fill out a sectioned application for a position
(Builder or Developer), and submit it. The application becomes a PDF in their own browser, which
downloads automatically. The same PDF is then delivered to the team and back to the applicant.
Nothing is stored in a database.

## The flow

```
Applicant opens the site
  → "Continue with Discord" (OAuth)
  → Server checks they are a member of the Minedrop Discord server
  → Application dashboard → pick a position → fill out the form
  → Submit
  → PDF generated in the browser and downloaded
  → Team receives it (ticket channel, webhook channel, and/or email — whichever you configure)
  → Applicant receives it as a Discord DM from the bot and as an email
  → Success popup
```

The applicant's Discord identity comes from Discord itself, not from a text box: the Discord
username on the application is locked to the verified account, and the server ignores anything
the browser sends for it.

## Run locally

```bash
npm install
npm run dev
```

Login and submission call Netlify Functions, which only exist under the Netlify CLI. To test the
full flow locally:

```bash
npm install -g netlify-cli
netlify dev
```

For local OAuth, add `http://localhost:8888/.netlify/functions/discord-callback` as an extra
redirect in the Discord Developer Portal and use it as `DISCORD_REDIRECT_URI` in your `.env`.


