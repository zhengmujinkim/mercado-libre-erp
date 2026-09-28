/**
 * 采集记录审核：确认 / 驳回
 *
 * POST /api/collect1688/confirm
 * { id: offerId, action: 'confirm' | 'reject' }
 *
 * confirm：
 *  1. record 状态 → confirmed（KV，线上可靠）
 *  2. best-effort 写回 selection-pool/data.json（仅本地 dev 生效；Vercel 只读时跳过）
 *     - images 替换为通过校验(可下载+同款)的高清图，主图在前
 *     - supplier_url 绑定该 offer 页，images_source 标记
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getRecord, saveRecord, type CollectedImage } from '@/lib/collector-1688';

const DATA_FILE = path.join(process.cwd(), 'src/app/api/selection-pool/data.json');

/** 选出通过校验的图片，主图类排前 */
function pickImages(images: CollectedImage[]): string[] {
  const passed = images.filter((i) => i.ok && i.sameProduct !== false);
  const roleRank = (i: CollectedImage): number => {
    const r = i.aiRole || i.role;
    return r === 'main' ? 0 : r === 'sku' ? 1 : r === 'scene' ? 2 : 3;
  };
  return passed.sort((a, b) => roleRank(a) - roleRank(b)).map((i) => i.url);
}

export async function POST(req: NextRequest) {
  let body: { id?: string; action?: 'confirm' | 'reject' };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 });
  }

  const { id, action } = body;
  if (!id || !action) {
    return NextResponse.json({ ok: false, error: 'id 和 action 必填' }, { status: 400 });
  }

  const record = await getRecord(id);
  if (!record) {
    return NextResponse.json({ ok: false, error: '记录不存在' }, { status: 404 });
  }

  record.status = action === 'confirm' ? 'confirmed' : 'rejected';
  if (action === 'confirm') record.confirmedAt = new Date().toISOString();
  await saveRecord(record);

  let dataWritten = false;
  let writeError = '';

  if (action === 'confirm' && record.productId) {
    try {
      const text = await fs.readFile(DATA_FILE, 'utf-8');
      const raw = JSON.parse(text);
      const list: unknown[] = Array.isArray(raw) ? raw : raw.products || [];
      const idx = list.findIndex(
        (p) => (p as { id?: string }).id === record.productId,
      );
      if (idx >= 0) {
        const product = list[idx] as Record<string, unknown>;
        const newImages = pickImages(record.images);
        if (newImages.length > 0) {
          product.images = newImages;
          product.images_synced_at = new Date().toISOString();
          product.images_source = '1688_auto_collect';
          product.supplier_url = record.pageUrl;
        }
        if (Array.isArray(raw)) {
          await fs.writeFile(DATA_FILE, JSON.stringify(raw, null, 2), 'utf-8');
        } else {
          raw.products = list;
          await fs.writeFile(DATA_FILE, JSON.stringify(raw, null, 2), 'utf-8');
        }
        dataWritten = true;
      }
    } catch (e) {
      // 线上只读文件系统会走到这里，属预期，不阻塞
      writeError = (e as Error).message;
    }
  }

  return NextResponse.json({
    ok: true,
    id,
    status: record.status,
    productId: record.productId,
    imagesSelected:
      action === 'confirm' ? pickImages(record.images).length : 0,
    dataWritten, // 本地 dev 为 true；线上 false（以 KV 为准，再批量同步）
    writeError,
  });
}
