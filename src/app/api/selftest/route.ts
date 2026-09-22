// 美客多 API 连通性自测（带超时保护，每个请求最多 8 秒）
// 支持通过 MERCADO_LIBRE_API_BASE 环境变量切换代理/直连
export const dynamic = 'force-dynamic';

const ML_API = process.env.MERCADO_LIBRE_API_BASE || 'https://api.mercadolibre.com';

async function timedFetch(url: string, init?: RequestInit, ms = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' });
    const body = await res.text();
    return { status: res.status, blocked: body.includes('PolicyAgent'), bodyHead: body.slice(0, 180) };
  } catch (e) {
    return { error: String((e as Error)?.message || e) };
  } finally {
    clearTimeout(timer);
  }
}

export async function GET() {
  const [sites, oauth] = await Promise.all([
    timedFetch(`${ML_API}/sites/MLM`),
    timedFetch(`${ML_API}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: '0000000000000000',
        client_secret: 'test',
        code: 'invalid',
        redirect_uri: 'https://mercado-libre-erp.vercel.app/api/auth/callback',
      }).toString(),
    }),
  ]);

  return Response.json({
    checkedAt: new Date().toISOString(),
    vercelRegion: process.env.VERCEL_REGION || 'unknown',
    apiBase: ML_API,
    sites_MLM: sites,        // 期望 status=200
    oauth_token: oauth,      // 期望 status=400（参数错误=网络通）；403=被拦；error=超时
  });
}
