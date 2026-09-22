"use client";
import { useEffect, useState } from "react";

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
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/inventory").then(r => r.json()).then(d => {
      setItems(d.inventory || []);
      setMessage(d.message || "");
      setLoading(false);
    }).catch(() => {
      setMessage("加载失败，请稍后刷新");
      setLoading(false);
    });
  }, []);

  const totalStock = items.reduce((a, b) => a + b.available_quantity, 0);
  const totalSold = items.reduce((a, b) => a + b.sold_quantity, 0);
  const lowStock = items.filter(i => i.available_quantity < 10 && i.available_quantity > 0).length;

  if (loading) return <div className="p-6 text-center text-gray-500">加载中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">库存管理</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">实时同步美客多店铺库存</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs text-gray-500">总库存</p>
          <p className="text-2xl font-bold mt-1">{totalStock}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs text-gray-500">已售出</p>
          <p className="text-2xl font-bold mt-1">{totalSold}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-red-200 dark:border-red-800 p-4">
          <p className="text-xs text-gray-500">低库存预警</p>
          <p className="text-2xl font-bold mt-1 text-red-600">{lowStock}</p>
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
                <th className="p-3">可售库存</th>
                <th className="p-3">已售</th>
                <th className="p-3">状态</th>
                <th className="p-3">站点</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400">暂无库存数据（新店铺需要先上架商品）</td></tr>
              ) : items.map(item => (
                <tr key={item.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {item.thumbnail && <img src={item.thumbnail} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />}
                      <a href={item.permalink || "#"} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs line-clamp-2">
                        {item.name}
                      </a>
                    </div>
                  </td>
                  <td className="p-3 font-medium text-xs">${item.price?.toFixed(2) || "N/A"} {item.currency_id}</td>
                  <td className={`p-3 ${item.available_quantity < 10 && item.available_quantity > 0 ? 'text-red-600 font-medium' : ''}`}>
                    {item.available_quantity}
                  </td>
                  <td className="p-3 text-gray-500">{item.sold_quantity}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${item.status === 'active' ? 'bg-green-100 text-green-700' : item.status === 'paused' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                      {item.status === 'active' ? '在售' : item.status === 'paused' ? '暂停' : item.status}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-gray-500">{item.site_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
