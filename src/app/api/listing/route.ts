import { NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/token-store';

export async function GET() {
  try {
    const token = await getAccessToken();
    if (!token) {
      return NextResponse.json({ listings: [], message: '请先授权美客多账号' });
    }

    const res = await fetch(
      'https://api.mercadolibre.com/users/3650205937/items/search?limit=50&offset=0',
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ listings: [], message: `API请求失败 (${res.status})` });
    }

    const data = await res.json();
    const items: string[] = data.results || [];

    if (items.length === 0) {
      return NextResponse.json({ listings: [], message: '暂无在售商品' });
    }

    // Fetch details for each item
    const allListings: any[] = [];
    for (const itemId of items) {
      try {
        const itemRes = await fetch(
          `https://api.mercadolibre.com/items/${itemId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!itemRes.ok) continue;
        const item = await itemRes.json();
        allListings.push({
          id: item.id,
          title: item.title,
          price: item.price,
          currency_id: item.currency_id,
          available_quantity: item.available_quantity || 0,
          sold_quantity: item.sold_quantity || 0,
          status: item.status,
          site_id: item.site_id,
          permalink: item.permalink,
          thumbnail: item.thumbnail,
        });
      } catch {
        continue;
      }
    }

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
