import { createToken, verifyToken } from './src/utils/token.js';
import { exchangeCodeForToken, getDiscordUser, checkGuildMembership, sendDirectMessage, postToChannel, createTicketChannel } from './src/utils/discord.js';
import { getApplicationType, getAllFields } from './src/config/applications.js';
import { validateApplication, sanitizeText } from './src/utils/validation.js';
import { buildDisplaySections } from './src/utils/formatAnswers.js';
import { buildPdfFilename } from './src/utils/filename.js';

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
const MAX_BODY_BYTES = 8_000_000;
const encoder = new TextEncoder();

function response(body, status = 200, headers = {}) {
  return new Response(body, { status, headers });
}

function redirect(location, headers = {}) {
  return new Response(null, { status: 302, headers: { Location: location, ...headers } });
}

function json(status, body) {
  return response(JSON.stringify(body), status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
}

function getCookie(request, name) {
  const part = (request.headers.get('Cookie') || '').split(';').map((item) => item.trim()).find((item) => item.startsWith(`${name}=`));
  return part ? part.slice(name.length + 1) : null;
}

function truncate(value, max) {
  const text = String(value || '—');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function buildEmbed(applicationType, values) {
  return {
    title: `New ${applicationType.label} Application`,
    color: 0x37a29f,
    fields: [
      ['Full Name', values.fullName, 200], ['Age', values.age, 50], ['Discord', values.discordUsername, 200],
      ['Java Username', values.javaUsername || 'Not provided', 200], ['Bedrock Username', values.bedrockUsername || 'Not provided', 200],
      ['Email', values.email, 200], ['Country', values.country, 100], ['State / Province / Region', values.state, 100], ['Timezone', values.timezone, 100],
    ].map(([name, value, max]) => ({ name, value: truncate(value, max), inline: true })),
    footer: { text: `Full application attached as PDF · ${new Date().toISOString()}` },
  };
}

function makePdfBlob(base64) {
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64) || base64.length % 4 !== 0 || base64.length > 6_666_668) return null;
  try {
    const binary = atob(base64);
    if (binary.length < 5 || binary.length > 5_000_000 || !binary.startsWith('%PDF-')) return null;
    return new Blob([Uint8Array.from(binary, (char) => char.charCodeAt(0))], { type: 'application/pdf' });
  } catch { return null; }
}

async function discordLoginStart(request, env) {
  if (!env.DISCORD_CLIENT_ID) return response('Discord login is not configured. Contact an administrator.', 500);
  const state = Array.from(crypto.getRandomValues(new Uint8Array(24)), (byte) => byte.toString(16).padStart(2, '0')).join('');
  const callbackOrigin = env.APP_ORIGIN || new URL(request.url).origin;
  const callback = `${callbackOrigin}/api/discord/callback`;
  const params = new URLSearchParams({ client_id: env.DISCORD_CLIENT_ID, redirect_uri: callback, response_type: 'code', scope: 'identify', prompt: 'consent', state });
  return redirect(`https://discord.com/api/oauth2/authorize?${params}`, { 'Set-Cookie': `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/api/discord/callback; Max-Age=600` });
}

async function discordCallback(request, env) {
  const url = new URL(request.url);
  const state = url.searchParams.get('state');
  const expectedState = getCookie(request, 'oauth_state');
  const clearCookie = 'oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/api/discord/callback; Max-Age=0';
  const fail = (message) => redirect(`/?authError=${encodeURIComponent(message)}`, { 'Set-Cookie': clearCookie, 'Cache-Control': 'no-store' });
  if (!env.DISCORD_CLIENT_ID || !env.DISCORD_CLIENT_SECRET || !env.DISCORD_BOT_TOKEN || !env.DISCORD_GUILD_ID || !env.SESSION_SECRET) return fail('The application portal is not configured yet. Please contact an administrator.');
  if (!state || !expectedState || state !== expectedState || !url.searchParams.get('code')) return fail('Your login session expired. Please try again.');
  try {
    const callbackOrigin = env.APP_ORIGIN || url.origin;
    const tokenData = await exchangeCodeForToken({ code: url.searchParams.get('code'), clientId: env.DISCORD_CLIENT_ID, clientSecret: env.DISCORD_CLIENT_SECRET, redirectUri: `${callbackOrigin}/api/discord/callback` });
    const user = await getDiscordUser(tokenData.access_token);
    const member = await checkGuildMembership({ botToken: env.DISCORD_BOT_TOKEN, guildId: env.DISCORD_GUILD_ID, userId: user.id });
    if (!member) return fail('You need to be a member of the Minedrop Discord server to apply. Join the server, then try again.');
    const discordUsername = user.discriminator && user.discriminator !== '0' ? `${user.username}#${user.discriminator}` : user.username;
    const token = await createToken({ exp: Date.now() + SESSION_DURATION_MS, discordId: user.id, discordUsername, displayName: user.global_name || user.username }, env.SESSION_SECRET);
    return redirect(`/auth/callback#token=${encodeURIComponent(token)}`, { 'Set-Cookie': clearCookie, 'Cache-Control': 'no-store' });
  } catch (error) {
    console.error('Discord OAuth flow failed:', error.message);
    return fail('Discord login failed. Please try again.');
  }
}

