import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/token-store';
import { MELI_CONFIG } from '@/lib/config';
import { fetchItemsByIds } from '@/lib/ml-items';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const status = searchParams.get('status') || 'active';

  try {
    const token = await getAccessToken();
    if (!token) {
      return NextResponse.json({ products: [], total: 0, mock: false, message: '请先完成美客多授权' });
    }

    // Step 1: 获取CBT ID列表
    const searchRes = await fetch(
      `${MELI_CONFIG.apiBase}/users/${MELI_CONFIG.userId}/items/search?limit=50&search_type=scan&status=${status}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }
    );

    if (!searchRes.ok) {
      return NextResponse.json({ products: [], total: 0, mock: false, message: `美客多API返回错误: ${searchRes.status}` });
    }

    const searchData = await searchRes.json();
    const itemIds: string[] = searchData.results || [];

    if (itemIds.length === 0) {
      return NextResponse.json({ products: [], total: 0, mock: false, message: '暂无在售商品' });
    }

    // Step 2: 健壮批量查询
    const { items: bodies, errors } = await fetchItemsByIds(token, itemIds);

    const products = bodies.map((body: any) => ({
      id: body.id,
      name: body.title || 'Unknown',
      category: body.category_id || '未知',
      purchasePrice: 0,
      sellingPrice: body.price || 0,
      netProceeds: body.net_proceeds ?? null,
      weight: body.shipping?.dimensions?.weight ? Number(body.shipping.dimensions.weight) : 0,
      site: body.site_id || 'CBT',
      status: body.status || 'active',
      rating: 0,
      soldRange: body.sales?.qty_sold_60_months?.toString() || '0',
      thumbnail: body.thumbnail || '',
      permalink: body.permalink || '',
    }));

    let filtered = products;
    if (category && category !== '全部品类') {
      filtered = products.filter((p) => p.category === category);
    }

    const response: Record<string, unknown> = { products: filtered, total: filtered.length, mock: false };
    if (errors.length > 0) {
      response.diagnostics = errors.slice(0, 5);
    }
    return NextResponse.json(response);
  } catch (err) {
    console.error('Products API error:', err);
    return NextResponse.json({ products: [], total: 0, mock: false, message: '美客多API连接失败' });
  }
}
