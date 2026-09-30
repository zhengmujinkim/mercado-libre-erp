/**
 * ML 竞品跟卖 API
 *
 * POST /api/ml-follow-sell
 * body: {
 *   source_item_id: "MLB5276090987",   // 竞品 ID
 *   my_price: 9.2,                      // 我要赚的价格（雷亚尔）
 *   title_rewrite?: true,               // 是否改写标题（默认 true）
 *   description_rewrite?: true,         // 是否改写详情（默认 true）
 *   use_source_images?: boolean,        // 是否直接用竞品图（默认 false，会下载重传）
 * }
 *
 * 流程：
 *   1. 采集竞品数据
 *   2. 改写标题/详情
 *   3. 下载竞品图片 → 上传到自己的 ML 账号 → 拿到新 pic_id
 *   4. 带上包装规格创建 listing
 *   5. 激活上架
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/token-store';
import { scrapeMLItem, parseItemId, rewriteTitle } from '@/lib/ml-scraper';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const API = 'https://api.mercadolibre.com';
const DEFAULT_LOGISTIC = 'remote';
const DEFAULT_LISTING_TYPE = 'gold_special';

/** 下载图片并上传到 ML，返回新的 pic_id */
async function reuploadImage(url: string, token: string): Promise<string | null> {
  try {
    // 下载原图
    const imgRes = await fetch(url);
    if (!imgRes.ok) return null;
    const buffer = await imgRes.arrayBuffer();

    // 上传到 ML（POST /pictures）
    const uploadRes = await fetch(`${API}/pictures`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
      },
      body: Buffer.from(buffer),
    });

    if (!uploadRes.ok) return null;
    const data = await uploadRes.json();
    return data.id || null;
  } catch {
    return null;
  }
}

