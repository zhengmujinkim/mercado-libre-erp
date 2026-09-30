/**
 * ML 竞品采集 API
 *
 * GET  /api/ml-scrape?id=MLB5276090987
 *   → 采集竞品数据（包装尺寸、主图、属性、详情）
 *
 * GET  /api/ml-scrape/rewrite?id=MLB5276090987
 *   → 采集 + 自动生成改写标题
 */

import { NextRequest, NextResponse } from 'next/server';
import { scrapeMLItem, parseItemId, rewriteTitle } from '@/lib/ml-scraper';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id') || '';
  const mode = request.nextUrl.searchParams.get('mode') || 'scrape'; // scrape | rewrite

  if (!id) {
    return NextResponse.json({ error: '请提供 id 参数（ML 商品 ID 或链接）' }, { status: 400 });
  }

  const itemId = parseItemId(id);
  if (!itemId) {
    return NextResponse.json({ error: '无效的 ML 商品 ID 或链接', hint: '示例: MLB5276090987 或 https://produto.mercadolivre.com.br/MLB-5276090987-xxx' }, { status: 400 });
  }

  const result = await scrapeMLItem(itemId);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  if (mode === 'rewrite') {
    result.title = rewriteTitle(result.title || '');
  }

  return NextResponse.json(result);
}
