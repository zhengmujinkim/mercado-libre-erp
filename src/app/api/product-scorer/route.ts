import { NextRequest, NextResponse } from 'next/server';
import { scoreProduct, scoreProducts, ProductInput } from '@/lib/scorer';

// 自动选品评分接口
// 当前：接收产品数据（手动录入/批量导入）返回评分
// 未来：美客多 API 打通后，可由后端定时采集商品数据 → 自动调用评分引擎 → 输出高分候选
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const products: ProductInput[] = Array.isArray(body.products) ? body.products : [body.product ?? body];
    if (!products.length) {
      return NextResponse.json({ error: '请提供 products 数组或单个 product' }, { status: 400 });
    }
    const results = scoreProducts(products);
    results.sort((a, b) => b.total - a.total);
    return NextResponse.json({ results, count: results.length });
  } catch (e) {
    return NextResponse.json({ error: '评分失败', detail: String(e) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'product-scorer',
    usage: 'POST { products: ProductInput[] } → 按6维28指标评分排序',
    dimensions: ['市场需求 25%', '利润空间 25%', '竞争格局 20%', '物流适配 15%', '合规风险 10%', '供应链与复购 5%'],
    note: '当前为本地评分引擎，美客多自动爬取待数据源接通',
  });
}
