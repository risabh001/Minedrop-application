function toBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value)));
}

export async function createToken(payload, secret) {
  const payloadB64 = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  return `${payloadB64}.${toBase64Url(await sign(payloadB64, secret))}`;
}

export async function verifyToken(token, secret) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  try {
    const actual = fromBase64Url(parts[1]);
    const expected = await sign(parts[0], secret);
    if (actual.length !== expected.length) return null;
    let mismatch = 0;
    for (let i = 0; i < actual.length; i += 1) mismatch |= actual[i] ^ expected[i];
    if (mismatch !== 0) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(parts[0])));
    return typeof payload.exp === 'number' && payload.exp > Date.now() ? payload : null;
  } catch { return null; }
}
