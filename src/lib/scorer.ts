// 美客多 CBT 轻小件选品评分引擎
// 6 维度 28 指标，总分 100，S/A/B/C/D 五级
// 纯函数，无运行时依赖，可同时被 API Route 和前端页面调用

export type SiteId = 'MLM' | 'MLB' | 'MLA' | 'MLC' | 'MCO' | 'MPE' | 'MLU';

export interface SiteParam {
  commission: number;      // 默认佣金率（Premium 口径，自发货）
  shippingPerKg: number;   // 1kg 自发货头程运费（USD）
  goldenPrice: [number, number]; // 轻小件黄金价格带（USD）
}

export const SITE_PARAMS: Record<SiteId, SiteParam> = {
  MLM: { commission: 0.14,  shippingPerKg: 3.0, goldenPrice: [15, 45] },
  MLB: { commission: 0.165, shippingPerKg: 5.0, goldenPrice: [30, 60] },
  MLC: { commission: 0.14,  shippingPerKg: 2.5, goldenPrice: [15, 25] },
  MCO: { commission: 0.14,  shippingPerKg: 2.5, goldenPrice: [15, 30] },
  MLA: { commission: 0.15,  shippingPerKg: 4.0, goldenPrice: [15, 40] },
  MPE: { commission: 0.14,  shippingPerKg: 3.0, goldenPrice: [15, 35] },
  MLU: { commission: 0.14,  shippingPerKg: 3.0, goldenPrice: [15, 35] },
};

export const USD_CNY = 7.2;
export const INDIRECT_COST_RATE = 0.18; // 广告/退货/汇损/提现等间接成本占售价比

// ============ 输入定义 ============
export interface ProductInput {
  name: string;
  site: SiteId;
  category?: string;
  // 市场需求
  monthlySearch?: number;        // 月搜索量（核心关键词之和）
  searchGrowthPct?: number;      // 月度搜索增长率 %，如 30 = 30%
  onlineItems?: number;          // 在线商品数
  topMonthlySales?: number;      // 头部商品月销量估计
  // 竞争格局
  cr10Pct?: number;              // CR10 头部集中度 %
  medianReviews?: number;        // TOP50 中位评论数
  newListings90d?: number;       // 90 天进入 TOP50 的新链接数
  competitorListingScore?: number; // 竞品平均 Listing 质量分 0-100
  priceBandConcentrationPct?: number; // 价格带集中度 %
  // 利润空间
  purchasePriceCNY?: number;     // 采购价（含国内运费口径前的裸价，¥）
  sellingPriceUSD?: number;      // 售价（$）
  priceBandFit?: 'auto' | 'in' | 'near' | 'far';
  costStability?: 'stable' | 'minor' | 'major';
  // 物流适配
  weightG?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  packaging?: 'opp' | 'bubble' | 'foam' | 'special';
  fragility?: 'durable' | 'appliance' | 'glass' | 'precision';
  // 合规风险
  ipRisk?: 'none' | 'low' | 'mid' | 'high';
  certification?: 'none' | 'simple' | 'testing' | 'unavailable';
  restricted?: 'ok' | 'gray' | 'forbidden';
  // 供应链与复购
  repurchase?: 'consumable' | 'seasonal' | 'durable' | 'onetime';
  leadTime?: '7d' | '15d' | '30d' | '30d+';
  moq?: '50-' | '200-' | '500-' | '500+';
  qcDifficulty?: 'easy' | 'normal' | 'hard' | 'veryhard';
}

// ============ 输出定义 ============
export interface IndicatorScore {
  key: string;
  label: string;
  score: number;    // 0-100
  weight: number;   // 子权重（占总分百分比）
  value: string;    // 实际取值展示
  note?: string;
}

export interface DimensionScore {
  key: string;
  label: string;
  score: number;    // 维度内归一化得分 0-100
  weight: number;   // 维度权重
  indicators: IndicatorScore[];
}

export interface ScoreResult {
  name: string;
  site: SiteId;
  total: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  gradeLabel: string;
  vetoed: boolean;
  vetoReasons: string[];
  dimensions: DimensionScore[];
  metrics: Record<string, string>;
  suggestions: string[];
  scoredAt: string;
}

