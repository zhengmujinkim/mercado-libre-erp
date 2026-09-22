import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/token-store';
import { MELI_CONFIG } from '@/lib/config';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const status = searchParams.get('status');

  try {
    const token = await getAccessToken();
    if (!token) {
      return NextResponse.json({ products: [], total: 0, mock: false, message: '请先完成美客多授权' });
    }

    const res = await fetch(
      `${MELI_CONFIG.apiBase}/users/${MELI_CONFIG.userId}/items/search?status=active`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      return NextResponse.json({ products: [], total: 0, mock: false, message: `美客多API返回错误: ${res.status}` });
    }

    const data = await res.json();
    const itemIds: string[] = data.results || [];

    if (itemIds.length === 0) {
      return NextResponse.json({ products: [], total: 0, mock: false, message: '暂无在售商品，请先在店铺后台上架商品' });
    }

    // Fetch item details (max 20 at a time)
    const itemsToFetch = itemIds.slice(0, 20);
    const itemDetails = await Promise.all(
      itemsToFetch.map(async (id: string) => {
        try {
          const itemRes = await fetch(`${MELI_CONFIG.apiBase}/items/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
          });
          if (!itemRes.ok) return null;
          const item = await itemRes.json();
          return {
            id: item.id,
            name: item.title || 'Unknown',
            category: item.category_id || '未知',
            purchasePrice: 0,
            sellingPrice: item.price || 0,
            weight: item.shipping?.dimensions?.weight ? Number(item.shipping.dimensions.weight) : 0,
            site: item.site_id || 'MLM',
            status: item.status || 'active',
            rating: 0,
            soldRange: item.sales?.qty_sold_60_months?.toString() || '0',
            thumbnail: item.thumbnail || '',
            permalink: item.permalink || '',
          };
        } catch {
          return null;
        }
      })
    );

    let products = itemDetails.filter(Boolean);

    if (category && category !== '全部品类') {
      products = products.filter((p) => p && (p as any).category === category);
    }
    if (status && status !== '全部状态') {
      products = products.filter((p) => p && (p as any).status === status);
    }

    return NextResponse.json({ products, total: products.length, mock: false });
  } catch (err) {
    console.error('Products API error:', err);
    return NextResponse.json({ products: [], total: 0, mock: false, message: '美客多API连接失败，请稍后重试' });
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
