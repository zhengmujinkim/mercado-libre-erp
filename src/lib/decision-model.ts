// 阿里云百炼决策模型（decision-model-preview）客户端
// 协议：TypeSafe System One —— POST /compatible-mode/v1/systemone
// 一次前向并行返回 分类(choice) / 是非(noul) / 评分(score) 及概率分布与置信度，不生成文本。
// 文档：https://help.aliyun.com/zh/model-studio/decision-model-api
//
// 定位：本地规则评分引擎(scorer.ts)之上的「AI 判断层」，
// 专攻规则难以量化的维度（合规可售、侵权风险、物流适配、差异化、综合潜力）。
// 无 Key / 调用失败时返回 null，由上层静默降级到纯本地引擎，不阻断主流程。

const DEFAULT_ENDPOINT = 'https://dashscope.aliyuncs.com/compatible-mode/v1/systemone';
const MODEL = 'decision-model-preview';
const DEFAULT_TIMEOUT_MS = 8000;

// ============ 类型 ============
export type QuestionType = 'choice' | 'noul' | 'score';

export interface BaseQuestion {
  type: QuestionType;
  instructions?: string;
  criteria?: unknown;
}

export interface ChoiceAnswer {
  type: 'choice';
  choice: string;
  confidence: number;
  probabilities: Record<string, number>;
}
export interface NoulAnswer {
  type: 'noul';
  noul: number; // P(yes) 0=否 1=是
  probabilities?: Record<string, number>;
}
export interface ScoreAnswer {
  type: 'score';
  score: number; // 等级索引的概率加权期望，可落在两级之间
  confidence: number;
  legend: Record<string, string>;
  probabilities: Record<string, number>;
}
export type Answer = ChoiceAnswer | NoulAnswer | ScoreAnswer;

export interface SystemOneResponse {
  model: string;
  request_id: string;
  answers: Record<string, Answer>;
  usage?: { input_tokens?: number };
  latency_ms?: number;
}

export type DecisionState = string | Record<string, unknown> | unknown[];

// ============ 配置 ============
export function getApiKey(): string | undefined {
  return (
    process.env.DECISION_MODEL_API_KEY ||
    process.env.DASHSCOPE_API_KEY ||
    undefined
  );
}

export function getEndpoint(): string {
  return process.env.DECISION_MODEL_ENDPOINT || DEFAULT_ENDPOINT;
}

export function isDecisionModelEnabled(): boolean {
  return Boolean(getApiKey());
}

// ============ 底层调用 ============
/**
 * 调用 System One。失败/超时/无 Key 时抛出 Error，由调用方决定降级策略。
 */
export async function callSystemOne(
  state: DecisionState,
  questions: Record<string, BaseQuestion>,
  opts: { timeoutMs?: number } = {},
): Promise<SystemOneResponse> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('未配置 DASHSCOPE_API_KEY / DECISION_MODEL_API_KEY');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(getEndpoint(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: MODEL, state, questions }),
      signal: controller.signal,
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`决策模型 HTTP ${res.status}: ${text.slice(0, 300)}`);
    }
    let json: SystemOneResponse;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(`决策模型返回非 JSON: ${text.slice(0, 300)}`);
    }
    if (!json.answers) throw new Error('决策模型返回缺少 answers 字段');
    return json;
  } finally {
    clearTimeout(timer);
  }
}

// ============ 选品场景高层封装 ============
// 针对单个待评商品，一次并行完成 5 项结构化判断。
export interface ProductDecisionInput {
  name: string;
  category?: string;
  site?: string;
  purchasePriceCNY?: number;
  sellingPriceUSD?: number;
  weightG?: number;
  dimensionsCm?: { l?: number; w?: number; h?: number };
  brand?: string;
  notes?: string;
}

export interface ProductDecision {
  sellable: number;           // noul P(可正常上架销售) 0-1
  ipRisk: string;             // none | low | mid | high
  ipRiskProb: Record<string, number>;
  complianceLevel: string;    // ok | simple_cert | testing | restricted
  complianceProb: Record<string, number>;
  logisticsFit: number;       // 0-4 期望等级（越高越适合轻小件跨境）
  logisticsConfidence: number;
  differentiation: number;    // 0-4 期望等级（越高越差异化/竞争越小）
  differentiationConfidence: number;
  overallPotential: number;   // 0-4 期望等级（越高越值得做）
  overallConfidence: number;
  raw: SystemOneResponse;
}

