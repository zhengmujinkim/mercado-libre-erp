"use client";

import { useState, useCallback } from 'react';

// ============================================================
// 类型定义
// ============================================================

interface DimensionResult {
  name: string;
  score: number;
  details: string;
  riskLevel: '安全' | '注意' | '高危';
}

interface InfringementResult {
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

interface HistoryItem {
  id: string;
  productName: string;
  category: string;
  result: InfringementResult;
  checkedAt: string;
}

// ============================================================
// 维度图标映射
// ============================================================

const DIM_ICONS: Record<string, string> = {
  '品牌商标': '🏷️',
  '专利风险': '🔬',
  '版权/IP': '🎭',
  '品类合规': '📋',
  '图片风险': '🖼️',
  '市场风险': '📊',
};

const DIM_WEIGHTS: Record<string, string> = {
  '品牌商标': '30%',
  '专利风险': '10%',
  '版权/IP': '25%',
  '品类合规': '20%',
  '图片风险': '10%',
  '市场风险': '5%',
};

const RISK_COLORS = {
  '安全': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', bar: 'bg-green-500', border: 'border-green-200 dark:border-green-800' },
  '注意': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', bar: 'bg-yellow-500', border: 'border-yellow-200 dark:border-yellow-800' },
  '高危': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', bar: 'bg-red-500', border: 'border-red-200 dark:border-red-800' },
};

const SCORE_COLORS = (score: number) =>
  score > 60 ? 'text-red-600 dark:text-red-400' :
  score > 30 ? 'text-yellow-600 dark:text-yellow-400' :
  'text-green-600 dark:text-green-400';

// ============================================================
// 主组件
// ============================================================

export default function InfringementPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 输入状态
  const [inputMode, setInputMode] = useState<'single' | 'batch'>('single');
  const [singleName, setSingleName] = useState('');
  const [singleCategory, setSingleCategory] = useState('');
  const [singleImageUrl, setSingleImageUrl] = useState('');
  const [batchText, setBatchText] = useState('');
  const [error, setError] = useState('');

  // 统计
  const safeCount = history.filter(h => h.result.level === '安全').length;
  const warnCount = history.filter(h => h.result.level === '注意').length;
  const dangerCount = history.filter(h => h.result.level === '高危').length;
  const avgScore = history.length > 0
    ? Math.round(history.reduce((a, b) => a + b.result.score, 0) / history.length)
    : 0;

