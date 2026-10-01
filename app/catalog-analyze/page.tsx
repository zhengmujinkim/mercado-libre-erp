/**
 * Catalog 竞争分析页面
 * 
 * 功能：
 * 1. 输入商品信息（关键词、重量、尺寸、采购价）
 * 2. 调用 API 搜索竞品并核价
 * 3. 显示分析报告（成本明细、竞品对比、竞争力评估、建议）
 */

'use client';

import { useState } from 'react';

interface AnalysisResult {
  keyword: string;
  product_name_cn: string;
  site_id: string;
  package: {
    weight_g: number;
    length_cm: number;
    width_cm: number;
    height_cm: number;
  };
  weight_analysis: {
    volume_weight_g: number;
    billable_weight_g: number;
    is_oversized: boolean;
  };
  pricing: {
    purchase_cost_cny: number;
    purchase_cost_brl: number;
    domestic_shipping_cny: number;
    international_shipping_cny: number;
    commission_cny: number;
    total_cost_cny: number;
    total_cost_brl: number;
    min_price_brl: number;
    suggested_price_brl: number;
  };
  competition: {
    total_results: number;
    competitors: Array<{
      item_id: string;
      title: string;
      price_brl: number;
      seller_reputation: string;
      listing_type: string;
      sold_count: number;
      is_catalog: boolean;
    }>;
    buy_box_winner: {
      item_id: string;
      title: string;
      price_brl: number;
      seller_reputation: string;
      listing_type: string;
      sold_count: number;
      is_catalog: boolean;
    } | null;
    avg_price_brl: number;
    min_price_brl: number;
    max_price_brl: number;
    catalog_ratio: number;
  };
  competitiveness: {
    is_competitive: boolean;
    profit_margin: number;
    win_probability: string;
    recommendations: string[];
  };
}

