"use client";

import { useState, useEffect } from 'react';

interface DecisionResult {
  sellable: number;
  ipRisk: string;
  ipRiskProb: Record<string, number>;
  complianceLevel: string;
  complianceProb: Record<string, number>;
  logisticsFit: number;
  differentiation: number;
  overallPotential: number;
  overallConfidence: number;
}

interface AiDecisionPanelProps {
  productName: string;
  category?: string;
  site?: string;
  purchasePriceCNY?: number;
  sellingPriceUSD?: number;
  weightG?: number;
}

export default function AiDecisionPanel(props: AiDecisionPanelProps) {
  const [decision, setDecision] = useState<DecisionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // 检查 AI 是否启用
    fetch('/api/product-scorer')
      .then(r => r.json())
      .then(d => {
        setEnabled(d.decisionModel?.enabled || false);
      })
      .catch(() => setEnabled(false));
  }, []);

  const runDecision = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/product-scorer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: [{
            name: props.productName,
            category: props.category,
            site: props.site,
            purchasePriceCNY: props.purchasePriceCNY,
            sellingPriceUSD: props.sellingPriceUSD,
            weightG: props.weightG,
          }],
          useAI: true,
        }),
      });
      const data = await res.json();
      if (data.results?.[0]?.decision) {
        setDecision(data.results[0].decision);
      } else if (data.results?.[0]?.decisionError) {
        setError(data.results[0].decisionError);
      } else {
        setError('未返回 AI 决策结果');
      }
    } catch (e: any) {
      setError(e.message || '调用失败');
    } finally {
      setLoading(false);
    }
  };

  if (!enabled) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-yellow-600 text-xl">💡</span>
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-200">AI 决策模型未启用</h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              请在 Vercel 环境变量中配置 <code>DASHSCOPE_API_KEY</code>（阿里云百炼），配置后自动启用 AI 选品评分。
            </p>
          </div>
        </div>
      </div>
    );
  }

  const potentialLabel = (p: number) => {
    if (p >= 3.5) return { text: ' 高潜力', color: 'text-green-600', bg: 'bg-green-100' };
    if (p >= 2.5) return { text: '✅ 潜力较好', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (p >= 1.5) return { text: '⚠️ 一般', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { text: ' 潜力较低', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const potentialInfo = decision ? potentialLabel(decision.overallPotential) : null;

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-purple-900 dark:text-purple-200 flex items-center gap-2">
          <span className="text-2xl"></span>
          AI 决策模型
        </h3>
        <button
          onClick={runDecision}
          disabled={loading || !props.productName}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition"
        >
          {loading ? '分析中...' : decision ? '重新分析' : '开始 AI 分析'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-lg p-3 text-sm text-red-700 dark:text-red-300 mb-3">
          {error}
        </div>
      )}

      {decision && (
        <div className="space-y-3">
          {/* 综合潜力 */}
          <div className={`rounded-lg p-3 ${potentialInfo?.bg} border`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900">综合潜力</span>
              <span className={`font-bold text-lg ${potentialInfo?.color}`}>
                {potentialInfo?.text}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                  style={{ width: `${(decision.overallPotential / 4) * 100}%` }}
                />
              </div>
              <span className="text-sm font-mono text-gray-700">
                {decision.overallPotential.toFixed(1)}/4
              </span>
            </div>
            <div className="text-xs text-gray-600 mt-1">
              置信度：{(decision.overallConfidence * 100).toFixed(0)}%
            </div>
          </div>

          {/* 详细指标 */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-white/50 dark:bg-gray-800/50 rounded p-2">
              <div className="text-gray-600 text-xs">可售概率</div>
              <div className="font-bold text-green-600">{(decision.sellable * 100).toFixed(0)}%</div>
            </div>
            <div className="bg-white/50 dark:bg-gray-800/50 rounded p-2">
              <div className="text-gray-600 text-xs">侵权风险</div>
              <div className={`font-bold ${decision.ipRisk === 'none' ? 'text-green-600' : decision.ipRisk === 'low' ? 'text-yellow-600' : 'text-red-600'}`}>
                {decision.ipRisk.toUpperCase()}
              </div>
            </div>
            <div className="bg-white/50 dark:bg-gray-800/50 rounded p-2">
              <div className="text-gray-600 text-xs">合规等级</div>
              <div className="font-bold text-blue-600">{decision.complianceLevel}</div>
            </div>
            <div className="bg-white/50 dark:bg-gray-800/50 rounded p-2">
              <div className="text-gray-600 text-xs">物流适配</div>
              <div className="font-bold text-purple-600">{decision.logisticsFit.toFixed(1)}/4</div>
            </div>
            <div className="bg-white/50 dark:bg-gray-800/50 rounded p-2">
              <div className="text-gray-600 text-xs">差异化</div>
              <div className="font-bold text-indigo-600">{decision.differentiation.toFixed(1)}/4</div>
            </div>
          </div>

          {/* 概率分布 */}
          {Object.keys(decision.ipRiskProb).length > 0 && (
            <div className="bg-white/30 dark:bg-gray-800/30 rounded p-2 text-xs">
              <div className="text-gray-600 mb-1">侵权风险分布：</div>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(decision.ipRiskProb).map(([k, v]) => (
                  <span key={k} className="text-gray-700">
                    {k}: <span className="font-mono font-bold">{(v * 100).toFixed(0)}%</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!decision && !loading && !error && (
        <div className="text-center py-6 text-gray-500">
          <div className="text-3xl mb-2">🤖</div>
          <div className="text-sm">点击「开始 AI 分析」获取决策模型评分</div>
          <div className="text-xs mt-1">平均耗时 80ms · 返回概率分布和置信度</div>
        </div>
      )}
    </div>
  );
}
