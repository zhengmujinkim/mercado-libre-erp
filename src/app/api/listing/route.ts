import { NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/token-store';
import { fetchItemsByIds } from '@/lib/ml-items';

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

    // Step 2: 健壮批量查询
    const { items: bodies, errors } = await fetchItemsByIds(token, items);

    const allListings = bodies.map((body: any) => ({
      id: body.id,
      title: body.title,
      price: body.price,
      net_proceeds: body.net_proceeds ?? null,
      currency_id: body.currency_id,
      available_quantity: body.available_quantity || 0,
      sold_quantity: body.sold_quantity || 0,
      status: body.status,
      site_id: body.site_id,
      permalink: body.permalink,
      thumbnail: body.thumbnail,
    }));

    const activeCount = allListings.filter(l => l.status === 'active').length;
    const totalStock = allListings.reduce((a, b) => a + b.available_quantity, 0);
    const totalSold = allListings.reduce((a, b) => a + b.sold_quantity, 0);
    const lowStock = allListings.filter(l => l.available_quantity < 10 && l.available_quantity > 0).length;

    const response: Record<string, unknown> = {
      listings: allListings,
      stats: { activeCount, totalStock, totalSold, lowStock, total: allListings.length },
    };
    if (errors.length > 0) {
      response.diagnostics = errors.slice(0, 5);
    }
    return NextResponse.json(response);
  } catch (err) {
    console.error('Listing API error:', err);
    return NextResponse.json({ listings: [], message: '加载失败' }, { status: 500 });
  }
}
