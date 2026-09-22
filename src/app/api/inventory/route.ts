import { NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/token-store';

export async function GET() {
  try {
    const token = await getAccessToken();
    if (!token) {
      return NextResponse.json({ inventory: [], message: '请先授权美客多账号' });
    }

    const res = await fetch(
      'https://api.mercadolibre.com/users/3650205937/items/search?limit=50&offset=0',
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ inventory: [], message: `API请求失败 (${res.status})` });
    }

    const data = await res.json();
    const items: string[] = data.results || [];

    if (items.length === 0) {
      return NextResponse.json({ inventory: [], message: '暂无在售商品' });
    }

    const allItems: any[] = [];
    for (const itemId of items) {
      try {
        const itemRes = await fetch(
          `https://api.mercadolibre.com/items/${itemId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!itemRes.ok) continue;
        const item = await itemRes.json();
        allItems.push({
          id: item.id,
          name: item.title,
          available_quantity: item.available_quantity || 0,
          sold_quantity: item.sold_quantity || 0,
          price: item.price,
          currency_id: item.currency_id,
          status: item.status,
          site_id: item.site_id,
          permalink: item.permalink,
          thumbnail: item.thumbnail,
          category_id: item.category_id,
        });
      } catch {
        continue;
      }
    }

    return NextResponse.json({ inventory: allItems, total: allItems.length });
  } catch (err) {
    console.error('Inventory API error:', err);
    return NextResponse.json({ inventory: [], message: '加载失败' }, { status: 500 });
  }
}
