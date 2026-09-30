/**
 * 从 1688 商品页面提取包装规格（重量、尺寸）
 *
 * 提取优先级：
 *   1. 页面内嵌 JSON 数据（__INITIAL_DATA__ / offerData / detailData）
 *   2. HTML 中"包装"、"重量"、"尺寸"相关文本段落
 *   3. SKU/属性表格中的重量和尺寸字段
 *
 * 返回格式（单位统一）：
 *   weight_g: 克
 *   length_cm / width_cm / height_cm: 厘米
 */

export interface PackageSpecs {
  weight_g?: number;
  length_cm?: number;
  width_cm?: number;
  height_cm?: number;
  source?: 'json' | 'html_text' | 'table' | 'manual' | null;
  confidence?: 'high' | 'medium' | 'low';
}

/** 从 1688 offer URL 提取 offerId */
export function parseOfferId(url: string): string | null {
  if (!url) return null;
  const m = url.match(/offer\/(\d+)/);
  if (m) return m[1];
  const m2 = url.match(/(\d{11,})/);
  return m2 ? m2[1] : null;
}

/** 判断是否为 1688 单品详情页 */
export function isOfferUrl(url: string): boolean {
  return /detail\.1688\.com\/offer\/\d+/.test(url || '');
}

/** 判断是否为 Alibaba 国际站链接 */
export function isAlibabaUrl(url: string): boolean {
  return /alibaba\.com|aliexpress\.com|chinese\.alibaba\.com/.test(url || '');
}

/* ------------------------------------------------------------------ */
/* 1. 从 HTML 文本中提取规格                                            */
/* ------------------------------------------------------------------ */

/** 解析中文重量描述 → 克 */
function parseWeight(text: string): number | null {
  // "7kg" / "7千克" / "7公斤" / "7000g" / "7000克"
  const patterns = [
    /(\d+\.?\d*)\s*kg/i,
    /(\d+\.?\d*)\s*千克/,
    /(\d+\.?\d*)\s*公斤/,
    /(\d+\.?\d*)\s*g\b/i,
    /(\d+\.?\d*)\s*克/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const val = parseFloat(m[1]);
      if (p.source.includes('kg') || p.source.includes('千克') || p.source.includes('公斤')) {
        return Math.round(val * 1000);
      }
      return Math.round(val);
    }
  }
  return null;
}

/** 解析中文尺寸描述 → 厘米 */
function parseDimension(text: string): number | null {
  // "30cm" / "30厘米" / "30公分" / "0.3m"
  const patterns = [
    /(\d+\.?\d*)\s*cm/i,
    /(\d+\.?\d*)\s*厘米/,
    /(\d+\.?\d*)\s*公分/,
    /(\d+\.?\d*)\s*m\b/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const val = parseFloat(m[1]);
      if (p.source.includes('m\b') && !p.source.includes('cm')) {
        return Math.round(val * 100);
      }
      return Math.round(val);
    }
  }
  return null;
}

/** 从一段文本中尝试提取长×宽×高 */
function parseDimensions(text: string): { length?: number; width?: number; height?: number } | null {
  // "150×200×5cm" / "150*200*5" / "150x200x5厘米"
  const patterns = [
    /(\d+\.?\d*)\s*[×x*X]\s*(\d+\.?\d*)\s*[×x*X]\s*(\d+\.?\d*)/,
    /(\d+\.?\d*)\s*[-—]\s*(\d+\.?\d*)\s*[-—]\s*(\d+\.?\d*)/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const vals = [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])];
      // 判断单位
      const isMeter = /m\b/i.test(text) && !/cm/i.test(text);
      const factor = isMeter ? 100 : 1;
      return {
        length: Math.round(vals[0] * factor),
        width: Math.round(vals[1] * factor),
        height: Math.round(vals[2] * factor),
      };
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* 2. 从 HTML 中提取                                                    */
/* ------------------------------------------------------------------ */

/**
 * 从 1688 商品页 HTML 提取包装规格
 */