function buildProductQuestions(): Record<string, BaseQuestion> {
  return {
    sellable: {
      type: 'noul',
      instructions:
        '该商品是否可以在美客多跨境站点正常上架销售（非平台禁售品、无明显合规硬伤）？能正常销售选是，存在禁售/强制认证缺失等硬伤选否。',
    },
    ip_risk: {
      type: 'choice',
      instructions:
        '评估该商品的知识产权侵权风险（商标/专利/版权，包括带品牌名、卡通形象、专利外观等）。',
      criteria: {
        none: '纯白牌无任何品牌/IP/专利外观元素',
        low: '基本通用款，存在较低概率的外观或关键词风险',
        mid: '含疑似品牌风格、流行IP元素或可能受专利保护的结构',
        high: '明确使用品牌名、注册商标、知名卡通/影视形象或专利产品',
      },
    },
    compliance_level: {
      type: 'choice',
      instructions:
        '评估该商品在目标跨境站点的合规与认证要求等级。',
      criteria: {
        ok: '普通无认证要求商品',
        simple_cert: '仅需简单声明/标签（如成分、产地）',
        testing: '接触电/人体/食品等需第三方检测认证（如INMETRO/ANATEL）',
        restricted: '受限或需专项资质，普通跨境卖家难以合规',
      },
    },
    logistics_fit: {
      type: 'score',
      instructions:
        '从重量体积、易碎程度评估作为跨境轻小件自发货的物流适配度。',
      criteria: [
        '重/大件或极易碎，物流成本与破损风险高',
        '偏重偏大或较易碎，适配度较差',
        '中等重量体积、正常包装可防护',
        '较轻巧，需简单缓冲包装',
        '轻小、耐摔、不易变形，跨境物流极友好',
      ],
    },
    differentiation: {
      type: 'score',
      instructions:
        '评估该商品相对站内同质化白牌商品的差异化程度（越高代表越独特、价格战压力越小）。',
      criteria: [
        '高度同质化的通用通货，极易陷入价格战',
        '差异很小，主要靠价格竞争',
        '有一定功能或组合差异',
        '较有特色（功能/设计/套装），同质链接较少',
        '强差异化或本地市场稀缺，几乎无直接对标',
      ],
    },
    overall_potential: {
      type: 'score',
      instructions:
        '综合需求、利润、竞争、物流与合规，判断该商品作为跨境新手卖家选品的整体潜力。',
      criteria: [
        '不建议做（风险高或无利润空间）',
        '潜力较低，谨慎',
        '一般，可作为补充款',
        '潜力较好，值得上架测试',
        '高潜力，优先主推',
      ],
    },
  };
}

function asChoice(a: Answer | undefined): ChoiceAnswer | null {
  return a && a.type === 'choice' ? (a as ChoiceAnswer) : null;
}
function asNoul(a: Answer | undefined): NoulAnswer | null {
  return a && a.type === 'noul' ? (a as NoulAnswer) : null;
}
function asScore(a: Answer | undefined): ScoreAnswer | null {
  return a && a.type === 'score' ? (a as ScoreAnswer) : null;
}

/**
 * 对单个商品调用决策模型。失败抛出，由上层降级。
 */
export async function decideProduct(
  product: ProductDecisionInput,
): Promise<ProductDecision> {
  const state: DecisionState = {
    product_name: product.name,
    category: product.category ?? '',
    target_site: product.site ?? '',
    purchase_price_cny: product.purchasePriceCNY ?? '',
    selling_price_usd: product.sellingPriceUSD ?? '',
    weight_g: product.weightG ?? '',
    package_cm: product.dimensionsCm ?? '',
    mentioned_brand: product.brand ?? '',
    remarks: product.notes ?? '',
  };

  const resp = await callSystemOne(state, buildProductQuestions());
  const a = resp.answers;

  const sellable = asNoul(a.sellable)?.noul ?? 0;
  const ip = asChoice(a.ip_risk);
  const comp = asChoice(a.compliance_level);
  const logistics = asScore(a.logistics_fit);
  const diff = asScore(a.differentiation);
  const overall = asScore(a.overall_potential);

  return {
    sellable,
    ipRisk: ip?.choice ?? 'low',
    ipRiskProb: ip?.probabilities ?? {},
    complianceLevel: comp?.choice ?? 'ok',
    complianceProb: comp?.probabilities ?? {},
    logisticsFit: logistics?.score ?? 0,
    logisticsConfidence: logistics?.confidence ?? 0,
    differentiation: diff?.score ?? 0,
    differentiationConfidence: diff?.confidence ?? 0,
    overallPotential: overall?.score ?? 0,
    overallConfidence: overall?.confidence ?? 0,
    raw: resp,
  };
}
