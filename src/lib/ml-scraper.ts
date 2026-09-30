/**
 * ML 竞品采集工具
 *
 * 流程：
 *   1. 输入 ML 商品 ID 或链接
 *   2. 调用 GET /items/{id} 获取包装尺寸、主图、属性
 *   3. 调用 GET /items/{id}/description 获取详情图文
 *   4. 返回完整数据供上架使用
 */

import { getAccessToken } from './token-store';

const API = 'https://api.mercadolibre.com';

export interface MLScrapeResult {
  success: boolean;
  itemId?: string;
  title?: string;
  // 包装规格（直接抄）
  package_specs: {
    weight_g?: number;
    length_cm?: number;
    width_cm?: number;
    height_cm?: number;
  };
  // 主图（ML 图片 ID 列表）
  pictures: { id: string; url: string }[];
  // 产品属性
  attributes: { id: string; name: string; value_name: string }[];
  // 详情图文（HTML 内容）
  description?: {
    plain_text: string;
    html: string;
    images: string[];
  };
  // 售价参考
  price?: number;
  currency?: string;
  // 分类
  category_id?: string;
  // 站点
  site_id?: string;
  error?: string;
}

/** 从 ML URL 或纯 ID 提取 item ID */
export function parseItemId(input: string): string | null {
  if (!input) return null;
  // https://produto.mercadolivre.com.br/MLB-5276090987-xxx
  const m1 = input.match(/ML[BAXCOU]-?\d+/i);
  if (m1) return m1[0].replace('-', '');
  // 纯 ID
  const m2 = input.match(/^(ML[BAXCOU]\d+)$/i);
  if (m2) return m2[1];
  return null;
}

/**
 * 采集 ML 竞品数据
 */
export async function scrapeMLItem(itemId: string): Promise<MLScrapeResult> {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, package_specs: {}, pictures: [], attributes: [], error: '无有效 token' };
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  try {
    // 1. 获取商品基本信息
    const itemRes = await fetch(`${API}/items/${itemId}`, { headers });
    if (!itemRes.ok) {
      const errText = await itemRes.text();
      return { success: false, package_specs: {}, pictures: [], attributes: [], error: `ML API 返回 ${itemRes.status}: ${errText.slice(0, 200)}` };
    }
    const item = await itemRes.json();

    // 2. 提取包装规格
    const package_specs = {
      weight_g: item.package_weight || undefined,
      length_cm: item.package_length || undefined,
      width_cm: item.package_width || undefined,
      height_cm: item.package_height || undefined,
    };

    // 3. 提取主图
    const pictures = (item.pictures || []).map((p: any) => ({
      id: p.id,
      url: p.secure_url || p.url,
    }));

    // 4. 提取属性
    const attributes = (item.attributes || [])
      .filter((a: any) => a.id !== 'SELLER_SKU') // 去掉 SKU
      .map((a: any) => ({
        id: a.id,
        name: a.name,
        value_name: a.value_name || a.values?.[0]?.name || '',
      }));

    // 5. 获取详情描述
    let description: MLScrapeResult['description'] | undefined;
    try {
      const descRes = await fetch(`${API}/items/${itemId}/description`, { headers });
      if (descRes.ok) {
        const desc = await descRes.json();
        // 提取详情中的图片
        const descImages: string[] = [];
        const html = desc.plain_text || desc.html || '';
        const imgMatches = html.match(/https?:\/\/[^"'\s]+\.(jpg|jpeg|png|webp)[^"'\s]*/gi) || [];
        descImages.push(...imgMatches);

        description = {
          plain_text: desc.plain_text || '',
          html: desc.html || '',
          images: [...new Set(descImages)], // 去重
        };
      }
    } catch {
      // 详情获取失败不影响主流程
    }

    return {
      success: true,
      itemId: item.id,
      title: item.title,
      package_specs,
      pictures,
      attributes,
      description,
      price: item.price,
      currency: item.currency_id,
      category_id: item.category_id,
      site_id: item.site_id,
    };
  } catch (e) {
    return { success: false, package_specs: {}, pictures: [], attributes: [], error: String(e) };
  }
}

/**
 * 基于采集数据生成改写标题（避免重复铺货）
 * 策略：同义词替换 + 语序调整 + 补充卖点
 */
export function rewriteTitle(original: string, site: string = 'MLB'): string {
  if (!original) return original;

  // 同义词替换表（西语/葡语）
  const synonyms: Record<string, string[]> = {
    'Manta': ['Cobertor', 'Cobija'],
    'Ponderada': ['con Peso', 'Pesada'],
    'con Cuentas de Vidrio': ['con Microcuentas', 'de Perlas de Vidrio'],
    'Set': ['Kit', 'Conjunto'],
    'Accesorios': ['Complementos', 'Aditamentos'],
    'para': ['de', 'para uso en'],
    'Profesional': ['Premium', 'de Alta Calidad'],
    'Nuevo': ['Moderno', 'Actualizado'],
    'Kit': ['Set', 'Paquete'],
    'Accesorio': ['Complemento', 'Aditamento'],
  };

  let result = original;

  // 随机替换 1-2 个关键词
  const keys = Object.keys(synonyms);
  let replaced = 0;
  for (const key of keys) {
    if (replaced >= 2) break;
    if (result.includes(key)) {
      const syns = synonyms[key];
      const replacement = syns[Math.floor(Math.random() * syns.length)];
      result = result.replace(key, replacement);
      replaced++;
    }
  }

  // 确保不超过 ML 标题长度限制（60 字符）
  if (result.length > 60) {
    result = result.slice(0, 57) + '...';
  }

  return result;
}
