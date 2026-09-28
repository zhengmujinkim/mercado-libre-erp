'use client';

import { useState } from 'react';

interface SceneResult {
  taskId: string;
  images: string[];
  count: number;
}

// 电商场景预设
const SCENE_PRESETS = [
  {
    label: '🪨 简约展台',
    prompt: 'professional product photography, product on minimalist stone podium, soft studio lighting, clean white gradient background, e-commerce style',
  },
  {
    label: '🏠 家居场景',
    prompt: 'product placed in modern minimalist home interior, warm natural lighting, cozy lifestyle scene, shallow depth of field',
  },
  {
    label: '🌿 自然户外',
    prompt: 'product in natural outdoor setting, green plants, natural sunlight, fresh and organic feeling, lifestyle photography',
  },
  {
    label: '🎨 纯色渐变',
    prompt: 'product on smooth gradient background, professional studio lighting, vibrant color, premium feel, commercial photography',
  },
  {
    label: '🏖️ 夏日沙滩',
    prompt: 'product on sandy beach background, ocean in background, bright summer sunlight, tropical vacation vibe, lifestyle shot',
  },
  {
    label: '🎄 节日氛围',
    prompt: 'product with festive decoration background, warm holiday lighting, gift boxes, seasonal atmosphere, commercial photography',
  },
  {
    label: '💎 高端质感',
    prompt: 'luxury product photography, dark elegant background, dramatic spotlight, premium feel, high-end commercial shot',
  },
  {
    label: '🌸 清新花卉',
    prompt: 'product surrounded by fresh flowers, soft pastel colors, gentle natural lighting, feminine aesthetic, beauty product photography',
  },
];

export default function SceneGenPage() {
  const [sourceImageUrl, setSourceImageUrl] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [imageCount, setImageCount] = useState(2);
  const [autoMatting, setAutoMatting] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SceneResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ url: string; prompt: string; time: string }>>([]);

  const selectPreset = (index: number) => {
    setSelectedPreset(index);
    setCustomPrompt(SCENE_PRESETS[index].prompt);
  };

  const handleGenerate = async () => {
    if (!sourceImageUrl.trim()) {
      setError('请输入产品图片 URL');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const prompt = selectedPreset !== null ? SCENE_PRESETS[selectedPreset].prompt : customPrompt;
      
      const res = await fetch('/api/wanx-bg-gen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceImageUrl: sourceImageUrl.trim(),
          prompt: prompt || undefined,
          n: imageCount,
          mode: autoMatting ? 'auto' : 'direct',
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        setResult(data);
        // 添加到历史
        const newHistory = data.images.map((url: string) => ({
          url,
          prompt: prompt || '默认',
          time: new Date().toLocaleTimeString('zh-CN'),
        }));
        setHistory(prev => [...newHistory, ...prev].slice(0, 20));
      } else {
        setError(data.error || '生成失败，请检查图片URL是否正确');
      }
    } catch (e: any) {
      setError(e.message || '网络错误');
    } finally {
      setLoading(false);
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🎨 AI 场景图生成</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          基于通义万相 · 上传产品白底图，AI 自动生成电商场景图
        </p>
      </div>

      {/* 输入区域 */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            产品图片 URL
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={sourceImageUrl}
              onChange={(e) => setSourceImageUrl(e.target.value)}
              placeholder="输入产品图片链接（建议白底图或透明底 PNG）"
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {sourceImageUrl && (
              <img
                src={sourceImageUrl}
                alt="预览"
                className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
          </div>
        </div>

        {/* 自动抠图开关 */}
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={autoMatting}
              onChange={(e) => setAutoMatting(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            自动抠图（非透明底图片建议开启）
          </span>
        </div>

        {/* 场景预设 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            选择场景风格
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {SCENE_PRESETS.map((preset, i) => (
              <button
                key={i}
                onClick={() => selectPreset(i)}
                className={`px-3 py-2 rounded-lg text-sm text-left transition border ${
                  selectedPreset === i
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* 自定义 Prompt */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            自定义描述（可选，覆盖预设）
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => {
              setCustomPrompt(e.target.value);
              setSelectedPreset(null);
            }}
            placeholder="描述你想要的场景，如：product on wooden desk with morning sunlight streaming through window"
            rows={2}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />
        </div>

        {/* 生成数量 */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">生成数量</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(n => (
              <button
                key={n}
                onClick={() => setImageCount(n)}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition ${
                  imageCount === n
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-400">（每张 0.08 元）</span>
        </div>

        {/* 生成按钮 */}
        <button
          onClick={handleGenerate}
          disabled={loading || !sourceImageUrl.trim()}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              生成中（通常需要30-60秒）...
            </>
          ) : (
            <>✨ 生成场景图</>
          )}
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-300">
          ⚠️ {error}
        </div>
      )}

      {/* 生成结果 */}
      {result && result.images.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 dark:text-white">
              🎉 生成完成（{result.count} 张）
            </h2>
            <span className="text-xs text-gray-400">Task: {result.taskId.slice(0, 12)}...</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.images.map((url, i) => (
              <div key={i} className="group relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <img
                  src={url}
                  alt={`场景图 ${i + 1}`}
                  className="w-full h-64 object-contain bg-gray-50 dark:bg-gray-800"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition">
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.open(url, '_blank')}
                      className="px-3 py-1.5 bg-white/90 text-gray-900 rounded-lg text-xs font-medium hover:bg-white transition"
                    >
                      🔍 查看原图
                    </button>
                    <button
                      onClick={() => copyUrl(url)}
                      className="px-3 py-1.5 bg-purple-600/90 text-white rounded-lg text-xs font-medium hover:bg-purple-600 transition"
                    >
                      📋 复制链接
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 历史记录 */}
      {history.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">📜 最近生成</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {history.slice(0, 10).map((item, i) => (
              <div key={i} className="group relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <img
                  src={item.url}
                  alt=""
                  className="w-full h-28 object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-black/50 px-2 py-1 opacity-0 group-hover:opacity-100 transition">
                  <span className="text-xs text-white truncate block">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="font-bold text-gray-900 dark:text-white mb-3">💡 使用指南</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">输入要求</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>产品图建议为白底图或透明底 PNG</li>
              <li>开启「自动抠图」可自动处理非透明底图片</li>
              <li>图片长边不超过 2048 像素</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">场景提示</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>选择预设场景快速生成</li>
              <li>自定义描述支持中英文</li>
              <li>英文效果通常更好，可加 &quot;professional product photography&quot; 前缀</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