export function extractSpecsFromHtml(html: string): PackageSpecs {
  const result: PackageSpecs = { source: 'html_text', confidence: 'low' };

  // 尝试从 JSON 数据块提取
  const jsonResult = extractFromJson(html);
  if (jsonResult) {
    return { ...jsonResult, source: 'json', confidence: 'high' };
  }

  // 尝试从表格提取
  const tableResult = extractFromTable(html);
  if (tableResult) {
    return { ...tableResult, source: 'table', confidence: 'medium' };
  }

  // 全文本搜索
  const fullText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

  // 搜索重量
  const weightPatterns = [
    /包装.*?重量.*?(\d+\.?\d*\s*(?:kg|千克|公斤|g|克))/i,
    /毛重.*?(\d+\.?\d*\s*(?:kg|千克|公斤|g|克))/i,
    /净重.*?(\d+\.?\d*\s*(?:kg|千克|公斤|g|克))/i,
    /重量.*?(\d+\.?\d*\s*(?:kg|千克|公斤|g|克))/i,
  ];
  for (const p of weightPatterns) {
    const m = fullText.match(p);
    if (m) {
      const w = parseWeight(m[1]);
      if (w) { result.weight_g = w; break; }
    }
  }

  // 搜索尺寸
  const dimPatterns = [
    /包装.*?(?:尺寸|规格|大小).*?(\d+\.?\d*\s*[×x*X]\s*\d+\.?\d*\s*[×x*X]\s*\d+\.?\d*)/i,
    /(?:尺寸|规格).*?(\d+\.?\d*\s*[×x*X]\s*\d+\.?\d*\s*[×x*X]\s*\d+\.?\d*)/i,
    /(\d+\.?\d*\s*[×x*X]\s*\d+\.?\d*\s*[×x*X]\s*\d+\.?\d*\s*(?:cm|厘米|公分))/i,
  ];
  for (const p of dimPatterns) {
    const m = fullText.match(p);
    if (m) {
      const dims = parseDimensions(m[1]);
      if (dims) {
        result.length_cm = dims.length;
        result.width_cm = dims.width;
        result.height_cm = dims.height;
        break;
      }
    }
  }

  // 如果只找到一个尺寸（如 "150×200cm"），作为长×宽
  if (!result.length_cm) {
    const simpleDim = fullText.match(/(\d+\.?\d*)\s*[×x*X]\s*(\d+\.?\d*)\s*(?:cm|厘米|公分)?/i);
    if (simpleDim) {
      result.length_cm = Math.round(parseFloat(simpleDim[1]));
      result.width_cm = Math.round(parseFloat(simpleDim[2]));
    }
  }

  const hasData = result.weight_g || result.length_cm;
  if (!hasData) return { source: null, confidence: 'low' };

  result.confidence = (result.weight_g && result.length_cm) ? 'medium' : 'low';
  return result;
}

/** 从页面内嵌 JSON 提取 */
function extractFromJson(html: string): PackageSpecs | null {
  // 尝试匹配 __INITIAL_DATA__ 或 offerData
  const patterns = [
    /__INITIAL_DATA__\s*=\s*({[^;]+})/,
    /offerData\s*=\s*({[^;]+})/,
    /detailData\s*=\s*({[^;]+})/,
    /"offerDetail":\s*({[^}]+})/,
  ];

  for (const p of patterns) {
    const m = html.match(p);
    if (!m) continue;
    try {
      const data = JSON.parse(m[1]);
      const specs = flattenAndSearch(data, ['weight', 'package', 'dimension', 'size', '包装', '重量', '尺寸']);
      if (specs.weight_g || specs.length_cm) {
        return { ...specs, source: 'json', confidence: 'high' };
      }
    } catch {
      continue;
    }
  }
  return null;
}

