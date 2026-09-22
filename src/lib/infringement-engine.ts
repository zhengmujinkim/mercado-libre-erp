// 侵权风险检测引擎 - 6维度检测
// 维度1: 品牌商标检测  维度2: 专利风险  维度3: 版权/IP
// 维度4: 品类合规     维度5: 图片风险   维度6: 市场风险

import {
  BRAND_DATABASE,
  IP_CHARACTERS,
  IP_FRANCHISES,
  type BrandEntry,
} from './brand-database';

// ============================================================
// 类型定义
// ============================================================

export interface DimensionResult {
  name: string;
  score: number;       // 0-100，越高越危险
  details: string;
  riskLevel: '安全' | '注意' | '高危';
}

export interface InfringementResult {
  score: number;
  level: '安全' | '注意' | '高危';
  dimensions: DimensionResult[];
  suggestions: string[];
  externalLinks: {
    wipo: string;
    googlePatents: string;
    googleLens: string;
  };
}

export interface CheckInput {
  productName: string;
  category?: string;
  imageUrl?: string;
}

// ============================================================
// 工具函数：编辑距离（Levenshtein Distance）
// ============================================================

function levenshteinDistance(a: string, b: string): number {
  const la = a.length;
  const lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;

  const matrix: number[][] = Array.from({ length: la + 1 }, () => new Array(lb + 1).fill(0));
  for (let i = 0; i <= la; i++) matrix[i][0] = i;
  for (let j = 0; j <= lb; j++) matrix[0][j] = j;

  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }
  return matrix[la][lb];
}

/** 归一化编辑距离相似度 0-1 */
function similarityRatio(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a, b) / maxLen;
}

/** 判断两个字符串的编辑距离是否 <= threshold */
function isWithinEditDistance(a: string, b: string, threshold: number): boolean {
  return levenshteinDistance(a, b) <= threshold;
}

// ============================================================
// 维度1：品牌商标检测
// ============================================================

interface BrandMatch {
  brand: BrandEntry;
  matchType: 'exact' | 'contains' | 'edit_distance' | 'substring';
  matchedText: string;
  matchScore: number; // 0-100
}

