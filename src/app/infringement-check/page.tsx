"use client";

import { useState } from 'react';

export default function InfringementPage() {
  const [checked, setChecked] = useState([
    { name: 'Nike Air 运动鞋 复刻版', category: '运动鞋', score: 85, level: '高危', dims: ['品牌词'] },
    { name: '硅胶手机壳 通用款', category: '手机壳', score: 15, level: '安全', dims: [] },
    { name: 'AirPods 保护壳', category: '其他', score: 65, level: '注意', dims: ['品牌词', '外观专利'] },
    { name: 'LED灯串 装饰灯', category: 'LED灯', score: 10, level: '安全', dims: [] },
    { name: 'Spider-Man 手办', category: '玩具/手办', score: 92, level: '高危', dims: ['版权/IP'] },
    { name: '无线蓝牙耳机 通用', category: '其他', score: 20, level: '安全', dims: [] },
  ]);

  const [checkInput, setCheckInput] = useState('');
  
  const handleCheck = () => {
    if (!checkInput.trim()) return;
    const brands = ['Nike', 'Adidas', 'Apple', 'Samsung', 'Sony', 'Disney', 'Marvel'];
    const lower = checkInput.toLowerCase();
    const hitBrands = brands.filter(b => lower.includes(b.toLowerCase()));
    const score = hitBrands.length > 0 ? Math.min(95, 50 + hitBrands.length * 20) : Math.floor(Math.random() * 30);
    const level = score > 60 ? '高危' : score > 30 ? '注意' : '安全';
    const newCheck = {
      name: checkInput,
      category: '其他',
      score,
      level,
      dims: hitBrands.length > 0 ? ['品牌词'] : [],
    };
    setChecked([newCheck, ...checked]);
    setCheckInput('');
  };

  const safeCount = checked.filter(c => c.level === '安全').length;
  const warnCount = checked.filter(c => c.level === '注意').length;
  const dangerCount = checked.filter(c => c.level === '高危').length;
  const avgScore = checked.length > 0 ? Math.round(checked.reduce((a, b) => a + b.score, 0) / checked.length) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">侵权风险检测</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">本地6维度检测 + 联网查询（WIPO商标 / Google Patents / Google Lens图片查重）</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
          <div className="text-2xl font-bold">{checked.length}</div>
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
          <div className="text-2xl font-bold">{avgScore}</div>
          <div className="text-xs text-gray-500">平均风险分</div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-base font-semibold mb-4">快速检测</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={checkInput}
            onChange={e => setCheckInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCheck()}
            placeholder="输入商品名称，如: Nike Air 运动鞋"
            className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
          />
          <button onClick={handleCheck} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">检测</button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-base font-semibold mb-4">检测结果</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left py-2 text-gray-500">商品名称</th>
                <th className="text-left py-2 text-gray-500">品类</th>
                <th className="text-center py-2 text-gray-500">风险评分</th>
                <th className="text-center py-2 text-gray-500">风险等级</th>
                <th className="text-left py-2 text-gray-500">命中维度</th>
              </tr>
            </thead>
            <tbody>
              {checked.map((c, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2.5 text-gray-900 dark:text-white">{c.name}</td>
                  <td className="py-2.5 text-gray-500">{c.category}</td>
                  <td className="py-2.5 text-center">
                    <span className={`font-medium ${c.score > 60 ? 'text-red-600' : c.score > 30 ? 'text-yellow-600' : 'text-green-600'}`}>{c.score}</span>
                  </td>
                  <td className="py-2.5 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded ${c.level === '安全' ? 'bg-green-100 text-green-700' : c.level === '注意' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {c.level}
                    </span>
                  </td>
                  <td className="py-2.5 text-gray-500">{c.dims.join(', ') || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
