import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/token-store';
import { MELI_CONFIG } from '@/lib/config';

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

    // Step 2: 批量获取CBT详情（每次最多50个）
    const idsBatch = itemIds.slice(0, 50).join(',');
    const itemsRes = await fetch(
      `${MELI_CONFIG.apiBase}/items?ids=${idsBatch}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }
    );

    if (!itemsRes.ok) {
      return NextResponse.json({ products: [], total: 0, mock: false, message: `批量查询失败: ${itemsRes.status}` });
    }

    const itemsData = await itemsRes.json();
    // itemsData 是数组，每个元素是 {body: {...}, http_code: 200} 或 {body: {...}, http_code: 403}
    const products = itemsData
      .filter((item: any) => item.http_code === 200 && item.body)
      .map((item: any) => {
        const body = item.body;
        return {
          id: body.id,
          name: body.title || 'Unknown',
          category: body.category_id || '未知',
          purchasePrice: 0,
          sellingPrice: body.price || 0,
          weight: body.shipping?.dimensions?.weight ? Number(body.shipping.dimensions.weight) : 0,
          site: body.site_id || 'MLM',
          status: body.status || 'active',
          rating: 0,
          soldRange: body.sales?.qty_sold_60_months?.toString() || '0',
          thumbnail: body.thumbnail || '',
          permalink: body.permalink || '',
        };
      });

    // 前端过滤
    let filtered = products;
    if (category && category !== '全部品类') {
      filtered = products.filter((p) => p.category === category);
    }

    return NextResponse.json({ products: filtered, total: filtered.length, mock: false });
  } catch (err) {
    console.error('Products API error:', err);
    return NextResponse.json({ products: [], total: 0, mock: false, message: '美客多API连接失败' });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({ success: true, id: `P${Date.now()}`, ...body, mock: false });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
