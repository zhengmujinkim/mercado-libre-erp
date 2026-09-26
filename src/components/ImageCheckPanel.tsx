"use client";

import { useState } from 'react';

interface ImageCheckResult {
  compliant: boolean;
  score: number;
  whiteBg: boolean;
  hasText: boolean;
  centered: boolean;
  issues: string[];
  suggestions: string[];
}

interface ImageCheckPanelProps {
  images: string[]; // URL 数组
}

export default function ImageCheckPanel({ images }: ImageCheckPanelProps) {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<ImageCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkImages = async () => {
    if (!images.length) {
      setError('请先添加图片 URL');
      return;
    }

    setChecking(true);
    setError(null);
    setResult(null);

    try {
      // 注意：实际部署时需要从 URL 下载图片转 base64，这里简化处理
      // 生产环境应该在后端处理图片下载
      const res = await fetch('/api/image-quality-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: images, // 后端会处理 URL 下载
          mode: 'multi',
        }),
      });

      const data = await res.json();
      if (data.result) {
        setResult(data.result);
      } else {
        setError(data.error || '检测失败');
      }
    } catch (e: any) {
      setError(e.message || '网络错误');
    } finally {
      setChecking(false);
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const scoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100 border-green-300';
    if (score >= 60) return 'bg-yellow-100 border-yellow-300';
    return 'bg-red-100 border-red-300';
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-2">
          <span className="text-2xl">📸</span>
          AI 图片合规检测
        </h3>
        <button
          onClick={checkImages}
          disabled={checking || !images.length}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition"
        >
          {checking ? '检测中...' : result ? '重新检测' : '开始检测'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-lg p-3 text-sm text-red-700 dark:text-red-300 mb-3">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-3">
          {/* 综合评分 */}
          <div className={`rounded-lg p-4 border-2 ${scoreBg(result.overallScore)}`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900">综合评分</span>
              <div className="flex items-center gap-2">
                {result.overallCompliant ? (
                  <span className="text-green-600 font-bold text-lg">✅ 合规</span>
                ) : (
                  <span className="text-red-600 font-bold text-lg">❌ 不合规</span>
                )}
                <span className={`font-bold text-2xl ${scoreColor(result.overallScore)}`}>
                  {result.overallScore}
                </span>
              </div>
            </div>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${result.overallScore >= 80 ? 'bg-green-500' : result.overallScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${result.overallScore}%` }}
              />
            </div>
          </div>

          {/* 问题列表 */}
          {result.results.flatMap(r => r.issues).length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-lg p-3">
              <h4 className="font-semibold text-red-900 dark:text-red-200 mb-2"> 发现的问题</h4>
              <ul className="space-y-1 text-sm text-red-700 dark:text-red-300">
                {result.results.flatMap(r => r.issues).map((issue, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 建议列表 */}
          {result.results.flatMap(r => r.suggestions).length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 rounded-lg p-3">
              <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">💡 优化建议</h4>
              <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                {result.results.flatMap(r => r.suggestions).map((suggestion, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">→</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 角度检测 */}
          {result.missingAngles.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 rounded-lg p-3">
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2"> 建议补充的角度</h4>
              <div className="flex gap-2 flex-wrap">
                {result.missingAngles.map((angle, i) => (
                  <span key={i} className="px-2 py-1 bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 rounded text-xs">
                    {angle}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          {!result.overallCompliant && result.overallScore < 80 && (
            <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 rounded-lg p-3 text-center">
              <p className="text-sm text-purple-700 dark:text-purple-300 mb-2">
                图片评分低于 80 分，上架可能被拒绝
              </p>
              <button
                onClick={() => alert('白底图生成功能即将上线')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition"
              >
                 自动生成白底图
              </button>
            </div>
          )}
        </div>
      )}

      {!result && !checking && !error && (
        <div className="text-center py-6 text-gray-500">
          <div className="text-3xl mb-2">🖼️</div>
          <div className="text-sm">点击「开始检测」分析图片质量</div>
          <div className="text-xs mt-1">检测白底/文字/居中/多角度 · 平均 2 秒</div>
        </div>
      )}
    </div>
  );
}
