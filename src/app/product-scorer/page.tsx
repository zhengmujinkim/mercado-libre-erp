"use client";

import { useState, useEffect, useMemo } from 'react';
import { scoreProduct, SITE_PARAMS, EXAMPLE_PRODUCTS, ProductInput, ScoreResult, SiteId } from '@/lib/scorer';

const SITE_OPTIONS: { id: SiteId; name: string }[] = [
  { id: 'MLM', name: '🇲🇽 墨西哥' },
  { id: 'MLB', name: '🇧🇷 巴西' },
  { id: 'MLA', name: '🇦🇷 阿根廷' },
  { id: 'MLC', name: '🇨🇱 智利' },
  { id: 'MCO', name: '🇨🇴 哥伦比亚' },
  { id: 'MPE', name: '🇵🇪 秘鲁' },
  { id: 'MLU', name: '🇺🇾 乌拉圭' },
];

const STORAGE_KEY = 'ml_product_candidates';

const EMPTY: ProductInput = {
  name: '', site: 'MLM', category: '',
  monthlySearch: undefined, searchGrowthPct: undefined, onlineItems: undefined, topMonthlySales: undefined,
  cr10Pct: 50, medianReviews: undefined, newListings90d: undefined, competitorListingScore: 60, priceBandConcentrationPct: 60,
  purchasePriceCNY: undefined, sellingPriceUSD: undefined, priceBandFit: 'auto', costStability: 'stable',
  weightG: undefined, lengthCm: undefined, widthCm: undefined, heightCm: undefined, packaging: 'bubble', fragility: 'durable',
  ipRisk: 'none', certification: 'none', restricted: 'ok',
  repurchase: 'durable', leadTime: '15d', moq: '200-', qcDifficulty: 'normal',
};

type SavedCandidate = { input: ProductInput; result: ScoreResult; savedAt: string };