// ============ 评分工具 ============
/** 升序阈值：value < threshold 返回对应分数，全部超过返回 maxScore（越高越好型） */
function scoreAsc(value: number, pairs: [number, number][], maxScore: number): number {
  for (const [threshold, score] of pairs) {
    if (value < threshold) return score;
  }
  return maxScore;
}

function dimFromIndicators(indicators: IndicatorScore[]): number {
  const totalWeight = indicators.reduce((s, i) => s + i.weight, 0);
  const weighted = indicators.reduce((s, i) => s + i.score * i.weight, 0);
  return totalWeight > 0 ? weighted / totalWeight : 0;
}

// ============ 自动计算指标 ============
export function calcMetrics(p: ProductInput) {
  const site = SITE_PARAMS[p.site] || SITE_PARAMS.MLM;
  const price = p.sellingPriceUSD ?? 0;
  const purchase = p.purchasePriceCNY ?? 0;
  const weightKg = (p.weightG ?? 0) / 1000;

  const blueOcean = p.monthlySearch && p.onlineItems ? p.monthlySearch / p.onlineItems : 0;

  // 体积重 = 长×宽×高 / 6000（kg）
  const volWeight = p.lengthCm && p.widthCm && p.heightCm
    ? (p.lengthCm * p.widthCm * p.heightCm) / 6000 : 0;
  const volRatio = volWeight > 0 && weightKg > 0 ? volWeight / weightKg : 1;

  // 利润测算（CNY 口径）
  const revenueCNY = price * USD_CNY;
  const purchaseTotalCNY = purchase * 1.08; // 含国内段运费约 8%
  const shippingCNY = weightKg * site.shippingPerKg * USD_CNY;
  const commissionCNY = revenueCNY * site.commission;
  const grossProfitCNY = revenueCNY - purchaseTotalCNY - shippingCNY - commissionCNY;
  const grossMargin = revenueCNY > 0 ? grossProfitCNY / revenueCNY : 0;
  const netMargin = grossMargin - INDIRECT_COST_RATE;

  // 价格带匹配
  let priceFit: 'in' | 'near' | 'far' = 'far';
  if (price > 0) {
    const [lo, hi] = site.goldenPrice;
    if (price >= lo && price <= hi) priceFit = 'in';
    else if (price >= lo * 0.8 && price <= hi * 1.2) priceFit = 'near';
    else priceFit = 'far';
  }
  const effectiveFit = p.priceBandFit && p.priceBandFit !== 'auto' ? p.priceBandFit : priceFit;

  const lowPriceWarning = price > 0 && price < site.goldenPrice[0];

  return {
    site, blueOcean, volWeight, volRatio,
    grossMargin, netMargin, effectiveFit, priceFit,
    shippingCNY, commissionCNY, revenueCNY, lowPriceWarning,
  };
}

