"use client";
import { useEffect, useState } from "react";

interface Product {
  id: string;
  name: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  weight: number;
  site: string;
  status: string;
  rating: number;
  soldRange: string;
  thumbnail: string;
  permalink: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("全部品类");
  const [busyId, setBusyId] = useState<string>("");

  const load = () => {
    setLoading(true);
    fetch("/api/products").then(r => r.json()).then(d => {
      setProducts(d.products || []);
      setMessage(d.message || "");
      setLoading(false);
    }).catch(() => {
      setMessage("加载失败，请稍后刷新");
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const closeOne = async (id: string, name: string) => {
    if (!confirm(`确定要关闭这个商品吗？\n\n${name}\n\n关闭后买家将看不到该商品。`)) return;
    setBusyId(id);
    try {
      const res = await fetch("/api/close-listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      const data = await res.json();
      const item = data?.results?.[0];
      if (item?.closed) {
        setMessage(`已关闭：${name}`);
        load();
      } else {
        setMessage(`关闭详情：${JSON.stringify(item || data, null, 2).slice(0, 1500)}`);
      }
    } catch (e: any) {
      setMessage(`关闭失败：${e?.message || e}`);
    } finally {
      setBusyId("");
    }
  };

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    paused: "bg-yellow-100 text-yellow-700",
    closed: "bg-red-100 text-red-700",
    reviewing: "bg-blue-100 text-blue-700",
  };
  const statusLabels: Record<string, string> = {
    active: "在售",
    paused: "暂停",
    closed: "已关闭",
    reviewing: "审核中",
  };

  const filtered = category === "全部品类" ? products : products.filter(p => p.category === category);

  if (loading) return <div className="p-6 text-center text-gray-500">加载中...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">商品管理</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">实时同步美客多店铺在售商品</p>
      </div>

      {message && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-300">
          {message}
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr className="text-left text-gray-500 dark:text-gray-400">
              <th className="p-3">商品</th>
              <th className="p-3">品类</th>
              <th className="p-3">售价</th>
              <th className="p-3">状态</th>
              <th className="p-3">销量(60月)</th>
              <th className="p-3">站点</th>
              <th className="p-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-400">暂无商品数据</td></tr>
            ) : filtered.map(p => (
              <tr key={p.id} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    {p.thumbnail && <img src={p.thumbnail} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />}
                    <a href={p.permalink || "#"} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline line-clamp-2 text-xs">
                      {p.name}
                    </a>
                  </div>
                </td>
                <td className="p-3 text-gray-500 text-xs">{p.category}</td>
                <td className="p-3 font-medium text-xs">${p.sellingPrice?.toFixed(2) || "N/A"}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${statusColors[p.status] || "bg-gray-100 text-gray-700"}`}>
                    {statusLabels[p.status] || p.status}
                  </span>
                </td>
                <td className="p-3 text-gray-500 text-xs">{p.soldRange || "0"}</td>
                <td className="p-3 text-xs text-gray-500">{p.site}</td>
                <td className="p-3">
                  {p.status === "active" && (
                    <button
                      onClick={() => closeOne(p.id, p.name)}
                      disabled={busyId === p.id}
                      className="px-2 py-1 text-xs rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {busyId === p.id ? "处理中..." : "关闭"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
