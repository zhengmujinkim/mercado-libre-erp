'use client';

import { useEffect, useState, useCallback } from 'react';

interface SiteStatus {
  site_id: string;
  item_id?: string;
  status: 'pending' | 'listing' | 'listed' | 'failed';
}

interface SelectionItem {
  id: string;
  rank: number;
  name: string;
  category: 'beauty' | 'electronics' | 'pets';
  categoryLabel: string;
  categoryId: string;
  price1688: number;
  totalCost: number;
  sellUSD: number;
  netProfit: number;
  margin: number;
  competitors: number;
  score: number;
  verdict: 'hot' | 'go' | 'watch' | 'skip';
  note: string;
  status: 'pending' | 'approved' | 'listing' | 'listed' | 'rejected';
  supplier_url?: string;
  supplier_name?: string;
  supplier_price?: number;
  monthly_sales?: string;
  sites?: SiteStatus[];
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  listed: number;
  avgMargin: number;
  minCost: number;
  maxProfit: number;
}

const verdictConfig: Record<string, { label: string; color: string; bg: string }> = {
  hot: { label: '强烈推荐', color: 'text-red-400', bg: 'bg-red-500/10' },
  go: { label: '推荐上架', color: 'text-green-400', bg: 'bg-green-500/10' },
  watch: { label: '可观察', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  skip: { label: '谨慎', color: 'text-gray-400', bg: 'bg-gray-500/10' },
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '待审核', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  approved: { label: '已批准', color: 'text-green-400', bg: 'bg-green-500/10' },
  listing: { label: '上架中', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  listed: { label: '已上架', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  rejected: { label: '已拒绝', color: 'text-red-400', bg: 'bg-red-500/10' },
};

const catConfig: Record<string, { label: string; color: string; bg: string }> = {
  beauty: { label: '美妆个护', color: 'text-pink-400', bg: 'bg-pink-500/10' },
  electronics: { label: '电脑配件', color: 'text-sky-400', bg: 'bg-sky-500/10' },
  pets: { label: '宠物用品', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
};

const siteLabels: Record<string, { flag: string; name: string }> = {
  MLB: { flag: '🇧🇷', name: '巴西' },
  MLM: { flag: '🇲🇽', name: '墨西哥' },
  MLA: { flag: '🇦🇷', name: '阿根廷' },
  MLC: { flag: '🇨🇱', name: '智利' },
  MCO: { flag: '🇨🇴', name: '哥伦比亚' },
  MLU: { flag: '🇺🇾', name: '乌拉圭' },
};

export default function SelectionPoolPage() {
  const [items, setItems] = useState<SelectionItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/selection-pool');
      const data = await res.json();
      setItems(data.items);
      setStats(data.stats);
    } catch (e) {
      console.error('Failed to fetch selection pool:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredItems = items.filter(item => {
    if (filter !== 'all' && filter !== 'hot' && filter !== 'pending' && filter !== 'approved' && filter !== 'listed') {
      if (item.category !== filter) return false;
    }
    if (filter === 'hot' && item.verdict !== 'hot') return false;
    if (filter === 'pending' && item.status !== 'pending') return false;
    if (filter === 'approved' && item.status !== 'approved') return false;
    if (filter === 'listed' && item.status !== 'listed') return false;
    if (statusFilter && item.status !== statusFilter) return false;
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const ids = filteredItems.filter(i => i.status === 'pending' || i.status === 'approved').map(i => i.id);
    setSelected(prev => {
      if (prev.size === ids.length && ids.every(id => prev.has(id))) {
        return new Set();
      }
      return new Set(ids);
    });
  };

  const handleBatchAction = async (action: string) => {
    if (selected.size === 0) return;
    setProcessing(true);
    try {
      const status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'pending';
      await fetch('/api/selection-pool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', ids: Array.from(selected), status }),
      });
      setSelected(new Set());
      await fetchData();
    } catch (e) {
      console.error('Batch action failed:', e);
    } finally {
      setProcessing(false);
    }
  };

  const handleListSelected = async () => {
    if (selected.size === 0) return;
    setProcessing(true);
    const selectedItems = items.filter(i => selected.has(i.id));
    
    for (const item of selectedItems) {
      await fetch('/api/selection-pool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', ids: [item.id], status: 'listing' }),
      });
      
      // TODO: Call auto_listing codeact script for real 6-site listing
      await new Promise(r => setTimeout(r, 500));
      
      await fetch('/api/selection-pool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', ids: [item.id], status: 'listed' }),
      });
    }
    
    setSelected(new Set());
    await fetchData();
    setProcessing(false);
  };

  const getListedSites = (item: SelectionItem) => {
    if (!item.sites) return [];
    return item.sites.filter(s => s.status === 'listed');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">加载选品池数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">待审选品池</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            采购成本 = 1688价格 + ¥6邮费 · 平台佣金16% · 汇率 1USD = 7.2CNY · 6站点同步上架
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              await fetch('/api/selection-pool', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reset' }),
              });
              await fetchData();
            }}
            className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            重置数据
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="text-xs text-gray-500 mb-1">待审核</div>
            <div className="text-2xl font-bold text-blue-500 font-mono">{stats.pending}</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="text-xs text-gray-500 mb-1">已上架</div>
            <div className="text-2xl font-bold text-emerald-500 font-mono">{stats.listed}</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="text-xs text-gray-500 mb-1">平均利润率</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white font-mono">{stats.avgMargin.toFixed(1)}%</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="text-xs text-gray-500 mb-1">最高净利</div>
            <div className="text-2xl font-bold text-yellow-500 font-mono">¥{stats.maxProfit.toFixed(0)}</div>
          </div>
        </div>
      )}

      {/* Filter + Batch Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {[
            { key: 'all', label: `全部 ${items.length}` },
            { key: 'beauty', label: '美妆个护' },
            { key: 'electronics', label: '电脑配件' },
            { key: 'pets', label: '宠物用品' },
            { key: 'hot', label: '⭐ 强烈推荐' },
            { key: 'pending', label: '待审核' },
            { key: 'approved', label: '已批准' },
            { key: 'listed', label: '已上架' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setSelected(new Set()); }}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                filter === f.key
                  ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-blue-400 hover:text-blue-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {selected.size > 0 && (
          <div className="flex gap-2 ml-auto">
            <span className="text-xs text-gray-500 self-center">已选 {selected.size} 项</span>
            <button
              onClick={() => handleBatchAction('approve')}
              disabled={processing}
              className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 transition-colors"
            >
              批量批准
            </button>
            <button
              onClick={handleListSelected}
              disabled={processing}
              className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors"
            >
              {processing ? '上架中...' : '🚀 批量6站上架'}
            </button>
            <button
              onClick={() => handleBatchAction('reject')}
              disabled={processing}
              className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 transition-colors"
            >
              批量拒绝
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                <th className="px-3 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={filteredItems.length > 0 && filteredItems.filter(i => i.status === 'pending' || i.status === 'approved').every(i => selected.has(i.id))}
                    onChange={selectAll}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">产品</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">1688货源</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">采购成本</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">售价</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">净利润</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">利润率</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">评分</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">上架站点</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredItems.map(item => {
                const v = verdictConfig[item.verdict];
                const s = statusConfig[item.status];
                const c = catConfig[item.category];
                const marginColor = item.margin >= 55 ? 'text-green-400' : item.margin >= 45 ? 'text-yellow-400' : 'text-gray-400';
                const scoreColor = item.score >= 85 ? 'from-green-400 to-cyan-400' : item.score >= 75 ? 'from-yellow-400 to-amber-500' : 'from-gray-400 to-gray-500';
                const listedSites = getListedSites(item);

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-blue-50/30 dark:hover:bg-blue-900/5 transition-colors ${selected.has(item.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                  >
                    <td className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={selected.has(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`font-mono font-bold text-sm ${item.rank <= 3 ? 'text-yellow-500' : 'text-gray-400'}`}>
                        {item.rank}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">{item.name}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${c.bg} ${c.color}`}>{c.label}</span>
                        <span className="text-xs text-gray-500 font-mono">{item.categoryId}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      {item.supplier_url ? (
                        <a
                          href={item.supplier_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-orange-500 hover:text-orange-400 hover:underline"
                          title={item.supplier_name || '1688货源'}
                        >
                          <span className="block font-medium">{item.supplier_name || '1688'}</span>
                          {item.monthly_sales && (
                            <span className="block text-gray-500 mt-0.5">月销 {item.monthly_sales}</span>
                          )}
                        </a>
                      ) : (
                        <span className="text-xs text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="font-mono text-gray-500">¥{item.price1688.toFixed(2)}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">+¥6 → ¥{item.totalCost.toFixed(2)}</div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-blue-400 font-semibold">${item.sellUSD.toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-green-400 font-semibold">¥{item.netProfit.toFixed(0)}</td>
                    <td className={`px-3 py-2.5 text-right font-mono font-bold ${marginColor}`}>{item.margin.toFixed(1)}%</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2 min-w-[70px]">
                        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full bg-gradient-to-r ${scoreColor}`} style={{ width: `${item.score}%` }} />
                        </div>
                        <span className="font-mono font-bold text-sm text-gray-900 dark:text-white">{item.score}</span>
                      </div>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full mt-0.5 inline-block ${v.bg} ${v.color}`}>{v.label}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(siteLabels).map(([siteId, info]) => {
                          const site = item.sites?.find(s => s.site_id === siteId);
                          const isListed = site?.status === 'listed';
                          const isListing = site?.status === 'listing';
                          return (
                            <span
                              key={siteId}
                              className={`text-xs px-1 py-0.5 rounded ${
                                isListed
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : isListing
                                  ? 'bg-purple-500/20 text-purple-400'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                              }`}
                              title={isListed && site?.item_id ? `${info.name}: ${site.item_id}` : info.name}
                            >
                              {info.flag}
                              {isListed && site?.item_id && (
                                <span className="ml-0.5 text-[10px]">{site.item_id.slice(-4)}</span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                      {listedSites.length > 0 && (
                        <div className="text-xs text-emerald-400 mt-1">{listedSites.length}/6 站已上架</div>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>{s.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" />强烈推荐：蓝海+高利润</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400" />推荐上架：利润可观</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400" />可观察：需差异化</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-400" />谨慎：红海/高门槛</span>
        <span className="ml-auto">站点图标：🇧🇷巴西 🇲🇽墨西哥 🇦🇷阿根廷 🇨🇱智利 🇨🇴哥伦比亚 🇺🇾乌拉圭</span>
      </div>
    </div>
  );
}
