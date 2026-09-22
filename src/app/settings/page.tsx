"use client";

import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [authStatus, setAuthStatus] = useState<{ hasToken: boolean; isValid: boolean; userId: string | null; expiresIn: number } | null>(null);
  const [brandWords, setBrandWords] = useState<string[]>([]);
  const [brandInput, setBrandInput] = useState('');

  useEffect(() => {
    fetch('/api/auth/status').then(r => r.json()).then(setAuthStatus).catch(() => {});
  }, []);

  const addBrandWord = () => {
    if (brandInput.trim() && !brandWords.includes(brandInput.trim())) {
      setBrandWords([...brandWords, brandInput.trim()]);
      setBrandInput('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">系统设置</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">配置汇率、佣金、物流等参数</p>
      </div>

      {/* Exchange Rates */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-base font-semibold mb-4">汇率配置</h3>
        <p className="text-xs text-gray-500 mb-4">人民币与其他货币的兑换汇率</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { from: 'USD', to: 'CNY', rate: 7.2 },
            { from: 'USD', to: 'BRL', rate: 5.0 },
            { from: 'USD', to: 'MXN', rate: 17.2 },
            { from: 'USD', to: 'COP', rate: 4000 },
            { from: 'USD', to: 'ARS', rate: 850 },
          ].map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{r.from} → {r.to}</span>
              <input type="number" defaultValue={r.rate} className="w-24 px-2 py-1 border border-gray-200 dark:border-gray-700 rounded text-sm bg-white dark:bg-gray-800" />
              <span className="text-xs text-gray-400">{r.to}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Commission */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-base font-semibold mb-4">平台佣金比例</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { site: '巴西', rate: 13 },
            { site: '墨西哥', rate: 12.5 },
            { site: '哥伦比亚', rate: 15 },
            { site: '阿根廷', rate: 14 },
            { site: '智利', rate: 14.5 },
          ].map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-sm text-gray-600 w-20">{c.site}</span>
              <input type="number" defaultValue={c.rate} className="w-20 px-2 py-1 border border-gray-200 dark:border-gray-700 rounded text-sm bg-white dark:bg-gray-800" />
              <span className="text-xs text-gray-400">%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Logistics */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-base font-semibold mb-4">物流费率</h3>
        <p className="text-xs text-gray-500 mb-4">国际小包空运参考费率（人民币/千克）</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { site: '巴西', rate: 65 },
            { site: '墨西哥', rate: 58 },
            { site: '哥伦比亚', rate: 70 },
            { site: '阿根廷', rate: 72 },
            { site: '智利', rate: 68 },
          ].map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-sm text-gray-600 w-20">{c.site}</span>
              <input type="number" defaultValue={c.rate} className="w-20 px-2 py-1 border border-gray-200 dark:border-gray-700 rounded text-sm bg-white dark:bg-gray-800" />
              <span className="text-xs text-gray-400">¥/kg</span>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Fee */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-base font-semibold mb-4">支付手续费</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">手续费比例</span>
          <input type="number" defaultValue={1.5} className="w-20 px-2 py-1 border border-gray-200 dark:border-gray-700 rounded text-sm bg-white dark:bg-gray-800" />
          <span className="text-xs text-gray-400">%</span>
        </div>
      </div>

      {/* Brand Words */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-base font-semibold mb-4">侵权词库管理</h3>
        <p className="text-xs text-gray-500 mb-4">自定义扩展检测词库</p>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={brandInput}
            onChange={e => setBrandInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addBrandWord()}
            placeholder="输入品牌词，如 Nike Air"
            className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
          />
          <button onClick={addBrandWord} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">添加</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {brandWords.map((w, i) => (
            <span key={i} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">{w}</span>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">预设词库已包含 128 个品牌词，此处可额外添加</p>
      </div>

      {/* Mercado Libre API */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-base font-semibold mb-2">美客多 API 连接</h3>
        <p className="text-xs text-gray-500 mb-4">CBT 跨境卖家统一授权，一次授权全站生效</p>
        
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">Mercado Libre Global Selling</span>
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">CBT 跨境模式</span>
            {authStatus?.isValid ? (
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">✅ 已连接</span>
            ) : (
              <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">⚠️ 未授权</span>
            )}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            跨境卖家统一授权入口，授权后全站生效
          </p>
          <div className="text-xs space-y-1">
            <p>Client ID: <span className="font-mono">1167380097326946</span></p>
            {authStatus?.userId && <p>User ID: <span className="font-mono">{authStatus.userId}</span></p>}
            {authStatus?.isValid && authStatus.expiresIn > 0 && (
              <p>Token 有效期: {authStatus.expiresIn > 3600 ? `${Math.floor(authStatus.expiresIn / 3600)}小时` : `${Math.floor(authStatus.expiresIn / 60)}分钟`}</p>
            )}
            <p>Token 存储: Vercel KV (自动刷新)</p>
          </div>
        </div>

        <a href="/api/auth/mercado-libre" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          {authStatus?.hasToken ? '🔄 重新授权（刷新Token）' : '🔗 授权美客多跨境账号'}
        </a>

        <div className="mt-4 text-xs text-gray-500 space-y-1">
          <p>• 使用 Global Selling 统一授权入口</p>
          <p>• 一次授权后，所有站点自动生效</p>
          <p>• Token 过期前 5 分钟自动刷新（refresh_token）</p>
          <p>• 授权 URL: https://global-selling.mercadolibre.com/authorization</p>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-base font-semibold mb-2">Webhook 通知接收</h3>
        <p className="text-xs text-gray-500 mb-2">POST /api/notifications</p>
        <p className="text-xs text-gray-400">美客多平台推送通知后将在此显示。支持 orders_v2、items、marketplace_orders 等 topic。</p>
        <a href="/api/notifications" className="text-xs text-blue-600 hover:underline mt-2 inline-block">查看通知列表 →</a>
      </div>
    </div>
  );
}
