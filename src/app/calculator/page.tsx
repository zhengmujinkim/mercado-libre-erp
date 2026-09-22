"use client";

import { useState } from 'react';

export default function CalculatorPage() {
  const [purchase, setPurchase] = useState(10);
  const [sell, setSell] = useState(15);
  const [weight, setWeight] = useState(100);
  const [site, setSite] = useState('MLB');

  const rates: Record<string, { commission: number; logistics: number; name: string }> = {
    MLB: { commission: 13, logistics: 65, name: '巴西' },
    MLM: { commission: 12.5, logistics: 58, name: '墨西哥' },
    MCO: { commission: 15, logistics: 70, name: '哥伦比亚' },
    MLA: { commission: 14, logistics: 72, name: '阿根廷' },
    MLC: { commission: 14.5, logistics: 68, name: '智利' },
  };

  const rate = rates[site] || rates.MLB;
  const usdToCny = 7.2;
  const paymentFee = 0.015;
  const volWeight = (10 * 10 * 10) / 6000; // default 10x10x10cm
  const actualWeight = Math.max(weight / 1000, volWeight);
  const logisticsCost = actualWeight * rate.logistics;
  const purchaseCny = purchase;
  const purchaseUsd = purchaseCny / usdToCny;
  const commissionUsd = sell * (rate.commission / 100);
  const paymentUsd = sell * paymentFee;
  const totalCost = purchaseUsd + logisticsCost / usdToCny + commissionUsd + paymentUsd;
  const profit = sell - totalCost;
  const profitRate = sell > 0 ? (profit / sell) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">利润计算器</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">快速计算单品利润或批量分析</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
          <h2 className="text-base font-semibold">输入商品信息</h2>
          
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400">目标市场</label>
            <select value={site} onChange={e => setSite(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm">
              {Object.entries(rates).map(([k, v]) => (
                <option key={k} value={k}>{v.name} ({k})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400">采购价 (CNY)</label>
            <input type="number" value={purchase} onChange={e => setPurchase(+e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm" />
          </div>

          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400">售价 (USD)</label>
            <input type="number" value={sell} onChange={e => setSell(+e.target.value)} step="0.01" className="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm" />
          </div>

          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400">重量 (g)</label>
            <input type="number" value={weight} onChange={e => setWeight(+e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm" />
          </div>

          <div className="text-xs text-gray-500 pt-3 border-t border-gray-100 dark:border-gray-800">
            <p>汇率: 1 USD = {usdToCny} CNY</p>
            <p>{rate.name}佣金: {rate.commission}% | 物流: ¥{rate.logistics}/kg</p>
            <p>支付手续费: {paymentFee * 100}%</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
          <h2 className="text-base font-semibold">利润分析</h2>
          <div className="space-y-3">
            <Row label="商品售价" value={`$${sell.toFixed(2)}`} />
            <Row label="采购成本 (CNY→USD)" value={`-$${purchaseUsd.toFixed(2)}`} />
            <Row label={`平台佣金 (${rate.commission}%)`} value={`-$${commissionUsd.toFixed(2)}`} />
            <Row label="支付手续费 (1.5%)" value={`-$${paymentUsd.toFixed(2)}`} />
            <Row label={`物流费用 (${rate.logistics}¥/kg)`} value={`-$${(logisticsCost / usdToCny).toFixed(2)}`} />
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <Row label="总成本" value={`$${totalCost.toFixed(2)}`} bold />
              <Row label="单品利润" value={`$${profit.toFixed(2)}`} bold color={profit >= 0 ? 'green' : 'red'} />
              <Row label="利润率" value={`${profitRate.toFixed(1)}%`} bold color={profitRate >= 0 ? 'green' : 'red'} large />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold, color, large }: { label: string; value: string; bold?: boolean; color?: string; large?: boolean }) {
  const colorClass = color === 'green' ? 'text-green-600' : color === 'red' ? 'text-red-600' : 'text-gray-900 dark:text-white';
  return (
    <div className="flex justify-between items-center">
      <span className={`text-sm ${bold ? 'font-semibold' : ''} text-gray-600 dark:text-gray-400`}>{label}</span>
      <span className={`${large ? 'text-xl' : 'text-sm'} font-medium ${color ? colorClass : 'text-gray-900 dark:text-white'}`}>{value}</span>
    </div>
  );
}