  // 检测函数
  const doCheck = useCallback(async (productName: string, category?: string, imageUrl?: string) => {
    const res = await fetch('/api/infringement-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productName,
        category: category || '',
        imageUrl: imageUrl || '',
      }),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `HTTP ${res.status}`);
    }
    return res.json() as Promise<InfringementResult>;
  }, []);

  const doBatchCheck = useCallback(async (items: Array<{ productName: string; category?: string }>) => {
    const res = await fetch('/api/infringement-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        products: items.map(i => ({
          productName: i.productName,
          category: i.category || '',
          imageUrl: '',
        })),
      }),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.results as InfringementResult[];
  }, []);

  // 单个检测
  const handleSingleCheck = async () => {
    if (!singleName.trim()) return;
    setLoading(true);
    setError('');
    try {
      const result = await doCheck(singleName.trim(), singleCategory.trim(), singleImageUrl.trim());
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        productName: singleName.trim(),
        category: singleCategory.trim() || '未分类',
        result,
        checkedAt: new Date().toLocaleString('zh-CN'),
      };
      setHistory(prev => [newItem, ...prev]);
      setExpandedId(newItem.id);
      setSingleName('');
      setSingleImageUrl('');
    } catch (e) {
      setError(`检测失败: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  // 批量检测
  const handleBatchCheck = async () => {
    const lines = batchText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return;

    const items = lines.map(line => {
      const parts = line.split(/[,，|]/).map(p => p.trim());
      return {
        productName: parts[0] || '',
        category: parts[1] || '',
      };
    }).filter(i => i.productName.length > 0);

    if (items.length === 0) return;

    setLoading(true);
    setError('');
    try {
      const results = await doBatchCheck(items);
      const newItems: HistoryItem[] = items.map((item, idx) => ({
        id: `${Date.now()}-${idx}`,
        productName: item.productName,
        category: item.category || '未分类',
        result: results[idx],
        checkedAt: new Date().toLocaleString('zh-CN'),
      }));
      setHistory(prev => [...newItems.reverse(), ...prev]);
      if (newItems.length > 0) setExpandedId(newItems[newItems.length - 1].id);
      setBatchText('');
    } catch (e) {
      setError(`批量检测失败: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    setExpandedId(null);
  };

  // ============================================================
  // 渲染
  // ============================================================

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">侵权风险检测</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          6维度智能检测引擎 · 300+品牌库模糊匹配 · WIPO/Google Patents/Google Lens 外部数据库链接
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
          <div className="text-2xl font-bold">{history.length}</div>
          <div className="text-xs text-gray-500">检测商品</div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-green-200 dark:border-green-800 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{safeCount}</div>
          <div className="text-xs text-gray-500">安全</div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-yellow-200 dark:border-yellow-800 p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{warnCount}</div>
          <div className="text-xs text-gray-500">注意</div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-red-200 dark:border-red-800 p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{dangerCount}</div>
          <div className="text-xs text-gray-500">高危</div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
          <div className={`text-2xl font-bold ${SCORE_COLORS(avgScore)}`}>{avgScore}</div>
          <div className="text-xs text-gray-500">平均风险分</div>
        </div>
      </div>

      {/* 输入区域 */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">快速检测</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setInputMode('single')}
              className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                inputMode === 'single'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              单个检测
            </button>
            <button
              onClick={() => setInputMode('batch')}
              className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                inputMode === 'batch'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              批量检测
            </button>
          </div>
        </div>

        {inputMode === 'single' ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={singleName}
                onChange={e => setSingleName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSingleCheck()}
                placeholder="输入商品名称，如: Nike Air Max 运动鞋"
                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
              />
              <button
                onClick={handleSingleCheck}
                disabled={loading || !singleName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {loading ? '检测中...' : '检测'}
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={singleCategory}
                onChange={e => setSingleCategory(e.target.value)}
                placeholder="品类（可选），如: 运动鞋"
                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
              />
              <input
                type="text"
                value={singleImageUrl}
                onChange={e => setSingleImageUrl(e.target.value)}
                placeholder="图片URL（可选）"
                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              value={batchText}
              onChange={e => setBatchText(e.target.value)}
              placeholder={"批量输入商品名称，每行一个，可选品类用逗号分隔：\nNike Air Max 运动鞋, 运动鞋\n硅胶手机壳 通用款, 手机配件\nSpider-Man 手办, 玩具/手办"}
              rows={5}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm font-mono"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {batchText.split('\n').filter(l => l.trim()).length} 个商品
              </span>
              <button
                onClick={handleBatchCheck}
                disabled={loading || batchText.trim().length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '检测中...' : '批量检测'}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* 检测结果列表 */}
      {history.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">检测结果 ({history.length})</h2>
            <button
              onClick={clearHistory}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              清空记录
            </button>
          </div>

          <div className="space-y-3">
            {history.map(item => (
              <div
                key={item.id}
                className={`border rounded-xl overflow-hidden transition-all ${RISK_COLORS[item.result.level].border}`}
              >
                {/* 摘要行 */}
                <button
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  {/* 风险分数圆环 */}
                  <div className="relative w-12 h-12 flex-shrink-0">
                    <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-200 dark:text-gray-700" />
                      <circle
                        cx="18" cy="18" r="15.9" fill="none"
                        strokeWidth="2.5"
                        strokeDasharray={`${item.result.score} 100`}
                        strokeLinecap="round"
                        className={item.result.score > 60 ? 'text-red-500' : item.result.score > 30 ? 'text-yellow-500' : 'text-green-500'}
                        stroke="currentColor"
                      />
                    </svg>
                    <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${SCORE_COLORS(item.result.score)}`}>
                      {item.result.score}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white truncate">{item.productName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${RISK_COLORS[item.result.level].bg} ${RISK_COLORS[item.result.level].text}`}>
                        {item.result.level}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{item.category}</span>
                      <span>·</span>
                      <span>{item.checkedAt}</span>
                      <span>·</span>
                      <span>
                        {item.result.dimensions.filter(d => d.riskLevel !== '安全').map(d => d.name).join('、') || '全部安全'}
                      </span>
                    </div>
                  </div>

                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${expandedId === item.id ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* 展开的详情 */}
                {expandedId === item.id && (
                  <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800">
                    {/* 6维度详细 */}
                    <div className="mt-4 space-y-3">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">6维度检测结果</h3>
                      {item.result.dimensions.map((dim, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border ${RISK_COLORS[dim.riskLevel].border} ${RISK_COLORS[dim.riskLevel].bg}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span>{DIM_ICONS[dim.name] || '📌'}</span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{dim.name}</span>
                              <span className="text-xs text-gray-500">权重 {DIM_WEIGHTS[dim.name] || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${RISK_COLORS[dim.riskLevel].bar}`}
                                  style={{ width: `${dim.score}%` }}
                                />
                              </div>
                              <span className={`text-xs font-bold ${SCORE_COLORS(dim.score)}`}>{dim.score}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded ${RISK_COLORS[dim.riskLevel].bg} ${RISK_COLORS[dim.riskLevel].text}`}>
                                {dim.riskLevel}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{dim.details}</p>
                        </div>
                      ))}
                    </div>

                    {/* 建议 */}
                    {item.result.suggestions.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">💡 建议</h3>
                        <div className="space-y-1.5">
                          {item.result.suggestions.map((sug, idx) => (
                            <p key={idx} className="text-xs text-gray-600 dark:text-gray-400">{sug}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 外部链接 */}
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">🔗 外部数据库查询</h3>
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={item.result.externalLinks.wipo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                        >
                          <span>🌐</span> WIPO 商标数据库
                        </a>
                        <a
                          href={item.result.externalLinks.googlePatents}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-xs hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                        >
                          <span>🔍</span> Google Patents
                        </a>
                        <a
                          href={item.result.externalLinks.googleLens}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg text-xs hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                        >
                          <span>📷</span> Google Lens 图片查重
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 空状态 */}
      {history.length === 0 && !loading && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">输入商品名称开始侵权风险检测</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">
            支持品牌商标 · 专利风险 · 版权IP · 品类合规 · 图片风险 · 市场风险 6个维度检测
          </p>
        </div>
      )}

      {/* Loading 状态 */}
      {loading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-600 dark:text-gray-400">正在进行6维度侵权检测...</p>
          </div>
        </div>
      )}
    </div>
  );
}
