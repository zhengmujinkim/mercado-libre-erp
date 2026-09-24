// 健壮的 ML 商品批量查询
// 策略：分批(每20个)调用 /items?ids=；某批失败则记录真实错误并逐个 /items/{id} 回退

import { MELI_CONFIG } from './config';

const CHUNK_SIZE = 20;

export interface RawItem {
  [key: string]: any;
}

export interface FetchItemsResult {
  items: RawItem[];
  // ML 返回的真实错误（用于服务端日志和前端诊断）
  errors: string[];
  // 最终是否完全成功
  ok: boolean;
}

async function authHeaders(token: string): Promise<Record<string, string>> {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

// 调用一次 /items?ids=，返回 { bodies, ok, error }
async function multiGet(
  token: string,
  ids: string[]
): Promise<{ bodies: RawItem[]; ok: boolean; error: string | null }> {
  const url = `${MELI_CONFIG.apiBase}/items?ids=${encodeURIComponent(ids.join(','))}`;
  const res = await fetch(url, {
    headers: await authHeaders(token),
    cache: 'no-store',
  });

  if (!res.ok) {
    let detail = '';
    try {
      detail = (await res.text()).slice(0, 500);
    } catch {
      detail = '';
    }
    return { bodies: [], ok: false, error: `HTTP ${res.status}: ${detail}` };
  }

  const data = await res.json();
  // 正常：[{ code: 200, body: {...} }, ...]
  if (Array.isArray(data)) {
    const bodies: RawItem[] = [];
    const errors: string[] = [];
    for (const entry of data) {
      if (entry && (entry.code === 200 || entry.http_code === 200) && entry.body) {
        bodies.push(entry.body);
      } else if (entry) {
        errors.push(`item ${entry.body?.id ?? '?'} code=${entry.code ?? entry.http_code}`);
      }
    }
    return {
      bodies,
      ok: errors.length === 0,
      error: errors.length ? errors.join('; ') : null,
    };
  }
  // 异常但 HTTP 200：可能是单个错误对象
  return { bodies: [], ok: false, error: `unexpected payload: ${JSON.stringify(data).slice(0, 300)}` };
}

// 逐个查询回退
async function singleGet(token: string, id: string): Promise<RawItem | null> {
  try {
    const res = await fetch(`${MELI_CONFIG.apiBase}/items/${encodeURIComponent(id)}`, {
      headers: await authHeaders(token),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchItemsByIds(token: string, ids: string[]): Promise<FetchItemsResult> {
  const cleanIds = ids.map(id => String(id).trim()).filter(Boolean);
  if (cleanIds.length === 0) {
    return { items: [], errors: [], ok: true };
  }

  const allItems: RawItem[] = [];
  const errors: string[] = [];

  for (let i = 0; i < cleanIds.length; i += CHUNK_SIZE) {
    const chunk = cleanIds.slice(i, i + CHUNK_SIZE);
    const result = await multiGet(token, chunk);

    if (result.ok && result.bodies.length === chunk.length) {
      allItems.push(...result.bodies);
      continue;
    }

    // 整批 4xx/5xx 或部分失败：记录真实错误
    if (result.error) {
      console.error(`[ml-items] multiGet failed for chunk starting ${chunk[0]}: ${result.error}`);
      errors.push(result.error);
    }
    if (result.bodies.length > 0) {
      allItems.push(...result.bodies);
    }

    // 对缺失/失败的 ID 逐个回退
    const gotIds = new Set(result.bodies.map(b => b.id));
    const missing = chunk.filter(id => !gotIds.has(id));
    for (const id of missing) {
      const item = await singleGet(token, id);
      if (item) {
        allItems.push(item);
      } else {
        errors.push(`single GET failed: ${id}`);
      }
    }
  }

  return { items: allItems, errors, ok: errors.length === 0 };
}
