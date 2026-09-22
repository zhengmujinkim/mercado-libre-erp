// Token storage & auto-refresh for Mercado Libre CBT API
// Persistence order: Vercel Edge Config (persistent) -> memory cache -> env vars

const USER_ID = '3650205937';
const FALLBACK_CLIENT_ID = '1167380097326946';
const FALLBACK_CLIENT_SECRET = '8nMYwpYkIDjVjh4ihHsWAtlt8x4Xn7qG';
const FALLBACK_REFRESH_TOKEN = 'TG-6ab2520235e7eb0001c61224-3650205937';
const FALLBACK_ACCESS_TOKEN = 'APP_USR-1167380097326946-092206-4c4d46d90cc00aa531f837ab54a848f7-3650205937';

export interface StoredTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user_id: string;
  token_type: string;
  scope: string;
  updated_at: string;
}

export interface TokenStatus {
  hasToken: boolean;
  isValid: boolean;
  expiresAt: string | null;
  expiresIn: number;
  userId: string | null;
}

// In-memory cache (persists across warm invocations in same container)
let memoryCache: StoredTokens | null = null;
let memoryCacheTime = 0;

// Edge Config read endpoint: https://edge-config.vercel.com/{id}/item/{key}?token={readToken}
function edgeConfigReadUrl(): string | null {
  const conn = process.env.EDGE_CONFIG;
  if (!conn) return null;
  // connection string like: https://edge-config.vercel.com/ecfg_xxx?token=yyy
  const base = conn.split('?')[0].replace(/\/$/, '');
  return `${base}/item/ml_tokens?${conn.split('?')[1] || ''}`;
}

// Edge Config write via Vercel Management API (needs VERCEL_API_TOKEN + EDGE_CONFIG_ID)
async function edgeConfigWrite(tokens: StoredTokens): Promise<boolean> {
  const apiToken = process.env.VERCEL_API_TOKEN;
  const configId = process.env.EDGE_CONFIG_ID;
  const teamId = process.env.VERCEL_TEAM_ID;
  if (!apiToken || !configId) return false;
  try {
    const url = `https://api.vercel.com/v1/edge-config/${configId}/items${teamId ? `?teamId=${teamId}` : ''}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ operation: 'upsert', key: 'ml_tokens', value: tokens }] }),
      cache: 'no-store',
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function edgeConfigRead(): Promise<StoredTokens | null> {
  const url = edgeConfigReadUrl();
  if (!url) return null;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.access_token && data.refresh_token) return data as StoredTokens;
    return null;
  } catch {
    return null;
  }
}

// --- Env var helpers (fallback when Edge Config not available) ---
function getTokensFromEnv(): StoredTokens | null {
  const at = process.env.MELI_ACCESS_TOKEN || FALLBACK_ACCESS_TOKEN;
  const rt = process.env.MELI_REFRESH_TOKEN || FALLBACK_REFRESH_TOKEN;
  if (!at || !rt) return null;
  const expiresAt = parseInt(process.env.MELI_TOKEN_EXPIRES_AT || '0', 10);
  return {
    access_token: at,
    refresh_token: rt,
    expires_at: expiresAt || (Math.floor(Date.now() / 1000) + 21600),
    user_id: USER_ID,
    token_type: 'Bearer',
    scope: '',
    updated_at: new Date().toISOString(),
  };
}

// --- Core functions ---
export async function getStoredTokens(): Promise<StoredTokens | null> {
  // 1. Try Edge Config (persistent across cold starts)
  const ecTokens = await edgeConfigRead();
  if (ecTokens) {
    memoryCache = ecTokens;
    memoryCacheTime = Date.now();
    return ecTokens;
  }
  // 2. Try memory cache
  if (memoryCache && Date.now() - memoryCacheTime < 300000) {
    return memoryCache;
  }
  // 3. Try env vars
  return getTokensFromEnv();
}

export async function saveTokens(data: {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type?: string;
  scope?: string;
  user_id?: string;
}): Promise<boolean> {
  const stored: StoredTokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 21600),
    user_id: data.user_id || USER_ID,
    token_type: data.token_type || 'Bearer',
    scope: data.scope || '',
    updated_at: new Date().toISOString(),
  };

  // Persist to Edge Config (survives cold starts)
  await edgeConfigWrite(stored);
  // Always update memory cache
  memoryCache = stored;
  memoryCacheTime = Date.now();
  return true;
}

export async function refreshAccessToken(): Promise<StoredTokens | null> {
  const stored = await getStoredTokens();
  const rt = stored?.refresh_token || process.env.MELI_REFRESH_TOKEN;
  if (!rt) return null;

  try {
    const res = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.MERCADO_LIBRE_CLIENT_ID || FALLBACK_CLIENT_ID,
        client_secret: process.env.MERCADO_LIBRE_CLIENT_SECRET || FALLBACK_CLIENT_SECRET,
        refresh_token: rt,
      }),
    });

    const data = await res.json();
    if (data.error) {
      console.error('Token refresh failed:', data.error, data.message);
      return null;
    }

    const newStored: StoredTokens = {
      access_token: data.access_token,
      refresh_token: data.refresh_token || rt,
      expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 21600),
      user_id: stored?.user_id || USER_ID,
      token_type: data.token_type || 'Bearer',
      scope: data.scope || stored?.scope || '',
      updated_at: new Date().toISOString(),
    };

    await saveTokens({
      access_token: newStored.access_token,
      refresh_token: newStored.refresh_token,
      expires_in: data.expires_in || 21600,
      token_type: newStored.token_type,
      scope: newStored.scope,
      user_id: newStored.user_id,
    });
    return newStored;
  } catch (err) {
    console.error('Token refresh error:', err);
    return null;
  }
}

export async function getAccessToken(): Promise<string | null> {
  const stored = await getStoredTokens();
  if (!stored) return null;

  const now = Math.floor(Date.now() / 1000);
  if (stored.expires_at - now < 300) {
    const refreshed = await refreshAccessToken();
    return refreshed?.access_token || null;
  }
  return stored.access_token;
}

export async function getTokenStatus(): Promise<TokenStatus> {
  const stored = await getStoredTokens();
  if (!stored) {
    return { hasToken: false, isValid: false, expiresAt: null, expiresIn: 0, userId: null };
  }
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = Math.max(0, stored.expires_at - now);
  return {
    hasToken: true,
    isValid: expiresIn > 300,
    expiresAt: new Date(stored.expires_at * 1000).toISOString(),
    expiresIn,
    userId: stored.user_id,
  };
}

export { USER_ID as ML_USER_ID };
