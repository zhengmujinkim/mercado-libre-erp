/**
 * Catalog 竞争分析 - TypeScript 版核价引擎
 * 
 * 直接在 Next.js 中运行，无需 Python 依赖
 */

// ==================== 物流硬约束 ====================
/** 实际重量和抛重都不能超过 5kg，否则无法发货（2026-10-01 确认） */
export const MAX_WEIGHT_G = 5000;
export const MAX_VOLUME_WEIGHT_G = 5000;
export const VOLUME_DIVISOR = 6000; // 长×宽×高÷6000 = 抛重(g)

export interface PackageSpec {
  weight_g: number;       // 实际重量（克）
  length_cm: number;      // 长
  width_cm: number;       // 宽
  height_cm: number;      // 高
}

export interface CostBreakdown {
  purchase_cost_cny: number;
  purchase_cost_brl: number;
  domestic_shipping_cny: number;
  domestic_shipping_brl: number;
  international_shipping_cny: number;
  international_shipping_brl: number;
  commission_cny: number;
  commission_brl: number;
  total_cost_cny: number;
  total_cost_brl: number;
}

export interface PricingResult {
  package: PackageSpec;
  cost: CostBreakdown;
  volume_weight_g: number;
  billable_weight_g: number;
  min_price_cny: number;
  min_price_brl: number;
  suggested_price_cny: number;
  suggested_price_brl: number;
  competitor_price_brl: number;
  competitor_count: number;
  is_competitive: boolean;
  profit_margin: number;
  win_probability: string;
  is_oversized: boolean;
  // 5kg 物流限制校验（2026-10-01）
  exceeds_weight_limit: boolean;
  exceeds_volume_limit: boolean;
  shipping_blocked: boolean;
  shipping_block_reason: string;
}

export interface PricingConfig {
  domestic_shipping_cny: number;   // 国内运费（元）
  exchange_rate: number;            // CNY→BRL 汇率
  commission_rate: number;          // ML 佣金比例
  profit_margin_target: number;     // 目标利润率
}

const DEFAULT_CONFIG: PricingConfig = {
  domestic_shipping_cny: 6.0,
  exchange_rate: 0.776,
  commission_rate: 0.14,
  profit_margin_target: 0.25,
};

/**
 * 计算体积重和计费重
 */
export function calculateWeight(pkg: PackageSpec) {
  const volume_weight_g = (pkg.length_cm * pkg.width_cm * pkg.height_cm / VOLUME_DIVISOR) * 1000;
  const billable_weight_g = Math.max(pkg.weight_g, volume_weight_g);
  const is_oversized = volume_weight_g > pkg.weight_g * 2;
  
  return { volume_weight_g, billable_weight_g, is_oversized };
}

/**
 * 校验 5kg 物流硬限制（2026-10-01 确认）
 * 实际重量和抛重都不能超过 5kg，否则无法发货
 */
export function validateShipping(pkg: PackageSpec): {
  exceeds_weight_limit: boolean;
  exceeds_volume_limit: boolean;
  shipping_blocked: boolean;
  shipping_block_reason: string;
} {
  const volume_weight_g = (pkg.length_cm * pkg.width_cm * pkg.height_cm / VOLUME_DIVISOR) * 1000;
  const exceeds_weight = pkg.weight_g > MAX_WEIGHT_G;
  const exceeds_volume = volume_weight_g > MAX_VOLUME_WEIGHT_G;
  const blocked = exceeds_weight || exceeds_volume;
  
  let reason = '';
  if (exceeds_weight && exceeds_volume) {
    reason = `实际重${pkg.weight_g}g 和抛重${volume_weight_g.toFixed(0)}g 均超过5kg限制，无法发货`;
  } else if (exceeds_weight) {
    reason = `实际重${pkg.weight_g}g 超过5kg限制，无法发货`;
  } else if (exceeds_volume) {
    reason = `抛重${volume_weight_g.toFixed(0)}g（${pkg.length_cm}×${pkg.width_cm}×${pkg.height_cm}cm÷6000）超过5kg限制，无法发货。建议压缩包装尺寸`;
  }
  
  return {
    exceeds_weight_limit: exceeds_weight,
    exceeds_volume_limit: exceeds_volume,
    shipping_blocked: blocked,
    shipping_block_reason: reason
  };
}