function checkBrandTrademark(productName: string): DimensionResult {
  const lowerName = productName.toLowerCase();
  const matches: BrandMatch[] = [];

  for (const brandCat of BRAND_DATABASE) {
    for (const brand of brandCat.brands) {
      // 检查英文名
      const engLower = brand.englishName.toLowerCase();
      const engTokens = engLower.split(/\s+/);

      // 1. 完全匹配品牌英文名（整体）
      if (lowerName === engLower) {
        matches.push({ brand, matchType: 'exact', matchedText: brand.englishName, matchScore: 100 });
        continue;
      }

      // 2. 产品名包含品牌英文名
      if (lowerName.includes(engLower) && engLower.length >= 2) {
        matches.push({ brand, matchType: 'contains', matchedText: brand.englishName, matchScore: 85 });
        continue;
      }

      // 3. 检查别名列表
      const allAliases = [
        ...(brand.aliases || []),
      ];
      let aliasMatched = false;
      for (const alias of allAliases) {
        const aliasLower = alias.toLowerCase();
        if (lowerName.includes(aliasLower) && aliasLower.length >= 2) {
          matches.push({ brand, matchType: 'contains', matchedText: alias, matchScore: 80 });
          aliasMatched = true;
          break;
        }
      }
      if (aliasMatched) continue;

      // 4. 中文名匹配
      if (brand.name && brand.name.length >= 2) {
        const zhLower = brand.name.toLowerCase();
        if (lowerName.includes(zhLower)) {
          matches.push({ brand, matchType: 'contains', matchedText: brand.name, matchScore: 80 });
          continue;
        }
      }

      // 5. 编辑距离检测（仅对 >= 4 字符的品牌名，距离 <= 2）
      if (engLower.length >= 4) {
        // 从产品名中取与品牌名等长的子串进行比较
        for (let i = 0; i <= lowerName.length - engLower.length + 2; i++) {
          const end = Math.min(i + engLower.length + 2, lowerName.length);
          const sub = lowerName.slice(i, end);
          if (isWithinEditDistance(sub, engLower, 2) && sub !== engLower) {
            // 确保不是子串匹配（已经检查过了）
            if (!lowerName.includes(engLower)) {
              matches.push({ brand, matchType: 'edit_distance', matchedText: sub, matchScore: 60 });
              break;
            }
          }
        }
      }

      // 6. 子串匹配（品牌名单词出现在产品名中，>= 3字符）
      for (const token of engTokens) {
        if (token.length >= 3 && lowerName.includes(token) && !['inc', 'ltd', 'co', 'the', 'and', 'for'].includes(token)) {
          // 排除太常见的词
          const commonWords = ['air', 'pro', 'max', 'plus', 'mini', 'new', 'old', 'hot', 'top', 'big', 'red', 'sun'];
          if (!commonWords.includes(token)) {
            matches.push({ brand, matchType: 'substring', matchedText: token, matchScore: 40 });
            break;
          }
        }
      }
    }
  }

  // 去重（同一品牌只保留最高分匹配）
  const deduped = new Map<string, BrandMatch>();
  for (const m of matches) {
    const key = m.brand.englishName;
    const existing = deduped.get(key);
    if (!existing || m.matchScore > existing.matchScore) {
      deduped.set(key, m);
    }
  }

  const uniqueMatches = Array.from(deduped.values());
  uniqueMatches.sort((a, b) => b.matchScore - a.matchScore);

  // 计算维度分数
  let dimensionScore = 0;
  if (uniqueMatches.length === 0) {
    dimensionScore = 0;
  } else {
    const topScore = uniqueMatches[0].matchScore;
    dimensionScore = Math.min(100, topScore + (uniqueMatches.length - 1) * 5);
  }

  const riskLevel: DimensionResult['riskLevel'] =
    dimensionScore > 60 ? '高危' : dimensionScore > 30 ? '注意' : '安全';

  const details = uniqueMatches.length === 0
    ? '未检测到已知品牌商标'
    : `命中 ${uniqueMatches.length} 个品牌: ${uniqueMatches.map(m => `${m.brand.englishName}(${m.matchedText}, ${m.matchType === 'exact' ? '完全匹配' : m.matchType === 'contains' ? '包含' : m.matchType === 'edit_distance' ? '近似匹配' : '子串匹配'})`).join('; ')}`;

  return {
    name: '品牌商标',
    score: dimensionScore,
    details,
    riskLevel,
  };
}

// ============================================================
// 维度2：专利风险检测
// ============================================================

/** 高风险品类 - 容易涉及专利的产品 */
const PATENT_HIGH_RISK_CATEGORIES = [
  '电子设备', '手机配件', '电脑配件', '智能设备', '无人机',
  '机械装置', '医疗器械', '化学配方', '半导体', '传感器',
  'LED', '电池', '充电器', '电子', '数码',
];

const PATENT_MEDIUM_RISK_CATEGORIES = [
  '运动器材', '家居电器', '厨房电器', '个人护理', '汽车配件',
  '灯具', '工具', '玩具', '游戏',
];

/** 专利敏感关键词 */
const PATENT_KEYWORDS = [
  '专利', 'patent', '独家技术', '专利技术', '发明专利',
  '实用新型', '外观设计', '防X技术', 'anti-', 'anti-scratch',
  '黑科技', '原创设计', '自研', '独创', '首创',
  '磁吸', 'magnetic', '无线充电', 'wireless charging',
  '快充', 'fast charge', 'PD充电', 'QC充电',
  '降噪', 'noise cancelling', 'ANC',
  '防水', 'waterproof', 'IP68', 'IP67',
  '蓝牙', 'bluetooth', 'TWS', 'true wireless',
];

