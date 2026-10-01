/**
 * API Route: POST /api/catalog-analyze
 * 
 * 接收商品参数，调用 ML API 搜索竞品，返回完整分析报告
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculatePricing, generateRecommendation, type PackageSpec, type PricingConfig } from '@/lib/catalog-analyzer';

// ML API 配置
const ML_CLIENT_ID = process.env.ML_CLIENT_ID || '1167380097326946';
const ML_CLIENT_SECRET = process.env.ML_CLIENT_SECRET || '8nMYwpYkIDjVjh4ihHsWAtlt8x4Xn7qG';
const ML_USER_ID = process.env.ML_USER_ID || '3650205937';

interface CatalogAnalyzeRequest {
  keyword: string;              // ML 搜索关键词
  product_name_cn: string;      // 中文名
  package_weight_g: number;     // 重量（克）
  package_l_cm: number;         // 长
  package_w_cm: number;         // 宽
  package_h_cm: number;         // 高
  purchase_cost_cny: number;    // 采购价（元）
  site_id?: string;             // 站点 ID（默认 MLB）
  competitor_limit?: number;    // 竞品采样数（默认 20）
  config?: Partial<PricingConfig>; // 核价配置
}

interface CompetitorInfo {
  item_id: string;
  title: string;
  price_brl: number;
  seller_reputation: string;
  listing_type: string;
  sold_count: number;
  is_catalog: boolean;
}

interface CatalogAnalyzeResponse {
  success: boolean;
  data?: {
    keyword: string;
    product_name_cn: string;
    site_id: string;
    package: PackageSpec;
    weight_analysis: {
      volume_weight_g: number;
      billable_weight_g: number;
      is_oversized: boolean;
    };
    pricing: {
      purchase_cost_cny: number;
      purchase_cost_brl: number;
      domestic_shipping_cny: number;
      international_shipping_cny: number;
      commission_cny: number;
      total_cost_cny: number;
      total_cost_brl: number;
      min_price_brl: number;
      suggested_price_brl: number;
    };
    competition: {
      total_results: number;
      competitors: CompetitorInfo[];
      buy_box_winner: CompetitorInfo | null;
      avg_price_brl: number;
      min_price_brl: number;
      max_price_brl: number;
      catalog_ratio: number;
    };
    competitiveness: {
      is_competitive: boolean;
      profit_margin: number;
      win_probability: string;
      recommendations: string[];
    };
  };
  error?: string;
}

/**
 * 获取 ML Access Token
 */
async function getMLToken(): Promise<string> {
  const resp = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: ML_CLIENT_ID,
      client_secret: ML_CLIENT_SECRET,
    }),
  });
  
  if (!resp.ok) {
    throw new Error(`ML OAuth failed: ${resp.status}`);
  }
  
  const data = await resp.json();
  return data.access_token;
}

/**
 * 搜索 ML 商品
 */
async function searchMLItems(
  token: string,
  keyword: string,
  site_id: string,
  limit: number
): Promise<{ results: string[]; total: number }> {
  const resp = await fetch(
    `https://api.mercadolibre.com/sites/${site_id}/items/search?q=${encodeURIComponent(keyword)}&limit=${limit}`,
    {
      headers: { 'Authorization': `Bearer ${token}` },
    }
  );
  
  if (!resp.ok) {
    throw new Error(`ML search failed: ${resp.status}`);
  }
  
  return resp.json();
}

/**
 * 批量获取商品详情
 */
async function getItemsBatch(
  token: string,
  item_ids: string[]
): Promise<any[]> {
  if (item_ids.length === 0) return [];
  
  // 分批获取（每次最多 20 个）
  const all_items: any[] = [];
  
  for (let i = 0; i < item_ids.length; i += 20) {
    const batch = item_ids.slice(i, i + 20);
    const ids_str = batch.join(',');
    
    const resp = await fetch(
      `https://api.mercadolibre.com/items?ids=${ids_str}`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
      }
    );
    
    if (!resp.ok) {
      console.error(`Failed to fetch items batch: ${resp.status}`);
      continue;
    }
    
    const data = await resp.json();
    all_items.push(...data);
  }
  
  return all_items;
}

