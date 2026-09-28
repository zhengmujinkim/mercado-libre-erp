/**
 * 1688 图片采集核心库
 *
 * 链路：
 *   云手机(已登录1688)打开商品页 → 地址栏 javascript: 脚本提取图片
 *   → fetch 推送到 ERP /api/collect1688/receive
 *   → 服务器下载 alicdn 原图 → 分类 + 同款一致性校验 → KV 暂存
 *   → 前端审核确认 → 写回 selection-pool/data.json 重建图片库
 *
 * 设计原则：所有图片来自同一个 offer 详情页，从源头保证"同款一致"。
 */

import { kvGet, kvSet } from './kv';

/* ------------------------------------------------------------------ */
/* 1. offer 基础解析                                                    */
/* ------------------------------------------------------------------ */

/** 从 1688 URL 中提取 offerId（商品数字ID） */
export function parseOfferId(url: string): string | null {
  if (!url) return null;
  // detail.1688.com/offer/999514423226.html
  const m = url.match(/offer\/(\d+)/);
  if (m) return m[1];
  // 兜底：URL 里任意 11 位以上连续数字
  const m2 = url.match(/(\d{11,})/);
  return m2 ? m2[1] : null;
}

/** 判断是不是真实单品详情链接（区别于搜索页 s.1688.com/kq） */
export function isOfferUrl(url: string): boolean {
  return /detail\.1688\.com\/offer\/\d+/.test(url || '');
}

/* ------------------------------------------------------------------ */
/* 2. 图片 URL 处理                                                     */
/* ------------------------------------------------------------------ */

/**
 * 把缩略/裁剪地址还原为高清原图。
 * 1688 常见：xxx.jpg_570x10000Q75.jpg_.webp  →  xxx.jpg
 *           xxx.jpg_300x300.jpg             →  xxx.jpg
 * 保留 alicdn 原图（带 !! 的处理串保留，那是原图标识）。
 */
export function toOriginalUrl(raw: string): string {
  let u = raw.trim();
  // 去掉协议相对地址
  if (u.startsWith('//')) u = 'https:' + u;
  // 去掉常见裁剪后缀：.jpg_xxx.webp / .jpg_xxx.jpg / .jpg_50x50.jpg 等
  u = u.replace(/\.(jpg|jpeg|png|webp)_[\dxQq!_.a-zA-Z]+\.(webp|jpg|jpeg|png)$/i, '.$1');
  // 去掉纯尺寸后缀：xxx.jpg_300x300
  u = u.replace(/\.(jpg|jpeg|png|webp)_[\dxQq]+$/i, '.$1');
  return u;
}

/** 图片是否来自 1688 官方图床 */
export function is1688Cdn(url: string): boolean {
  return /alicdn\.com/.test(url || '');
}

/**
 * 根据 URL 路径做初分类（后续 AI 精修）。
 * cbu01/img/ibank/ 主图库 → main（主图/SKU图）
 * 含 desc / detail / O1CN 长图描述路径 → detail
 * imge 等其它 → other
 */
export type ImageRole1688 = 'main' | 'detail' | 'sku' | 'unknown';