// ============ 主评分函数 ============
export function scoreProduct(p: ProductInput): ScoreResult {
  const m = calcMetrics(p);
  const vetoReasons: string[] = [];
  if (p.ipRisk === 'high') vetoReasons.push('高知识产权风险（疑似商标/专利/版权侵权，平台可直接下架封店）');
  if (p.restricted === 'forbidden') vetoReasons.push('平台禁售品类');
  if (p.certification === 'unavailable') vetoReasons.push('目标站点要求强制认证但无法获取（如巴西 INMETRO/ANATEL）');
  const vetoed = vetoReasons.length > 0;

  // ---- 维度一：市场需求 25% ----
  const search = p.monthlySearch ?? 0;
  const growth = (p.searchGrowthPct ?? 0) / 100;
  const sales = p.topMonthlySales ?? 0;
  const demandIndicators: IndicatorScore[] = [
    { key: 'search_volume', label: '月搜索量', weight: 8,
      score: scoreAsc(search, [[1000, 10], [10000, 40], [50000, 70]], 100),
      value: search > 0 ? search.toLocaleString() : '未填（按0计）',
      note: '美客多 /trends API 或蓝鲸BI等工具，用站点本地语言关键词' },
    { key: 'search_growth', label: '搜索增长率', weight: 6,
      score: scoreAsc(growth, [[0, 20], [0.2, 50], [0.5, 75]], 100),
      value: `${p.searchGrowthPct ?? 0}%` },
    { key: 'blue_ocean', label: '蓝海指数（搜索量÷商品数）', weight: 7,
      score: scoreAsc(m.blueOcean, [[10, 20], [20, 50], [50, 80]], 100),
      value: m.blueOcean > 0 ? m.blueOcean.toFixed(1) : '未填' },
    { key: 'est_sales', label: '头部月销量估计', weight: 4,
      score: scoreAsc(sales, [[100, 10], [500, 40], [1000, 70]], 100),
      value: sales > 0 ? `${sales} 件` : '未填（按0计）' },
  ];

  // ---- 维度二：竞争格局 20%（越低越好型） ----
  const cr10 = p.cr10Pct ?? 50;
  const reviews = p.medianReviews ?? 100;
  const newListings = p.newListings90d ?? 5;
  const compListing = p.competitorListingScore ?? 60;
  const bandConc = p.priceBandConcentrationPct ?? 60;
  const competitionIndicators: IndicatorScore[] = [
    { key: 'cr10', label: '头部集中度 CR10', weight: 6,
      score: scoreAsc(cr10, [[40, 100], [60, 60], [80, 30]], 10),
      value: `${cr10}%`, note: 'TOP10销量÷TOP100销量，越低越分散' },
    { key: 'review_barrier', label: '评论壁垒（中位评论数）', weight: 5,
      score: scoreAsc(reviews, [[50, 100], [200, 70], [500, 40]], 10),
      value: `${reviews} 条` },
    { key: 'new_speed', label: '90天新品流入数', weight: 4,
      score: scoreAsc(newListings, [[1, 5], [5, 30], [15, 60]], 100),
      value: `${newListings} 条` },
    { key: 'listing_quality', label: '竞品Listing质量（反向）', weight: 3,
      score: scoreAsc(compListing, [[40, 100], [60, 60], [80, 30]], 10),
      value: `${compListing} 分`, note: '竞品质量越差，你越容易靠基本功超越' },
    { key: 'price_concentration', label: '价格带集中度', weight: 2,
      score: scoreAsc(bandConc, [[50, 100], [70, 60]], 20),
      value: `${bandConc}%` },
  ];

  // ---- 维度三：利润空间 25% ----
  const fitScore = { in: 100, near: 60, far: 20 }[m.effectiveFit];
  const stabilityScore = { stable: 100, minor: 60, major: 20 }[p.costStability ?? 'stable'];
  const profitIndicators: IndicatorScore[] = [
    { key: 'gross_margin', label: '毛利率（自动测算）', weight: 10,
      score: scoreAsc(m.grossMargin, [[0.2, 0], [0.3, 40], [0.5, 70]], 100),
      value: `${(m.grossMargin * 100).toFixed(1)}%`,
      note: '已扣采购、头程运费、平台佣金；低于20%不建议新手做' },
    { key: 'net_margin', label: '净利率（自动测算）', weight: 8,
      score: scoreAsc(m.netMargin, [[0.05, 0], [0.1, 30], [0.2, 65]], 100),
      value: `${(Math.max(m.netMargin, 0) * 100).toFixed(1)}%`,
      note: '毛利率再扣约18%间接成本（广告/退货/汇损/提现）' },
    { key: 'price_band_fit', label: '价格带匹配度', weight: 4,
      score: fitScore,
      value: { in: '在黄金价格带内', near: '略偏离', far: '严重偏离' }[m.effectiveFit],
      note: `${p.site} 站黄金带 $${m.site.goldenPrice[0]}-$${m.site.goldenPrice[1]}` },
    { key: 'cost_stability', label: '成本稳定性', weight: 3,
      score: stabilityScore,
      value: { stable: '稳定', minor: '小幅波动', major: '波动较大' }[p.costStability ?? 'stable'] },
  ];

  // ---- 维度四：物流适配 15% ----
  const weight = p.weightG ?? 0;
  const pkgScore = { opp: 100, bubble: 70, foam: 40, special: 10 }[p.packaging ?? 'bubble'];
  const fragScore = { durable: 100, appliance: 70, glass: 30, precision: 10 }[p.fragility ?? 'durable'];
  const logisticsIndicators: IndicatorScore[] = [
    { key: 'weight', label: '产品重量', weight: 5,
      score: scoreAsc(weight, [[200, 100], [500, 70], [1000, 40]], 10),
      value: weight > 0 ? `${weight}g` : '未填' },
    { key: 'vol_ratio', label: '体积重比（泡货系数）', weight: 4,
      score: scoreAsc(m.volRatio, [[1.0, 100], [1.3, 70], [1.7, 40]], 10),
      value: m.volRatio > 0 ? m.volRatio.toFixed(2) : '未填尺寸',
      note: '体积重÷实重，>1 说明是泡货，2026年4月起按大值计费' },
    { key: 'packaging', label: '包装简易度', weight: 3, score: pkgScore,
      value: { opp: 'OPP袋', bubble: '气泡袋/纸盒', foam: '泡沫内衬', special: '特殊包装' }[p.packaging ?? 'bubble'] },
    { key: 'fragility', label: '抗损程度', weight: 3, score: fragScore,
      value: { durable: '塑料/硅胶/布艺', appliance: '小家电', glass: '玻璃/陶瓷', precision: '精密电子' }[p.fragility ?? 'durable'] },
  ];

  // ---- 维度五：合规风险 10% ----
  const ipScore = { none: 100, low: 70, mid: 30, high: 0 }[p.ipRisk ?? 'none'];
  const certScore = { none: 100, simple: 60, testing: 30, unavailable: 0 }[p.certification ?? 'none'];
  const restScore = { ok: 100, gray: 50, forbidden: 0 }[p.restricted ?? 'ok'];
  const complianceIndicators: IndicatorScore[] = [
    { key: 'ip_risk', label: '知识产权风险', weight: 4, score: ipScore,
      value: { none: '无品牌通用款', low: '低风险', mid: '中风险', high: '高风险' }[p.ipRisk ?? 'none'] },
    { key: 'certification', label: '品类认证要求', weight: 3, score: certScore,
      value: { none: '无需认证', simple: '简单备案', testing: '需检测认证', unavailable: '强制认证无法获取' }[p.certification ?? 'none'] },
    { key: 'restricted', label: '禁限售核查', weight: 2, score: restScore,
      value: { ok: '合规', gray: '灰区', forbidden: '禁售' }[p.restricted ?? 'ok'] },
    { key: 'policy', label: '平台政策符合性', weight: 1,
      score: { ok: 100, gray: 60, forbidden: 20 }[p.restricted ?? 'ok'],
      value: '按禁限售状态联动' },
  ];

  // ---- 维度六：供应链与复购 5% ----
  const repurchaseScore = { consumable: 100, seasonal: 60, durable: 20, onetime: 0 }[p.repurchase ?? 'durable'];
  const leadScore = { '7d': 100, '15d': 60, '30d': 30, '30d+': 10 }[p.leadTime ?? '15d'];
  const moqScore = { '50-': 100, '200-': 60, '500-': 30, '500+': 10 }[p.moq ?? '200-'];
  const qcScore = { easy: 100, normal: 60, hard: 30, veryhard: 10 }[p.qcDifficulty ?? 'normal'];
  const supplyIndicators: IndicatorScore[] = [
    { key: 'repurchase', label: '复购属性', weight: 2, score: repurchaseScore,
      value: { consumable: '高频消耗', seasonal: '季节性', durable: '耐用品', onetime: '一次性' }[p.repurchase ?? 'durable'] },
    { key: 'lead_time', label: '供应商交期', weight: 1.5, score: leadScore,
      value: { '7d': '现货7天内', '15d': '7-15天', '30d': '15-30天', '30d+': '30天以上' }[p.leadTime ?? '15d'] },
    { key: 'moq', label: '最小起订量 MOQ', weight: 1, score: moqScore,
      value: { '50-': '<50件', '200-': '50-200件', '500-': '200-500件', '500+': '>500件' }[p.moq ?? '200-'] },
    { key: 'qc', label: '品控难度', weight: 0.5, score: qcScore,
      value: { easy: '极简单', normal: '一般', hard: '较难', veryhard: '极难' }[p.qcDifficulty ?? 'normal'] },
  ];

  const dimensions: DimensionScore[] = [
    { key: 'demand', label: '市场需求', weight: 25, indicators: demandIndicators, score: dimFromIndicators(demandIndicators) },
    { key: 'competition', label: '竞争格局', weight: 20, indicators: competitionIndicators, score: dimFromIndicators(competitionIndicators) },
    { key: 'profit', label: '利润空间', weight: 25, indicators: profitIndicators, score: dimFromIndicators(profitIndicators) },
    { key: 'logistics', label: '物流适配', weight: 15, indicators: logisticsIndicators, score: dimFromIndicators(logisticsIndicators) },
    { key: 'compliance', label: '合规风险', weight: 10, indicators: complianceIndicators, score: dimFromIndicators(complianceIndicators) },
    { key: 'supply', label: '供应链与复购', weight: 5, indicators: supplyIndicators, score: dimFromIndicators(supplyIndicators) },
  ];

  const total = dimensions.reduce((s, d) => s + d.score * (d.weight / 100), 0);
  const finalTotal = vetoed ? 0 : Math.round(total * 10) / 10;

  let grade: ScoreResult['grade'] = 'D';
  if (!vetoed) {
    if (total >= 90) grade = 'S';
    else if (total >= 75) grade = 'A';
    else if (total >= 60) grade = 'B';
    else if (total >= 40) grade = 'C';
  }
  const gradeLabel = {
    S: 'S级 · 强烈推荐', A: 'A级 · 推荐', B: 'B级 · 谨慎推荐', C: 'C级 · 风险较高', D: 'D级 · 不推荐',
  }[grade];

  // ---- 建议生成 ----
  const suggestions: string[] = [];
  if (vetoed) {
    suggestions.push('⛔ 触发一票否决，无论总分多少都不建议上架：' + vetoReasons.join('；'));
  }
  const dimMap: Record<string, DimensionScore> = Object.fromEntries(dimensions.map(d => [d.key, d]));
  if (dimMap.demand.score < 60) suggestions.push('📈 市场需求偏弱：优先用站点本地语言（西语/葡语）核对关键词搜索量，考虑换更大需求的细分品类。');
  if (dimMap.competition.score < 60) suggestions.push('⚔️ 竞争环境不利：头部垄断或评论壁垒高，建议切更细分的长尾切口，或用差异化（功能/设计/组合装）避开正面竞争。');
  if (dimMap.profit.score < 60) suggestions.push('💰 利润不足：毛利率低于20%的品新手别碰；尝试压低采购价、提高售价或换轻量包装降运费。');
  if (m.lowPriceWarning) suggestions.push(`💸 售价低于本站黄金价格带下沿（$${m.site.goldenPrice[0]}），可能触发低价附加费且利润空间不足。`);
  if (dimMap.logistics.score < 60) suggestions.push('📦 物流成本偏高：2026年4月起按实重与体积重取大值计费，注意压缩包装尺寸，泡货谨慎做。');
  if (dimMap.compliance.score < 60 && !vetoed) suggestions.push('⚖️ 存在合规隐患：上架前务必完成商标/专利检索和认证确认，侵权处罚可致封店冻结资金。');
  if (dimMap.supply.score < 60) suggestions.push('🔗 供应链条件一般：优先选现货、低MOQ、品控简单的供应商，降低新手试错成本。');
  if (m.blueOcean >= 20 && m.blueOcean < 50) suggestions.push('🌊 蓝海指数不错（20-50），属于正常蓝海市场，可以小批量测试。');
  if (m.blueOcean >= 50) suggestions.push('🌊 蓝海指数很高（≥50），超级蓝海！但要核实需求真实性，小心"伪需求"。');
  if (suggestions.length === 0) suggestions.push('✅ 各维度表现均衡，建议小单测试验证后再放量。记住：评分是筛选工具，最终还要结合实盘数据回评。');

  const metrics: Record<string, string> = {
    蓝海指数: m.blueOcean > 0 ? m.blueOcean.toFixed(1) : '—',
    毛利率: `${(m.grossMargin * 100).toFixed(1)}%`,
    净利率: `${(Math.max(m.netMargin, 0) * 100).toFixed(1)}%`,
    头程运费估算: `$${(m.shippingCNY / USD_CNY).toFixed(2)}`,
    平台佣金估算: `¥${m.commissionCNY.toFixed(1)}`,
    体积重比: m.volRatio > 0 ? m.volRatio.toFixed(2) : '—',
    价格带匹配: { in: '黄金带内', near: '略偏离', far: '严重偏离' }[m.effectiveFit],
  };

  return {
    name: p.name || '未命名产品',
    site: p.site,
    total: finalTotal,
    grade,
    gradeLabel,
    vetoed,
    vetoReasons,
    dimensions,
    metrics,
    suggestions,
    scoredAt: new Date().toISOString(),
  };
}