/**
 * 估算国际运费（简化公式）
 * 首重 500g ¥25，续重每 500g ¥8
 */
export function estimateInternationalShipping(billable_weight_g: number): number {
  const weight_kg = billable_weight_g / 1000;
  if (weight_kg <= 0.5) {
    return 25.0;
  } else {
    const extra_units = Math.ceil((weight_kg - 0.5) * 2);
    return 25.0 + extra_units * 8.0;
  }
}

/**
 * 完整核价计算
 */
export function calculatePricing(
  package: PackageSpec,
  purchase_cost_cny: number,
  competitor_price_brl: number = 0,
  competitor_count: number = 0,
  config: PricingConfig = DEFAULT_CONFIG,
  actual_commission_rate?: number
): PricingResult {
  // 1. 计算重量
  const { volume_weight_g, billable_weight_g, is_oversized } = calculateWeight(package);
  
  // 1.5 校验 5kg 物流硬限制（2026-10-01）
  const shippingCheck = validateShipping(package);
  
  // 2. 计算成本（即使超限也计算，但结果会标记为不可发货）
  const commission_rate = actual_commission_rate ?? config.commission_rate;
  const international_shipping_cny = estimateInternationalShipping(billable_weight_g);
  const base_cost_cny = purchase_cost_cny + config.domestic_shipping_cny;
  
  // 3. 计算价格
  const min_price_cny = (base_cost_cny + international_shipping_cny) / (1 - commission_rate);
  const suggested_price_cny = (base_cost_cny + international_shipping_cny) / (1 - commission_rate - config.profit_margin_target);
  
  // 4. 转换为 BRL
  const min_price_brl = min_price_cny * config.exchange_rate;
  const suggested_price_brl = suggested_price_cny * config.exchange_rate;
  
  // 5. 佣金金额
  const commission_cny = suggested_price_cny * commission_rate;
  
  const cost: CostBreakdown = {
    purchase_cost_cny,
    purchase_cost_brl: purchase_cost_cny * config.exchange_rate,
    domestic_shipping_cny: config.domestic_shipping_cny,
    domestic_shipping_brl: config.domestic_shipping_cny * config.exchange_rate,
    international_shipping_cny,
    international_shipping_brl: international_shipping_cny * config.exchange_rate,
    commission_cny,
    commission_brl: commission_cny * config.exchange_rate,
    total_cost_cny: min_price_cny,
    total_cost_brl: min_price_brl,
  };
  
  // 6. 竞争力评估
  let is_competitive = false;
  let profit_margin = 0;
  let win_probability = "无法评估";
  
  if (competitor_price_brl > 0) {
    const price_diff_pct = (competitor_price_brl - suggested_price_brl) / competitor_price_brl * 100;
    
    if (suggested_price_brl <= competitor_price_brl * 0.9) {
      is_competitive = true;
      win_probability = "🟢 高（价格优势 >10%）";
      profit_margin = config.profit_margin_target;
    } else if (suggested_price_brl <= competitor_price_brl) {
      is_competitive = true;
      win_probability = "🟡 中（价格略优）";
      profit_margin = config.profit_margin_target * 0.5;
    } else if (suggested_price_brl <= competitor_price_brl * 1.1) {
      is_competitive = false;
      win_probability = "🟠 低（价格接近但偏高）";
      profit_margin = 0.05;
    } else {
      is_competitive = false;
      win_probability = "🔴 极低（价格远高于竞品）";
      profit_margin = -0.1;
    }
    
    if (competitor_count > 10) {
      win_probability += `，且竞争激烈（${competitor_count}+ 卖家）`;
    } else if (competitor_count > 5) {
      win_probability += `，竞争中等（${competitor_count} 卖家）`;
    }
  }
  
  return {
    package,
    cost,
    volume_weight_g,
    billable_weight_g,
    min_price_cny,
    min_price_brl,
    suggested_price_cny,
    suggested_price_brl,
    competitor_price_brl,
    competitor_count,
    is_competitive,
    profit_margin,
    win_probability,
    is_oversized,
    // 5kg 物流限制校验（2026-10-01）
    exceeds_weight_limit: shippingCheck.exceeds_weight_limit,
    exceeds_volume_limit: shippingCheck.exceeds_volume_limit,
    shipping_blocked: shippingCheck.shipping_blocked,
    shipping_block_reason: shippingCheck.shipping_block_reason,
  };
}

