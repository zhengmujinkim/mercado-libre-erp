import { NextRequest, NextResponse } from 'next/server';
import { MELI_CONFIG } from '@/lib/config';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const site = searchParams.get('site') || 'MLM';

  if (!q) {
    return NextResponse.json({ results: [], query: q, site, mock: false, message: '请输入搜索关键词' });
  }

  try {
    // ML public search API (doesn't require auth)
    const res = await fetch(
      `${MELI_CONFIG.apiBase}/sites/${site}/search?q=${encodeURIComponent(q)}&limit=20`,
      { next: { revalidate: 300 } }
    );

    if (res.ok) {
      const data = await res.json();
      const results = (data.results || []).map((item: Record<string, unknown>) => ({
        id: item.id,
        title: item.title,
        price: item.price,
        currency: (item as Record<string, Record<string, string>>).currency?.id || 'MXN',
        condition: item.condition,
        thumbnail: item.thumbnail,
        permalink: item.permalink,
        sold_quantity: item.sold_quantity,
        available_quantity: item.available_quantity,
        shipping: (item as Record<string, Record<string, unknown>>).shipping?.free_shipping || false,
        accept_meli_credits: (item as Record<string, Record<string, unknown>>).installments ? true : false,
      }));

      return NextResponse.json({
        results,
        query: q,
        site,
        total: data.paging?.total || results.length,
        mock: false,
      });
    }
  } catch (err) {
    console.error('Market search API error:', err);
  }

  // Fallback: return empty with message (better than fake data for search)
  return NextResponse.json({
    results: [],
    query: q,
    site,
    mock: true,
    message: '搜索API暂不可用，请稍后重试',
  });
}
