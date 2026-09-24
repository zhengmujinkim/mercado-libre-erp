import { NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/token-store';

export async function GET() {
  try {
    const token = await getAccessToken();
    if (!token) {
      return NextResponse.json({ listings: [], message: '请先授权美客多账号' });
    }

    const userId = process.env.MELI_USER_ID || '3650205937';
    
    // Step 1: 获取CBT ID列表
    const searchRes = await fetch(
      `https://api.mercadolibre.com/users/${userId}/items/search?limit=50&search_type=scan&status=active`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }
    );

    if (!searchRes.ok) {
      return NextResponse.json({ listings: [], message: `API请求失败 (${searchRes.status})` });
    }

    const searchData = await searchRes.json();
    const items: string[] = searchData.results || [];

    if (items.length === 0) {
      return NextResponse.json({ listings: [], message: '暂无在售商品' });
    }

    // Step 2: 批量获取CBT详情（每次最多50个）
    const idsBatch = items.slice(0, 50).join(',');
    const itemsRes = await fetch(
      `https://api.mercadolibre.com/items?ids=${idsBatch}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }
    );

    if (!itemsRes.ok) {
      return NextResponse.json({ listings: [], message: `批量查询失败: ${itemsRes.status}` });
    }

    const itemsData = await itemsRes.json();
    const allListings = itemsData
      .filter((item: any) => item.http_code === 200 && item.body)
      .map((item: any) => {
        const body = item.body;
        return {
          id: body.id,
          title: body.title,
          price: body.price,
          currency_id: body.currency_id,
          available_quantity: body.available_quantity || 0,
          sold_quantity: body.sold_quantity || 0,
          status: body.status,
          site_id: body.site_id,
          permalink: body.permalink,
          thumbnail: body.thumbnail,
        };
      });

    // Stats (listing-specific)
    const activeCount = allListings.filter(l => l.status === 'active').length;
    const totalStock = allListings.reduce((a, b) => a + b.available_quantity, 0);
    const totalSold = allListings.reduce((a, b) => a + b.sold_quantity, 0);
    const lowStock = allListings.filter(l => l.available_quantity < 10 && l.available_quantity > 0).length;

    return NextResponse.json({
      listings: allListings,
      stats: { activeCount, totalStock, totalSold, lowStock, total: allListings.length },
    });
  } catch (err) {
    console.error('Listing API error:', err);
    return NextResponse.json({ listings: [], message: '加载失败' }, { status: 500 });
  }
}
