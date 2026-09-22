// 美客多 API 连通性自测（带超时保护，每个请求最多 10 秒）
// 合并原 ml-test 功能：同时测试公开端点 + OAuth端点 + 自动判定
// 支持通过 MERCADO_LIBRE_API_BASE 环境变量切换代理/直连
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

  // Run both tests in parallel
  const [sitesResult, oauthResult] = await Promise.all([
    // 1) 美客多公开端点
    timedFetch(`${ML_API}/sites/MLM`),
    // 2) 美客多令牌端点（错误参数 → 网络通应返回 400）
    timedFetch(`${ML_API}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: '0000000000000000',
        client_secret: 'test',
        code: 'invalid-code',
        redirect_uri: process.env.MERCADO_LIBRE_REDIRECT_URI || 'https://mercado-libre-erp.vercel.app/api/auth/callback',
      }).toString(),
    }),
  ]);

  result.sites_MLM = sitesResult;
  result.oauth_token = oauthResult;

  // 自动判定
  const s = sitesResult as { status?: number; blocked?: boolean; error?: string };
  const o = oauthResult as { status?: number; blocked?: boolean; error?: string };
  result.verdict = s.status === 200 && o.status === 400
    ? '✅ 美客多API完全可达，可以走真实授权'
    : s.blocked || o.blocked
    ? '❌ 仍被 PolicyAgent 拦截'
    : '⚠️ 部分异常，见明细';

  return Response.json(result);
}
