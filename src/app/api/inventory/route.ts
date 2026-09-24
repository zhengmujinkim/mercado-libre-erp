import { NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/token-store';
import { fetchItemsByIds } from '@/lib/ml-items';

export async function GET() {
  try {
    const token = await getAccessToken();
    if (!token) {
      return NextResponse.json({ inventory: [], message: '请先授权美客多账号' });
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
      let detail = '';
      try { detail = (await searchRes.text()).slice(0, 300); } catch { /* noop */ }
      console.error('[inventory] search failed:', searchRes.status, detail);
      return NextResponse.json({ inventory: [], message: `商品列表请求失败 (${searchRes.status})` });
    }

    const searchData = await searchRes.json();
    const items: string[] = searchData.results || [];

    if (items.length === 0) {
      return NextResponse.json({ inventory: [], message: '暂无在售商品' });
    }

    // Step 2: 健壮的批量查询（分批 + 失败逐个回退）
    const { items: bodies, errors } = await fetchItemsByIds(token, items);

    const allItems = bodies.map((body: any) => ({
      id: body.id,
      name: body.title,
      available_quantity: body.available_quantity || 0,
      sold_quantity: body.sold_quantity || 0,
      price: body.price,
      net_proceeds: body.net_proceeds ?? null,
      currency_id: body.currency_id,
      status: body.status,
      site_id: body.site_id,
      permalink: body.permalink,
      thumbnail: body.thumbnail,
      category_id: body.category_id,
    }));

    const response: Record<string, unknown> = { inventory: allItems, total: allItems.length };
    // 仅在有错误时附带诊断信息（不含敏感凭证）
    if (errors.length > 0) {
      response.diagnostics = errors.slice(0, 5);
    }
    return NextResponse.json(response);
  } catch (err) {
    console.error('Inventory API error:', err);
    return NextResponse.json({ inventory: [], message: '加载失败' }, { status: 500 });
  }
}