export function scoreProducts(products: ProductInput[]): ScoreResult[] {
  return products.map(scoreProduct);
}

// ============ 示例数据 ============
export const EXAMPLE_PRODUCTS: Record<string, ProductInput> = {
  blueOcean: {
    name: '宠物自动喂食器（墨西哥站示例）',
    site: 'MLM',
    category: '宠物用品',
    monthlySearch: 38000, searchGrowthPct: 35, onlineItems: 520, topMonthlySales: 800,
    cr10Pct: 35, medianReviews: 40, newListings90d: 18, competitorListingScore: 38, priceBandConcentrationPct: 45,
    purchasePriceCNY: 45, sellingPriceUSD: 25.99, priceBandFit: 'auto', costStability: 'stable',
    weightG: 450, lengthCm: 18, widthCm: 18, heightCm: 25, packaging: 'bubble', fragility: 'appliance',
    ipRisk: 'none', certification: 'none', restricted: 'ok',
    repurchase: 'durable', leadTime: '15d', moq: '50-', qcDifficulty: 'normal',
  },
  redOcean: {
    name: '通用手机壳（墨西哥站示例）',
    site: 'MLM',
    category: '3C配件',
    monthlySearch: 120000, searchGrowthPct: 5, onlineItems: 85000, topMonthlySales: 3000,
    cr10Pct: 82, medianReviews: 800, newListings90d: 2, competitorListingScore: 85, priceBandConcentrationPct: 80,
    purchasePriceCNY: 3, sellingPriceUSD: 8.99, priceBandFit: 'auto', costStability: 'stable',
    weightG: 60, lengthCm: 15, widthCm: 8, heightCm: 1.5, packaging: 'opp', fragility: 'durable',
    ipRisk: 'mid', certification: 'none', restricted: 'ok',
    repurchase: 'durable', leadTime: '7d', moq: '50-', qcDifficulty: 'easy',
  },
  veto: {
    name: '世界杯吉祥物挂件（侵权示例）',
    site: 'MLM',
    category: '派对用品',
    monthlySearch: 60000, searchGrowthPct: 120, onlineItems: 300, topMonthlySales: 2000,
    cr10Pct: 30, medianReviews: 30, newListings90d: 20, competitorListingScore: 35, priceBandConcentrationPct: 40,
    purchasePriceCNY: 6, sellingPriceUSD: 12.99, priceBandFit: 'auto', costStability: 'stable',
    weightG: 80, lengthCm: 10, widthCm: 8, heightCm: 3, packaging: 'opp', fragility: 'durable',
    ipRisk: 'high', certification: 'none', restricted: 'ok',
    repurchase: 'seasonal', leadTime: '7d', moq: '50-', qcDifficulty: 'easy',
  },
};
