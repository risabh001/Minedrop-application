const API_BASE = process.env.DISCORD_API_BASE || 'https://discord.com/api/v10';

export async function exchangeCodeForToken({ code, clientId, clientSecret, redirectUri }) {
  const res = await fetch(`${API_BASE}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) throw new Error(`Discord token exchange failed: ${res.status}`);
  return res.json();
}

export async function getDiscordUser(accessToken) {
  const res = await fetch(`${API_BASE}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Discord user fetch failed: ${res.status}`);
  return res.json();
}

export async function checkGuildMembership({ botToken, guildId, userId }) {
  const res = await fetch(`${API_BASE}/guilds/${guildId}/members/${userId}`, {
    headers: { Authorization: `Bot ${botToken}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Guild membership check failed: ${res.status}`);
  return res.json();
}

export async function sendDirectMessage({ botToken, userId, content, filename, fileBuffer }) {
  const dmRes = await fetch(`${API_BASE}/users/@me/channels`, {
    method: 'POST',
    headers: { Authorization: `Bot ${botToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipient_id: userId }),
  });
  if (!dmRes.ok) throw new Error(`Could not open DM channel: ${dmRes.status}`);
  const dmChannel = await dmRes.json();

  const form = new FormData();
  form.append('payload_json', JSON.stringify({ content }));
  form.append('files[0]', new Blob([fileBuffer], { type: 'application/pdf' }), filename);

  const msgRes = await fetch(`${API_BASE}/channels/${dmChannel.id}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bot ${botToken}` },
    body: form,
  });
  if (!msgRes.ok) throw new Error(`Could not send DM: ${msgRes.status}`);
  return msgRes.json();
}

export async function postToChannel({ botToken, channelId, content, embeds, filename, fileBuffer }) {
  const form = new FormData();
  form.append('payload_json', JSON.stringify({ content, embeds }));
  form.append('files[0]', new Blob([fileBuffer], { type: 'application/pdf' }), filename);

  const res = await fetch(`${API_BASE}/channels/${channelId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bot ${botToken}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Could not post to channel: ${res.status}`);
  return res.json();
}

export async function createTicketChannel({ botToken, botUserId, guildId, categoryId, staffRoleId, applicantId, name }) {
  const permissionOverwrites = [
    { id: guildId, type: 0, deny: '1024' },
    { id: applicantId, type: 1, allow: '3072' },
  ];
  if (botUserId) {
    permissionOverwrites.push({ id: botUserId, type: 1, allow: '52224' });
  }
  if (staffRoleId) {
    permissionOverwrites.push({ id: staffRoleId, type: 0, allow: '3072' });
  }

  const res = await fetch(`${API_BASE}/guilds/${guildId}/channels`, {
    method: 'POST',
    headers: { Authorization: `Bot ${botToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      type: 0,
      parent_id: categoryId || undefined,
      permission_overwrites: permissionOverwrites,
    }),
  });
  if (!res.ok) throw new Error(`Could not create ticket channel: ${res.status}`);
  return res.json();
}