function checkPatentRisk(productName: string, category: string): DimensionResult {
  let score = 0;
  const details: string[] = [];
  const lowerName = productName.toLowerCase();
  const lowerCat = category.toLowerCase();

  // 品类风险基础分
  const isHighRiskCat = PATENT_HIGH_RISK_CATEGORIES.some(c => lowerCat.includes(c.toLowerCase()));
  const isMedRiskCat = PATENT_MEDIUM_RISK_CATEGORIES.some(c => lowerCat.includes(c.toLowerCase()));

  if (isHighRiskCat) {
    score += 30;
    details.push(`品类"${category}"属于专利高风险领域`);
  } else if (isMedRiskCat) {
    score += 15;
    details.push(`品类"${category}"属于专利中风险领域`);
  }

  // 关键词检测
  const matchedKeywords: string[] = [];
  for (const kw of PATENT_KEYWORDS) {
    if (lowerName.includes(kw.toLowerCase())) {
      matchedKeywords.push(kw);
    }
  }

  if (matchedKeywords.length > 0) {
    score += Math.min(50, matchedKeywords.length * 15);
    details.push(`产品名含专利技术关键词: ${matchedKeywords.join(', ')}`);
  }

  // 品类+关键词叠加惩罚
  if (isHighRiskCat && matchedKeywords.length >= 2) {
    score += 15;
    details.push('高风险品类 + 多个专利关键词，风险叠加');
  }

  score = Math.min(100, score);

  const riskLevel: DimensionResult['riskLevel'] =
    score > 60 ? '高危' : score > 30 ? '注意' : '安全';

  return {
    name: '专利风险',
    score,
    details: details.length > 0 ? details.join('；') : '未检测到明显专利风险信号',
    riskLevel,
  };
}

// ============================================================
// 维度3：版权/IP检测
// ============================================================

function checkCopyrightIP(productName: string): DimensionResult {
  const lowerName = productName.toLowerCase();
  const matchedCharacters: string[] = [];
  const matchedFranchises: string[] = [];

  // 检测IP角色名
  for (const char of IP_CHARACTERS) {
    const enLower = char.englishName.toLowerCase();
    const zhLower = char.name.toLowerCase();

    if (lowerName.includes(enLower) || lowerName.includes(zhLower)) {
      matchedCharacters.push(`${char.englishName}/${char.name} (${char.franchise})`);
    }
  }

  // 检测IP作品名
  for (const fr of IP_FRANCHISES) {
    const enLower = fr.englishName.toLowerCase();
    const zhLower = fr.name.toLowerCase();

    if (lowerName.includes(enLower) || lowerName.includes(zhLower)) {
      if (!matchedFranchises.some(f => f.includes(fr.englishName))) {
        matchedFranchises.push(`${fr.englishName}/${fr.name} (${fr.owner})`);
      }
    }
  }

  // 额外检查：常见的IP周边关键词
  const ipKeywords = ['手办', 'figurine', 'action figure', '公仔', '玩偶', 'plush', '毛绒',
    'cosplay', 'cos', '同人', 'fan art', '周边', 'merch'];
  const hasIpKeyword = ipKeywords.some(kw => lowerName.includes(kw));

  let score = 0;
  score += matchedCharacters.length * 25;
  score += matchedFranchises.length * 20;
  if (hasIpKeyword && (matchedCharacters.length > 0 || matchedFranchises.length > 0)) {
    score += 15; // IP关键词+名称同时出现，风险更高
  }
  score = Math.min(100, score);

  const riskLevel: DimensionResult['riskLevel'] =
    score > 60 ? '高危' : score > 30 ? '注意' : '安全';

  const details: string[] = [];
  if (matchedCharacters.length > 0) {
    details.push(`命中IP角色: ${matchedCharacters.join(', ')}`);
  }
  if (matchedFranchises.length > 0) {
    details.push(`命中IP作品: ${matchedFranchises.join(', ')}`);
  }
  if (hasIpKeyword) {
    details.push('产品名含IP周边关键词');
  }
  if (details.length === 0) {
    details.push('未检测到已知IP/版权内容');
  }

  return {
    name: '版权/IP',
    score,
    details: details.join('；'),
    riskLevel,
  };
}

// ============================================================
// 维度4：品类合规检测
// ============================================================

/** 美客多禁售/限制品类 */
const ML_RESTRICTED_CATEGORIES = [
  '武器', '弹药', '爆炸物', '管制刀具',
  '烟草', '电子烟', 'vape',
  '处方药', '药品', '药物',
  '假钞', '伪造', 'replica', 'counterfeit',
  '人体器官', '血液',
  '赌博设备', 'slot machine',
  '卫星电视解码器', '信号干扰器',
  '杀虫剂', '农药',
  '石棉', 'mercury', '汞',
];

