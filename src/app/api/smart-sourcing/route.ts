/**
 * 多数据源融合选品 API
 * 整合：美客多（自有商品/订单）、Google Trends（市场趋势）、1688（供应链）
 * 支持：
 *   GET ?mode=auto&site=MLM     → 自动推荐候选品（融合三源数据）
 *   GET ?mode=trends&site=MLM   → 仅 Google Trends 趋势
 *   GET ?mode=supplier&q=手机壳  → 1688 供应端查询
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDailyTrends, getRealtimeTrends } from '@/lib/sources/google-trends';
import { generate1688SearchLinks, parse1688Product } from '@/lib/sources/alibaba-1688';
import { MELI_CONFIG } from '@/lib/config';
import { getAccessToken } from '@/lib/token-store';

const SITE_CONFIG: Record<string, { name: string; domain: string }> = {
  MLM: { name: '墨西哥', domain: 'mercadolibre.com.mx' },
  MLB: { name: '巴西', domain: 'mercadolivre.com.br' },
  MLA: { name: '阿根廷', domain: 'mercadolibre.com.ar' },
  MLC: { name: '智利', domain: 'mercadolibre.cl' },
  MCO: { name: '哥伦比亚', domain: 'mercadolibre.com.co' },
};

// 品类→关键词映射（覆盖 Google Trends 和 1688 用）
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  '手机配件': ['Celulares y Telefonía', 'fundas de celular', 'cable usb', 'cargador'],
  '电脑配件': ['Computación', 'teclado', 'mouse', 'soporte laptop'],
  '电子数码': ['Electrónica', 'auriculares bluetooth', 'bocina bluetooth', 'smartwatch'],
  '游戏周边': ['Consolas y Videojuegos', 'control xbox', 'funda switch', 'gaming keyboard'],
  '家电小件': ['Electrodomésticos', 'ventilador portátil', 'humidificador', 'licuadora'],
  '家居收纳': ['Hogar', 'organizador', 'caja organizadora', 'soporte cocina'],
  '美妆个护': ['Belleza', 'brochas maquillaje', 'esponja belleza', 'limas de uñas'],
  '服饰配件': ['Ropa', 'collar', 'reloj mujer', 'lentes de sol', 'billetera'],
  '运动健身': ['Deportes', 'pulsera deportiva', 'esterilla yoga', 'botella deportiva'],
  '玩具模型': ['Juguetes', 'juguete educativo', 'carro control remoto', 'bloques'],
  '工具五金': ['Herramientas', 'juego de destornilladores', 'linterna LED', 'cinta métrica'],
  '宠物用品': ['Mascotas', 'comedor automático', 'juguete para perro', 'collar gato'],
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'auto';
  const site = searchParams.get('site') || 'MLM';
  const query = searchParams.get('q') || '';

  try {
    if (mode === 'trends') {
      return handleTrends(site);
    }
    if (mode === 'supplier') {
      return handleSupplier(query, site);
    }
    if (mode === 'supplier_detail') {
      const url = searchParams.get('url') || '';
      return handleSupplierDetail(url);
    }
    if (mode === 'auto') {
      return handleAutoSourcing(site);
    }
    return NextResponse.json({ error: '未知 mode' }, { status: 400 });
  } catch (e) {
    console.error('Smart sourcing error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// ===== 模式 1：纯 Google Trends =====
async function handleTrends(site: string) {
  const [daily, realtime] = await Promise.all([
    getDailyTrends(site),
    getRealtimeTrends(site),
  ]);
  return NextResponse.json({
    daily,
    realtime,
    site,
    source: 'google_trends',
  });
}

// ===== 模式 2：1688 供应端 =====
async function handleSupplier(keyword: string, site: string) {
  if (!keyword) {
    return NextResponse.json({ results: [], message: '请输入关键词' });
  }
  // 用英文/西语关键词查找对应中文搜索词
  const links = generate1688SearchLinks(keyword, site);
  // 如果没有匹配到中文映射，直接用关键词本身
  if (links.length === 0) {
    links.push({
      keyword,
      keywordCN: keyword,
      searchUrl: `https://s.1688.com/selloffer/offer_search.htm?keywords=${encodeURIComponent(keyword)}`,
      estimatedMatches: 0,
    });
  }
  return NextResponse.json({ results: links, source: 'alibaba_1688' });
}

async function handleSupplierDetail(url: string) {
  if (!url) {
    return NextResponse.json({ error: '请提供1688商品URL' }, { status: 400 });
  }
  const product = await parse1688Product(url);
  if (!product) {
    return NextResponse.json({ error: '解析失败，请手动查看' }, { status: 500 });
  }
  return NextResponse.json({ product });
}

// ===== 模式 3：全自动选品推荐（融合三源）=====
async function handleAutoSourcing(site: string) {
  const config = SITE_CONFIG[site] || SITE_CONFIG['MLM'];

  // 1) 收集 Google Trends 数据
  const [dailyTrends, realtimeTrends] = await Promise.all([
    getDailyTrends(site),
    getRealtimeTrends(site),
  ]);

  // 2) 构建候选商品列表（品类维度）
  const candidates: Array<{
    keyword: string;
    trendScore: number;
    supplierLinks: Array<{ keyword: string; keywordCN: string; searchUrl: string }>;
    marketUrl: string;
  }> = [];

  // 遍历品类
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    // 在 Google Trends 中寻找相关趋势
    const relatedTrends: Array<{score?: number; traffic?: string}> = [
      ...dailyTrends.filter(t =>
        keywords.some(k => t.keyword.toLowerCase().includes(k.toLowerCase().slice(0, 8)))
      ).map(t => ({ traffic: t.traffic })),
      ...realtimeTrends.filter(t =>
        keywords.some(k => t.keyword.toLowerCase().includes(k.toLowerCase().slice(0, 8)))
      ).map(t => ({ score: t.score })),
    ];

    // 计算该品类的趋势分数
    const maxTrendScore = relatedTrends.length > 0
      ? Math.max(...relatedTrends.map(t => t.score ?? (t.traffic ? 60 : 0)))
      : 30; // 基础分

    // 生成 1688 采购搜索链接
    const supplierLinks = generate1688SearchLinks(keywords[0], site);

    // 美客多站内搜索链接
    const marketUrl = `https://www.${config.domain}/${keywords[0].toLowerCase().replace(/\s+/g, '-')}`;

    candidates.push({
      keyword: category,
      trendScore: Math.min(maxTrendScore + 20, 100),
      supplierLinks: supplierLinks.slice(0, 3),
      marketUrl: `https://www.${config.domain}/search?category=${encodeURIComponent(keywords[0])}`,
    });
  }

  // 3) 加入 Google Trends 中与电商相关的热门话题（过滤非商品词）
  const NON_SHOPPING = /noticias|clima|tiempo|weather|vs\b|partido|resultado|marcador|liga|copa|mundial|horoscopo|efemerides|traduccion|significado|traductor|elecciones|presidente|gobierno|politica|festival|concierto|serie\b|pelicula|netflix|disney|tiktok|youtube|terremoto|huracan|temperatura|lluvia/i;

  const allTrendKeywords: Array<{keyword: string; score?: number; traffic?: string}> = [
    ...dailyTrends.slice(0, 15).map(t => ({ keyword: t.keyword, traffic: t.traffic })),
    ...realtimeTrends.slice(0, 15).map(t => ({ keyword: t.keyword, score: t.score })),
  ];
  for (const t of allTrendKeywords) {
    const kw = t.keyword;
    // 过滤非电商关键词
    if (NON_SHOPPING.test(kw)) continue;
    // 必须包含至少一个产品相关信号词
    const productSignals = /celular|phone|laptop|computer|pc|tablet|audifono|auricular|headphone|earbud|bocina|speaker|parlante|smartwatch|watch|camara|camera|tv|televisor|monitor|teclado|keyboard|mouse|cargador|charger|cable|usb|funda|case|zapatilla|shoe|tenis|sneaker|vestido|dress|camisa|shirt|pantalon|pants|mochila|backpack|bolso|bag|reloj|collar|necklace|arete|earring|perfume|maquillaje|makeup|crema|shampoo|juguete|toy|muñeca|doll|bicicleta|bike|patineta|scooter|herramienta|tool|taladro|drill|linterna|flashlight|mueble|furniture|silla|chair|mesa|table|cama|bed|lampara|lamp|ventilador|fan|aspiradora|vacuum|licuadora|blender|cafetera|coffee|microondas|microwave|refrigerador|fridge|lavadora|washer|perro|dog|gato|cat|mascota|pet|collar|correa|perr|gat|vitamina|vitamin|suplemento|supplement|proteina|protein|colageno|collagen|termometro|oximetro|mascarilla|mask|gel|alcohol|rueda|llanta|tire|aceite|oil|filtro|filter|casco|helmet|guitarra|guitar|piano|violin|trompeta|ukulele|maleta|suitcase|libreta|notebook|cuaderno|lapiz|pencil|boligrafo|pen|tijera|scissors|pegamento|glue|cinta|tape|carpa|tent|saco|sleeping|parrilla|grill|pesca|fishing|piscina|pool|yoga|fitness|gimnasio|gym|pesa|dumbbell|raqueta|racket|pelota|ball|balon|skate|surf|snow/i;
    if (!productSignals.test(kw)) continue;

    const alreadyCovered = candidates.some(c =>
      c.keyword.toLowerCase().includes(kw.toLowerCase().slice(0, 6)) ||
      kw.toLowerCase().includes(c.keyword.toLowerCase().slice(0, 6))
    );
    if (!alreadyCovered && candidates.length < 20) {
      const supplierLinks = generate1688SearchLinks(kw, site);
      candidates.push({
        keyword: kw,
        trendScore: (t.score !== undefined || t.traffic) ? 60 : 30,
        supplierLinks: supplierLinks.slice(0, 3),
        marketUrl: `https://www.${config.domain}/search?q=${encodeURIComponent(kw)}`,
      });
    }
  }

  // 4) 尝试获取自有商品数据作为参考
  let userItems: any[] = [];
  try {
    const token = await getAccessToken();
    if (token) {
      const res = await fetch(
        `${MELI_CONFIG.apiBase}/users/${MELI_CONFIG.userId}/items/search?search_type=scan&status=active&limit=10`,
        { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 60 } }
      );
      if (res.ok) {
        const data = await res.json();
        userItems = data.results || [];
      }
    }
  } catch {}

  // 5) 按趋势分数排序，取 TOP 15
  candidates.sort((a, b) => b.trendScore - a.trendScore);
  const topCandidates = candidates.slice(0, 15);

  return NextResponse.json({
    site,
    siteName: config.name,
    recommendations: topCandidates.map((c, i) => ({
      rank: i + 1,
      keyword: c.keyword,
      trendScore: c.trendScore,
      trendLevel: c.trendScore >= 70 ? '🔥 高热度' : c.trendScore >= 50 ? '📈 中等热度' : '⚪ 常规',
      supplierLinks: c.supplierLinks,
      marketUrl: c.marketUrl,
    })),
    googleTrends: {
      daily: dailyTrends.slice(0, 10),
      realtime: realtimeTrends.slice(0, 10),
    },
    myStoreItems: userItems.slice(0, 5),
    generatedAt: new Date().toISOString(),
    source: 'multi_source',
  });
}