export async function POST(req: NextRequest) {
  try {
    const body: CatalogAnalyzeRequest = await req.json();
    
    // 验证必填字段
    if (!body.keyword || !body.product_name_cn) {
      return NextResponse.json<CatalogAnalyzeResponse>({
        success: false,
        error: '缺少必填字段：keyword 和 product_name_cn',
      }, { status: 400 });
    }
    
    if (!body.package_weight_g || body.package_weight_g <= 0) {
      return NextResponse.json<CatalogAnalyzeResponse>({
        success: false,
        error: '包裹重量必须 > 0',
      }, { status: 400 });
    }
    
    if (!body.package_l_cm || !body.package_w_cm || !body.package_h_cm) {
      return NextResponse.json<CatalogAnalyzeResponse>({
        success: false,
        error: '包裹尺寸（长宽高）必须填写',
      }, { status: 400 });
    }
    
    const site_id = body.site_id || 'MLB';
    const competitor_limit = body.competitor_limit || 20;
    
    // 1. 获取 ML Token
    const token = await getMLToken();
    
    // 2. 搜索竞品
    const searchResult = await searchMLItems(token, body.keyword, site_id, competitor_limit);
    const item_ids = searchResult.results.slice(0, competitor_limit);
    
    // 3. 获取商品详情
    const items_data = await getItemsBatch(token, item_ids);
    
    // 4. 解析竞品信息
    const competitors: CompetitorInfo[] = items_data
      .filter((item: any) => item.body && item.body.id)
      .map((item: any) => {
        const body = item.body;
        const tags = body.tags || [];
        const is_catalog = !!body.family_name || tags.includes('user_product_listing');
        
        return {
          item_id: body.id,
          title: body.title || '',
          price_brl: body.price || 0,
          seller_reputation: body.seller?.seller_reputation?.color_id || 'unknown',
          listing_type: body.listing_type_id || 'gold_special',
          sold_count: body.sold_quantity || 0,
          is_catalog,
        };
      });
    
    // 5. 计算统计数据
    const prices = competitors.map(c => c.price_brl).filter(p => p > 0);
    const avg_price_brl = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    const min_price_brl = prices.length > 0 ? Math.min(...prices) : 0;
    const max_price_brl = prices.length > 0 ? Math.max(...prices) : 0;
    const catalog_count = competitors.filter(c => c.is_catalog).length;
    const catalog_ratio = competitors.length > 0 ? catalog_count / competitors.length : 0;
    
    // 6. 估算 buy box 赢家（简化版）
    let buy_box_winner: CompetitorInfo | null = null;
    if (competitors.length > 0) {
      buy_box_winner = competitors.reduce((best, curr) => {
        const best_score = scoreCompetitor(best, competitors);
        const curr_score = scoreCompetitor(curr, competitors);
        return curr_score > best_score ? curr : best;
      });
    }
    
    // 7. 核价计算
    const package: PackageSpec = {
      weight_g: body.package_weight_g,
      length_cm: body.package_l_cm,
      width_cm: body.package_w_cm,
      height_cm: body.package_h_cm,
    };
    
    const config: PricingConfig = {
      ...{
        domestic_shipping_cny: 6.0,
        exchange_rate: 0.776,
        commission_rate: 0.14,
        profit_margin_target: 0.25,
      },
      ...body.config,
    };
    
    const pricing_result = calculatePricing(
      package,
      body.purchase_cost_cny,
      min_price_brl,  // 用竞品最低价作为对标
      competitors.length,
      config
    );
    
    // 8. 生成建议
    const recommendations = generateRecommendation(pricing_result, catalog_ratio);
    
    // 9. 返回结果
    return NextResponse.json<CatalogAnalyzeResponse>({
      success: true,
      data: {
        keyword: body.keyword,
        product_name_cn: body.product_name_cn,
        site_id,
        package,
        weight_analysis: {
          volume_weight_g: pricing_result.volume_weight_g,
          billable_weight_g: pricing_result.billable_weight_g,
          is_oversized: pricing_result.is_oversized,
        },
        pricing: {
          purchase_cost_cny: pricing_result.cost.purchase_cost_cny,
          purchase_cost_brl: pricing_result.cost.purchase_cost_brl,
          domestic_shipping_cny: pricing_result.cost.domestic_shipping_cny,
          international_shipping_cny: pricing_result.cost.international_shipping_cny,
          commission_cny: pricing_result.cost.commission_cny,
          total_cost_cny: pricing_result.cost.total_cost_cny,
          total_cost_brl: pricing_result.cost.total_cost_brl,
          min_price_brl: pricing_result.min_price_brl,
          suggested_price_brl: pricing_result.suggested_price_brl,
        },
        competition: {
          total_results: searchResult.total,
          competitors: competitors.slice(0, 10),  // 只返回前 10 个
          buy_box_winner,
          avg_price_brl,
          min_price_brl,
          max_price_brl,
          catalog_ratio,
        },
        competitiveness: {
          is_competitive: pricing_result.is_competitive,
          profit_margin: pricing_result.profit_margin,
          win_probability: pricing_result.win_probability,
          recommendations,
        },
      },
    });
    
  } catch (error) {
    console.error('Catalog analyze error:', error);
    return NextResponse.json<CatalogAnalyzeResponse>({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}

/**
 * 竞品评分（用于估算 buy box 赢家）
 */
function scoreCompetitor(c: CompetitorInfo, all: CompetitorInfo[]): number {
  let score = 0;
  
  // 价格分（0-40）
  const prices = all.map(x => x.price_brl).filter(p => p > 0);
  if (prices.length > 0) {
    const min_p = Math.min(...prices);
    const max_p = Math.max(...prices);
    if (max_p > min_p) {
      score += 40 * (1 - (c.price_brl - min_p) / (max_p - min_p));
    } else {
      score += 20;
    }
  }
  
  // listing 类型分（0-25）
  if (c.listing_type === 'gold_pro') score += 25;
  else if (c.listing_type === 'gold_special') score += 15;
  else score += 5;
  
  // 信誉分（0-20）
  if (c.seller_reputation === 'green') score += 20;
  else if (c.seller_reputation === 'yellow') score += 10;
  
  // 销量分（0-15）
  const max_sold = Math.max(...all.map(x => x.sold_count), 1);
  score += 15 * Math.min(c.sold_count / max_sold, 1);
  
  return score;
}
