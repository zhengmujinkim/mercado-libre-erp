'use client';

import { useEffect, useState } from 'react';

interface AuthStatus {
  hasToken: boolean;
  isValid: boolean;
  expiresAt: string | null;
  expiresIn: number;
  userId: string | null;
  authUrl: string;
  error?: string;
}

interface InventoryItem {
  id: string;
  name: string;
  available_quantity: number;
  sold_quantity: number;
  price: number;
  currency_id: string;
  status: string;
  site_id: string;
  permalink: string;
  thumbnail: string;
  category_id: string;
}

interface OrderData {
  orders: Array<{
    id: string;
    orderId: string;
    buyer: string;
    product: string;
    amount: number;
    currency: string;
    status: string;
    shipping: string;
    date: string;
    site: string;
  }>;
  total: number;
  message?: string;
}

export default function DashboardPage() {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [invMsg, setInvMsg] = useState('');
  const [ordMsg, setOrdMsg] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/status').then(r => r.json()),
      fetch('/api/inventory').then(r => r.json()),
      fetch('/api/orders').then(r => r.json()),
    ]).then(([auth, inv, ord]) => {
      setAuthStatus(auth);
      if (!auth.hasToken || !auth.isValid) setShowAuth(true);
      if (auth.error) setShowAuth(true);
      setInventory(inv.inventory || []);
      setInvMsg(inv.message || '');
      setOrders(ord);
      setOrdMsg(ord.message || '');

      const params = new URLSearchParams(window.location.search);
      if (params.get('auth') === 'success') {
        setShowAuth(false);
        window.history.replaceState({}, '', '/');
      }
    }).catch(() => {
      setShowAuth(true);
    }).finally(() => setLoading(false));
  }, []);

  const formatExpiry = (seconds: number) => {
    if (seconds > 86400) return `${Math.floor(seconds / 86400)}天${Math.floor((seconds % 86400) / 3600)}小时`;
    if (seconds > 3600) return `${Math.floor(seconds / 3600)}小时${Math.floor((seconds % 3600) / 60)}分钟`;
    return `${Math.floor(seconds / 60)}分钟`;
  };

  // 计算真实指标
  const totalProducts = inventory.length;
  const activeCount = inventory.filter(i => i.status === 'active').length;
  const totalStock = inventory.reduce((sum, i) => sum + (i.available_quantity || 0), 0);
  const totalSold = inventory.reduce((sum, i) => sum + (i.sold_quantity || 0), 0);
  const totalOrderCount = orders?.total || 0;
  const totalOrderValue = (orders?.orders || []).reduce((sum, o) => sum + (o.amount || 0), 0);

  // 商品状态分布
  const statusDist: Record<string, number> = {};
  inventory.forEach(i => {
    const s = i.status || 'unknown';
    statusDist[s] = (statusDist[s] || 0) + 1;
  });
  const statusEntries = Object.entries(statusDist).sort((a, b) => b[1] - a[1]);

  // 站点分布
  const siteDist: Record<string, number> = {};
  inventory.forEach(i => {
    const s = i.site_id || 'N/A';
    siteDist[s] = (siteDist[s] || 0) + 1;
  });
  const siteEntries = Object.entries(siteDist).sort((a, b) => b[1] - a[1]);
  const siteLabels: Record<string, string> = {
    MLM: '墨西哥', MLB: '巴西', MLA: '阿根廷', MLC: '智利', MCO: '哥伦比亚',
  };

  // 销量排行 TOP 8
  const topBySold = [...inventory]
    .sort((a, b) => (b.sold_quantity || 0) - (a.sold_quantity || 0))
    .slice(0, 8);

  const maxStatusCount = statusEntries.length > 0 ? statusEntries[0][1] : 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">正在加载店铺数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showAuth && authStatus && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-yellow-800 dark:text-yellow-200 font-semibold flex items-center gap-2">
                ⚠️ 需要授权
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                {authStatus.hasToken
                  ? 'Token 已过期，请重新授权以刷新令牌'
                  : '尚未连接美客多账号，请先完成OAuth授权'}
              </p>
            </div>
            <a href={authStatus.authUrl} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
              🔗 立即授权
            </a>
          </div>
        </div>
      )}

      {!showAuth && authStatus?.isValid && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-green-500 text-lg">✅</span>
              <span className="text-green-800 dark:text-green-200 font-medium">已连接美客多 CBT</span>
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">
              User: {authStatus.userId} · Token 有效期: {formatExpiry(authStatus.expiresIn)}
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">数据看板</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">实时店铺数据概览</p>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="在售商品" value={String(activeCount)} subtitle={`共 ${totalProducts} 个商品`} icon="📦" />
        <StatCard title="总销量" value={String(totalSold)} subtitle="累计已售出件数" icon="🛒" />
        <StatCard title="库存总量" value={String(totalStock)} subtitle="当前可售库存" icon="📊" />
        <StatCard title="订单总数" value={String(totalOrderCount)} subtitle="最近订单" icon="📋" />
      </div>

      {/* 消息提示 */}
      {(invMsg || ordMsg) && !showAuth && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-sm text-blue-700 dark:text-blue-300">
          {invMsg && <p>📦 {invMsg}</p>}
          {ordMsg && <p className="mt-1">📋 {ordMsg}</p>}
        </div>
      )}

      {/* 分布图 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 站点分布 */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-base font-semibold mb-4 text-gray-900 dark:text-white">站点分布</h3>
          {siteEntries.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">暂无商品数据</p>
          ) : (
            <div className="space-y-3">
              {siteEntries.map(([site, count]) => {
                const pct = (count / totalProducts) * 100;
                return (
                  <div key={site} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-24">
                      {siteLabels[site] || site}
                    </span>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm text-gray-500 w-8">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 商品状态分布 */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-base font-semibold mb-4 text-gray-900 dark:text-white">商品状态</h3>
          {statusEntries.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">暂无商品数据</p>
          ) : (
            <div className="space-y-3">
              {statusEntries.map(([status, count]) => {
                const pct = (count / maxStatusCount) * 100;
                const label: Record<string, string> = {
                  active: '在售', paused: '已暂停', closed: '已关闭', under_review: '审核中',
                };
                const color: Record<string, string> = {
                  active: 'bg-green-500', paused: 'bg-yellow-500', closed: 'bg-red-500', under_review: 'bg-blue-500',
                };
                return (
                  <div key={status} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-20">
                      {label[status] || status}
                    </span>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                      <div className={`${color[status] || 'bg-gray-500'} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm text-gray-500 w-8">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 销量排行 */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-base font-semibold mb-4 text-gray-900 dark:text-white">销量排行 TOP {topBySold.length}</h3>
        {topBySold.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">暂无在售商品，销量排行将在上架商品后自动生成</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left py-2 text-gray-500">排名</th>
                  <th className="text-left py-2 text-gray-500">商品</th>
                  <th className="text-right py-2 text-gray-500">价格</th>
                  <th className="text-right py-2 text-gray-500">已售</th>
                  <th className="text-right py-2 text-gray-500">库存</th>
                  <th className="text-right py-2 text-gray-500">状态</th>
                </tr>
              </thead>
              <tbody>
                {topBySold.map((item, i) => (
                  <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-2.5 text-gray-500">
                      {i < 3 ? <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-100 text-gray-700' : 'bg-orange-100 text-orange-700'}`}>{i + 1}</span> : i + 1}
                    </td>
                    <td className="py-2.5">
                      <a href={item.permalink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-900 dark:text-white hover:text-blue-600 transition-colors">
                        {item.thumbnail && <img src={item.thumbnail} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />}
                        <span className="truncate max-w-[300px]" title={item.name}>{item.name}</span>
                      </a>
                    </td>
                    <td className="py-2.5 text-right text-gray-900 dark:text-white">
                      ${item.price} <span className="text-xs text-gray-500">{item.currency_id}</span>
                    </td>
                    <td className="py-2.5 text-right font-medium text-orange-600">{item.sold_quantity || 0}</td>
                    <td className="py-2.5 text-right text-gray-900 dark:text-white">{item.available_quantity || 0}</td>
                    <td className="py-2.5 text-right">
                      <span className={`text-xs px-2 py-0.5 rounded ${item.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}>
                        {item.status === 'active' ? '在售' : item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalOrderValue > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-base font-semibold mb-4 text-gray-900 dark:text-white">最近订单</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left py-2 text-gray-500">订单号</th>
                  <th className="text-left py-2 text-gray-500">商品</th>
                  <th className="text-left py-2 text-gray-500">买家</th>
                  <th className="text-right py-2 text-gray-500">金额</th>
                  <th className="text-right py-2 text-gray-500">状态</th>
                </tr>
              </thead>
              <tbody>
                {(orders?.orders || []).slice(0, 10).map((o) => {
                  const statusLabel: Record<string, string> = {
                    paid: '已付款', confirmed: '已确认', paid_to_be_shipped: '待发货',
                    shipped: '已发货', delivered: '已送达', cancelled: '已取消',
                  };
                  return (
                    <tr key={o.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-2 text-gray-500 font-mono text-xs">{o.orderId}</td>
                      <td className="py-2 text-gray-900 dark:text-white">{o.product}</td>
                      <td className="py-2 text-gray-500">{o.buyer}</td>
                      <td className="py-2 text-right text-gray-900 dark:text-white">
                        ${o.amount.toFixed(2)} <span className="text-xs text-gray-500">{o.currency}</span>
                      </td>
                      <td className="py-2 text-right">
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          {statusLabel[o.status] || o.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, subtitle, icon }: { title: string; value: string; subtitle: string; icon: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500 dark:text-gray-400">{title}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
    </div>
  );
}
