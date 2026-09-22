/**
 * 1688 供应端数据源
 * - 根据美客多热销品关键词，生成1688搜索链接
 * - 解析1688商品URL获取详细信息（通过HTML meta抽取，不需执行JS）
 * - 支持用户粘贴1688商品链接手动导入
 */

export interface SupplierProduct {
  title: string;
  priceCNY: number | null;      // 供应价（人民币）
  priceRange?: string;           // 如 "¥5.80 - ¥12.00"
  moq: string;                   // 最小起订量
  shopName: string;
  url: string;
  imageUrl?: string;
  attributes: Record<string, string>;
  source: 'alibaba_1688';
}

export interface SupplierSearchResult {
  keyword: string;
  keywordCN: string;             // 中文翻译关键词
  searchUrl: string;             // 1688搜索链接
  estimatedMatches: number;
}

// 西语 → 中文 热门品类关键词映射
const KEYWORD_MAP: Record<string, string[]> = {
  'Celulares y Telefonía': ['手机配件', '手机壳', '钢化膜', '数据线', '充电器'],
  'Computación': ['电脑配件', '键盘', '鼠标', '笔记本支架', 'USB集线器'],
  'Electrónica, Audio y Video': ['蓝牙耳机', '音箱', '数据线', '手机支架', 'LED灯'],
  'Consolas y Videojuegos': ['游戏手柄', '游戏配件', '手柄保护套', '游戏键盘'],
  'Electrodomésticos': ['小家电', '空气净化器', '迷你风扇', '加湿器', '榨汁机'],
  'Hogar, Muebles y Jardín': ['家居收纳', '厨房用品', '浴室收纳', 'LED灯泡'],
  'Belleza y Cuidado Personal': ['美妆工具', '化妆刷', '美甲', '卷发棒'],
  'Ropa y Accesorios': ['首饰', '手表', '太阳镜', '钱包'],
  'Deportes y Fitness': ['运动手环', '瑜伽用品', '健身器材', '运动水壶'],
  'Juguetes': ['益智玩具', '遥控车', '积木', '毛绒玩具'],
  'Herramientas': ['工具箱', '螺丝刀套装', '卷尺', 'LED工作灯'],
  'Mascotas': ['宠物用品', '宠物喂食器', '宠物玩具', '宠物牵引'],
  'Salud y Equipamiento Médico': ['健康产品', '按摩器', '血压计'],
  // 巴西站
  'Celulares e Telefones': ['手机配件', '手机壳', '钢化膜', '数据线'],
  'Informática': ['电脑配件', '键盘鼠标', 'USB风扇', '笔记本支架'],
  'Eletrônicos': ['蓝牙耳机', '音箱', '智能手表', '数据线'],
  'Games': ['游戏手柄', '游戏配件', '电竞外设'],
  'Eletrodomésticos': ['小家电', '迷你风扇', '加湿器', '榨汁机'],
};

/**
 * 根据美客多关键词，生成对应的1688搜索链接
 */
export function generate1688SearchLinks(mlKeyword: string, site: string): SupplierSearchResult[] {
  const cnKeywords = KEYWORD_MAP[mlKeyword] || [mlKeyword];
  return cnKeywords.map(kw => ({
    keyword: mlKeyword,
    keywordCN: kw,
    searchUrl: `https://s.1688.com/selloffer/offer_search.htm?keywords=${encodeURIComponent(kw)}`,
    estimatedMatches: 0, // 需要实际抓取才能知道
  }));
}

/**
 * 解析1688商品页面HTML（通过meta标签和结构化数据）
 * 注意：1688主要靠JS渲染，这里只尝试从HTML的meta/JSON-LD中提取基础信息
 * 对于完整数据需要浏览器扩展辅助
 */
