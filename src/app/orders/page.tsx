"use client";
import { useEffect, useState } from "react";

interface Order {
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
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("全部状态");
  const statuses = ["全部状态", "paid", "shipped", "cancelled", "pending"];
  const statusLabels: Record<string, string> = {
    paid: "已付款",
    shipped: "已发货",
    cancelled: "已取消",
    pending: "待付款",
  };
  const statusColors: Record<string, string> = {
    paid: "bg-green-100 text-green-700",
    shipped: "bg-blue-100 text-blue-700",
    cancelled: "bg-red-100 text-red-700",
    pending: "bg-yellow-100 text-yellow-700",
  };

  useEffect(() => {
    fetch("/api/orders").then(r => r.json()).then(d => {
      setOrders(d.orders || []);
      setMessage(d.message || "");
      setLoading(false);
    }).catch(() => {
      setMessage("加载失败，请稍后刷新");
      setLoading(false);
    });
  }, []);

  const filtered = statusFilter === "全部状态" ? orders : orders.filter(o => o.status === statusFilter);
  const paid = filtered.filter(o => o.status === "paid").reduce((a, b) => a + b.amount, 0);
  const shipped = filtered.filter(o => o.status === "shipped").length;

  if (loading) return <div className="p-6 text-center text-gray-500">加载中...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">订单管理</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">实时同步美客多店铺订单</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs text-gray-500">总订单</p>
          <p className="text-2xl font-bold mt-1">{filtered.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs text-gray-500">已付款金额</p>
          <p className="text-2xl font-bold mt-1 text-green-600">${paid.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs text-gray-500">已发货</p>
          <p className="text-2xl font-bold mt-1 text-blue-600">{shipped}</p>
        </div>
      </div>

      {message && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-300">
          {message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {statuses.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${statusFilter === s ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>
              {s === "全部状态" ? s : statusLabels[s] || s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr className="text-left text-gray-500 dark:text-gray-400">
              <th className="p-3">订单号</th>
              <th className="p-3">买家</th>
              <th className="p-3">商品</th>
              <th className="p-3">金额</th>
              <th className="p-3">状态</th>
              <th className="p-3">物流</th>
              <th className="p-3">日期</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-400">
                {orders.length === 0 ? "暂无订单数据（新店铺需要等待买家下单）" : "该状态暂无订单"}
              </td></tr>
            ) : filtered.map(o => (
              <tr key={o.id} className="border-t border-gray-100 dark:border-gray-800">
                <td className="p-3 font-mono text-xs">{o.orderId}</td>
                <td className="p-3">{o.buyer}</td>
                <td className="p-3">{o.product}</td>
                <td className="p-3 font-medium">${o.amount.toFixed(2)} {o.currency}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[o.status] || "bg-gray-100 text-gray-700"}`}>
                    {statusLabels[o.status] || o.status}
                  </span>
                </td>
                <td className="p-3 text-gray-500">{o.shipping}</td>
                <td className="p-3 text-gray-500">{o.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
