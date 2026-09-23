import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// 真实选品数据文件（与本路由同目录）
const DATA_FILE = path.join(process.cwd(), 'src/app/api/selection-pool/data.json');

// 汇率与佣金（与前端说明一致）
const FX = 7.2;
const SALE_FEE = 0.16;

// item_ids 的 marketplace key -> 标准站点
const KEY_TO_SITE: Record<string, string> = {
  BR: 'MLB',
  MLB: 'MLB',
  MX: 'MLM',
  MLM: 'MLM',
  AR: 'MLA',
  MLA: 'MLA',
  CO: 'MCO',
  MCO: 'MCO',
  CL: 'MLC',
  MLC: 'MLC',
  UY: 'MLU',
  MLU: 'MLU',
};

interface SiteStatus {
  site_id: string;
  item_id?: string;
  status: 'listed' | 'listing' | 'pending';
}

type RawItem = Record<string, any>;

// 取第一个有效有限数字，否则 0
function firstNum(...vals: any[]): number {
  for (const v of vals) {
    const n = Number(v);
    if (isFinite(n)) return n;
  }
  return 0;
}

// 10分制评分归一到百分制
function normScore(s: number): number {
  const n = Number(s) || 0;
  return n <= 20 ? Math.round(n * 10) : Math.round(n);
}

// verdict 归一到前端四类
function normVerdit(raw: string | undefined, score100: number): 'hot' | 'go' | 'watch' | 'skip' {
  if (raw === 'pass') return 'go';
  if (raw === 'hot' || raw === 'go' || raw === 'watch' || raw === 'skip') return raw;
  // 缺失（p21-p30）按评分补
  if (score100 >= 85) return 'hot';
  if (score100 >= 70) return 'go';
  return 'watch';
}

// 从 item_ids 构建站点状态
function buildSites(item: RawItem): SiteStatus[] {
  const ids = item.item_ids || {};
  const bySite = new Map<string, SiteStatus>();
  for (const [key, val] of Object.entries(ids)) {
    const siteId = KEY_TO_SITE[key];
    if (!siteId) continue; // global 等非站点键跳过
    const existing = bySite.get(siteId);
    // 已存在则保留更"完整"的（带 item_id）
    if (existing && existing.item_id) continue;
    bySite.set(siteId, {
      site_id,
      item_id: val ? String(val) : undefined,
      status: 'listed',
    });
  }
  return Array.from(bySite.values());
}

// 统一重算净利（¥）与利润率（%），修正历史批次不一致
function calcProfit(totalCost: number, sellUSD: number) {
  const grossCNY = sellUSD * FX;
  const netCNY = grossCNY * (1 - SALE_FEE) - totalCost;
  const margin = grossCNY > 0 ? (netCNY / grossCNY) * 100 : 0;
  return { netProfit: netCNY, margin };
}

async function readRaw(): Promise<RawItem[]> {
  const text = await fs.readFile(DATA_FILE, 'utf-8');
  return JSON.parse(text) as RawItem[];
}

// 转换成前端结构（展示层归一，不改原文件）
// 兼容三套历史 schema：
//  A(p01-p20): price1688/totalCost/sellUSD/categoryLabel
//  B(p21-p30): estimated_cost_cny/estimated_price_usd/subcategory
//  C(p31-p40): supplier_price/sellUSD(混) + weight/variant
function toView(item: RawItem) {
  const score100 = normScore(item.score);

  // 采购价（¥）：多字段回退
  const price1688 = firstNum(
    item.price1688, item.estimated_cost_cny, item.supplier_price
  );

  // 总成本（¥）：totalCost 优先；否则 采购价 + ¥6
  let totalCost = Number(item.totalCost);
  if (!isFinite(totalCost)) totalCost = price1688 + 6;

  // 目标价/净收益（USD）：sellUSD 或 estimated_price_usd
  const sellUSD = firstNum(item.sellUSD, item.estimated_price_usd);

  const { netProfit, margin } = calcProfit(totalCost, sellUSD);

  return {
    id: item.id,
    rank: Number(item.rank) || 0,
    name: item.name,
    category: item.category,
    categoryLabel: item.categoryLabel || item.subcategory || item.category || '',
    categoryId: item.categoryId || item.ml_category || '',
    price1688,
    totalCost,
    sellUSD,
    netProfit,
    margin,
    competitors: Number(item.competitors) || 0,
    score: score100,
    verdict: normVerdit(item.verdict, score100),
    note: item.note || item.source_note || '',
    status: item.status || 'pending',
    supplier_url: item.supplier_url,
    supplier_name: item.supplier_name,
    supplier_price: item.supplier_price,
    monthly_sales: item.monthly_sales,
    images: item.images || [],
    sites: buildSites(item),
  };
}

export async function GET() {
  try {
    const raw = await readRaw();
    const items = raw.map(toView);

    const stats = {
      total: items.length,
      pending: items.filter(i => i.status === 'pending').length,
      approved: items.filter(i => i.status === 'approved').length,
      listed: items.filter(i => i.status === 'listed').length,
      avgMargin: items.reduce((s, i) => s + i.margin, 0) / (items.length || 1),
      minCost: Math.min(...items.map(i => i.totalCost)),
      maxProfit: Math.max(...items.map(i => i.netProfit)),
    };

    return NextResponse.json({ items, stats });
  } catch (e) {
    console.error('selection-pool GET error:', e);
    return NextResponse.json({ items: [], stats: null, error: '读取选品数据失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ids, status } = body;

    if (action === 'update_status' && Array.isArray(ids) && status) {
      const raw = await readRaw();
      let changed = 0;
      for (const item of raw) {
        if (ids.includes(item.id)) {
          item.status = status;
          changed++;
        }
      }
      // 尝试持久化（云盘环境可写；只读平台环境写回会失败但不影响内存语义）
      try {
        await fs.writeFile(DATA_FILE, JSON.stringify(raw, null, 2), 'utf-8');
      } catch (writeErr) {
        console.warn('status 写回失败（环境只读）:', (writeErr as Error)?.message);
      }
      return NextResponse.json({ success: true, updated: changed });
    }

    if (action === 'reset') {
      // 真实经营数据不做破坏性重置
      return NextResponse.json({ success: true, message: '真实选品数据不支持重置' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e) {
    console.error('selection-pool POST error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