export function classifyByUrl(url: string): ImageRole1688 {
  const u = (url || '').toLowerCase();
  // 详情描述长图多在 imge/ 或带 desc 标记，且文件名常带处理串
  if (/\/imge\//.test(u) || /desc|detail|description/.test(u)) return 'detail';
  // 主图库
  if (/cbu01\.alicdn/.test(u) && /\/img\/ibank\//.test(u)) return 'main';
  return 'unknown';
}

/** 过滤掉明显非产品图（UI 图标、表情、店招、占位图） */
export function isLikelyProductImage(url: string): boolean {
  const u = (url || '').toLowerCase();
  if (!is1688Cdn(url)) return false;
  // 排除图标/UI 资源路径
  if (/\/(img|assets)\/.*(icon|logo|btn|sprite|emoji|avatar|shop|banner|ad\/)/.test(u)) return false;
  // 产品图通常在 ibank / imge 目录
  return /\/ibank\//.test(u) || /\/imge\//.test(u);
}

/* ------------------------------------------------------------------ */
/* 3. 采集结果类型                                                      */
/* ------------------------------------------------------------------ */

export interface CollectedImage {
  rawUrl: string;        // 页面提取的原始地址
  url: string;           // 还原后的高清地址
  role: ImageRole1688;   // 初分类
  width?: number;
  height?: number;
  bytes?: number;
  ok: boolean;           // 是否可下载
  aiRole?: string;       // AI 精修分类
  sameProduct?: boolean; // 同款一致性
  issues?: string[];
}

export interface CollectRecord {
  id: string;            // 记录ID = offerId 或 productId
  productId?: string;    // 绑定的选品池产品（p01..p40）
  offerId: string;
  pageUrl: string;       // 提取时的页面地址
  title?: string;
  images: CollectedImage[];
  status: 'pending' | 'confirmed' | 'rejected';
  collectedAt: string;
  confirmedAt?: string;
}

/* ------------------------------------------------------------------ */
/* 4. 存储层：Edge Config 优先，KV 兜底                                  */
/* ------------------------------------------------------------------ */

const EC_KEYS = {
  records: 'c1688_records',
  mapping: 'c1688_mapping',
} as const;

// Edge Config read: 复用 token-store 的模式
function edgeConfigReadUrl(key: string): string | null {
  const conn = process.env.EDGE_CONFIG;
  if (!conn) return null;
  const base = conn.split('?')[0].replace(/\/$/, '');
  const token = conn.split('?')[1] || '';
  return `${base}/item/${key}?${token}`;
}

// Edge Config write: 通过 Vercel Management API
async function edgeConfigWrite(items: { operation: 'upsert'; key: string; value: unknown }[]): Promise<boolean> {
  const apiToken = process.env.VERCEL_API_TOKEN;
  const configId = process.env.EDGE_CONFIG_ID;
  const teamId = process.env.VERCEL_TEAM_ID;
  if (!apiToken || !configId) return false;
  try {
    const url = `https://api.vercel.com/v1/edge-config/${configId}/items${teamId ? `?teamId=${teamId}` : ''}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
      cache: 'no-store',
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function edgeConfigRead<T>(key: string): Promise<T | null> {
  const url = edgeConfigReadUrl(key);
  if (!url) return null;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return (data ?? null) as T | null;
  } catch {
    return null;
  }
}

// 通用存储接口：Edge Config 优先，KV 兜底
async function storageGet<T>(key: string, kvKey: string): Promise<T | null> {
  // 优先 Edge Config
  const ec = await edgeConfigRead<T>(key);
  if (ec) return ec;
  // 兜底 KV
  return kvGet<T>(kvKey);
}

async function storageSet<T>(key: string, kvKey: string, value: T): Promise<boolean> {
  // 优先 Edge Config
  const ecOk = await edgeConfigWrite([{ operation: 'upsert', key, value }]);
  if (ecOk) return true;
  // 兜底 KV
  return kvSet(kvKey, value);
}

export async function getAllRecords(): Promise<Record<string, CollectRecord>> {
  return (await storageGet<Record<string, CollectRecord>>(EC_KEYS.records, 'collect1688:records')) || {};
}

export async function getRecord(id: string): Promise<CollectRecord | null> {
  const all = await getAllRecords();
  return all[id] || null;
}

export async function saveRecord(record: CollectRecord): Promise<boolean> {
  const all = await getAllRecords();
  all[record.id] = record;
  return storageSet(EC_KEYS.records, 'collect1688:records', all);
}

/** offerId → productId 绑定映射 */
export async function getOfferMapping(): Promise<Record<string, string>> {
  return (await storageGet<Record<string, string>>(EC_KEYS.mapping, 'collect1688:mapping')) || {};
}

export async function bindOffer(offerId: string, productId: string): Promise<boolean> {
  const m = await getOfferMapping();
  m[offerId] = productId;
  return storageSet(EC_KEYS.mapping, 'collect1688:mapping', m);
}

/** 根据 offerId 反查绑定的 productId */
export async function resolveProductId(offerId: string): Promise<string | undefined> {
  const m = await getOfferMapping();
  return m[offerId];
}

/* ------------------------------------------------------------------ */
/* 5. 同款一致性校验（规则层，AI 层在 vision 模块补充）                    */
/* ------------------------------------------------------------------ */

/**
 * 规则层一致性：
 *  - 所有图必须来自同一 offer 页（天然满足，链路保证）
 *  - 主图组应来自同一 ibank 卖家目录（!! 后面的卖家ID一致）
 *  - 异常尺寸（过窄/过宽的店招横幅）标记
 */
export function ruleConsistencyCheck(images: CollectedImage[]): CollectedImage[] {
  // 提取主图卖家ID：!!954446126-0-cib 中的 954446126
  const sellerIds = new Set<string>();
  for (const img of images) {
    const m = img.url.match(/!!(\d+)-/);
    if (m && img.role === 'main') sellerIds.add(m[1]);
  }
  const primarySeller = sellerIds.size > 0 ? [...sellerIds].sort((a, b) => b.length - a.length)[0] : null;

  return images.map((img) => {
    const issues = [...(img.issues || [])];
    let sameProduct = true;

    // 主图跨卖家目录 → 疑似混图
    if (primarySeller && img.role === 'main') {
      const m = img.url.match(/!!(\d+)-/);
      if (m && m[1] !== primarySeller) {
        sameProduct = false;
        issues.push('主图来自不同卖家目录，疑似非同款混图');
      }
    }
    // 尺寸异常：过窄/过宽横幅
    if (img.width && img.height) {
      const ratio = img.width / img.height;
      if (ratio > 4 || ratio < 0.25) {
        issues.push('尺寸异常(超宽/超窄)，疑似店招或拼接图');
      }
    }
    if (!img.ok) {
      sameProduct = false;
      issues.push('图片无法下载');
    }
    return { ...img, sameProduct, issues };
  });
}

/* ------------------------------------------------------------------ */
/* 6. 工具：去重 + 规范化一批原始 URL                                    */
/* ------------------------------------------------------------------ */

export function normalizeImages(rawUrls: string[]): CollectedImage[] {
  const seen = new Set<string>();
  const out: CollectedImage[] = [];
  for (const raw of rawUrls) {
    if (!isLikelyProductImage(raw)) continue;
    const url = toOriginalUrl(raw);
    if (seen.has(url)) continue;
    seen.add(url);
    out.push({
      rawUrl: raw,
      url,
      role: classifyByUrl(url),
      ok: true,
    });
  }
  return out;
}
