import { NextRequest, NextResponse } from 'next/server';
import {
  checkProductImages,
  checkSingleImage,
  generateWhiteBackgroundImage,
  isImageCheckerEnabled,
} from '@/lib/image-quality-checker';

// 商品图片合规检测接口
// POST { images: string[] (base64), mode?: 'single' | 'multi' | 'fix' }
// - single: 单图检测
// - multi: 多图综合检测（主图 + 副图）
// - fix: 生成白底图（返回修复后的图）

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const images: string[] = body.images || [];
    const mode = body.mode || 'multi';

    if (!images.length) {
      return NextResponse.json({ error: '请提供 images 数组（base64）' }, { status: 400 });
    }

    const enabled = isImageCheckerEnabled();
    if (!enabled) {
      return NextResponse.json({
        error: '未配置 DASHSCOPE_API_KEY',
        note: '请在 Vercel 环境变量中添加 DASHSCOPE_API_KEY',
      });
    }

    let result: any;

    if (mode === 'single') {
      result = await checkSingleImage(images[0], { isMain: true });
      if (!result) {
        return NextResponse.json({ error: '检测失败，请重试' }, { status: 500 });
      }
    } else if (mode === 'fix') {
      // 生成白底图
      const fixed = await generateWhiteBackgroundImage(images[0]);
      if (!fixed) {
        return NextResponse.json({ error: '白底图生成失败' }, { status: 500 });
      }
      return NextResponse.json({
        mode: 'fix',
        original: images[0].slice(0, 50) + '...',
        fixedImage: fixed,
        note: '已生成白底图，可下载替换原图',
      });
    } else {
      // multi
      result = await checkProductImages(images);
    }

    return NextResponse.json({
      mode,
      enabled: true,
      model: 'qwen-vl-max',
      result,
    });
  } catch (e) {
    return NextResponse.json({ error: '检测失败', detail: String(e) }, { status: 500 });
  }
}

export async function GET() {
  const enabled = isImageCheckerEnabled();
  return NextResponse.json({
    service: 'image-quality-checker',
    enabled,
    capabilities: ['单图合规检测', '多图综合评分', '白底图生成', '角度缺失提醒'],
    models: {
      detection: 'qwen-vl-max',
      backgroundGeneration: 'wanx-background-generation-v2',
    },
    usage: 'POST { images: string[] (base64), mode?: single|multi|fix }',
    note: enabled
      ? '已启用'
      : '未配置 DASHSCOPE_API_KEY',
  });
}