async function submitApplication(request, env) {
  if (!env.SESSION_SECRET) return json(500, { message: 'The application portal is not configured yet.' });
  const authorization = request.headers.get('Authorization') || '';
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  const session = await verifyToken(token, env.SESSION_SECRET);
  if (!session?.discordId) return json(401, { message: 'Your session has expired. Please log in again.' });
  const contentLength = Number(request.headers.get('Content-Length') || 0);
  if (contentLength > MAX_BODY_BYTES) return json(413, { message: 'Request too large.' });
  let payload;
  try {
    const raw = await request.text();
    if (encoder.encode(raw).length > MAX_BODY_BYTES) return json(413, { message: 'Request too large.' });
    payload = JSON.parse(raw || '{}');
  } catch { return json(400, { message: 'Malformed request body.' }); }
  if (payload._hp) return json(200, { success: true });
  const applicationType = getApplicationType(payload.positionId);
  if (!applicationType) return json(400, { message: 'Unknown position.' });
  const values = { ...(payload.values && typeof payload.values === 'object' ? payload.values : {}), discordUsername: session.discordUsername };
  const { valid, errors } = validateApplication(getAllFields(applicationType), values);
  if (!valid) return json(400, { message: Object.values(errors)[0] || 'Please check your answers and try again.' });
  for (const field of getAllFields(applicationType)) {
    const value = values[field.key];
    if (Array.isArray(value) && field.options && value.some((choice) => !field.options.includes(choice))) {
      return json(400, { message: `Choose valid options for \"${field.label}\".` });
    }
  }
  const cleanValues = {};
  for (const field of getAllFields(applicationType)) cleanValues[field.key] = Array.isArray(values[field.key]) ? values[field.key].filter((v) => typeof v === 'string').map(sanitizeText) : typeof values[field.key] === 'string' ? sanitizeText(values[field.key]) : values[field.key];
  for (const key of ['country', 'state', 'timezone']) if (typeof values[key] === 'string') cleanValues[key] = sanitizeText(values[key]);
  cleanValues.discordUsername = session.discordUsername;
  const filename = buildPdfFilename(applicationType.label, cleanValues.fullName || session.discordUsername || 'Applicant');
  const pdfBlob = typeof payload.pdfBase64 === 'string' ? makePdfBlob(payload.pdfBase64) : null;
  if (!pdfBlob) return json(400, { message: 'The generated PDF is invalid or too large. Please try again.' });
  const embed = buildEmbed(applicationType, cleanValues);
  const attempts = [];
  if (env.DISCORD_WEBHOOK_URL) {
    attempts.push((async () => {
      const form = new FormData();
      form.append('payload_json', JSON.stringify({ content: `📋 New **${applicationType.label}** application from **${cleanValues.fullName || session.discordUsername}**`, embeds: [embed] }));
      form.append('files[0]', pdfBlob, filename);
      const result = await fetch(env.DISCORD_WEBHOOK_URL, { method: 'POST', body: form });
      if (!result.ok) throw new Error(`Webhook returned ${result.status}`);
      return 'webhook';
    })());
  }
  if (env.DISCORD_BOT_TOKEN && env.DISCORD_GUILD_ID && env.DISCORD_TICKET_CATEGORY_ID) {
    attempts.push((async () => {
      const channel = await createTicketChannel({ botToken: env.DISCORD_BOT_TOKEN, botUserId: env.DISCORD_CLIENT_ID || null, guildId: env.DISCORD_GUILD_ID, categoryId: env.DISCORD_TICKET_CATEGORY_ID, staffRoleId: env.DISCORD_STAFF_ROLE_ID || null, applicantId: session.discordId, name: `application-${(cleanValues.fullName || 'applicant').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80)}` });
      await postToChannel({ botToken: env.DISCORD_BOT_TOKEN, channelId: channel.id, content: `📋 New **${applicationType.label}** application from <@${session.discordId}>`, embeds: [embed], filename, fileBuffer: pdfBlob });
      return 'ticket';
    })());
  }
  if (!attempts.length) return json(500, { message: 'No team delivery channel is configured. Please contact an administrator.' });
  const outcomes = await Promise.allSettled(attempts);
  const succeeded = outcomes.filter((item) => item.status === 'fulfilled');
  if (!succeeded.length) return json(502, { message: 'We could not deliver your application right now. Please try again later.' });
  let dmSent = false;
  if (env.DISCORD_BOT_TOKEN) {
    try {
      await sendDirectMessage({ botToken: env.DISCORD_BOT_TOKEN, userId: session.discordId, content: `Thanks for applying to Minedrop! Here's a copy of your **${applicationType.label}** application for your records.`, filename, fileBuffer: pdfBlob });
      dmSent = true;
    } catch (error) { console.error('Applicant Discord DM failed:', error.message); }
  }
  return json(200, { success: true, dmSent, emailSent: false });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/discord/login') return request.method === 'GET' ? discordLoginStart(request, env) : json(405, { message: 'Method not allowed.' });
    if (url.pathname === '/api/discord/callback') return request.method === 'GET' ? discordCallback(request, env) : json(405, { message: 'Method not allowed.' });
    if (url.pathname === '/api/applications' && request.method === 'POST') return submitApplication(request, env);
    if (url.pathname === '/api/applications') return json(405, { message: 'Method not allowed.' });
    if (url.pathname.startsWith('/api/')) return json(404, { message: 'Not found.' });
    return env.ASSETS.fetch(request);
  },
};