/** 递归搜索 JSON 对象中的关键词 */
function flattenAndSearch(obj: any, keywords: string[], depth = 0): PackageSpecs {
  if (depth > 5 || !obj) return {};
  const result: PackageSpecs = {};

  if (typeof obj === 'string') {
    const w = parseWeight(obj);
    if (w) result.weight_g = w;
    const dims = parseDimensions(obj);
    if (dims) {
      result.length_cm = dims.length;
      result.width_cm = dims.width;
      result.height_cm = dims.height;
    }
    return result;
  }

  if (Array.isArray(obj)) {
    for (const item of obj.slice(0, 50)) {
      const sub = flattenAndSearch(item, keywords, depth + 1);
      if (sub.weight_g && !result.weight_g) result.weight_g = sub.weight_g;
      if (sub.length_cm && !result.length_cm) result.length_cm = sub.length_cm;
    }
    return result;
  }

  if (typeof obj === 'object') {
    for (const [key, val] of Object.entries(obj)) {
      const keyLower = key.toLowerCase();
      const isRelevant = keywords.some(k => keyLower.includes(k.toLowerCase()));
      if (isRelevant && typeof val === 'string') {
        const w = parseWeight(val);
        if (w && !result.weight_g) result.weight_g = w;
        const dims = parseDimensions(val);
        if (dims && !result.length_cm) {
          result.length_cm = dims.length;
          result.width_cm = dims.width;
          result.height_cm = dims.height;
        }
      }
      if (typeof val === 'object' && val !== null) {
        const sub = flattenAndSearch(val, keywords, depth + 1);
        if (sub.weight_g && !result.weight_g) result.weight_g = sub.weight_g;
        if (sub.length_cm && !result.length_cm) result.length_cm = sub.length_cm;
      }
    }
  }
  return result;
}

/** 从 HTML 表格提取 */
function extractFromTable(html: string): PackageSpecs | null {
  const result: PackageSpecs = {};
  // 简单提取 <td> 或 <th> 中包含重量/尺寸的文本
  const cellPattern = /<(?:td|th)[^>]*>([^<]*(?:重量|尺寸|包装|规格|长|宽|高|kg|g|cm)[^<]*)<\/(?:td|th)>/gi;
  let match;
  while ((match = cellPattern.exec(html)) !== null) {
    const text = match[1];
    const w = parseWeight(text);
    if (w && !result.weight_g) result.weight_g = w;
    const dims = parseDimensions(text);
    if (dims && !result.length_cm) {
      result.length_cm = dims.length;
      result.width_cm = dims.width;
      result.height_cm = dims.height;
    }
  }
  return (result.weight_g || result.length_cm) ? { ...result, source: 'table', confidence: 'medium' } : null;
}

/* ------------------------------------------------------------------ */
/* 3. 远程抓取                                                          */
/* ------------------------------------------------------------------ */

/**
 * 从 URL 抓取页面并提取规格
 * 注意：1688 需要登录态，服务器端直接 fetch 可能拿不到完整内容
 */
export async function fetchSpecsFromUrl(url: string): Promise<PackageSpecs> {
  if (!url) return { source: null, confidence: 'low' };

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      redirect: 'follow',
    });

    if (!res.ok) {
      return { source: null, confidence: 'low' };
    }

    const html = await res.text();
    return extractSpecsFromHtml(html);
  } catch {
    return { source: null, confidence: 'low' };
  }
}

/* ------------------------------------------------------------------ */
/* 4. 合并逻辑：优先使用已存数据，缺的再抓取                              */
/* ------------------------------------------------------------------ */

export interface SpecInput {
  /** 已在 data.json 中存的包装规格 */
  stored?: PackageSpecs;
  /** 1688 offer URL */
  offerUrl?: string;
  /** 用户手动输入的规格 */
  manual?: PackageSpecs;
}

/**
 * 合并包装规格：manual > stored > fetched
 */
export async function resolveSpecs(input: SpecInput): Promise<PackageSpecs> {
  // 手动输入最高优先级
  if (input.manual?.weight_g || input.manual?.length_cm) {
    return { ...input.manual, source: 'manual', confidence: 'high' };
  }

  // 已有存储数据
  if (input.stored?.weight_g || input.stored?.length_cm) {
    return { ...input.stored, source: input.stored.source || 'stored', confidence: 'medium' };
  }

  // 尝试从 URL 抓取
  if (input.offerUrl) {
    const fetched = await fetchSpecsFromUrl(input.offerUrl);
    if (fetched.source) return fetched;
  }

  return { source: null, confidence: 'low' };
}
