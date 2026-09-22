import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/token-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const LOGISTIC = 'remote';
const DEFAULT_SITE = 'MLB';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function apiCall(token: string, method: string, path: string, body?: unknown, extraHeaders?: Record<string, string>) {
  const res = await fetch(`https://api.mercadolibre.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(extraHeaders || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { /* noop */ }
  return { status: res.status, ok: res.ok, text, json };
}

/**
 * CBT 商品下架（暂停）。
 * 已验证可行的流程：
 *  1. 读取商品，拿到 user_product_id（CBTUxxx -> Uxxx）和 site_id
 *  2. 重新挂载站点恢复映射：POST /global/user-products/{up} sites_to_sell
 *  3. 等待映射传播
 *  4. PUT /global/items/{item} status=paused
 *  5. 复查状态
 */
async function pauseItem(token: string, itemId: string, requestedSite?: string) {
  const log: any = { id: itemId };

  // 1) detalle del item
  const detail = await apiCall(token, 'GET', `/items/${itemId}`);
  if (!detail.ok) {
    return { ...log, closed: false, error: detail.text.slice(0, 300) };
  }
  const rawUp: string = detail.json?.user_product_id || '';
  const upId = rawUp.replace(/^CBTU/, 'U');
  log.before = detail.json?.status;

  // Determine site: priority = requestedSite > item's site_id > DEFAULT_SITE
  const SITE = requestedSite || detail.json?.site_id || DEFAULT_SITE;

  // Si ya está pausado/cerrado, nada que hacer
  if (detail.json?.status !== 'active') {
    return { ...log, closed: true, already: detail.json?.status };
  }

  // 2-4) reintentar el ciclo readd -> pausa
  for (let attempt = 0; attempt < 3; attempt++) {
    if (upId) {
      await apiCall(token, 'POST', `/global/user-products/${upId}`, {
        sites_to_sell: [{ site_id: SITE, logistic_type: LOGISTIC }],
      });
    }
    await sleep(4000);

    const pause = await apiCall(token, 'PUT', `/global/items/${itemId}`, {
      site_id: SITE,
      logistic_type: LOGISTIC,
      status: 'paused',
    });
    log.lastPauseStatus = pause.status;
    if (!pause.ok) {
      log.pauseError = pause.text.slice(0, 300);
      await sleep(3000);
      continue;
    }

    await sleep(6000);
    const verify = await apiCall(token, 'GET', `/items/${itemId}`);
    log.after = verify.json?.status;
    if (verify.json?.status === 'paused' || verify.json?.status === 'closed') {
      return { ...log, closed: true };
    }

    // 补救：父商品仍 active，说明本地子商品没关掉。
    // 查 user-products v2 找到本地 listing，精确关闭，下一轮再 readd+暂停。
    if (upId) {
      const up = await apiCall(token, 'GET', `/user-products/${upId}`, undefined, { 'X-API-Version': '2' });
      const sites: any[] = up.json?.sites || up.json?.site_statuses || [];
      const targetSite = sites.find((s) => s.site_id === SITE);
      const localId: string | undefined = targetSite?.listing_id || targetSite?.item_id;
      if (localId) {
        await apiCall(token, 'PUT', `/global/user-products/${upId}`, {
          listing_sites: [{ listing_id: localId, status: 'closed' }],
        });
        log.localClosed = localId;
        await sleep(3000);
      }
    }
  }

  return { ...log, closed: false };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ids, site } = body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: 'Se requiere una lista de ids' }, { status: 400 });
    }
    const token = await getAccessToken();
    if (!token) {
      return NextResponse.json({ success: false, error: '请先授权美客多账号' }, { status: 401 });
    }
    const results = [];
    for (const id of ids) {
      results.push(await pauseItem(token, id, site));
    }
    return NextResponse.json({ success: true, results });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e?.message || e) }, { status: 500 });
  }
}
