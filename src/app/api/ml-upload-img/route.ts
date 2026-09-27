import { NextRequest, NextResponse } from 'next/server';

// 服务端图片上传：从 alicdn 取图 → multipart 上传到 Mercado Libre
// GET /api/ml-upload-img?u=<encoded alicdn url>&t=<ml access token>
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const ALLOWED_HOSTS = [
  'cbu01.alicdn.com',
  'cbu02.alicdn.com',
  'cbu03.alicdn.com',
  'cbu04.alicdn.com',
  'img.alicdn.com',
  'sc01.alicdn.com',
  'sc02.alicdn.com',
  'sc03.alicdn.com',
  'sc04.alicdn.com',
];

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get('u');
  const t = req.nextUrl.searchParams.get('t');

  if (!u || !t) {
    return NextResponse.json({ error: 'missing u or t' }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(u);
  } catch {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 });
  }

  if (!ALLOWED_HOSTS.includes(target.hostname)) {
    return NextResponse.json({ error: 'host not allowed' }, { status: 403 });
  }

  // 1. 从 alicdn 取图
  const imgResp = await fetch(target.toString(), {
    headers: { Referer: 'https://detail.1688.com/', 'User-Agent': UA, Accept: 'image/*,*/*;q=0.8' },
    cache: 'no-store',
  });

  const imgBuf = await imgResp.arrayBuffer();

  if (imgBuf.byteLength < 1000) {
    return NextResponse.json(
      { error: 'image too small', bytes: imgBuf.byteLength, upstreamStatus: imgResp.status },
      { status: 502 }
    );
  }

  // 2. multipart 上传到 ML
  const form = new FormData();
  const blob = new Blob([imgBuf], {
    type: imgResp.headers.get('content-type') || 'image/jpeg',
  });
  form.append('file', blob, 'product.jpg');

  const mlResp = await fetch('https://api.mercadolibre.com/pictures/items/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${t}` },
    body: form,
    cache: 'no-store',
  });

  const mlText = await mlResp.text();
  let mlJson: unknown = null;
  try {
    mlJson = JSON.parse(mlText);
  } catch {
    mlJson = mlText.slice(0, 500);
  }

  return NextResponse.json({
    ok: mlResp.status === 200 || mlResp.status === 201,
    mlStatus: mlResp.status,
    sourceBytes: imgBuf.byteLength,
    sourceType: imgResp.headers.get('content-type'),
    result: mlJson,
  });
}
