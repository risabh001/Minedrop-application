import { createToken } from './lib/token.js';
import { exchangeCodeForToken, getDiscordUser, checkGuildMembership } from './lib/discord.js';

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

const CLEAR_STATE_COOKIE = 'oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0';

function redirectWithError(message) {
  return {
    statusCode: 302,
    headers: {
      Location: `/?authError=${encodeURIComponent(message)}`,
      'Set-Cookie': CLEAR_STATE_COOKIE,
    },
  };
}

function readCookie(event, name) {
  const header = event.headers?.cookie || event.headers?.Cookie || '';
  const match = header.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${name}=`));
  return match ? match.slice(name.length + 1) : null;
}

export async function handler(event) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  const sessionSecret = process.env.SESSION_SECRET;

  if (!clientId || !clientSecret || !redirectUri || !botToken || !guildId || !sessionSecret) {
    console.error('discord-callback: Discord OAuth environment variables are not fully configured.');
    return redirectWithError('The application portal is not configured yet. Please contact an administrator.');
  }

  const code = event.queryStringParameters?.code;
  if (!code) {
    return redirectWithError('Discord login was cancelled or failed. Please try again.');
  }

  const returnedState = event.queryStringParameters?.state;
  const expectedState = readCookie(event, 'oauth_state');
  if (!returnedState || !expectedState || returnedState !== expectedState) {
    return redirectWithError('Your login session expired. Please try again.');
  }

  let tokenData;
  try {
    tokenData = await exchangeCodeForToken({ code, clientId, clientSecret, redirectUri });
  } catch (err) {
    console.error('discord-callback: token exchange failed:', err.message);
    return redirectWithError('Discord login failed. Please try again.');
  }

  let discordUser;
  try {
    discordUser = await getDiscordUser(tokenData.access_token);
  } catch (err) {
    console.error('discord-callback: user fetch failed:', err.message);
    return redirectWithError('Discord login failed. Please try again.');
  }

  let membership;
  try {
    membership = await checkGuildMembership({ botToken, guildId, userId: discordUser.id });
  } catch (err) {
    console.error('discord-callback: membership check failed:', err.message);
    return redirectWithError('Could not verify your server membership. Please try again.');
  }

  if (!membership) {
    return redirectWithError('You need to be a member of the Minedrop Discord server to apply. Join the server, then try again.');
  }

  const displayName = discordUser.global_name || discordUser.username;
  const discordUsername = discordUser.discriminator && discordUser.discriminator !== '0'
    ? `${discordUser.username}#${discordUser.discriminator}`
    : discordUser.username;

  const sessionToken = createToken(
    {
      exp: Date.now() + SESSION_DURATION_MS,
      discordId: discordUser.id,
      discordUsername,
      displayName,
    },
    sessionSecret
  );

  return {
    statusCode: 302,
    headers: {
      Location: `/auth/callback#token=${encodeURIComponent(sessionToken)}`,
      'Set-Cookie': CLEAR_STATE_COOKIE,
    },
  };
}