/** 简单改写详情文本 */
function rewriteDescription(html: string): string {
  if (!html) return html;
  // 去掉可能的卖家标识
  let result = html
    .replace(/<[^>]*class="[^"]*seller[^"]*"[^>]*>.*?<\/[^>]+>/gi, '')
    .replace(/<[^>]*id="[^"]*seller[^"]*"[^>]*>.*?<\/[^>]+>/gi, '');
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      source_item_id,
      my_price,
      title_rewrite = true,
      description_rewrite = true,
      use_source_images = false,
      site_id = 'MLB',
    } = body;

    if (!source_item_id) {
      return NextResponse.json({ error: '请提供 source_item_id（竞品 ML 商品 ID）' }, { status: 400 });
    }
    if (typeof my_price !== 'number' || my_price <= 0) {
      return NextResponse.json({ error: '请提供有效的 my_price（要赚的价格，雷亚尔）' }, { status: 400 });
    }

    const itemId = parseItemId(source_item_id);
    if (!itemId) {
      return NextResponse.json({ error: '无效的 ML 商品 ID', hint: '示例: MLB5276090987' }, { status: 400 });
    }

    // Step 1: 采集竞品数据
    const scraped = await scrapeMLItem(itemId);
    if (!scraped.success) {
      return NextResponse.json({ error: '采集失败', detail: scraped.error }, { status: 502 });
    }

    // Step 2: 改写标题
    const finalTitle = title_rewrite ? rewriteTitle(scraped.title || '') : scraped.title;

    // Step 3: 处理图片
    const token = await getAccessToken();
    if (!token) {
      return NextResponse.json({ error: '无有效 token' }, { status: 401 });
    }

    let pictureIds: string[] = [];
    let imageUploadResults: { url: string; new_id: string | null }[] = [];

    if (use_source_images) {
      // 直接用竞品 pic_id（有风险：可能被判重复铺货）
      pictureIds = scraped.pictures.map(p => p.id);
    } else {
      // 下载重传（安全）
      const uploadPromises = scraped.pictures.map(p => reuploadImage(p.url, token));
      const results = await Promise.all(uploadPromises);
      pictureIds = results.filter(Boolean) as string[];
      imageUploadResults = scraped.pictures.map((p, i) => ({
        url: p.url,
        new_id: results[i],
      }));
    }

    if (pictureIds.length === 0) {
      return NextResponse.json({
        error: '图片处理失败',
        detail: '无法获取有效图片 ID。如果竞品图防盗链，请尝试从 1688 找同款图',
        imageResults: imageUploadResults,
      }, { status: 422 });
    }

    // Step 4: 构造属性（去掉 SELLER_SKU）
    const attributes = (scraped.attributes || [])
      .filter((a: any) => a.id !== 'SELLER_SKU' && a.id !== 'BRAND' && a.id !== 'GTIN')
      .map((a: any) => ({
        id: a.id,
        value_name: a.value_name,
        values: a.value_name ? [{ id: '', name: a.value_name, struct: null }] : [],
      }));

    // 补充品牌
    attributes.push({
      id: 'BRAND',
      value_name: 'SIN MARCA',
      values: [{ id: '35249837', name: 'SIN MARCA', struct: null }],
    });

    // Step 5: 创建 listing
    const createPayload: any = {
      title: finalTitle,
      category_id: scraped.category_id || 'others',
      price: my_price,
      currency_id: site_id === 'MLB' ? 'BRL' : 'USD',
      available_quantity: 1,
      buying_mode: 'buy_it_now',
      listing_type_id: DEFAULT_LISTING_TYPE,
      condition: 'new',
      pictures: pictureIds.map(id => ({ id })),
      attributes,
    };

    // 加入包装规格
    const ps = scraped.package_specs;
    if (ps.weight_g) createPayload.package_weight = ps.weight_g;
    if (ps.length_cm) createPayload.package_length = ps.length_cm;
    if (ps.width_cm) createPayload.package_width = ps.width_cm;
    if (ps.height_cm) createPayload.package_height = ps.height_cm;

    const createRes = await fetch(`${API}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(createPayload),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      return NextResponse.json({
        error: 'ML API 创建失败',
        httpStatus: createRes.status,
        detail: errText.slice(0, 500),
      }, { status: 502 });
    }

    const createData = await createRes.json();
    const listingId = createData.id;

    // Step 6: 设置物流
    try {
      await fetch(`${API}/listings/${listingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ shipping: { logistic_type: DEFAULT_LOGISTIC } }),
      });
    } catch (e) {
      console.error('物流设置失败', e);
    }

    // Step 7: 激活
    try {
      await fetch(`${API}/items/${listingId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'active' }),
      });
    } catch (e) {
      console.error('激活失败', e);
    }

    // Step 8: 更新详情描述
    if (scraped.description?.plain_text) {
      try {
        const finalDesc = description_rewrite
          ? rewriteDescription(scraped.description.plain_text)
          : scraped.description.plain_text;
        await fetch(`${API}/items/${listingId}/description`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ plain_text: finalDesc }),
        });
      } catch (e) {
        console.error('详情更新失败', e);
      }
    }

    return NextResponse.json({
      success: true,
      listing_id: listingId,
      permalink: createData.permalink,
      source_item_id: itemId,
      title_original: scraped.title,
      title_rewritten: finalTitle,
      price: my_price,
      package_specs: scraped.package_specs,
      pictures_used: pictureIds.length,
      image_upload: use_source_images ? '直接使用竞品图' : '下载重传',
      image_results: imageUploadResults,
    });
  } catch (e) {
    console.error('ml-follow-sell error', e);
    return NextResponse.json({ error: '内部服务器错误', detail: String(e) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'ml-follow-sell',
    version: '1.0',
    description: 'ML 竞品跟卖：采集竞品数据 → 改写标题 → 重传图片 → 带包装规格上架',
    usage: 'POST { source_item_id, my_price, title_rewrite?, description_rewrite?, use_source_images?, site_id? }',
    steps: [
      '1. 输入竞品 ML 商品 ID（如 MLB5276090987）',
      '2. 自动采集包装尺寸、主图、属性、详情',
      '3. 改写标题（避免重复铺货）',
      '4. 下载竞品图片并上传到你的账号（或直接用竞品 pic_id）',
      '5. 带上包装规格创建 listing',
      '6. 设置跨境物流 + 激活上架',
    ],
  });
}