const ML_NEEDS_CERTIFICATION = [
  { category: '电子产品', cert: 'INMETRO（巴西强制认证）', keywords: ['电子', 'electric', 'electronic', '充电器', 'charger', '电源', 'adapter', '电池', 'battery'] },
  { category: '儿童玩具', cert: 'INMETRO（巴西玩具安全认证）', keywords: ['玩具', 'toy', '儿童', 'kids', 'children', 'baby', '婴儿'] },
  { category: '医疗器械', cert: 'ANVISA（巴西卫生监督局认证）', keywords: ['医疗', 'medical', '医疗器械', '体温计', '血压计', 'mask', '口罩'] },
  { category: '食品', cert: 'ANVISA 食品注册', keywords: ['食品', 'food', '零食', '饮料', '维生素', 'supplement', '保健品'] },
  { category: '化妆品', cert: 'ANVISA 化妆品注册', keywords: ['化妆品', 'cosmetic', '护肤品', 'skincare', '面膜', '面霜', '精华'] },
];

function checkCategoryCompliance(productName: string, category: string): DimensionResult {
  const lowerName = productName.toLowerCase();
  const lowerCat = category.toLowerCase();
  let score = 0;
  const details: string[] = [];

  // 1. 禁售品类检测
  for (const restricted of ML_RESTRICTED_CATEGORIES) {
    if (lowerName.includes(restricted.toLowerCase()) || lowerCat.includes(restricted.toLowerCase())) {
      score = 100;
      details.push(`⛔ 命中美客多禁售品类: "${restricted}"`);
      break;
    }
  }

  // 2. 认证需求检测
  if (score < 100) {
    for (const certInfo of ML_NEEDS_CERTIFICATION) {
      const matched = certInfo.keywords.some(kw => lowerName.includes(kw.toLowerCase()) || lowerCat.includes(kw.toLowerCase()));
      if (matched) {
        score = Math.max(score, 45);
        details.push(`⚠️ 该品类可能需要 ${certInfo.cert}`);
      }
    }
  }

  // 3. 敏感词检测
  const sensitiveWords = ['仿品', '高仿', 'A货', '1:1', 'replica', 'fake', 'imitation',
    '复刻', '同款', '平替品牌', '大牌同款', 'original', '正品代购'];
  const matchedSensitive = sensitiveWords.filter(w => lowerName.includes(w));
  if (matchedSensitive.length > 0) {
    score = Math.max(score, 85);
    details.push(`⛔ 含敏感词: ${matchedSensitive.join(', ')}，可能被视为售假`);
  }

  score = Math.min(100, score);
  const riskLevel: DimensionResult['riskLevel'] =
    score > 60 ? '高危' : score > 30 ? '注意' : '安全';

  return {
    name: '品类合规',
    score,
    details: details.length > 0 ? details.join('；') : '品类合规性检查通过',
    riskLevel,
  };
}

// ============================================================
// 维度5：图片风险检测
// ============================================================

/** 品牌官方网站/CDN域名（如果发现图片来自这些域名，风险极高） */
const BRAND_DOMAINS = [
  'nike.com', 'adidas.com', 'apple.com', 'samsung.com', 'sony.com',
  'gucci.com', 'louisvuitton.com', 'chanel.com', 'dior.com', 'hermes.com',
  'prada.com', 'versace.com', 'armani.com', 'fendi.com', 'cartier.com',
  'tiffany.com', 'rolex.com', 'omega.com', 'pandora.com', 'swarovski.com',
  'disney.com', 'marvel.com', 'dc.com', 'starwars.com', 'harrypotter.com',
  'nintendo.com', 'playstation.com', 'xbox.com', 'lego.com', 'barbie.com',
  'amazon.com', 'ebay.com', 'walmart.com', 'target.com',
  'cdn.shopify.com', 'media-amazon.com', 'images-na.ssl-images-amazon.com',
  'i.ebayimg.com', 'img.alibaba.com', 'ae01.alicdn.com',
];

