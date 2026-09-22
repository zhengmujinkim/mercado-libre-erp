import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '美客多 ERP',
  description: '多站点跨境电商管理',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-64 p-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto z-50">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">🇲🇽 美客多 ERP</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">多站点跨境电商管理</p>
      </div>
      <div className="px-3 py-2">
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-2 mb-3">
          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Phase 2 - 多站点管理</span>
        </div>
      </div>
      <nav className="px-3 space-y-1">
        <NavItem href="/" icon="📊" label="数据看板" />
        <NavItem href="/products" icon="🔍" label="选品分析" />
        <NavItem href="/hot-ranking" icon="🔥" label="热销榜选品" />
        <NavItem href="/product-scorer" icon="🎯" label="智能选品评分" />
        <NavItem href="/selection-pool" icon="📋" label="待审选品池" />
        <NavItem href="/calculator" icon="🧮" label="利润计算器" />
        <NavItem href="/infringement-check" icon="⚠️" label="侵权检测" />
        <NavItem href="/listing" icon="📦" label="商品上架" />
        <NavItem href="/orders" icon="📋" label="订单管理" />
        <NavItem href="/inventory" icon="🏪" label="库存管理" />
        <NavItem href="/settings" icon="⚙️" label="系统设置" />
      </nav>
    </aside>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    >
      <span>{icon}</span>
      <span>{label}</span>
    </a>
  );
}
