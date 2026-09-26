import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/token-store';
import { checkProductImages, isImageCheckerEnabled } from '@/lib/image-quality-checker';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const API = 'https://api.mercadolibre.com';

const ALLOWED_SITES = new Set(['MLB', 'MLM', 'MLA', 'MLC', 'MCO', 'MLU']);
const DEFAULT_LOGISTIC = 'remote';
const DEFAULT_LISTING_TYPE = 'gold_special';

const BRAND = 'SIN MARCA';
const BRAND_ID = '35249837';
const CONDITION_ID = '2230284';
const CONDITION_NAME = 'New';
const WARRANTY_TYPE = 'No warranty';
const WARRANTY_TYPE_ID = '6150835';
const EMPTY_GTIN = 'Another reason';
const EMPTY_GTIN_ID = '17055161';

interface PicRef { id: string }

const ALLOWED_IMAGE_DOMAINS = [
  'cbu01.alicdn.com',
  'cbu02.alicdn.com',
  'cbu03.alicdn.com',
  'sc04.alicdn.com',
  'img.alicdn.com',
  'http2.mlstatic.com',
  'ae-pic-a1.aliexpress-media.com',
];

function isAllowedImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname.startsWith('127.') || hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname === '169.254.169.254') {
      return false;
    }
    return ALLOWED_IMAGE_DOMAINS.some(domain => hostname === domain || hostname.endsWith('.' + domain));
  } catch {
    return false;
  }
}

// ============ 图片合规检测（新增） ============
async function validateImagesWithAI(images: string[]): Promise<{
  compliant: boolean;
  score: number;
  issues: string[];
  suggestions: string[];
}> {
  if (!isImageCheckerEnabled() || !images.length) {
    return { compliant: true, score: 100, issues: [], suggestions: [] };
  }

  const result = await checkProductImages(images);
  return {
    compliant: result.overallCompliant && result.overallScore >= 80,
    score: result.overallScore,
    issues: result.results.flatMap(r => r.issues),
    suggestions: result.results.flatMap(r => r.suggestions),
  };
}

// ============ 上架接口 ============
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, pictures, price, category_id, attributes = [], site_id = 'MLB', sku = '', warranty } = body;

    // 参数校验
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return NextResponse.json({ error: '标题不能为空且不少于 3 个字符' }, { status: 400 });
    }
    if (!Array.isArray(pictures) || pictures.length === 0) {
      return NextResponse.json({ error: '请提供商品图片（pictures 数组）' }, { status: 400 });
    }
    if (!site_id || !ALLOWED_SITES.has(site_id)) {
      return NextResponse.json({ error: `站点无效，可选：${[...ALLOWED_SITES].join('/')}` }, { status: 400 });
    }

    // 图片 URL 校验
    const invalidPics = pictures.filter((p: string) => !isAllowedImageUrl(p));
    if (invalidPics.length > 0) {
      return NextResponse.json({
        error: '图片域名不在白名单',
        invalid: invalidPics.slice(0, 3),
        allowed: ALLOWED_IMAGE_DOMAINS,
      }, { status: 400 });
    }

    // ========== 新增：AI 图片合规检测 ==========
    const imageCheck = await validateImagesWithAI(pictures);
    if (!imageCheck.compliant) {
      return NextResponse.json({
        error: '图片不符合美客多规范，请调整后再上架',
        imageCheck: {
          score: imageCheck.score,
          issues: imageCheck.issues,
          suggestions: imageCheck.suggestions,
        },
        hint: '可用 /api/image-quality-check 的 fix 模式自动生成白底图',
      }, { status: 422 });
    }

    // 构造商品属性
    const finalAttributes = [
      ...attributes.filter((a: any) => {
        if (a.id === 'BRAND' || a.id === 'GTIN') return false;
        return true;
      }),
      { id: 'BRAND', value_name: BRAND, values: [{ id: BRAND_ID, name: BRAND, struct: null }] },
      { id: 'SELLER_SKU', value_name: sku || title.slice(0, 20).replace(/\s+/g, ''), values: [] },
      { id: 'ITEM_CONDITION', value_name: CONDITION_NAME, values: [{ id: CONDITION_ID, name: CONDITION_NAME, struct: null }] },
      { id: 'GTIN', value_name: EMPTY_GTIN, values: [{ id: EMPTY_GTIN_ID, name: EMPTY_GTIN, struct: null }] },
    ];

    if (warranty) {
      finalAttributes.push({ id: 'WARRANTY_TYPE', value_name: warranty.type, values: [{ id: warranty.id, name: warranty.type, struct: null }] });
    } else {
      finalAttributes.push({ id: 'WARRANTY_TYPE', value_name: WARRANTY_TYPE, values: [{ id: WARRANTY_TYPE_ID, name: WARRANTY_TYPE, struct: null }] });
    }

    const token = await getAccessToken();

    // 创建商品 listing
    const createRes = await fetch(`${API}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: title.trim(),
        category_id: category_id || 'others',
        price: typeof price === 'number' && price > 0 ? price : undefined,
        currency_id: site_id === 'MLB' ? 'BRL' : 'USD',
        available_quantity: 1,
        buying_mode: 'buy_it_now',
        listing_type_id: DEFAULT_LISTING_TYPE,
        condition: 'new',
        pictures: pictures.map((id: string) => ({ id })),
        attributes: finalAttributes,
        video_id: undefined,
      }),
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

    // 设置物流方式
    const listingId = createData.id;
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
      console.error('物流设置失败，listing 已创建', e);
    }

    // 激活上架
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

    return NextResponse.json({
      success: true,
      id: listingId,
      permalink: createData.permalink,
      imageCheck: {
        score: imageCheck.score,
        compliant: true,
        message: '图片合规检测通过',
      },
    });
  } catch (e) {
    console.error('publish error', e);
    return NextResponse.json({ error: '内部服务器错误', detail: String(e) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'publish',
    version: '2.0',
    features: [
      '图片域名白名单校验',
      'AI 图片合规检测（通义千问 VL）',
      '自动填充品牌/SKU/GTIN/保修属性',
      '自动设置跨境物流（remote）',
      '自动激活上架（active）',
    ],
    imageChecker: {
      enabled: isImageCheckerEnabled(),
      model: 'qwen-vl-max',
      minScore: 80,
    },
    usage: 'POST { title, pictures: string[], site_id, price?, category_id?, attributes?, sku?, warranty? }',
  });
}