function checkImageRisk(imageUrl?: string): DimensionResult {
  if (!imageUrl || imageUrl.trim() === '') {
    return {
      name: '图片风险',
      score: 0,
      details: '未提供图片，跳过图片检测（建议手动通过 Google Lens 检查）',
      riskLevel: '安全',
    };
  }

  const lowerUrl = imageUrl.toLowerCase();
  let score = 0;
  const details: string[] = [];

  // 检查是否来自品牌官方域名
  for (const domain of BRAND_DOMAINS) {
    if (lowerUrl.includes(domain)) {
      score = Math.max(score, 75);
      details.push(`⚠️ 图片可能来自 "${domain}"，存在盗图风险`);
    }
  }

  // 检查是否是常见的图片托管（低风险）
  const safeHosts = ['alicdn.com', 'alicdn', '1688.com', 'alibaba.com', 'taobao.com',
    'jd.com', 'pinduoduo.com', 'yangkeduo.com'];
  const isFromSafeHost = safeHosts.some(h => lowerUrl.includes(h));
  if (isFromSafeHost && score === 0) {
    details.push('图片来源为国内电商平台，建议确认是否获得供应商授权');
    score = 10;
  }

  // 如果无法判断来源
  if (details.length === 0) {
    details.push('图片来源无法自动判定，建议使用 Google Lens 手动检查');
    score = 5;
  }

  score = Math.min(100, score);
  const riskLevel: DimensionResult['riskLevel'] =
    score > 60 ? '高危' : score > 30 ? '注意' : '安全';

  return {
    name: '图片风险',
    score,
    details: details.join('；'),
    riskLevel,
  };
}

// ============================================================
// 维度6：市场风险检测
// ============================================================

/** 高竞争品类（竞争激烈的品类） */
const HIGH_COMPETITION_CATEGORIES = [
  '手机壳', '手机配件', '耳机', '充电器', '数据线',
  'LED灯', '蓝牙音箱', '智能手表', '智能手环',
  '运动鞋', 'T恤', '连衣裙', '内衣',
  '手机膜', '保护膜', '屏幕保护',
];

const MEDIUM_COMPETITION_CATEGORIES = [
  '家居收纳', '厨房用品', '浴室用品', '宠物用品',
  '运动用品', '户外用品', '汽车配件',
  '美妆工具', '化妆刷', '美甲',
  '玩具', '文具', '礼品',
];

function checkMarketRisk(productName: string, category: string): DimensionResult {
  const lowerCat = category.toLowerCase();
  const lowerName = productName.toLowerCase();
  let score = 0;
  const details: string[] = [];

  // 品类竞争度
  const isHighComp = HIGH_COMPETITION_CATEGORIES.some(c => lowerCat.includes(c) || lowerName.includes(c));
  const isMedComp = MEDIUM_COMPETITION_CATEGORIES.some(c => lowerCat.includes(c) || lowerName.includes(c));

  if (isHighComp) {
    score += 35;
    details.push(`品类"${category}"竞争激烈，市场饱和度高`);
  } else if (isMedComp) {
    score += 20;
    details.push(`品类"${category}"竞争中等，有一定市场空间`);
  } else {
    details.push(`品类"${category}"竞争度较低或为利基市场`);
  }

  // 关键词风险评估
  const riskKeywords = ['同款', '平替', '便宜', '廉价', '批发', 'wholesale', 'cheap',
    'bulk', '大量', '清仓', '尾货'];
  const matchedRisk = riskKeywords.filter(kw => lowerName.includes(kw));
  if (matchedRisk.length > 0) {
    score += 15;
    details.push(`产品名含价格竞争关键词: ${matchedRisk.join(', ')}`);
  }

  score = Math.min(100, score);
  const riskLevel: DimensionResult['riskLevel'] =
    score > 60 ? '高危' : score > 30 ? '注意' : '安全';

  return {
    name: '市场风险',
    score,
    details: details.join('；'),
    riskLevel,
  };
}

// ============================================================
// 主检测函数
// ============================================================

