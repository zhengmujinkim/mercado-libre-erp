'use client';

import { useEffect, useState, useCallback } from 'react';
import { scoreProducts } from '@/lib/scorer';

// ========== Interfaces ==========
interface TrendItem { keyword: string; traffic: string; link?: string; source?: string; }
interface RealtimeItem { keyword: string; score: number; }
interface Recommendation {
  rank: number;
  keyword: string;
  trendScore: number;
  trendLevel: string;
  supplierLinks: Array<{ keyword: string; keywordCN: string; searchUrl: string }>;
  marketUrl: string;
}
interface ExtensionProduct {
  id: string; title: string; price: number | null; currency: string;
  soldCount: number | string; rating: number | null; seller: string;
  url: string; imageUrl: string; source: 'meli' | '1688'; site?: string;
}

interface HotRankingItem {
  id: string;
  title: string;
  titleCN: string;
  price: number;
  currency: string;
  soldQuantity: number;
  thumbnail: string;
  permalink: string;
  rating: number;
  site: string;
}
interface HotTrend {
  keyword: string;
  keywordCN: string;
  searchCount: number;
  items: HotRankingItem[];
}

// ========== Constants ==========
const SITE_OPTIONS = [
  { id: 'MLM', name: '墨西哥', domain: 'mercadolibre.com.mx' },
  { id: 'MLB', name: '巴西', domain: 'mercadolivre.com.br' },
  { id: 'MLA', name: '阿根廷', domain: 'mercadolibre.com.ar' },
  { id: 'MLC', name: '智利', domain: 'mercadolibre.cl' },
  { id: 'MCO', name: '哥伦比亚', domain: 'mercadolibre.com.co' },
];

