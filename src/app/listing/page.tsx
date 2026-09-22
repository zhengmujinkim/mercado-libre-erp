"use client";
import { useEffect, useState } from "react";

interface Listing {
  id: string;
  title: string;
  price: number;
  currency_id: string;
  available_quantity: number;
  sold_quantity: number;
  status: string;
  site_id: string;
  permalink: string;
  thumbnail: string;
}

interface Stats {
  activeCount: number;
  totalStock: number;
  totalSold: number;
  lowStock: number;
  total: number;
}

export default function ListingPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<Stats>({ activeCount: 0, totalStock: 0, totalSold: 0, lowStock: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/listing").then(r => r.json()).then(d => {
      setListings(d.listings || []);
      setStats(d.stats || { activeCount: 0, totalStock: 0, totalSold: 0, lowStock: 0, total: 0 });
      setMessage(d.message || "");
      setLoading(false);
    }).catch(() => {
      setMessage("加载失败，请稍后刷新");
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-6 text-center text-gray-500">加载中...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">商品上架</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">管理美客多商品发布与库存</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
          <div className="text-xs text-gray-500">在售商品</div>
          <div className="text-2xl font-bold mt-1">{stats.activeCount}</div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
          <div className="text-xs text-gray-500">总库存</div>
          <div className="text-2xl font-bold mt-1">{stats.totalStock.toLocaleString()}</div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
          <div className="text-xs text-gray-500">已售出</div>
          <div className="text-2xl font-bold mt-1">{stats.totalSold.toLocaleString()}</div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-red-200 dark:border-red-800 p-4 text-center">
          <div className="text-xs text-gray-500">低库存预警</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{stats.lowStock}</div>
        </div>
      </div>

      {message && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-300">
          {message}
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr className="text-left text-gray-500 dark:text-gray-400">
                <th className="p-3">商品</th>
                <th className="p-3">价格</th>
                <th className="p-3">库存</th>
                <th className="p-3">已售</th>
                <th className="p-3">状态</th>
                <th className="p-3">站点</th>
              </tr>
            </thead>
            <tbody>
              {listings.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400">暂无商品数据（新店铺需要先上架商品）</td></tr>
              ) : listings.map(l => (
                <tr key={l.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {l.thumbnail && <img src={l.thumbnail} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />}
                      <a href={l.permalink || "#"} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs line-clamp-2">
                        {l.title}
                      </a>
                    </div>
                  </td>
                  <td className="p-3 font-medium text-xs">${l.price?.toFixed(2) || "N/A"} {l.currency_id}</td>
                  <td className={`p-3 ${l.available_quantity < 10 && l.available_quantity > 0 ? 'text-red-600 font-medium' : ''}`}>
                    {l.available_quantity}
                  </td>
                  <td className="p-3 text-gray-500">{l.sold_quantity}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${l.status === 'active' ? 'bg-green-100 text-green-700' : l.status === 'paused' ? 'bg-yellow-100 text-yellow-700' : l.status === 'closed' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                      {l.status === 'active' ? '在售' : l.status === 'paused' ? '暂停' : l.status === 'closed' ? '已关闭' : l.status}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-gray-500">{l.site_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
