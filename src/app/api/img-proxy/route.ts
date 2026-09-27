import { NextRequest, NextResponse } from 'next/server';

// 1688/alicdn 图片代理：服务器侧取图，绕过浏览器防盗链与跨域
// GET /api/img-proxy?u=<encoded alicdn url>
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

export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get('u');
  if (!u) {
    return NextResponse.json({ error: 'missing u' }, { status: 400 });
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

  const upstream = await fetch(target.toString(), {
    headers: {
      Referer: 'https://detail.1688.com/',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    },
    cache: 'no-store',
  });

  const buf = await upstream.arrayBuffer();
  const ct = upstream.headers.get('content-type') || 'image/jpeg';

  return new NextResponse(buf, {
    status: upstream.status,
    headers: {
      'Content-Type': ct,
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
      'X-Upstream-Status': String(upstream.status),
      'X-Bytes': String(buf.byteLength),
    },
  });
}
