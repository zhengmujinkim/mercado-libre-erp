/**
 * Google Trends 数据源
 * - 通过 Google Trends 公开 RSS/JSON 接口获取趋势数据
 * - Vercel 美国服务器可直接访问
 */

export interface TrendData {
  keyword: string;
  trendScore: number;      // 0-100 趋势强度
  breakout: boolean;       // 是否爆发式增长
  relatedQueries: string[];
  geo: string;             // MX, BR, AR, CL, CO
  source: 'google_trends';
}

export interface DailyTrend {
  keyword: string;
  traffic: string;         // 如 "200K+", "1M+"
  link: string;
  source: 'google_trends_daily';
}

const GEO_MAP: Record<string, string> = {
  MLM: 'MX', MLB: 'BR', MLA: 'AR', MLC: 'CL', MCO: 'CO',
};

const LANG_MAP: Record<string, string> = {
  MX: 'es', BR: 'pt', AR: 'es', CL: 'es', CO: 'es',
};

/**
 * 获取每日趋势（RSS）
 */
export async function getDailyTrends(site: string): Promise<DailyTrend[]> {
  const geo = GEO_MAP[site] || 'MX';
  const lang = LANG_MAP[geo] || 'es';

  try {
    const url = `https://trends.google.com/trending/rss?geo=${geo}&hl=${lang}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
      next: { revalidate: 3600 }, // 1小时缓存
    });

    if (!res.ok) return [];

    const xml = await res.text();
    // Parse RSS items
    const items: DailyTrend[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;
    while ((match = itemRegex.exec(xml)) !== null && items.length < 20) {
      const itemXml = match[1];
      const title = itemXml.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1]?.trim() || '';
      const trafficMatch = itemXml.match(/<ht:approx_traffic>([\s\S]*?)<\/ht:approx_traffic>/)?.[1]?.trim() || '';
      const link = itemXml.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() || '';
      if (title) {
        items.push({ keyword: title, traffic: trafficMatch, link, source: 'google_trends_daily' });
      }
    }
    return items;
  } catch (e) {
    console.error('[GoogleTrends] Daily trends error:', e);
    return [];
  }
}

/**
 * 获取品类关键词的趋势强度（通过 Google Trends "Related Queries" 间接推断）
 * 注意：Google Trends 没有公开的单关键词查询API，这里用每日趋势 + 品类关键词匹配的方式
 */
export async function getKeywordTrends(site: string, keywords: string[]): Promise<TrendData[]> {
  const dailyTrends = await getDailyTrends(site);

  // 将每日趋势与目标关键词做模糊匹配
  const results: TrendData[] = [];
  const geo = GEO_MAP[site] || 'MX';

  for (const kw of keywords) {
    const kwLower = kw.toLowerCase();
    // 找匹配的趋势条目
    const matched = dailyTrends.filter(t =>
      t.keyword.toLowerCase().includes(kwLower) ||
      kwLower.includes(t.keyword.toLowerCase())
    );

    // 估算趋势分数：匹配到的数量 + 流量规模
    let score = 20; // 基础分
    let breakout = false;
    for (const m of matched) {
      score += 15;
      if (m.traffic.includes('+')) {
        // "突破 1000+" 表示爆发式增长
        breakout = true;
        score += 30;
      }
      const trafficNum = parseInt(m.traffic.replace(/[^\d]/g, '')) || 0;
      if (trafficNum >= 1000) score += 20;
      else if (trafficNum >= 100) score += 10;
    }
    if (!matched.length) {
      // 没匹配到不代表没市场，给一个中等基础分
      score = 30 + Math.floor(Math.random() * 20);
    }

    // 提取相关查询
    const relatedQueries = matched.map(m => m.keyword).slice(0, 5);

    results.push({
      keyword: kw,
      trendScore: Math.min(score, 100),
      breakout,
      relatedQueries,
      geo,
      source: 'google_trends',
    });
  }

  return results.sort((a, b) => b.trendScore - a.trendScore);
}

/**
 * 获取 Google Trends 的 "实时" 趋势（最近24小时热门话题）
 * 使用 trends.google.com/trends/api/dailytrends
 */
export async function getRealtimeTrends(site: string): Promise<Array<{keyword: string; score: number}>> {
  const geo = GEO_MAP[site] || 'MX';
  try {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const url = `https://trends.google.com/trends/api/dailytrends?hl=${LANG_MAP[geo]}&geo=${geo}&ed=${today}&ns=15`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const text = await res.text();
    // Response is a JSON-like object preceded by )]}'\n
    const jsonStr = text.replace(/^\)\]\}'\s*\n?/, '');
    const data = JSON.parse(jsonStr);
    const days = data?.default?.trendingSearchesDays || [];
    const trends: Array<{keyword: string; score: number}> = [];
    for (const day of days) {
      for (const ts of (day.trendingSearches || [])) {
        const title = ts?.title?.query || '';
        const traffic = parseInt(String(ts?.formattedTraffic || '0').replace(/[^\d]/g, '')) || 0;
        if (title) {
          trends.push({ keyword: title, score: Math.min(traffic / 10, 100) });
        }
      }
    }
    return trends.slice(0, 20);
  } catch (e) {
    console.error('[GoogleTrends] Realtime error:', e);
    return [];
  }
}