export function checkInfringement(input: CheckInput): InfringementResult {
  const { productName, category = '', imageUrl } = input;

  // 执行6个维度的检测
  const dim1 = checkBrandTrademark(productName);
  const dim2 = checkPatentRisk(productName, category);
  const dim3 = checkCopyrightIP(productName);
  const dim4 = checkCategoryCompliance(productName, category);
  const dim5 = checkImageRisk(imageUrl);
  const dim6 = checkMarketRisk(productName, category);

  const dimensions: DimensionResult[] = [dim1, dim2, dim3, dim4, dim5, dim6];

  // 综合评分：加权平均
  // 权重: 品牌30% 版权25% 品类合规20% 专利10% 图片10% 市场5%
  const weights = [0.30, 0.10, 0.25, 0.20, 0.10, 0.05];
  const totalScore = Math.round(
    dimensions.reduce((sum, dim, i) => sum + dim.score * weights[i], 0)
  );

  // 最终风险等级
  const finalLevel: InfringementResult['level'] =
    totalScore > 60 ? '高危' : totalScore > 30 ? '注意' : '安全';

  // 任何单项高危，总评至少是注意
  const hasHighRisk = dimensions.some(d => d.riskLevel === '高危');
  const adjustedLevel: InfringementResult['level'] =
    hasHighRisk && finalLevel === '安全' ? '注意' : finalLevel;

  // 生成建议
  const suggestions = generateSuggestions(dimensions, totalScore);

  // 生成外部链接
  const encodedName = encodeURIComponent(productName);
  const externalLinks = {
    wipo: `https://www.wipo.int/branddb/en/quicksearch/results.jsp?strategy=SimpleSearch&searchField=BRAND&searchValue=${encodedName}`,
    googlePatents: `https://patents.google.com/?q=${encodedName}`,
    googleLens: imageUrl
      ? `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(imageUrl)}`
      : `https://lens.google.com/`,
  };

  return {
    score: totalScore,
    level: adjustedLevel,
    dimensions,
    suggestions,
    externalLinks,
  };
}

// ============================================================
// 建议生成
// ============================================================

function generateSuggestions(dimensions: DimensionResult[], totalScore: number): string[] {
  const suggestions: string[] = [];

  const [brand, patent, copyright, compliance, image, market] = dimensions;

  if (brand.score > 60) {
    suggestions.push('🚫 立即停止使用该品牌名称，即使是描述性使用也可能构成侵权');
    suggestions.push('💡 考虑使用通用描述词替代品牌名，如"运动鞋"代替"Nike鞋"');
  } else if (brand.score > 30) {
    suggestions.push('⚠️ 产品名可能包含品牌相关词汇，建议修改为通用描述');
  }

  if (patent.score > 60) {
    suggestions.push('🔍 建议在 Google Patents 中搜索相关专利，确认不涉及已有专利');
    suggestions.push('📋 联系供应商确认产品是否已获得相关专利授权');
  }

  if (copyright.score > 60) {
    suggestions.push('🚫 禁止使用未授权的IP角色/作品名称，这是最常见的侵权原因');
    suggestions.push('💡 如需销售IP周边，必须获得版权方正式授权');
  } else if (copyright.score > 30) {
    suggestions.push('⚠️ 产品名可能与知名IP相似，建议修改避免关联');
  }

  if (compliance.score > 60) {
    suggestions.push('⛔ 该产品可能属于美客多禁售品类，请立即下架');
    suggestions.push('📋 如确需销售，请确认已获得所有必要的认证和许可');
  } else if (compliance.score > 30) {
    suggestions.push('📋 该品类可能需要INMETRO/ANVISA认证，建议提前准备');
  }

  if (image.score > 60) {
    suggestions.push('🚫 图片可能来自品牌官方，存在盗图侵权风险，请更换为原创图片');
    suggestions.push('💡 使用 Google Lens 反向搜索确认图片来源');
  }

  if (market.score > 60) {
    suggestions.push('📊 该品类竞争激烈，建议差异化定位或寻找细分利基市场');
  }

  if (totalScore <= 30) {
    suggestions.push('✅ 整体风险较低，但建议定期复查，确保产品合规');
  }

  if (totalScore > 60) {
    suggestions.push('⚡ 综合风险较高，强烈建议在上架前完成所有风险项的排查');
  }

  return suggestions;
}

// ============================================================
// 批量检测
// ============================================================

export function checkMultiple(inputs: CheckInput[]): InfringementResult[] {
  return inputs.map(checkInfringement);
}
