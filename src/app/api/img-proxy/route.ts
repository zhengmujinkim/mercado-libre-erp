import { NextRequest, NextResponse } from 'next/server';
import { fetchFromAlicdn, isAllowedAlicdnHost } from '@/lib/alicdn';

// 1688/alicdn 图片代理：多镜像轮换 + 浏览器全套头
// GET /api/img-proxy?u=<encoded alicdn url>
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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

  if (!isAllowedAlicdnHost(target.hostname)) {
    return NextResponse.json({ error: 'host not allowed' }, { status: 403 });
  }

  const res = await fetchFromAlicdn(target);

  if (!res.ok) {
    return NextResponse.json(
      { error: 'all mirrors failed', attempts: res.attempts },
      { status: 502 }
    );
  }

  return new NextResponse(res.buf, {
    status: 200,
    headers: {
      'Content-Type': res.contentType,
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
      'X-Upstream-Host': res.usedHost,
      'X-Bytes': String(res.buf.byteLength),
    },
  });
}
