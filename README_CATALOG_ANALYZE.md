# Catalog 竞争分析功能集成完成

##  已创建文件

### 1. TypeScript 核价引擎
**文件**: `lib/catalog-analyzer.ts`
- 完整移植 Python 版核价逻辑到 TypeScript
- 直接在 Next.js 中运行，无需 Python 依赖
- 导出函数：
  - `calculateWeight()` - 计算体积重/计费重
  - `estimateInternationalShipping()` - 估算国际运费
  - `calculatePricing()` - 完整核价计算
  - `generateRecommendation()` - 生成操作建议

### 2. API 路由
**文件**: `app/api/catalog-analyze/route.ts`
- POST 接口，接收商品参数
- 自动调用 ML API 搜索竞品
- 批量获取商品详情（每次 20 个）
- 返回完整分析报告（成本、竞品、竞争力评估）

**请求示例**:
```json
POST /api/catalog-analyze
{
  "keyword": "cobertor ponderado 7kg",
  "product_name_cn": "7kg 重力毯",
  "package_weight_g": 7500,
  "package_l_cm": 42,
  "package_w_cm": 32,
  "package_h_cm": 12,
  "purchase_cost_cny": 52,
  "site_id": "MLB",
  "competitor_limit": 20
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "keyword": "cobertor ponderado 7kg",
    "product_name_cn": "7kg 重力毯",
    "site_id": "MLB",
    "weight_analysis": {
      "volume_weight_g": 2688,
      "billable_weight_g": 7500,
      "is_oversized": false
    },
    "pricing": {
      "purchase_cost_cny": 52,
      "total_cost_cny": 226.74,
      "min_price_brl": 175.95,
      "suggested_price_brl": 248.07
    },
    "competition": {
      "total_results": 922,
      "competitors": [...],
      "buy_box_winner": {...},
      "avg_price_brl": 650.5,
      "min_price_brl": 418,
      "catalog_ratio": 0.3
    },
    "competitiveness": {
      "is_competitive": true,
      "profit_margin": 0.25,
      "win_probability": "🟢 高（价格优势 >10%）",
      "recommendations": [...]
    }
  }
}
```

### 3. 前端页面
**文件**: `app/catalog-analyze/page.tsx`
- 完整的分析界面
- 输入表单：关键词、重量、尺寸、采购价、站点选择
- 结果展示：
  - 包裹规格（实际重/体积重/计费重）
  - 成本明细（采购价/运费/佣金/总成本）
  - 定价分析（保本价/建议价/竞品价）
  - 竞争力评估（胜率/利润率）
  - 竞品列表（Top 5 + Buy Box 赢家）
  - 操作建议

##  部署步骤

### 1. 确认环境变量
在 Vercel 项目设置中确认以下环境变量已配置：
```
ML_CLIENT_ID=1167380097326946
ML_CLIENT_SECRET=8nMYwpYkIDjVjh4ihHsWAtlt8x4Xn7qG
ML_USER_ID=3650205937
```

### 2. 推送代码到 GitHub
```bash
cd mercado-libre-erp
git add lib/catalog-analyzer.ts
git add app/api/catalog-analyze/route.ts
git add app/catalog-analyze/page.tsx
git commit -m "feat: add Catalog competition analysis feature"
git push origin main
```

### 3. Vercel 自动部署
推送后 Vercel 会自动构建和部署，约 2-3 分钟完成。

### 4. 访问新页面
部署完成后访问：
```
https://mercado-libre-erp.vercel.app/catalog-analyze
```

##  功能测试

### 测试用例 1: 7kg 重力毯
- 关键词：`cobertor ponderado 7kg`
- 重量：7500g
- 尺寸：42×32×12cm
- 采购价：¥52
- **预期结果**: 竞争力 ✅，建议价 R$248 vs 竞品 R$418

### 测试用例 2: 化妆刷套装
- 关键词：`kit 12 pinceis de maquiagem`
- 重量：250g
- 尺寸：20×15×5cm
- 采购价：¥12
- **预期结果**: 需查看竞品价格判断

### 测试用例 3: 超大包装警示
- 关键词：任意
- 重量：250g
- 尺寸：30×25×15cm（过大盒子）
- 采购价：¥10
- **预期结果**: ⚠️ 体积重过大提示

##  后续优化

### 高优先级
1. **真实佣金率** - 从 ML API `get_listing_fees` 获取实际类目佣金
2. **真实运费** - 从 ML API `get_shipping_cost` 获取实际运费
3. **1688 自动采价** - 接入 1688 开放平台 API 或优化 web_search 方案

### 中优先级
4. **批量分析** - 支持一次分析多个商品
5. **历史记录** - 保存分析结果到数据库
6. **导出报告** - 支持导出 PDF/Excel

### 低优先级
7. **Catalog 上架** - 一键创建 Catalog Listing
8. **价格监控** - 定期监控竞品价格变化
9. **智能选品** - 基于分析结果自动推荐高利润品

##  注意事项

1. **API 限流**: ML API 有速率限制（约 100 次/分钟），批量分析时需控制频率
2. **Token 刷新**: Access Token 有效期 6 小时，API 路由会自动刷新
3. **体积重警示**: 计费重 = max(实际重，体积重)，包装过大会导致运费暴涨
4. **佣金率**: 默认 14%，实际因类目而异（10%-19%）
5. **汇率**: 默认 0.776 (CNY→BRL)，建议定期更新

##  文件清单

```
mercado-libre-erp/
├── lib/
│   └── catalog-analyzer.ts          # ✅ 新增
├── app/
│   ├── api/
│   │   └── catalog-analyze/
│   │       └── route.ts             # ✅ 新增
│   └── catalog-analyze/
│       └── page.tsx                 # ✅ 新增
└── README_CATALOG_ANALYZE.md        # ✅ 本文档
```

---

**创建时间**: 2026-10-01
**版本**: v1.0.0
**状态**: ✅ 开发完成，待部署
