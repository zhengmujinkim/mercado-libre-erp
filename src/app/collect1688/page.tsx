'use client';

import { useEffect, useState, useCallback } from 'react';

interface CollectedImage {
  rawUrl: string;
  url: string;
  role: string;
  aiRole?: string;
  width?: number;
  height?: number;
  bytes?: number;
  ok: boolean;
  sameProduct?: boolean;
  issues?: string[];
}

interface CollectRecord {
  id: string;
  productId?: string;
  offerId: string;
  pageUrl: string;
  title?: string;
  images: CollectedImage[];
  status: 'pending' | 'confirmed' | 'rejected';
  collectedAt: string;
  confirmedAt?: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '待确认', color: 'text-amber-300', bg: 'bg-amber-500/10' },
  confirmed: { label: '已确认', color: 'text-emerald-300', bg: 'bg-emerald-500/10' },
  rejected: { label: '已驳回', color: 'text-red-300', bg: 'bg-red-500/10' },
};

const roleLabel: Record<string, { label: string; color: string }> = {
  main: { label: '主图', color: 'bg-blue-500/20 text-blue-300' },
  sku: { label: '规格', color: 'bg-purple-500/20 text-purple-300' },
  detail: { label: '细节', color: 'bg-cyan-500/20 text-cyan-300' },
  scene: { label: '场景', color: 'bg-teal-500/20 text-teal-300' },
  unknown: { label: '未分类', color: 'bg-gray-500/20 text-gray-300' },
};

export default function Collect1688Page() {
  const [records, setRecords] = useState<Record<string, CollectRecord>>({});
  const [loading, setLoading] = useState(true);
  const [productId, setProductId] = useState('');
  const [script, setScript] = useState('');
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/collect1688/receive', { cache: 'no-store' });
      const data = await res.json();
      setRecords(data.records || {});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const genScript = useCallback(async () => {
    const qs = productId ? `?productId=${encodeURIComponent(productId.trim())}` : '';
    const res = await fetch(`/api/collect1688/script${qs}`);
    const data = await res.json();
    setScript(data.script || '');
    setCopied(false);
  }, [productId]);

  const copyScript = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard 可能不可用 */
    }
  }, [script]);

  const review = useCallback(
    async (id: string, action: 'confirm' | 'reject') => {
      setBusy(id);
      try {
        await fetch('/api/collect1688/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, action }),
        });
        await load();
      } finally {
        setBusy(null);
      }
    },
    [load],
  );

  const list = Object.values(records).sort(
    (a, b) => +new Date(b.collectedAt) - +new Date(a.collectedAt),
  );
  const pending = list.filter((r) => r.status === 'pending').length;
  const confirmed = list.filter((r) => r.status === 'confirmed').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">1688 图片自动采集</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          云手机登录 1688 → 打开商品页 → 地址栏运行脚本 → 图片自动下载、分类、同款校验 → 在此确认入库。所有图片来自同一商品页，从源头保证同款一致。
        </p>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="采集记录" value={list.length} tone="text-gray-900 dark:text-white" />
        <StatCard label="待确认" value={pending} tone="text-amber-500" />
        <StatCard label="已确认入库" value={confirmed} tone="text-emerald-500" />
      </div>

      {/* 脚本生成器 */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">① 生成采集脚本</h2>
        <div className="flex gap-2">
          <input
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            placeholder="选品编号，如 p01（可留空，系统按 offer 自动反查）"
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100"
          />
          <button
            onClick={genScript}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
          >
            生成脚本
          </button>
        </div>
        {script && (
          <div className="space-y-2">
            <textarea
              readOnly
              value={script}
              rows={5}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-mono text-gray-700 dark:text-gray-300"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={copyScript}
                className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-200"
              >
                {copied ? '✅ 已复制' : '复制脚本'}
              </button>
              <span className="text-xs text-gray-500">
                在云手机商品页地址栏粘贴回车；标题变 <code className="text-emerald-500">OK_下载数/总数</code> 即成功
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 采集记录 */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">② 采集记录审核</h2>
        {loading && <p className="text-sm text-gray-500">加载中…</p>}
        {!loading && list.length === 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center text-sm text-gray-500">
            暂无采集记录，先在云手机上运行脚本采集一个商品。
          </div>
        )}

        {list.map((r) => {
          const ok = r.images.filter((i) => i.ok).length;
          const suspect = r.images.filter((i) => i.sameProduct === false || i.issues?.length).length;
          const cfg = statusConfig[r.status];
          return (
            <div
              key={r.id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    {r.productId && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300">
                        {r.productId}
                      </span>
                    )}
                    <span className="text-xs text-gray-400 font-mono">{r.offerId}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 truncate">
                    {r.title || '（未取到标题）'}
                  </p>
                  <a
                    href={r.pageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-500 hover:underline break-all"
                  >
                    {r.pageUrl}
                  </a>
                </div>
                <div className="text-right text-xs text-gray-500 shrink-0">
                  <div>可下载 {ok}/{r.images.length}</div>
                  {suspect > 0 && <div className="text-red-400">⚠ {suspect} 张存疑</div>}
                </div>
              </div>

              {/* 图片网格 */}
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {r.images.map((img, i) => {
                  const rc = roleLabel[img.aiRole || img.role] || roleLabel.unknown;
                  const bad = img.sameProduct === false;
                  return (
                    <div
                      key={i}
                      className={`relative group rounded-lg overflow-hidden border ${
                        bad ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                      } bg-gray-50 dark:bg-gray-800`}
                      title={(img.issues || []).join('；')}
                    >
                      <div className="aspect-square flex items-center justify-center">
                        {img.ok ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <span className="text-xs text-red-400 px-1 text-center">下载失败</span>
                        )}
                      </div>
                      <span
                        className={`absolute top-1 left-1 text-[10px] px-1 rounded ${rc.color}`}
                      >
                        {rc.label}
                      </span>
                      {bad && (
                        <span className="absolute bottom-1 right-1 text-[10px] px-1 rounded bg-red-500 text-white">
                          非同款
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {r.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    disabled={busy === r.id}
                    onClick={() => review(r.id, 'confirm')}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium"
                  >
                    确认入库
                  </button>
                  <button
                    disabled={busy === r.id}
                    onClick={() => review(r.id, 'reject')}
                    className="px-4 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-200"
                  >
                    驳回
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <div className={`text-2xl font-bold ${tone}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}