export default function CatalogAnalyzePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    keyword: '',
    product_name_cn: '',
    package_weight_g: '',
    package_l_cm: '',
    package_w_cm: '',
    package_h_cm: '',
    purchase_cost_cny: '',
    site_id: 'MLB',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const resp = await fetch('/api/catalog-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: formData.keyword,
          product_name_cn: formData.product_name_cn,
          package_weight_g: parseFloat(formData.package_weight_g),
          package_l_cm: parseFloat(formData.package_l_cm),
          package_w_cm: parseFloat(formData.package_w_cm),
          package_h_cm: parseFloat(formData.package_h_cm),
          purchase_cost_cny: parseFloat(formData.purchase_cost_cny),
          site_id: formData.site_id,
          competitor_limit: 20,
        }),
      });
      
      const data = await resp.json();
      
      if (!data.success) {
        throw new Error(data.error || '分析失败');
      }
      
      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Catalog 竞争分析</h1>
      <p className="text-gray-600 mb-8">
        输入商品信息，自动搜索美客多竞品并核算利润，评估上架竞争力
      </p>
      
      {/* 输入表单 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">商品信息</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ML 搜索关键词 *
              </label>
              <input
                type="text"
                value={formData.keyword}
                onChange={(e) => handleInputChange('keyword', e.target.value)}
                placeholder="例：cobertor ponderado 7kg"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                商品中文名 *
              </label>
              <input
                type="text"
                value={formData.product_name_cn}
                onChange={(e) => handleInputChange('product_name_cn', e.target.value)}
                placeholder="例：7kg 重力毯"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                包裹重量 (g) *
              </label>
              <input
                type="number"
                value={formData.package_weight_g}
                onChange={(e) => handleInputChange('package_weight_g', e.target.value)}
                placeholder="7500"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min="1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                长 (cm) *
              </label>
              <input
                type="number"
                value={formData.package_l_cm}
                onChange={(e) => handleInputChange('package_l_cm', e.target.value)}
                placeholder="42"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min="0.1"
                step="0.1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                宽 (cm) *
              </label>
              <input
                type="number"
                value={formData.package_w_cm}
                onChange={(e) => handleInputChange('package_w_cm', e.target.value)}
                placeholder="32"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min="0.1"
                step="0.1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                高 (cm) *
              </label>
              <input
                type="number"
                value={formData.package_h_cm}
                onChange={(e) => handleInputChange('package_h_cm', e.target.value)}
                placeholder="12"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min="0.1"
                step="0.1"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                1688 采购价 (¥) *
              </label>
              <input
                type="number"
                value={formData.purchase_cost_cny}
                onChange={(e) => handleInputChange('purchase_cost_cny', e.target.value)}
                placeholder="52"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min="0.01"
                step="0.01"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                目标站点
              </label>
              <select
                value={formData.site_id}
                onChange={(e) => handleInputChange('site_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="MLB">🇷 巴西 (MLB)</option>
                <option value="MLM">🇽 墨西哥 (MLM)</option>
              </select>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '分析中...' : '开始分析'}
          </button>
        </form>
      </div>
      
      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <p className="text-red-700 font-medium"> 分析失败</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}
      
      {/* 分析结果 */}
      {result && (
        <div className="space-y-6">
          {/* 包裹规格 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">📦 包裹规格</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs text-gray-600">实际重量</p>
                <p className="text-lg font-semibold">{result.package.weight_g}g</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs text-gray-600">体积重</p>
                <p className="text-lg font-semibold">
                  {result.weight_analysis.volume_weight_g.toFixed(0)}g
                  {result.weight_analysis.is_oversized && <span className="text-red-500 text-xs ml-1">⚠️ 过大</span>}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs text-gray-600">计费重</p>
                <p className="text-lg font-semibold">{result.weight_analysis.billable_weight_g.toFixed(0)}g</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs text-gray-600">尺寸</p>
                <p className="text-lg font-semibold">
                  {result.package.length_cm}×{result.package.width_cm}×{result.package.height_cm}cm
                </p>
              </div>
            </div>
          </div>
          
          {/* 成本明细 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">💰 成本明细</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-700">📦 采购价</span>
                <span className="font-semibold">
                  ¥{result.pricing.purchase_cost_cny.toFixed(2)} (R${result.pricing.purchase_cost_brl.toFixed(2)})
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-700"> 国内运费</span>
                <span className="font-semibold">
                  ¥{result.pricing.domestic_shipping_cny.toFixed(2)} (R${result.pricing.domestic_shipping_cny * 0.776}).toFixed(2))
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-700">✈️ 国际运费</span>
                <span className="font-semibold">
                  ¥{result.pricing.international_shipping_cny.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-700">💳 ML 佣金</span>
                <span className="font-semibold">
                  ¥{result.pricing.commission_cny.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 bg-yellow-50 px-3 rounded">
                <span className="font-semibold text-gray-900">💸 总成本</span>
                <span className="font-bold text-lg">
                  ¥{result.pricing.total_cost_cny.toFixed(2)} (R${result.pricing.total_cost_brl.toFixed(2)})
                </span>
              </div>
            </div>
          </div>
          
          {/* 定价建议 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">📊 定价分析</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600 mb-1">保本价</p>
                <p className="text-2xl font-bold text-blue-700">
                  R${result.pricing.min_price_brl.toFixed(2)}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600 mb-1">建议售价</p>
                <p className="text-2xl font-bold text-green-700">
                  R${result.pricing.suggested_price_brl.toFixed(2)}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600 mb-1">竞品最低价</p>
                <p className="text-2xl font-bold text-purple-700">
                  R${result.competition.min_price_brl.toFixed(2)}
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold mb-2">竞争力评估</p>
              <p className={`text-lg font-bold ${result.competitiveness.is_competitive ? 'text-green-600' : 'text-red-600'}`}>
                {result.competitiveness.is_competitive ? '✅ 有竞争力' : '❌ 无竞争力'}
              </p>
              <p className="text-gray-700 mt-2">{result.competitiveness.win_probability}</p>
              <p className="text-gray-600 mt-1">
                预期利润率：{(result.competitiveness.profit_margin * 100).toFixed(0)}%
              </p>
            </div>
          </div>
          
          {/* 竞品列表 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              竞品分析 
              <span className="text-sm font-normal text-gray-600 ml-2">
                (共 {result.competition.total_results} 个结果，采样 {result.competition.competitors.length} 个)
              </span>
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs text-gray-600">平均价</p>
                <p className="text-lg font-semibold">R${result.competition.avg_price_brl.toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs text-gray-600">最低价</p>
                <p className="text-lg font-semibold">R${result.competition.min_price_brl.toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs text-gray-600">最高价</p>
                <p className="text-lg font-semibold">R${result.competition.max_price_brl.toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs text-gray-600">Catalog 占比</p>
                <p className="text-lg font-semibold">
                  {(result.competition.catalog_ratio * 100).toFixed(0)}%
                </p>
              </div>
            </div>
            
            {result.competition.buy_box_winner && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
                <p className="font-semibold text-yellow-900 mb-2">🥇 当前 Buy Box 赢家</p>
                <p className="text-sm text-gray-700 line-clamp-2">
                  {result.competition.buy_box_winner.title}
                </p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="font-semibold">R${result.competition.buy_box_winner.price_brl.toFixed(2)}</span>
                  <span>信誉：{result.competition.buy_box_winner.seller_reputation}</span>
                  <span>类型：{result.competition.buy_box_winner.listing_type}</span>
                  <span>已售：{result.competition.buy_box_winner.sold_count}</span>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <p className="font-semibold text-gray-700">Top 5 竞品:</p>
              {result.competition.competitors.slice(0, 5).map((comp, idx) => (
                <div key={comp.item_id} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                  <span className="font-bold text-gray-500 w-6">{idx + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">{comp.title}</p>
                    <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-600">
                      <span className="font-semibold">R${comp.price_brl.toFixed(2)}</span>
                      <span>信誉：{comp.seller_reputation}</span>
                      <span>类型：{comp.listing_type}</span>
                      <span>已售：{comp.sold_count}</span>
                      {comp.is_catalog && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Catalog</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 操作建议 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">💡 操作建议</h2>
            <div className="space-y-2">
              {result.competitiveness.recommendations.map((rec, idx) => (
                <p key={idx} className="text-gray-700 py-1 border-b last:border-0">
                  {rec}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
