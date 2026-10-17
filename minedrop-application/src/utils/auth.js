const STORAGE_KEY = 'minedrop_session_token';

export function getToken() {
  return sessionStorage.getItem(STORAGE_KEY);
}

export function setToken(token) {
  sessionStorage.setItem(STORAGE_KEY, token);
}

export function clearToken() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function decodeToken(token) {
  if (!token || !token.includes('.')) return null;
  try {
    const [payloadB64] = token.split('.');
    return JSON.parse(atob(payloadB64));
  } catch {
    return null;
  }
}

export function isTokenLikelyValid(token) {
  const payload = decodeToken(token);
  return Boolean(payload && typeof payload.exp === 'number' && payload.exp > Date.now());
}

export function isAuthenticated() {
  return isTokenLikelyValid(getToken());
}

export function getSessionUser() {
  const payload = decodeToken(getToken());
  if (!payload || !isTokenLikelyValid(getToken())) return null;
  return {
    discordId: payload.discordId,
    discordUsername: payload.discordUsername,
    displayName: payload.displayName,
  };
}

export function getDiscordLoginUrl() {
  return '/.netlify/functions/discord-login-start';
}

export function logout() {
  clearToken();
}

export async function authFetch(url, options = {}) {
  const token = getToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: token ? `Bearer ${token}` : '',
    },
  });
  if (res.status === 401) {
    clearToken();
  }
  return res;
}
