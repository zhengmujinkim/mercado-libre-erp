import { NextRequest, NextResponse } from 'next/server';
import { checkInfringement, checkMultiple, type CheckInput } from '@/lib/infringement-engine';

// POST /api/infringement-check
// 侵权风险检测接口 - 支持单个和批量检测
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 支持批量检测：{ products: CheckInput[] }
    // 也支持单个检测：{ productName, category, imageUrl }
    if (body.products && Array.isArray(body.products) && body.products.length > 0) {
      const inputs: CheckInput[] = body.products.map((p: Record<string, string>) => ({
        productName: p.productName || p.name || '',
        category: p.category || '',
        imageUrl: p.imageUrl || '',
      }));

      // 过滤掉空的
      const validInputs = inputs.filter(i => i.productName.trim().length > 0);
      if (validInputs.length === 0) {
        return NextResponse.json({ error: '所有产品名称均为空' }, { status: 400 });
      }

      const results = checkMultiple(validInputs);
      return NextResponse.json({ results, count: results.length });
    }

    // 单个检测
    const productName = body.productName || body.name || '';
    if (!productName || typeof productName !== 'string') {
      return NextResponse.json(
        { error: '请提供 productName 字段' },
        { status: 400 }
      );
    }

    const input: CheckInput = {
      productName: productName.trim(),
      category: (body.category || '').trim(),
      imageUrl: (body.imageUrl || '').trim(),
    };

    const result = checkInfringement(input);
    return NextResponse.json(result);
  } catch (e) {
    console.error('[infringement-check] Error:', e);
    return NextResponse.json(
      { error: '检测失败', detail: String(e) },
      { status: 500 }
    );
  }
}

// GET /api/infringement-check - 服务信息
export async function GET() {
  return NextResponse.json({
    service: 'infringement-check',
    version: '2.0',
    description: '6维度侵权风险智能检测引擎',
    dimensions: [
      { name: '品牌商标', weight: '30%', description: '300+全球知名品牌模糊匹配' },
      { name: '专利风险', weight: '10%', description: '品类风险+专利技术关键词' },
      { name: '版权/IP', weight: '25%', description: '70+IP角色/作品名检测' },
      { name: '品类合规', weight: '20%', description: 'ML禁售/限制品类+认证需求' },
      { name: '图片风险', weight: '10%', description: '图片来源域名+品牌CDN检测' },
      { name: '市场风险', weight: '5%', description: '品类竞争度+价格策略评估' },
    ],
    usage: {
      single: 'POST { productName, category?, imageUrl? }',
      batch: 'POST { products: [{ productName, category?, imageUrl? }] }',
    },
    externalLinks: ['WIPO商标数据库', 'Google Patents', 'Google Lens'],
    note: '本地检测引擎，不依赖外部API；外部链接跳转至WIPO/Google搜索页',
  });
}