export default function ProductScorerPage() {
  const [form, setForm] = useState<ProductInput>({ ...EMPTY, ...EXAMPLE_PRODUCTS.blueOcean });
  const [candidates, setCandidates] = useState<SavedCandidate[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCandidates(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const persist = (list: SavedCandidate[]) => {
    setCandidates(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  const result = useMemo(() => scoreProduct(form), [form]);

  const set = <K extends keyof ProductInput>(key: K, value: ProductInput[K]) =>
    setForm(f => ({ ...f, [key]: value }));

  const num = (v: string) => (v === '' ? undefined : Number(v));

  const gradeColor = (g: string, vetoed?: boolean) => {
    if (vetoed || g === 'D') return 'bg-red-100 text-red-700 border-red-300';
    if (g === 'S') return 'bg-purple-100 text-purple-700 border-purple-300';
    if (g === 'A') return 'bg-green-100 text-green-700 border-green-300';
    if (g === 'B') return 'bg-blue-100 text-blue-700 border-blue-300';
    return 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const barColor = (s: number) => s >= 75 ? 'bg-green-500' : s >= 60 ? 'bg-blue-500' : s >= 40 ? 'bg-yellow-500' : 'bg-red-500';

  const saveCandidate = () => {
    if (!form.name) return alert('请先填写产品名称');
    const item: SavedCandidate = { input: { ...form }, result: scoreProduct({ ...form }), savedAt: new Date().toISOString() };
    persist([item, ...candidates]);
  };

  const removeCandidate = (i: number) => persist(candidates.filter((_, idx) => idx !== i));

  const loadCandidate = (c: SavedCandidate) => setForm({ ...c.input });

  const exportCSV = () => {
    if (!candidates.length) return;
    const header = ['产品名', '站点', '总分', '等级', '需求', '竞争', '利润', '物流', '合规', '供应链', '蓝海指数', '毛利率', '净利率', '否决原因'];
    const rows = candidates.map(c => [
      c.input.name, c.result.site, c.result.total, c.result.grade,
      ...c.result.dimensions.map(d => d.score.toFixed(0)),
      c.result.metrics['蓝海指数'], c.result.metrics['毛利率'], c.result.metrics['净利率'],
      c.result.vetoReasons.join(' / '),
    ]);
    const csv = [header, ...rows].map(r => r.map(x => `"${String(x ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `选品评分_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🎯 智能选品评分</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">6大维度 28项指标，填入产品数据自动打分（S/A/B/C/D五级），帮你先筛掉80%的坑</p>
        <div className="mt-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-300">
          数据可从美客多后台趋势榜、蓝鲸BI等工具或竞品页面估算。定性项不会填就保持默认，系统按中性值计分；自动爬取美客多数据将在数据源接通后上线。
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧表单 */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">产品信息</h2>
              <div className="flex gap-2">
                <button onClick={() => setForm({ ...EMPTY, ...EXAMPLE_PRODUCTS.blueOcean })} className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100">示例：蓝海品</button>
                <button onClick={() => setForm({ ...EMPTY, ...EXAMPLE_PRODUCTS.redOcean })} className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100">示例：红海品</button>
                <button onClick={() => setForm({ ...EMPTY, ...EXAMPLE_PRODUCTS.veto })} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">示例：侵权品</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="产品名称" full>
                <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="如：宠物自动喂食器" />
              </Field>
              <Field label="目标站点">
                <select className={inputCls} value={form.site} onChange={e => set('site', e.target.value as SiteId)}>
                  {SITE_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
              <Field label="类目">
                <input className={inputCls} value={form.category ?? ''} onChange={e => set('category', e.target.value)} placeholder="如：宠物用品" />
              </Field>
            </div>
            <p className="text-xs text-gray-400">本站点参考：佣金率 {Math.round(SITE_PARAMS[form.site].commission * 100)}%，头程运费约 ${SITE_PARAMS[form.site].shippingPerKg}/kg，黄金价格带 ${SITE_PARAMS[form.site].goldenPrice[0]}-${SITE_PARAMS[form.site].goldenPrice[1]}</p>
          </div>

          <Section title="📈 市场需求（25%）">
            <Field label="月搜索量（核心关键词之和）" hint="用西语/葡语关键词，trends API 或第三方工具">
              <input type="number" className={inputCls} value={form.monthlySearch ?? ''} onChange={e => set('monthlySearch', num(e.target.value))} placeholder="如 38000" />
            </Field>
            <Field label="月度搜索增长率（%）" hint="对比上月，可负">
              <input type="number" className={inputCls} value={form.searchGrowthPct ?? ''} onChange={e => set('searchGrowthPct', num(e.target.value))} placeholder="如 35" />
            </Field>
            <Field label="在线商品数" hint="搜索结果页在售链接数">
              <input type="number" className={inputCls} value={form.onlineItems ?? ''} onChange={e => set('onlineItems', num(e.target.value))} placeholder="如 520" />
            </Field>
            <Field label="头部商品月销量估计（件）">
              <input type="number" className={inputCls} value={form.topMonthlySales ?? ''} onChange={e => set('topMonthlySales', num(e.target.value))} placeholder="如 800" />
            </Field>
          </Section>

          <Section title="⚔️ 竞争格局（20%）">
            <Field label="头部集中度 CR10（%）" hint="TOP10销量÷TOP100销量，越低越好">
              <input type="number" className={inputCls} value={form.cr10Pct ?? ''} onChange={e => set('cr10Pct', num(e.target.value))} placeholder="默认50" />
            </Field>
            <Field label="TOP50 中位评论数（条）" hint="越低壁垒越小">
              <input type="number" className={inputCls} value={form.medianReviews ?? ''} onChange={e => set('medianReviews', num(e.target.value))} placeholder="如 40" />
            </Field>
            <Field label="90天新链接流入数（条）">
              <input type="number" className={inputCls} value={form.newListings90d ?? ''} onChange={e => set('newListings90d', num(e.target.value))} placeholder="如 18" />
            </Field>
            <Field label="竞品平均Listing质量分（0-100）" hint="竞品越差你越容易超越">
              <input type="number" className={inputCls} value={form.competitorListingScore ?? ''} onChange={e => set('competitorListingScore', num(e.target.value))} placeholder="默认60" />
            </Field>
            <Field label="价格带集中度（%）" hint="挤在同一价格带的比例">
              <input type="number" className={inputCls} value={form.priceBandConcentrationPct ?? ''} onChange={e => set('priceBandConcentrationPct', num(e.target.value))} placeholder="默认60" />
            </Field>
          </Section>

          <Section title="💰 利润空间（25%）">
            <Field label="采购价（¥，含国内运费前）">
              <input type="number" className={inputCls} value={form.purchasePriceCNY ?? ''} onChange={e => set('purchasePriceCNY', num(e.target.value))} placeholder="如 45" />
            </Field>
            <Field label="计划售价（$ 美元）" hint="CBT 以美元定价">
              <input type="number" className={inputCls} value={form.sellingPriceUSD ?? ''} onChange={e => set('sellingPriceUSD', num(e.target.value))} placeholder="如 25.99" />
            </Field>
            <Field label="价格带匹配" full>
              <select className={inputCls} value={form.priceBandFit} onChange={e => set('priceBandFit', e.target.value as ProductInput['priceBandFit'])}>
                <option value="auto">自动判断（按售价与本站黄金带）</option>
                <option value="in">在黄金价格带内</option>
                <option value="near">略偏离</option>
                <option value="far">严重偏离</option>
              </select>
            </Field>
            <Field label="采购价/汇率稳定性">
              <select className={inputCls} value={form.costStability} onChange={e => set('costStability', e.target.value as ProductInput['costStability'])}>
                <option value="stable">稳定（波动低于5%）</option>
                <option value="minor">小幅波动（5-15%）</option>
                <option value="major">波动较大（高于15%）</option>
              </select>
            </Field>
          </Section>

          <Section title="📦 物流适配（15%）">
            <Field label="产品重量（克，含包装）">
              <input type="number" className={inputCls} value={form.weightG ?? ''} onChange={e => set('weightG', num(e.target.value))} placeholder="如 450" />
            </Field>
            <Field label="包装尺寸 长×宽×高（cm）">
              <div className="grid grid-cols-3 gap-1">
                <input type="number" className={inputCls} value={form.lengthCm ?? ''} onChange={e => set('lengthCm', num(e.target.value))} placeholder="长" />
                <input type="number" className={inputCls} value={form.widthCm ?? ''} onChange={e => set('widthCm', num(e.target.value))} placeholder="宽" />
                <input type="number" className={inputCls} value={form.heightCm ?? ''} onChange={e => set('heightCm', num(e.target.value))} placeholder="高" />
              </div>
            </Field>
            <Field label="包装方式">
              <select className={inputCls} value={form.packaging} onChange={e => set('packaging', e.target.value as ProductInput['packaging'])}>
                <option value="opp">OPP袋（最简单）</option>
                <option value="bubble">气泡袋/纸盒</option>
                <option value="foam">泡沫内衬</option>
                <option value="special">特殊包装</option>
              </select>
            </Field>
            <Field label="抗损程度">
              <select className={inputCls} value={form.fragility} onChange={e => set('fragility', e.target.value as ProductInput['fragility'])}>
                <option value="durable">塑料/硅胶/布艺（耐造）</option>
                <option value="appliance">小家电</option>
                <option value="glass">玻璃/陶瓷（易碎）</option>
                <option value="precision">精密电子</option>
              </select>
            </Field>
          </Section>

          <Section title="⚖️ 合规风险（10%）— 三项为一票否决">
            <Field label="知识产权风险" full>
              <select className={inputCls} value={form.ipRisk} onChange={e => set('ipRisk', e.target.value as ProductInput['ipRisk'])}>
                <option value="none">无品牌通用款</option>
                <option value="low">低风险（擦边但无明确标识）</option>
                <option value="mid">中风险（可能涉及外观/商标）</option>
                <option value="high">高风险（知名品牌/IP/球星形象等，直接淘汰）</option>
              </select>
            </Field>
            <Field label="品类认证要求">
              <select className={inputCls} value={form.certification} onChange={e => set('certification', e.target.value as ProductInput['certification'])}>
                <option value="none">无需认证</option>
                <option value="simple">简单备案</option>
                <option value="testing">需检测认证（如巴西INMETRO/ANATEL）</option>
                <option value="unavailable">强制认证且无法获取（直接淘汰）</option>
              </select>
            </Field>
            <Field label="禁限售核查">
              <select className={inputCls} value={form.restricted} onChange={e => set('restricted', e.target.value as ProductInput['restricted'])}>
                <option value="ok">合规可售</option>
                <option value="gray">灰区（不确定）</option>
                <option value="forbidden">平台禁售（直接淘汰）</option>
              </select>
            </Field>
          </Section>

          <Section title="🔗 供应链与复购（5%）">
            <Field label="复购属性">
              <select className={inputCls} value={form.repurchase} onChange={e => set('repurchase', e.target.value as ProductInput['repurchase'])}>
                <option value="consumable">高频消耗（耗材/配件）</option>
                <option value="seasonal">季节性产品</option>
                <option value="durable">耐用品</option>
                <option value="onetime">一次性购买</option>
              </select>
            </Field>
            <Field label="供应商交期">
              <select className={inputCls} value={form.leadTime} onChange={e => set('leadTime', e.target.value as ProductInput['leadTime'])}>
                <option value="7d">现货7天内</option>
                <option value="15d">7-15天</option>
                <option value="30d">15-30天</option>
                <option value="30d+">30天以上</option>
              </select>
            </Field>
            <Field label="最小起订量 MOQ">
              <select className={inputCls} value={form.moq} onChange={e => set('moq', e.target.value as ProductInput['moq'])}>
                <option value="50-">50件以内</option>
                <option value="200-">50-200件</option>
                <option value="500-">200-500件</option>
                <option value="500+">500件以上</option>
              </select>
            </Field>
            <Field label="品控难度">
              <select className={inputCls} value={form.qcDifficulty} onChange={e => set('qcDifficulty', e.target.value as ProductInput['qcDifficulty'])}>
                <option value="easy">极简单</option>
                <option value="normal">一般</option>
                <option value="hard">较难</option>
                <option value="veryhard">极难</option>
              </select>
            </Field>
          </Section>
        </div>

        {/* 右侧结果 */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className={`rounded-xl border-2 p-6 ${gradeColor(result.grade, result.vetoed)}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm opacity-80">综合评分</div>
                <div className="text-5xl font-bold mt-1">{result.total}</div>
              </div>
              <div className="text-right">
                <span className="inline-block px-4 py-2 rounded-lg bg-white/60 dark:bg-black/20 font-bold text-lg">{result.gradeLabel}</span>
                {result.vetoed && <div className="text-xs mt-2 font-medium">⛔ 一票否决</div>}
              </div>
            </div>
            {result.vetoed && (
              <div className="mt-3 p-3 rounded-lg bg-white/70 dark:bg-black/20 text-xs space-y-1">
                {result.vetoReasons.map((r, i) => <div key={i}>• {r}</div>)}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="text-sm font-semibold mb-3">六维得分</h3>
            <div className="space-y-3">
              {result.dimensions.map(d => (
                <div key={d.key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-700 dark:text-gray-300">{d.label}<span className="text-gray-400 ml-1">{d.weight}%</span></span>
                    <span className="font-medium">{d.score.toFixed(0)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div className={`h-full rounded-full ${barColor(d.score)}`} style={{ width: `${Math.min(d.score, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="text-sm font-semibold mb-3">自动测算指标</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(result.metrics).map(([k, v]) => (
                <div key={k} className="flex justify-between p-2 rounded bg-gray-50 dark:bg-gray-800">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="text-sm font-semibold mb-2">建议</h3>
            <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              {result.suggestions.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="text-sm font-semibold mb-3">指标明细（28项）</h3>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {result.dimensions.map(d => (
                <div key={d.key}>
                  <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{d.label}</div>
                  {d.indicators.map(ind => (
                    <div key={ind.key} className="flex items-center justify-between text-xs py-1 border-b border-gray-50 dark:border-gray-800">
                      <span className="text-gray-500" title={ind.note}>{ind.label}：<span className="text-gray-400">{ind.value}</span></span>
                      <span className={`font-medium ${ind.score >= 60 ? 'text-green-600' : ind.score >= 30 ? 'text-yellow-600' : 'text-red-600'}`}>{ind.score.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <button onClick={saveCandidate} className="w-full py-3 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold text-sm">
            ⭐ 加入候选清单（{candidates.length}）
          </button>
        </div>
      </div>

      {/* 候选清单 */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">📋 我的候选清单（{candidates.length}）— 按总分排序</h2>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100">导出CSV</button>
            {candidates.length > 0 && (
              <button onClick={() => { if (confirm('确定清空候选清单？')) persist([]); }} className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200">清空</button>
            )}
          </div>
        </div>
        {candidates.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">还没有候选产品，填好左边表单点"加入候选清单"试试</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-800">
                  <th className="py-2 pr-3">排名</th>
                  <th className="py-2 pr-3">产品</th>
                  <th className="py-2 pr-3">站点</th>
                  <th className="py-2 pr-3">总分</th>
                  <th className="py-2 pr-3">等级</th>
                  {[...Array(6)].map((_, i) => <th key={i} className="py-2 pr-2 hidden md:table-cell">{['需求', '竞争', '利润', '物流', '合规', '供应'][i]}</th>)}
                  <th className="py-2 pr-3">蓝海</th>
                  <th className="py-2 pr-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {[...candidates].sort((a, b) => b.result.total - a.result.total).map((c, i) => (
                  <tr key={i} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-2 pr-3 font-bold text-gray-400">{i + 1}</td>
                    <td className="py-2 pr-3 max-w-[160px]">
                      <div className="font-medium truncate" title={c.input.name}>{c.input.name}</div>
                      {c.result.vetoed && <div className="text-red-500 text-[10px]">⛔ {c.result.vetoReasons[0]?.slice(0, 20)}</div>}
                    </td>
                    <td className="py-2 pr-3">{c.result.site}</td>
                    <td className="py-2 pr-3 font-bold text-base">{c.result.total}</td>
                    <td className="py-2 pr-3">
                      <span className={`px-2 py-0.5 rounded border ${gradeColor(c.result.grade, c.result.vetoed)}`}>{c.result.grade}</span>
                    </td>
                    {c.result.dimensions.map(d => <td key={d.key} className="py-2 pr-2 hidden md:table-cell">{d.score.toFixed(0)}</td>)}
                    <td className="py-2 pr-3">{c.result.metrics['蓝海指数']}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      <button onClick={() => loadCandidate(c)} className="text-blue-600 hover:underline mr-2">载入</button>
                      <button onClick={() => removeCandidate(candidates.indexOf(c))} className="text-red-500 hover:underline">删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const inputCls = "w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
      <h2 className="text-sm font-semibold mb-3">{title}</h2>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function Field({ label, hint, full, children }: { label: string; hint?: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
        {label}
        {hint && <span className="text-gray-400 ml-1">（{hint}）</span>}
      </label>
      {children}
    </div>
  );
}
