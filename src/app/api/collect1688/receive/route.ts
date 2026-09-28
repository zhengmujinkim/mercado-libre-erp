/**
 * 1688 采集推送接收端
 * 云手机在商品页执行 JS，把图片列表 POST 到这里。
 *
 * POST /api/collect1688/receive
 * body: { productId?: string, pageUrl: string, title?: string, images: string[] }
 *
 * 处理：规范化去重 → 下载探测(限15张) → 规则一致性 → AI视觉分类 → KV暂存
 * 也支持 GET 直接读取已暂存记录（?id= 或全部）。
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  parseOfferId,
  normalizeImages,
  ruleConsistencyCheck,
  saveRecord,
  getAllRecords,
  getRecord,
  resolveProductId,
  type CollectRecord,
} from '@/lib/collector-1688';
import { probeImage } from '@/lib/image-probe';
import { classifyImagesVision, isVisionEnabled } from '@/lib/collector-vision';

const MAX_DOWNLOAD = 15;
const SECRET = process.env.COLLECT1688_SECRET || '';

// 允许云手机在 1688 域跨域推送
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (id) {
    const r = await getRecord(id);
    return NextResponse.json({ record: r }, { headers: CORS_HEADERS });
  }
  const all = await getAllRecords();
  return NextResponse.json(
    { records: all, count: Object.keys(all).length },
    { headers: CORS_HEADERS },
  );
}

export async function POST(req: NextRequest) {
  // 简单密钥校验（可空，云手机地址栏不方便带 header，故用 body.secret）
  let body: {
    productId?: string;
    pageUrl?: string;
    title?: string;
    images?: string[];
    secret?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 });
  }

  if (SECRET && body.secret !== SECRET) {
    return NextResponse.json({ ok: false, error: 'bad secret' }, { status: 401 });
  }

  const pageUrl = body.pageUrl || '';
  const offerId = parseOfferId(pageUrl) || `tmp_${Date.now()}`;
  const rawImages = Array.isArray(body.images) ? body.images : [];

  if (!pageUrl || rawImages.length === 0) {
    return NextResponse.json({ ok: false, error: 'pageUrl 和 images 必填' }, { status: 400 });
  }

  // 反查绑定的 productId
  let productId = body.productId;
  if (!productId && offerId) {
    productId = (await resolveProductId(offerId)) || undefined;
  }

  // 规范化 + 去重
  let images = normalizeImages(rawImages);
  if (images.length === 0) {
    return NextResponse.json({ ok: false, error: '未识别到有效的 alicdn 产品图' }, { status: 422 });
  }

  // 下载探测（限制数量，优先 main，再 detail）
  const toProbe = images.slice(0, MAX_DOWNLOAD);
  const probed = await Promise.all(
    toProbe.map(async (img) => {
      const p = await probeImage(img.url);
      return {
        ...img,
        ok: p.ok,
        bytes: p.bytes,
        width: p.width,
        height: p.height,
        issues: p.ok ? img.issues : [...(img.issues || []), p.error || '下载失败'],
      };
    }),
  );

  // 规则层一致性
  let checked = ruleConsistencyCheck(probed);

  // AI 视觉分类 + 同款校验（有 Key 才跑）
  let aiRan = false;
  if (isVisionEnabled()) {
    const title = body.title || '';
    const vision = await classifyImagesVision(title, checked.map((c) => c.url));
    if (vision) {
      aiRan = true;
      checked = checked.map((img, i) => {
        const v = vision.find((r) => r.index === i + 1);
        if (!v) return img;
        return {
          ...img,
          aiRole: v.role,
          role: v.role === 'irrelevant' ? img.role : (v.role as typeof img.role),
          sameProduct: v.sameProduct ? img.sameProduct : false,
          issues: v.sameProduct
            ? img.issues
            : [...(img.issues || []), `AI判定疑似非同款：${v.reason}`],
        };
      });
    }
  }

  const record: CollectRecord = {
    id: offerId,
    productId,
    offerId,
    pageUrl,
    title: body.title,
    images: checked,
    status: 'pending',
    collectedAt: new Date().toISOString(),
  };

  const saved = await saveRecord(record);

  const okCount = checked.filter((c) => c.ok).length;
  const sameCount = checked.filter((c) => c.sameProduct !== false).length;

  return NextResponse.json(
    {
      ok: true,
      saved,
      recordId: offerId,
      productId,
      total: rawImages.length,
      normalized: images.length,
      downloaded: okCount,
      sameProduct: sameCount,
      suspect: checked.length - sameCount,
      aiRan,
      visionEnabled: isVisionEnabled(),
    },
    { headers: CORS_HEADERS },
  );
}
