import crypto from 'node:crypto';

export async function handler() {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Discord login is not configured yet. Please contact an administrator.',
    };
  }

  const state = crypto.randomBytes(16).toString('hex');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify',
    prompt: 'consent',
    state,
  });

  return {
    statusCode: 302,
    headers: {
      Location: `https://discord.com/api/oauth2/authorize?${params.toString()}`,
      'Set-Cookie': `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`,
    },
  };
}
