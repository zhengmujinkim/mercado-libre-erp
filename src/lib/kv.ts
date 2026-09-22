// Vercel KV REST API client (no extra dependencies)
// Uses VERCEL_KV_REST_API_URL and VERCEL_KV_REST_API_TOKEN env vars

function kvHeaders() {
  const token = process.env.VERCEL_KV_REST_API_TOKEN;
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

function kvUrl() {
  return process.env.VERCEL_KV_REST_API_URL;
}

/** GET a value from KV */
export async function kvGet<T = unknown>(key: string): Promise<T | null> {
  const url = kvUrl();
  if (!url) return null;
  try {
    const res = await fetch(`${url}/get/${key}`, { headers: kvHeaders(), cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.result ?? data) as T;
  } catch {
    return null;
  }
}

/** SET a value in KV (with optional TTL in seconds) */
export async function kvSet(key: string, value: unknown, ex?: number): Promise<boolean> {
  const url = kvUrl();
  if (!url) return false;
  try {
    const params = ex ? `?EX=${ex}` : '';
    const res = await fetch(`${url}/set/${key}${params}`, {
      method: 'POST',
      headers: kvHeaders(),
      body: JSON.stringify(value),
    });
    return res.ok;
  } catch {
    return false;
  }
}
