# 美客多 ERP - MercadoLibre Cross-Border E-Commerce ERP

多站点跨境电商管理系统，支持美客多(Mercado Libre) CBT跨境卖家模式。

## ✨ 功能特性

- 📊 **数据看板** - 选品池概览与利润分析
- 🔍 **选品分析** - 管理候选商品，评估利润空间
- 🔥 **热销榜选品** - 类目热销Top20 + 热搜词 + 竞品监控
- 🧮 **利润计算器** - 轻小件商品成本计算
- ⚠️ **侵权检测** - 品牌词/关键词6维度检测
- 📦 **商品上架** - 多站点批量上架管理
- 📋 **订单管理** - 订单列表、状态跟踪
- 🏪 **库存管理** - 多站点库存统一管理
- ⚙️ **系统设置** - 汇率/佣金/物流参数配置 + API连接

## 🛠 技术栈

- **Next.js 15+** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **pnpm** 包管理器

## 🚀 快速开始

```bash
# 安装依赖
pnpm install

# 复制环境变量
cp .env.example .env.local

# 启动开发服务器
pnpm dev
```

访问 http://localhost:3000

## 🌎 支持站点

| 站点 | 国家 | 货币 |
|------|------|------|
| MLM | 🇲🇽 墨西哥 | MXN |
| MLB | 🇧🇷 巴西 | BRL |
| MLA | 🇦🇷 阿根廷 | ARS |
| MLC | 🇨🇱 智利 | CLP |
| MCO | 🇨🇴 哥伦比亚 | COP |
| MPE | 🇵🇪 秘鲁 | PEN |
| MLU | 🇺🇾 乌拉圭 | UYU |

## 🔐 CBT跨境授权

使用 Global Selling 统一授权入口，一次授权后所有站点自动生效。

授权URL: `https://global-selling.mercadolibre.com/authorization`

## 📡 API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/mercado-libre` | GET | 发起OAuth授权 |
| `/api/auth/callback` | GET | OAuth回调处理 |
| `/api/auth/status` | GET | 查询授权状态 |
| `/api/trends` | GET | 热搜词 |
| `/api/hot-ranking` | GET | 类目热销 |
| `/api/market-search` | GET | 市场搜索 |
| `/api/notifications` | GET/POST | Webhook通知 |
| `/api/products` | GET/POST | 商品数据 |
| `/api/orders` | GET | 订单数据 |
| `/api/listing` | GET/POST | 上架操作 |
| `/api/inventory` | GET/POST | 库存同步 |
| `/api/profit-calculator` | POST | 利润计算 |

## 📦 环境变量

```env
MERCADO_LIBRE_CLIENT_ID=your_client_id
MERCADO_LIBRE_CLIENT_SECRET=your_client_secret
MERCADO_LIBRE_REDIRECT_URI=https://your-domain.com/api/auth/callback
MERCADO_LIBRE_MOCK=true  # false for real API
```

## 🚢 部署到 Vercel

1. Fork 此仓库
2. 在 Vercel 导入项目
3. 设置环境变量
4. 部署

## 📄 License

MIT
