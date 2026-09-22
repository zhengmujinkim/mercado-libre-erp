// Vercel 服务器自测美客多连通性：通过代理或直连测试
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const ML_API = process.env.MERCADO_LIBRE_API_BASE || 'https://api.mercadolibre.com';

async function timedFetch(url: string, init?: RequestInit, ms = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const start = Date.now();
    const res = await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' });
    const body = await res.text();
    return {
      status: res.status,
      ms: Date.now() - start,
      blocked: body.includes('PolicyAgent'),
      bodyHead: body.slice(0, 200),
    };
  } catch (e) {
    return { error: String((e as Error)?.message || e) };
  } finally {
    clearTimeout(timer);
  }
}

export async function GET() {
  const result: Record<string, unknown> = {
    checkedAt: new Date().toISOString(),
    vercelRegion: process.env.VERCEL_REGION || 'unknown',
    apiBase: ML_API,
    functionWorks: true,
  };

  // 1) 美客多公开端点
  result.sites_MLM = await timedFetch(`${ML_API}/sites/MLM`);

  // 2) 美客多令牌端点（错误参数 → 网络通应返回 400）
  result.oauth_token = await timedFetch(`${ML_API}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: '0000000000000000',
      client_secret: 'test',
      code: 'invalid-code',
      redirect_uri: process.env.MERCADO_LIBRE_REDIRECT_URI || 'https://example.com/callback',
    }).toString(),
  });

  // 判定
  const s = result.sites_MLM as { status?: number; blocked?: boolean; error?: string };
  const o = result.oauth_token as { status?: number; blocked?: boolean; error?: string };
  result.verdict = s.status === 200 && o.status === 400
    ? '✅ 美客多API完全可达，可以走真实授权'
    : s.blocked || o.blocked
    ? '❌ 仍被 PolicyAgent 拦截'
    : '⚠️ 部分异常，见明细';

  return Response.json(result);
}