export async function parse1688Product(url: string): Promise<SupplierProduct | null> {
  try {
    // 规范化URL
    const normalizedUrl = url.startsWith('http') ? url : `https://detail.1688.com/offer/${url}.html`;

    const res = await fetch(normalizedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return {
        title: '(无法访问，请在浏览器中打开)',
        priceCNY: null,
        moq: '未知',
        shopName: '',
        url: normalizedUrl,
        attributes: {},
        source: 'alibaba_1688',
      };
    }

    const html = await res.text();

    // 从 meta 标签提取
    const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/[-_].*$/, '').trim() || '1688商品';
    const desc = html.match(/<meta\s+name="description"\s+content="([^"]*)"/)?.[1] || '';
    const image = html.match(/<meta\s+property="og:image"\s+content="([^"]*)"/)?.[1]
             || html.match(/<meta\s+name="image"\s+content="([^"]*)"/)?.[1];

    // 尝试从页面中提取价格（JSON-LD / 内嵌脚本）
    let price: number | null = null;
    let priceRange = '';
    const priceMatch = html.match(/¥([\d.]+)\s*[-~至]\s*¥([\d.]+)/);
    const singlePriceMatch = html.match(/"(?:price|salePrice|priceRange)"\s*:\s*"?([\d.]+)/);
    if (priceMatch) {
      priceRange = `¥${priceMatch[1]} - ¥${priceMatch[2]}`;
      price = parseFloat(priceMatch[1]);
    } else if (singlePriceMatch) {
      price = parseFloat(singlePriceMatch[1]);
    }

    // 店铺名
    const shopName = html.match(/"companyName"\s*:\s*"([^"]+)"/)?.[1]
                  || html.match(/companyName=([^&"]+)/)?.[1]
                  || '';

    // MOQ
    const moqMatch = html.match(/(\d+)\s*件起订/) || html.match(/"minOrderQuantity"\s*:\s*"?(\d+)/);
    const moq = moqMatch ? `${moqMatch[1]}件起批` : '2件起批';

    return {
      title,
      priceCNY: price,
      priceRange: priceRange || (price ? `¥${price}` : ''),
      moq,
      shopName,
      url: normalizedUrl,
      imageUrl: image,
      attributes: { description: desc.slice(0, 200) },
      source: 'alibaba_1688',
    };
  } catch (e) {
    console.error('[1688] Parse error:', e);
    return null;
  }
}

/**
 * 根据美客多商品标题，生成最可能的1688中文搜索词
 * 简单启发式：保留产品核心词，去除品牌名和规格
 */
export function extractCoreKeywords(meliTitle: string): string[] {
  // 常见需要去掉的品牌/型号词
  const stopWords = /^(apple|samsung|xiaomi|huawei|iphone|galaxy|redmi|poco|motorola|lenovo|asus|acer|hp|dell|lg|sony|philips|bosch|anker|baseus)/i;
  // 分词
  const words = meliTitle.split(/[\s,/-]+/).filter(Boolean);
  // 保留长度合适且不是纯数字/纯符号的词
  const core = words.filter(w =>
    w.length >= 3 &&
    !/^\d+$/.test(w) &&
    !stopWords.test(w) &&
    !/^(para|con|de|la|el|los|las|y|o|por|con)$/i.test(w)
  );

  // 也生成几个中文常见关键词
  const genericTerms: string[] = [];
  if (/celular|smartphone|móvil|phone/i.test(meliTitle)) genericTerms.push('手机壳', '手机配件');
  if (/cable|charger|cargador|carregador/i.test(meliTitle)) genericTerms.push('数据线', '充电器');
  if (/led|lamp|luz|lâmpada/i.test(meliTitle)) genericTerms.push('LED灯');
  if (/headphone|fone|audífono|auricular/i.test(meliTitle)) genericTerms.push('蓝牙耳机');
  if (/watch|reloj|relógio/i.test(meliTitle)) genericTerms.push('智能手表', '手表表带');
  if (/case|funda|capa|cover/i.test(meliTitle)) genericTerms.push('保护套', '手机壳');

  return [...new Set([...core.slice(0, 3), ...genericTerms])];
}
