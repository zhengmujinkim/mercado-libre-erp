/**
 * 1688 商品规格提取 API
 *
 * GET  /api/1688-specs?url=https://detail.1688.com/offer/xxx.html
 *   → 从页面提取包装规格（重量、尺寸）
 *
 * POST /api/1688-specs
 *   body: { offer_url, manual_specs? }
 *   → 合并手动输入 + 页面抓取
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchSpecsFromUrl, resolveSpecs, isOfferUrl } from '@/lib/1688-specs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url') || '';

  if (!url) {
    return NextResponse.json({ error: '请提供 url 参数' }, { status: 400 });
  }

  if (!isOfferUrl(url)) {
    return NextResponse.json({ error: 'URL 不是 1688 商品详情页', url }, { status: 400 });
  }

  const specs = await fetchSpecsFromUrl(url);

  return NextResponse.json({
    url,
    specs,
    hint: specs.source
      ? `成功提取：${specs.weight_g ? `重量 ${specs.weight_g}g` : ''}${specs.length_cm ? ` 尺寸 ${specs.length_cm}×${specs.width_cm}×${specs.height_cm}cm` : ''}`
      : '未能提取到规格，1688页面可能需要登录态，建议手动输入',
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { offer_url, manual_specs, stored_specs } = body;

    if (!offer_url && !manual_specs) {
      return NextResponse.json({ error: '请提供 offer_url 或 manual_specs' }, { status: 400 });
    }

    const specs = await resolveSpecs({
      offerUrl: offer_url,
      manual: manual_specs,
      stored: stored_specs,
    });

    return NextResponse.json({
      specs,
      source: specs.source,
      confidence: specs.confidence,
    });
  } catch (e) {
    return NextResponse.json({ error: '解析失败', detail: String(e) }, { status: 500 });
  }
}
