'use client';
import { useState } from 'react';

import ImageCheckPanel from '@/components/ImageCheckPanel';
interface PublishResult {
  success: boolean;
  itemId?: string;
  permalink?: string;
  pictures?: number;
  sites?: string[];
  message?: string;
  error?: string;
}

const SITE_OPTIONS = [
  { id: 'MLB', flag: '🇧🇷', name: '巴西' },
  { id: 'MLM', flag: '🇲🇽', name: '墨西哥' },
  { id: 'MLA', flag: '🇦🇷', name: '阿根廷' },
  { id: 'MLC', flag: '🇨🇱', name: '智利' },
  { id: 'MCO', flag: '🇨🇴', name: '哥伦比亚' },
  { id: 'MLU', flag: '🇺🇾', name: '乌拉圭' },
];

export default function PublishPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PublishResult | null>(null);

  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [netProceeds, setNetProceeds] = useState('');
  const [stock, setStock] = useState('100');
  const [imageUrls, setImageUrls] = useState('');
  const [sites, setSites] = useState<string[]>(['MLB']);

  const toggleSite = (id: string) => {
    setSites(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const urls = imageUrls.split('\n').map(s => s.trim()).filter(Boolean);
  const [imageCheckOpen, setImageCheckOpen] = useState(false);

  const handleSubmit = async () => {
  const [imageCheckOpen, setImageCheckOpen] = useState(false);

    if (!categoryId || !title || !netProceeds || urls.length === 0 || sites.length === 0) {
      alert('请填写 CBT品类、标题、净收益，至少1个站点和1张图片URL');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: categoryId.trim(),
          title,
          description,
          net_proceeds: parseFloat(netProceeds),
          available_quantity: parseInt(stock),
          images: urls,
          sites,
        }),
      });
      setResult(await res.json());
    } catch {
      setResult({ success: false, error: '网络错误，请重试' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setResult(null);
    setCategoryId(''); setTitle(''); setDescription('');
    setNetProceeds(''); setStock('100'); setImageUrls('');
    setSites(['MLB']);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">发布全球商品</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          CBT / User Products 模式 · 净收益定价(USD) · 多站点同步 · 图片需为公网可访问URL
        </p>
      </div>

      {result?.success ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">发布成功</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{result.message}</p>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-left text-sm space-y-1 mb-6">
            {result.itemId && <p className="text-gray-900 dark:text-white">商品ID：<span className="font-mono">{result.itemId}</span></p>}
            <p className="text-gray-600 dark:text-gray-400">图片：{result.pictures} 张</p>
            <p className="text-gray-600 dark:text-gray-400">站点：{(result.sites || []).join(' / ')}</p>
            {result.permalink && <a href={result.permalink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{result.permalink}</a>}
          </div>
          <button onClick={resetForm} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">继续发布</button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">
          {/* CBT品类 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">CBT 品类 ID <span className="text-red-500">*</span></label>
            <input value={categoryId} onChange={e => setCategoryId(e.target.value)} placeholder="如 CBT1659"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
          </div>

          {/* 标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">标题（葡/西语，≤60字）<span className="text-red-500">*</span></label>
            <input value={title} onChange={e => setTitle(e.target.value.slice(0, 60))}
              placeholder="如 Placa De Captura De Vídeo Hdmi 1080p"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            <p className="text-xs text-gray-500 mt-1">{title.length}/60</p>
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">商品描述</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              placeholder="产品特点、尺寸、材质等..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
          </div>

          {/* 净收益 + 库存 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">净收益 (USD) <span className="text-red-500">*</span></label>
              <input type="number" value={netProceeds} onChange={e => setNetProceeds(e.target.value)} placeholder="如 14.99" step="0.01" min="0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">库存数量</label>
              <input type="number" value={stock} onChange={e => setStock(e.target.value)} min="1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            </div>
          </div>

          {/* 站点 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">目标站点 <span className="text-red-500">*</span></label>
            <div className="flex flex-wrap gap-2">
              {SITE_OPTIONS.map(s => (
                <button key={s.id} type="button" onClick={() => toggleSite(s.id)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    sites.includes(s.id)
                      ? 'bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-gray-300 dark:border-gray-700 text-gray-500'
                  }`}>
                  {s.flag} {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* 图片URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">产品图片 URL <span className="text-red-500">*</span>（每行一个，建议5张）</label>
            <textarea value={imageUrls} onChange={e => setImageUrls(e.target.value)} rows={4}
              placeholder={'https://..../img1.jpg\nhttps://..../img2.jpg'}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-xs" />
            <p className="text-xs text-gray-500 mt-1">已识别 {urls.length} 个链接 · 图片须为公网可访问、≥500px、纯色背景、无文字水印</p>
          </div>

          {result && !result.success && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-red-600 dark:text-red-400 text-sm">发布失败：{result.error}</p>
            </div>
          )}

          {/* 图片检测面板 */}
          <ImageCheckPanel images={urls} />


          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50">
            {loading ? '发布中...' : '确认发布'}
          </button>
        </div>
      )}
    </div>
  );
}
