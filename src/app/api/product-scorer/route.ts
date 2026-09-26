import { NextRequest, NextResponse } from 'next/server';
import { scoreProducts, ProductInput, ScoreResult } from '@/lib/scorer';
import {
  decideProduct,
  isDecisionModelEnabled,
  ProductDecision,
} from '@/lib/decision-model';

// 自动选品评分接口
// 评分 = 本地规则引擎（6维28指标，始终执行） + 阿里云百炼决策模型 AI 判断层（配置 Key 后启用）
// AI 层并行完成：可售性 / 侵权风险 / 合规等级 / 物流适配 / 差异化 / 综合潜力，
// 返回概率分布与置信度。无 Key 或调用失败时自动降级为纯本地评分，不阻断。

export interface ScoredItem {
  local: ScoreResult;
  decision: ProductDecision | null;
  decisionError?: string;
  // AI 综合潜力分（0-100），由决策模型 overall_potential(0-4) 换算
  aiPotentialScore: number | null;
  // AI 融合分：本地分 70% + AI潜力 30%，仅在有 AI 结果时给出
  fusedScore: number | null;
}

function toDecisionInput(p: ProductInput) {
  return {
    name: p.name,
    category: p.category,
    site: p.site,
    purchasePriceCNY: p.purchasePriceCNY,
    sellingPriceUSD: p.sellingPriceUSD,
    weightG: p.weightG,
    dimensionsCm: { l: p.lengthCm, w: p.widthCm, h: p.heightCm },
    notes: [
      p.repurchase ? `复购属性:${p.repurchase}` : '',
      p.fragility ? `易碎度:${p.fragility}` : '',
      p.packaging ? `包装:${p.packaging}` : '',
      p.ipRisk ? `规则判定IP风险:${p.ipRisk}` : '',
    ]
      .filter(Boolean)
      .join('；'),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const products: ProductInput[] = Array.isArray(body.products)
      ? body.products
      : [body.product ?? body];
    if (!products.length) {
      return NextResponse.json({ error: '请提供 products 数组或单个 product' }, { status: 400 });
    }

    // 1) 本地规则引擎（始终执行）
    const localResults = scoreProducts(products);

    // 2) 决策模型 AI 判断层（可选，单商品失败隔离）
    const aiEnabled = isDecisionModelEnabled();
    let items: ScoredItem[] = localResults.map((local) => ({
      local,
      decision: null,
      aiPotentialScore: null,
      fusedScore: null,
    }));

    if (aiEnabled && body.useAI !== false) {
      items = await Promise.all(
        items.map(async (item) => {
          const idx = products.findIndex(
            (p) => p.name === item.local.name && p.site === item.local.site,
          );
          const product = products[idx >= 0 ? idx : 0];
          try {
            const decision = await decideProduct(toDecisionInput(product));
            const aiPotentialScore = Math.round((decision.overallPotential / 4) * 100);
            const fusedScore = Math.round(item.local.total * 0.7 + aiPotentialScore * 0.3);
            return { ...item, decision, aiPotentialScore, fusedScore };
          } catch (e) {
            return { ...item, decisionError: String(e).slice(0, 200) };
          }
        }),
      );
    }

    // 排序：有融合分按融合分，否则按本地分
    items.sort((a, b) => (b.fusedScore ?? b.local.total) - (a.fusedScore ?? a.local.total));

    const aiErrors = items.filter((i) => i.decisionError).length;

    return NextResponse.json({
      results: items,
      count: items.length,
      engine: {
        local: '6维28指标规则引擎',
        decisionModel: aiEnabled ? 'decision-model-preview (已启用)' : '未启用（未配置 DASHSCOPE_API_KEY，已降级为纯本地评分）',
        aiEnabled,
        aiErrors,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: '评分失败', detail: String(e) }, { status: 500 });
  }
}

export async function GET() {
  const aiEnabled = isDecisionModelEnabled();
  return NextResponse.json({
    service: 'product-scorer',
    usage: 'POST { products: ProductInput[], useAI?: boolean } → 本地规则评分 + 决策模型AI判断，融合排序',
    localDimensions: ['市场需求 25%', '利润空间 25%', '竞争格局 20%', '物流适配 15%', '合规风险 10%', '供应链与复购 5%'],
    decisionModel: {
      model: 'decision-model-preview',
      enabled: aiEnabled,
      questions: ['可售性 noul', '侵权风险 choice', '合规等级 choice', '物流适配 score', '差异化 score', '综合潜力 score'],
      blend: 'fusedScore = 本地总分*0.7 + AI潜力分*0.3',
      note: aiEnabled
        ? '已启用，返回概率分布与置信度'
        : '未配置 DASHSCOPE_API_KEY 或 DECISION_MODEL_API_KEY，当前仅本地评分；配置后自动启用',
    },
  });
}
