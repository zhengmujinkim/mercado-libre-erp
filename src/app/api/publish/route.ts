import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/token-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const API = 'https://api.mercadolibre.com';

const ALLOWED_SITES = new Set(['MLB', 'MLM', 'MLA', 'MLC', 'MCO', 'MLU']);
const DEFAULT_LOGISTIC = 'remote';
const DEFAULT_LISTING_TYPE = 'gold_special';

// 默认属性常量（与 auto_listing 脚本一致）
const BRAND = 'SIN MARCA';
const BRAND_ID = '35249837';
const CONDITION_ID = '2230284';
const CONDITION_NAME = 'New';
const WARRANTY_TYPE = 'No warranty';
const WARRANTY_TYPE_ID = '6150835';
const EMPTY_GTIN = 'Another reason';
const EMPTY_GTIN_ID = '17055161';

interface PicRef { id: string }

// 白名单域名：只允许从这些CDN加载图片
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
    // 禁止内网地址
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname.startsWith('127.') || hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname === '169.254.169.254') {
      return false;
    }
    // 检查域名白名单
    return ALLOWED_IMAGE_DOMAINS.some(domain => hostname === domain || hostname.endsWith('.' + domain));
  } catch {
    return false;
  }
}

// 上传单张图片：公网URL走 source；data:base64 走 multipart
async function uploadPicture(token: string, image: string): Promise<PicRef | null> {
  // 1) 公网 URL：source 方式（已验证最稳定）
  if (/^https?:\/\//i.test(image)) {
    // H1修复：校验URL白名单防SSRF
    if (!isAllowedImageUrl(image)) {
      console.error('Image URL not allowed:', image);
      return null;
    }
    const res = await fetch(`${API}/pictures`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: image }),
      cache: 'no-store',
    });
    if (res.ok) {
      const d = await res.json();
      if (d.id) return { id: d.id };
    }
    // source 失败则不再回退 multipart（URL 无法直接 multipart），报错
    const t = await res.text().catch(() => '');
    console.error('picture source upload failed:', res.status, t.slice(0, 200));
    return null;
  }

  // 2) data:image/...;base64 → multipart
  const m = image.match(/^data:([^;]+);base64,(.*)$/s);
  if (!m) return null;
  const mime = m[1] || 'image/jpeg';
  const buf = Buffer.from(m[2], 'base64');

  const form = new FormData();
  form.append('file', new Blob([buf], { type: mime }), 'product.jpg');

  // 依次尝试两个 multipart 端点
  for (const endpoint of ['/pictures/items/upload', '/pictures']) {
    const res = await fetch(`${API}${endpoint}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
      cache: 'no-store',
    });
    if (res.ok) {
      const d = await res.json();
      if (d.id) return { id: d.id };
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return NextResponse.json({ success: false, error: '请先授权美客多账号' }, { status: 401 });
    }

    const body = await request.json();
    const {
      category_id,
      title,
      description,
      net_proceeds,
      available_quantity,
      images = [],
      sites = ['MLB'],
    } = body;

    if (!category_id || !title || !net_proceeds || !available_quantity) {
      return NextResponse.json({ success: false, error: '缺少必填字段（品类/标题/净收益/库存）' }, { status: 400 });
    }
    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ success: false, error: '请至少提供 1 张产品图（公网URL或已上传图片）' }, { status: 400 });
    }

    // 校验站点
    const targetSites: string[] = (Array.isArray(sites) ? sites : ['MLB'])
      .map((s: string) => String(s).toUpperCase())
      .filter((s: string) => ALLOWED_SITES.has(s));
    if (targetSites.length === 0) {
      return NextResponse.json({ success: false, error: '没有合法的目标站点' }, { status: 400 });
    }

    // 1) 上传图片
    const pictureIds: string[] = [];
    for (const img of images) {
      const pic = await uploadPicture(accessToken, img);
      if (pic) pictureIds.push(pic.id);
    }
    if (pictureIds.length === 0) {
      return NextResponse.json({ success: false, error: '图片全部上传失败，请检查图片链接是否可公开访问' }, { status: 502 });
    }

    // 2) 组装 /global/user-products payload（UP / net_proceeds 模式）
    const cleanTitle = String(title).trim().slice(0, 60);
    const sellerSku = `SKU-${Date.now().toString(36).toUpperCase()}`;
    const modelValue = `MDL-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;

    const sitesToSell = targetSites.map(sid => ({
      site_id: sid,
      logistic_type: DEFAULT_LOGISTIC,
      listing_type_id: DEFAULT_LISTING_TYPE,
      title: cleanTitle,
    }));

    const payload = {
      sites_to_sell: sitesToSell,
      global_net_proceeds: Number(net_proceeds),
      category_id,
      title: cleanTitle,
      description: { plain_text: description || '' },
      available_quantity: Number(available_quantity),
      pictures: pictureIds.map(id => ({ id })),
      attributes: [
        { id: 'BRAND', name: 'Brand', value_id: BRAND_ID, value_name: BRAND, values: [{ id: BRAND_ID, name: BRAND }] },
        { id: 'MODEL', name: 'Model', value_id: null, value_name: modelValue, values: [{ id: null, name: modelValue }] },
        { id: 'ITEM_CONDITION', name: 'Item condition', value_id: CONDITION_ID, value_name: CONDITION_NAME, values: [{ id: CONDITION_ID, name: CONDITION_NAME }] },
        { id: 'PACKAGE_HEIGHT', name: 'Package height', value_id: null, value_name: '30 cm', values: [{ id: null, name: '30 cm' }] },
        { id: 'PACKAGE_LENGTH', name: 'Package length', value_id: null, value_name: '30 cm', values: [{ id: null, name: '30 cm' }] },
        { id: 'PACKAGE_WIDTH', name: 'Package width', value_id: null, value_name: '30 cm', values: [{ id: null, name: '30 cm' }] },
        { id: 'PACKAGE_WEIGHT', name: 'Package weight', value_id: null, value_name: '500 g', values: [{ id: null, name: '500 g' }] },
        { id: 'EMPTY_GTIN_REASON', name: 'Empty GTIN reason', value_id: EMPTY_GTIN_ID, value_name: EMPTY_GTIN, values: [{ id: EMPTY_GTIN_ID, name: EMPTY_GTIN }] },
        { id: 'SELLER_SKU', name: 'Seller SKU', value_id: null, value_name: sellerSku, values: [{ id: null, name: sellerSku }] },
      ],
      sale_terms: [
        { id: 'WARRANTY_TYPE', name: 'Warranty type', value_id: WARRANTY_TYPE_ID, value_name: WARRANTY_TYPE, values: [{ id: WARRANTY_TYPE_ID, name: WARRANTY_TYPE }] },
      ],
    };

    // 3) 创建全球商品
    const createRes = await fetch(`${API}/global/user-products`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const resultText = await createRes.text();
    let result: any = null;
    try { result = JSON.parse(resultText); } catch { /* non-json */ }

    if (!createRes.ok) {
      console.error('global listing create failed:', createRes.status, resultText.slice(0, 400));
      // H6修复：不暴露内部错误详情，只返回用户友好的消息
      const msg = '发布失败，请检查品类、标题或图片格式是否正确';
      return NextResponse.json({ success: false, error: msg }, { status: createRes.status });
    }

    return NextResponse.json({
      success: true,
      itemId: result?.id || result?.global_item_id,
      permalink: result?.permalink,
      pictures: pictureIds.length,
      sites: targetSites,
      message: '全球商品创建成功，站点listing将自动生成',
    });
  } catch (error) {
    console.error('Publish error:', error);
    return NextResponse.json({ success: false, error: '网络错误，请重试' }, { status: 500 });
  }
}
