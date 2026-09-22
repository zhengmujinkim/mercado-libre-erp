// Site configuration
export const SITES = {
  MLM: { name: '墨西哥', currency: 'MXN', flag: '🇲🇽' },
  MLB: { name: '巴西', currency: 'BRL', flag: '🇧🇷' },
  MLA: { name: '阿根廷', currency: 'ARS', flag: '🇦🇷' },
  MLC: { name: '智利', currency: 'CLP', flag: '🇨🇱' },
  MCO: { name: '哥伦比亚', currency: 'COP', flag: '🇨🇴' },
  MLU: { name: '乌拉圭', currency: 'UYU', flag: '🇺🇾' },
  MEC: { name: '哥斯达黎加', currency: 'CRC', flag: '🇨🇷' },
  MSV: { name: '萨尔瓦多', currency: 'USD', flag: '🇸🇻' },
  MPE: { name: '秘鲁', currency: 'PEN', flag: '🇵🇪' },
  MVE: { name: '委内瑞拉', currency: 'VES', flag: '🇻🇪' },
  MBO: { name: '玻利维亚', currency: 'BOB', flag: '🇧🇴' },
  MDO: { name: '多米尼加', currency: 'DOP', flag: '🇩🇴' },
  MPA: { name: '巴拿马', currency: 'PAB', flag: '🇵🇦' },
  MHN: { name: '洪都拉斯', currency: 'HNL', flag: '🇭🇳' },
  MNI: { name: '尼加拉瓜', currency: 'NIO', flag: '🇳🇮' },
  MPR: { name: '巴拉圭', currency: 'PYG', flag: '🇵🇾' },
  MEU: { name: '厄瓜多尔', currency: 'USD', flag: '🇪🇨' },
  MGT: { name: '危地马拉', currency: 'GTQ', flag: '🇬🇹' },
  MCR: { name: '古巴', currency: 'CUP', flag: '🇨🇺' },
  MHT: { name: '海地', currency: 'HTG', flag: '🇭🇹' },
} as const;

export type SiteCode = keyof typeof SITES;

// Type definitions
export interface ProductSize {
  l: number;
  w: number;
  h: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  weight: number;
  size: ProductSize;
  site: string;
  status: 'active' | 'paused' | 'reviewing' | 'closed';
  rating: number;
  soldRange: string;
  store: string;
}

export interface Order {
  id: string;
  orderId: string;
  buyer: string;
  product: string;
  amount: number;
  currency: string;
  status: 'paid' | 'shipped' | 'pending' | 'cancelled';
  shipping: string;
  date: string;
  site: string;
}

export interface HotItem {
  id: string;
  title: string;
  price: number;
  currency: string;
  rating: number;
  soldRange: string;
  store: string;
}

export interface Notification {
  id: string;
  topic: string;
  resource: string;
  userId: string;
  timestamp: string;
  site: string;
}

// API base URL
export function mlApiBase(country?: string): string {
  // CBT: all countries use the same API endpoint
  return 'https://api.mercadolibre.com';
}

// CBT OAuth credentials (read from environment variables)
export const MELI_CONFIG = {
  get clientId() { return process.env.MERCADO_LIBRE_CLIENT_ID || ''; },
  get clientSecret() { return process.env.MERCADO_LIBRE_CLIENT_SECRET || ''; },
  redirectUri: process.env.MERCADO_LIBRE_REDIRECT_URI || 'https://mercado-libre-erp.vercel.app/api/auth/callback',
  apiBase: 'https://api.mercadolibre.com',
  get userId() { return process.env.MELI_USER_ID || '3650205937'; },
  authUrl: 'https://global-selling.mercadolibre.com/authorization',
};
