# 美客多 ERP 编程任务清单

> 创建时间：2026-10-05  
> 创建者：小银（主 Agent）  
> 项目：美客多跨境 ERP 系统

---

## 一、项目背景

### 1.1 项目信息
- **GitHub 仓库**：https://github.com/zhengmujinkim/mercado-libre-erp
- **技术栈**：Next.js 15+ / React 19 / TypeScript / Tailwind CSS 4
- **部署平台**：Coze 平台 + Vercel
- **ML 账号**：CBT 跨境卖家（User ID: 3650205937）

### 1.2 两个域名问题

| 域名 | 平台 | 状态 | 功能 |
|------|------|------|------|
| **mercado-libre-erp.vercel.app** | Vercel | 旧部署 | 智能选品评分/待审选品池/1688 图片采集/AI 场景图/利润计算器 |
| **56p2bxk5pw.coze.site** | Coze | 新部署（有 bug） | 数据看板/订单管理/商品管理/站点分布/商品状态 |

**问题原因**：
- 早期项目在 Vercel 直接部署，实现了选品分析等功能
- 后来接入 Coze 平台重新部署，分配了 `coze.site` 域名
- 两个部署共用同一 GitHub 仓库，但**部署历史不同步**
- Coze 部署系统有 bug：不拉取 GitHub 最新 commit，一直用旧代码

**需要编程专家处理**：
1. 统一两个域名的功能，确保所有页面在两个域名都能访问
2. 或者明确哪个是主域名，把功能集中到一个部署

---

## 二、已完成修复

### 2.1 订单 API 端点修复（2026-10-04）

**问题**：订单 API 返回 403 或空数组，订单总数显示 0

**原因**：使用了本地卖家端点 `/orders/search`，CBT 跨境卖家需要用 `/marketplace/orders/search`

**修复内容**：
```typescript
// 文件：src/app/api/orders/route.ts

// 修复前（错误）
`${MELI_CONFIG.apiBase}/orders/search?seller=${MELI_CONFIG.userId}`

// 修复后（正确）
`${MELI_CONFIG.apiBase}/marketplace/orders/search?seller=${MELI_CONFIG.userId}`
```

**提交记录**：
- commit `eb799be`：fix: 使用 CBT 专用订单 API 端点 /marketplace/orders/search
- 已推送 GitHub，但 Coze 部署系统未同步

**验证**：
- ML API 测试确认账号有 2 单巴西站订单（订单 ID: 2000015250972937, 2000015236762291）
- 商品：MLB5276090987

---

## 三、待处理任务

### 3.1 高优先级

#### 任务 1：解决 Coze 部署不同步问题
**描述**：Coze 部署系统一直用旧 commit `df0894b`，不拉最新代码 `eb799be` 和 `b057d92`

**可能方案**：
1. 在 Coze 平台手动触发"同步 GitHub"或"重新部署"
2. 检查 Coze 项目配置，确认绑定的 GitHub 仓库和分支是否正确
3. 如果 Coze 平台无法解决，考虑完全迁移到 Vercel 部署

**验收标准**：
- `coze site` 域名能正确显示订单数据
- API 返回非空订单列表

---

#### 任务 2：统一两个域名的功能
**描述**：两个域名功能不一致，用户困惑

**方案 A**（推荐）：以 `coze.site` 为主域名
- 把 Vercel 上的功能（选品评分/待审池/图片采集/AI 场景图）迁移到 Coze 部署
- 确保所有页面在 `coze.site` 都能访问
- 可以设置 `vercel.app` 重定向到 `coze.site`

**方案 B**：以 `vercel.app` 为主域名
- 在 Vercel 上部署完整功能
- 需要解决 Vercel 部署的 token/环境变量问题

**验收标准**：
- 用户只访问一个域名就能看到所有功能
- 没有功能缺失或重复

---

### 3.2 中优先级

#### 任务 3：订单详情页
**描述**：当前只有订单列表，没有订单详情页

**需要实现**：
- 点击订单号跳转到详情页
- 显示订单完整信息（商品、买家、物流、付款状态）
- 支持订单操作（发货、打印面单等）

**API 参考**：
- 订单详情：`GET /orders/{order_id}`
- 物流信息：`GET /orders/{order_id}/shipments`

---

#### 任务 4：订单实时推送
**描述**：当前订单是手动刷新，没有实时推送

**需要实现**：
- 接入 ML Webhooks 或轮询机制
- 新订单到达时自动更新数据看板
- 可选：浏览器通知或邮件提醒

---

### 3.3 低优先级

#### 任务 5：多站点订单筛选
**描述**：当前订单混合显示所有站点

**需要实现**：
- 按站点筛选订单（巴西/墨西哥/阿根廷等）
- 按商品筛选订单
- 按时间范围筛选

---

#### 任务 6：订单导出
**描述**：支持导出订单数据

**需要实现**：
- 导出为 Excel/CSV
- 支持自定义字段
- 支持批量导出

---

## 四、关键代码位置

### 4.1 订单相关
```
src/app/api/orders/route.ts          # 订单 API
src/app/orders/page.tsx              # 订单管理页面
src/app/page.tsx                     # 数据看板（调用订单 API）
```

### 4.2 授权相关
```
src/lib/token-store.ts               # Token 存储/刷新
src/app/api/auth/status/route.ts     # 授权状态检查
src/app/api/auth/callback/route.ts   # OAuth 回调
```

### 4.3 配置相关
```
src/lib/config.ts                    # ML API 配置
.env.local                           # 环境变量（本地开发）
```

---

## 五、环境变量

### 5.1 必要变量
```env
MERCADO_LIBRE_CLIENT_ID=1167380097326946
MERCADO_LIBRE_CLIENT_SECRET=8nMYwpYkIDjVjh4ihHsWAtlt8x4Xn7qG
MERCADO_LIBRE_REDIRECT_URI=https://56p2bxk5pw.coze.site/api/auth/callback
MELI_USER_ID=3650205937
```

### 5.2 可选变量
```env
# 阿里云（AI 出图）
ALIYUN_ACCESS_KEY_ID=xxx
ALIYUN_ACCESS_KEY_SECRET=xxx

# Vercel 部署
VERCEL_OIDC_TOKEN=xxx
```

---

## 六、测试账号

- **ML 账号**：CBT 跨境卖家
- **User ID**：3650205937
- **站点**：巴西（MLB）、墨西哥（MLM）等
- **授权状态**：已连接（token 有效期约 6 小时）

---

## 七、已知问题

### 7.1 Coze 部署 bug
- **现象**：Coze 部署系统不拉取 GitHub 最新代码
- **影响**：修复的订单 API 无法上线
- **临时方案**：在 Coze 平台手动触发重新部署

### 7.2 订单 API 权限
- **现象**：client_credentials token 无法访问订单详情
- **影响**：只能获取订单列表，无法获取完整详情
- **解决**：需要用 authorization_code 获取的 token（用户授权后）

### 7.3 两个域名功能不一致
- **现象**：vercel.app 和 coze.site 功能不同
- **影响**：用户困惑，体验割裂
- **解决**：统一到一个域名

---

## 八、参考资料

- ML 官方 API 文档：https://global-selling.mercadolibre.com/devsite/
- CBT 订单 API：`GET /marketplace/orders/search`
- 项目 README：`/Coze/Drive/扣子/所有对话/主对话/mercado-libre-erp/README.md`

---

## 九、联系方式

如有问题，联系主 Agent（小银）或用户（小金）。
