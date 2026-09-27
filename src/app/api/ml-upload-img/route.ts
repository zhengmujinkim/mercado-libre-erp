import { NextRequest, NextResponse } from 'next/server';
import { fetchFromAlicdn, isAllowedAlicdnHost } from '@/lib/alicdn';

// 服务端图片上传：从 alicdn 取图 → multipart 上传到 Mercado Libre
// GET /api/ml-upload-img?u=<encoded alicdn url>&t=<ml access token>
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
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

    if (!isAllowedAlicdnHost(target.hostname)) {
      return NextResponse.json({ error: 'host not allowed' }, { status: 403 });
    }

    // 1. 多镜像取图
    const t0 = Date.now();
    const img = await fetchFromAlicdn(target);
    const fetchMs = Date.now() - t0;

    if (!img.ok) {
      return NextResponse.json(
        { error: 'all mirrors failed', attempts: img.attempts, fetchMs },
        { status: 502 }
      );
    }

    // 2. multipart 上传 ML
    const form = new FormData();
    const blob = new Blob([img.buf], { type: img.contentType || 'image/jpeg' });
    form.append('file', blob, 'product.jpg');

    const t1 = Date.now();
    const mlResp = await fetch('https://api.mercadolibre.com/pictures/items/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}` },
      body: form,
      cache: 'no-store',
    });
    const mlMs = Date.now() - t1;

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
      sourceBytes: img.buf.byteLength,
      sourceType: img.contentType,
      usedHost: img.usedHost,
      attempts: img.attempts,
      fetchMs,
      mlMs,
      result: mlJson,
    });
  } catch (e) {
    return NextResponse.json(
      {
        error: 'handler exception',
        message: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? (e.stack || '').slice(0, 800) : undefined,
      },
      { status: 500 }
    );
  }
}