// ========== Component ==========
export default function HotRankingPage() {
  const [site, setSite] = useState('MLM');
  const [tab, setTab] = useState<'recommend' | 'hot' | 'extension'>('recommend');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [dailyTrends, setDailyTrends] = useState<TrendItem[]>([]);
  const [realtimeTrends, setRealtimeTrends] = useState<RealtimeItem[]>([]);
  const [googleTrendsError, setGoogleTrendsError] = useState('');

  const [hotTrends, setHotTrends] = useState<HotTrend[]>([]);
  const [hotAllItems, setHotAllItems] = useState<HotRankingItem[]>([]);
  const [hotLoading, setHotLoading] = useState(false);
  const [hotMsg, setHotMsg] = useState('');
  const [hotWebsiteUrl, setHotWebsiteUrl] = useState('');
  const [expandedKeywords, setExpandedKeywords] = useState<Set<string>>(new Set());

  const [extensionProducts, setExtensionProducts] = useState<ExtensionProduct[]>([]);

  // ── Load recommendations & Google Trends ──
  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/smart-sourcing?mode=auto&site=' + site);
      const data = await res.json();
      setRecommendations(data.recommendations || []);
      setDailyTrends(data.googleTrends?.daily || []);
      setRealtimeTrends(data.googleTrends?.realtime || []);
      if (!data.recommendations?.length && data.googleTrends?.daily?.length === 0) {
        setGoogleTrendsError('Google Trends 暂时不可用，仅展示品类候选');
      } else {
        setGoogleTrendsError('');
      }
      if (data.message) setErrorMsg(data.message);
    } catch (e) {
      setErrorMsg('加载失败：' + String(e));
    } finally {
      setLoading(false);
    }
  }, [site]);

  // ── Load hot ranking (ML trends) ──
  const loadHotRanking = useCallback(async () => {
    setHotLoading(true);
    setHotMsg('');
    try {
      const res = await fetch('/api/hot-ranking?site=' + site);
      const data = await res.json();
      setHotTrends(data.trends || []);
      setHotAllItems(data.items || []);
      if (data.message) setHotMsg(data.message);
      else setHotMsg('');
      if (data.websiteUrl) setHotWebsiteUrl(data.websiteUrl);
      else setHotWebsiteUrl('');
    } catch (e) {
      setHotMsg('加载失败：' + String(e));
    } finally {
      setHotLoading(false);
    }
  }, [site]);

  // ── Load extension data ──
  const loadExtensionData = useCallback(async () => {
    try {
      const res = await fetch('/api/browser-extension?site=' + site + '&limit=50');
      const data = await res.json();
      setExtensionProducts(data.products || []);
    } catch { /* ignore */ }
  }, [site]);

  useEffect(() => {
    loadRecommendations();
    loadHotRanking();
    loadExtensionData();
  }, [loadRecommendations, loadHotRanking, loadExtensionData]);

  // ── Score extension products ──
  const scoredProducts = extensionProducts
    .filter(p => p.price && p.source === 'meli')
    .map(p => ({
      name: p.title,
      site: (p.site || site) as 'MLM' | 'MLB' | 'MLA' | 'MLC' | 'MCO',
      sellingPriceUSD: p.price!,
      topMonthlySales: typeof p.soldCount === 'number' ? p.soldCount : 0,
    }))
    .filter(p => p.name);

  const scored = scoredProducts.length > 0
    ? scoreProducts(scoredProducts).sort((a, b) => b.total - a.total).slice(0, 20)
    : [];

  const selectedSite = SITE_OPTIONS.find(s => s.id === site)!;

  // ── Toggle keyword expansion ──
  const toggleExpand = (kw: string) => {
    setExpandedKeywords(prev => {
      const next = new Set(prev);
      if (next.has(kw)) next.delete(kw);
      else next.add(kw);
      return next;
    });
  };

  // ── Format price ──
  const fmtPrice = (price: number, currency: string) => {
    return currency + ' ' + price.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">智能选品</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            美客多平台实时热搜 · 中文翻译 · 真实销量数据
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={site}
            onChange={(e) => setSite(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
          >
            {SITE_OPTIONS.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <button
            onClick={() => { loadRecommendations(); loadHotRanking(); }}
            disabled={loading || hotLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium"
          >
            {(loading || hotLoading) ? '加载中...' : '🔄 刷新'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        <TabButton active={tab === 'recommend'} onClick={() => setTab('recommend')}>
          🎯 自动选品推荐
        </TabButton>
        <TabButton active={tab === 'hot'} onClick={() => setTab('hot')}>
          🔥 美客多热搜
          {hotTrends.length > 0 && (
            <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">
              {hotTrends.length}
            </span>
          )}
        </TabButton>
        <TabButton active={tab === 'extension'} onClick={() => setTab('extension')}>
          🧩 扩展采集
          {extensionProducts.length > 0 && (
            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
              {extensionProducts.length}
            </span>
          )}
        </TabButton>
      </div>

      {/* ==================== Tab: 自动选品推荐 ==================== */}
      {tab === 'recommend' && (
        <div className="space-y-4">
          {errorMsg && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 text-sm text-yellow-700 dark:text-yellow-300">
              {errorMsg}
            </div>
          )}

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              基于 <b>美客多热搜数据</b>、<b>Google Trends 实时热度</b> 和 <b>1688 供应链</b> 综合评估的选品建议。
              点击"1688找货源"可直接跳转到 1688 寻找国内供应商。
            </p>

            {recommendations.length === 0 ? (
              <p className="text-center text-gray-400 py-8">暂无推荐数据</p>
            ) : (
              <div className="space-y-3">
                {recommendations.map((rec) => (
                  <div key={rec.keyword} className="border border-gray-100 dark:border-gray-800 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-400 w-6">#{rec.rank}</span>
                        <span className="font-medium text-gray-900 dark:text-white">{rec.keyword}</span>
                        <span className="text-sm">{rec.trendLevel}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">趋势分 {rec.trendScore}</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                        <div
                          className={'h-1.5 rounded-full ' + (
                            rec.trendScore >= 70 ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                            rec.trendScore >= 50 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                            'bg-blue-500'
                          )}
                          style={{ width: rec.trendScore + '%' }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <a
                        href={rec.marketUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded hover:bg-blue-100"
                      >
                        🔍 美客多查看
                      </a>
                      {rec.supplierLinks.map((s, i) => (
                        <a
                          key={i}
                          href={s.searchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 text-xs bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 rounded hover:bg-orange-100"
                        >
                          {'🏭 1688找' + s.keywordCN}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== Tab: 美客多热搜 ==================== */}
      {tab === 'hot' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  🔥 {selectedSite.name} · 美客多实时热搜
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  美客多热搜数据 + 1688供应链 · 数据来自美客多官方 API
                </p>
              </div>
              <span className="text-xs text-gray-400">
                共 {hotTrends.length} 个热搜词 · {hotAllItems.length} 件商品
              </span>
            </div>

            {hotMsg && !hotMsg.includes('暂时获取失败') && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-sm text-yellow-700 dark:text-yellow-300 mb-4">
                ⚠️ {hotMsg}
              </div>
            )}

            {hotMsg && hotMsg.includes('暂时获取失败') && hotWebsiteUrl && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-300 mb-4">
                💡 {'可以直接访问美客多查看热销品：'}
                <a href={hotWebsiteUrl} target="_blank" rel="noopener noreferrer" className="underline ml-1">
                  {hotWebsiteUrl} →
                </a>
              </div>
            )}

            {hotLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin text-3xl mb-2">🔄</div>
                <p className="text-gray-500 text-sm">正在获取美客多实时热搜数据...</p>
              </div>
            ) : hotTrends.length === 0 ? (
              <p className="text-gray-400 text-center py-8">暂无热搜数据</p>
            ) : (
              <div className="space-y-4">
                {hotTrends.map((trend, idx) => {
                  const isExpanded = expandedKeywords.has(trend.keyword);
                  const visibleItems = isExpanded ? trend.items : trend.items.slice(0, 2);
                  const hasMore = trend.items.length > 2;

                  return (
                    <div key={trend.keyword + '-' + idx} className="border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden">
                      {/* Keyword header */}
                      <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={
                              'text-lg font-bold w-8 h-8 flex items-center justify-center rounded-full ' +
                              (idx < 3 ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300')
                            }>
                              {idx + 1}
                            </span>
                            <div>
                              <span className="font-medium text-gray-900 dark:text-white text-base">
                                {trend.keyword}
                              </span>
                              <span className="mx-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                                {trend.keywordCN}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {trend.searchCount > 0 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                搜索量 {trend.searchCount.toLocaleString()}
                              </span>
                            )}
                            <div className="flex gap-1">
                              <a
                                href={'https://www.' + selectedSite.domain + '/search?q=' + encodeURIComponent(trend.keyword)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 text-xs bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 rounded hover:bg-blue-100"
                              >
                                🔍 美客多
                              </a>
                              <a
                                href={'https://s.1688.com/selloffer/offer_search.htm?keywords=' + encodeURIComponent(trend.keywordCN)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 text-xs bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300 rounded hover:bg-orange-100"
                              >
                                🏭 1688找{trend.keywordCN}
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Product items */}
                      {visibleItems.length > 0 && (
                        <div className="p-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {visibleItems.map((item) => (
                              <a
                                key={item.id}
                                href={item.permalink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                              >
                                {item.thumbnail && (
                                  <img
                                    src={item.thumbnail}
                                    alt={item.title}
                                    className="w-16 h-16 rounded object-cover flex-shrink-0 bg-gray-100"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-900 dark:text-white truncate font-medium">
                                    {item.title}
                                  </p>
                                  <p className="text-xs text-emerald-600 dark:text-emerald-400 truncate mt-0.5">
                                    {item.titleCN}
                                  </p>
                                  <div className="flex items-center gap-3 mt-1.5">
                                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                      {fmtPrice(item.price, item.currency)}
                                    </span>
                                    {item.soldQuantity > 0 && (
                                      <span className="text-xs text-gray-500">
                                        已售 {item.soldQuantity.toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </a>
                            ))}
                          </div>
                          {hasMore && (
                            <button
                              onClick={() => toggleExpand(trend.keyword)}
                              className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {isExpanded
                                ? '▲ 收起'
                                : '▼ 查看更多 ' + (trend.items.length - 2) + ' 件商品'}
                            </button>
                          )}
                        </div>
                      )}

                      {visibleItems.length === 0 && (
                        <div className="px-4 py-3 text-sm text-gray-400">
                          暂无匹配商品
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info footer */}
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 text-sm text-orange-700 dark:text-orange-300">
            💡 数据来源：美客多官方 API（api.mercadolibre.com），所有关键词和标题均已翻译为中文。热搜词反映买家真实搜索行为，可用于选品和市场趋势分析。
          </div>
        </div>
      )}

      {/* ==================== Tab: 扩展采集 ==================== */}
      {tab === 'extension' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">🧩 浏览器扩展采集</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {'在 Chrome 安装扩展后，浏览美客多或 1688 时点击页面右下角蓝色按钮，即可把商品数据推送到 ERP 进行评分。'}
              <a href="/extension-guide" className="text-blue-600 ml-1">安装指南 →</a>
            </p>

            {extensionProducts.length === 0 ? (
              <p className="text-gray-400 text-center py-8 text-sm">暂无采集数据，使用扩展抓取商品后会自动显示在这里</p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  共采集 <b>{extensionProducts.length}</b> 条商品数据
                </p>
                {scored.length > 0 && (
                  <>
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm mt-4 mb-2">
                      🏆 自动评分排行（基于你采集的商品）
                    </h4>
                    <div className="space-y-2">
                      {scored.map((r, i) => (
                        <div key={r.name} className="flex items-center gap-3 p-2 rounded border border-gray-100 dark:border-gray-800">
                          <span className="text-lg font-bold text-gray-400 w-6">#{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 dark:text-white truncate">{r.name}</p>
                            <p className="text-xs text-gray-500">{r.gradeLabel} · 总分 {r.total}</p>
                          </div>
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            {r.site}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <h4 className="font-medium text-gray-900 dark:text-white text-sm mt-4 mb-2">
                  📋 原始采集列表
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {extensionProducts.map((p, i) => (
                    <div key={i} className="border border-gray-100 dark:border-gray-800 rounded-lg p-3 flex gap-3">
                      {p.imageUrl && <img src={p.imageUrl} alt="" className="w-16 h-16 rounded object-cover flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white truncate">{p.title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {p.currency + ' ' + (p.price ?? '—') + ' · 销量 ' + (p.soldCount || 0)}
                        </p>
                        <p className="text-xs text-gray-400">来源：{p.source === 'meli' ? '美客多' : '1688'}</p>
                        <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                          查看原页面 →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ========== Tab Button ==========
function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={'px-4 py-2 text-sm font-medium border-b-2 transition ' + (
        active
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
      )}
    >
      {children}
    </button>
  );
}
