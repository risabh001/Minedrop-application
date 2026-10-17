import crypto from 'node:crypto';

export function createToken(payload, secret) {
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64');
  const hmac = crypto.createHmac('sha256', secret).update(payloadB64).digest('hex');
  return `${payloadB64}.${hmac}`;
}

export function verifyToken(token, secret) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [payloadB64, hmac] = token.split('.');
  if (!payloadB64 || !hmac) return null;

  const expected = crypto.createHmac('sha256', secret).update(payloadB64).digest('hex');
  const a = Buffer.from(hmac, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf8'));
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getBearerToken(event) {
  const header = event.headers.authorization || event.headers.Authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}