/**
 * 生成操作建议
 */
export function generateRecommendation(
  pricing: PricingResult,
  catalog_ratio: number = 0
): string[] {
  const lines: string[] = [];
  
  if (pricing.is_competitive) {
    lines.push("✅ 该商品有竞争力，建议上架");
    lines.push(`建议定价：R$${pricing.suggested_price_brl.toFixed(2)}`);
    lines.push(`预期利润率：${(pricing.profit_margin * 100).toFixed(0)}%`);
  } else {
    lines.push("⚠️ 价格竞争力不足");
    lines.push(`保本价：R$${pricing.min_price_brl.toFixed(2)}`);
    lines.push(`竞品最低价：R$${pricing.competitor_price_brl.toFixed(2)}`);
    
    if (pricing.is_oversized) {
      const ratio = pricing.volume_weight_g / pricing.package.weight_g;
      lines.push(`⚠️ 体积重是实际重的 ${ratio.toFixed(1)} 倍，建议优化包装尺寸以降低运费`);
    }
    
    if (pricing.competitor_count > 10) {
      lines.push(`⚠️ 竞争过于激烈（${pricing.competitor_count}+ 卖家），建议换品`);
    }
  }
  
  if (catalog_ratio > 0.5) {
    lines.push(`📦 该品类 Catalog listing 占比 ${(catalog_ratio * 100).toFixed(0)}%`);
    lines.push("建议走 Catalog 竞争模式（ML 提供标准化图片）");
  } else if (catalog_ratio > 0) {
    lines.push(`📦 该品类 Catalog listing 占比仅 ${(catalog_ratio * 100).toFixed(0)}%`);
    lines.push("建议走传统 listing 模式（自己控制标题和图片）");
  }
  
  return lines;
}

/**
 * 快速校验商品是否满足发货条件（5kg 硬限制）
 * 用于选品环节的自动过滤
 * 
 * @returns true = 可以发货，false = 超重/超抛重，无法发货
 */
export function canShip(pkg: PackageSpec): { ok: boolean; reason: string } {
  const check = validateShipping(pkg);
  if (check.shipping_blocked) {
    return { ok: false, reason: check.shipping_block_reason };
  }
  return { ok: true, reason: '' };
}

/**
 * 计算最大允许的包装尺寸（在 5kg 抛重限制下）
 * 已知实际重量，反推最大长×宽×高
 */
export function maxAllowedDimensions(actual_weight_g: number): { max_volume_cm3: number; note: string } {
  const max_volume_weight_g = MAX_VOLUME_WEIGHT_G;
  // 体积重 = L×W×H÷6000×1000，所以 L×W×H = 体积重×6
  const max_volume_cm3 = max_volume_weight_g / 1000 * VOLUME_DIVISOR; // 5000g → 30000 cm³
  
  let note = '';
  if (actual_weight_g > MAX_WEIGHT_G) {
    note = `实际重${actual_weight_g}g已超限，无论如何都无法发货`;
  } else if (actual_weight_g > max_volume_weight_g * 0.8) {
    note = `实际重${actual_weight_g}g接近5kg上限，建议控制包装尺寸在${max_volume_cm3.toFixed(0)}cm³以内`;
  } else {
    note = `包装体积不超过${max_volume_cm3.toFixed(0)}cm³即可（如30×25×15=11250cm³ ✅）`;
  }
  
  return { max_volume_cm3, note };
}
