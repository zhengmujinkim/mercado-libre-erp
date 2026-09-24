import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 需要保护的写操作路径
const PROTECTED_PATHS = [
  '/api/publish',
  '/api/close-listings',
  '/api/ext',
  '/api/selection-pool',
  '/api/inventory',
  '/api/listing',
  '/api/image-process',
];

// 只读路径（允许匿名GET）
const READONLY_PATHS = [
  '/api/auth/status',
  '/api/auth/mercado-libre',
  '/api/auth/callback',
  '/api/hot-ranking',
  '/api/market-search',
  '/api/products',
  '/api/profit-calculator',
  '/api/selftest',
];

// 需要速率限制的热点API路径（消耗大量外部API调用）
const RATE_LIMITED_PATHS = [
  '/api/hot-ranking',
  '/api/market-search',
  '/api/image-process',
  '/api/smart-sourcing',
];

// 速率限制配置
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1分钟窗口
const RATE_LIMIT_MAX_REQUESTS = 10; // 每窗口最大请求数

// 内存中的速率限制存储（Edge Runtime兼容）
// 格式：Map<ip, timestamp[]>
const rateLimitStore = new Map<string, number[]>();

// 清理过期记录的辅助函数
function cleanupExpiredStore(now: number) {
  for (const [ip, timestamps] of rateLimitStore.entries()) {
    const valid = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
    if (valid.length === 0) {
      rateLimitStore.delete(ip);
    } else {
      rateLimitStore.set(ip, valid);
    }
  }
}

// 获取客户端IP
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

// 检查速率限制，返回 { allowed: boolean, remaining: number, resetMs: number }
function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();

  // 定期清理（每50次请求清理一次）
  if (rateLimitStore.size > 100) {
    cleanupExpiredStore(now);
  }

  const timestamps = rateLimitStore.get(ip) || [];
  const validTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    const oldestInWindow = validTimestamps[0];
    const resetMs = RATE_LIMIT_WINDOW_MS - (now - oldestInWindow);
    rateLimitStore.set(ip, validTimestamps);
    return { allowed: false, remaining: 0, resetMs };
  }

  validTimestamps.push(now);
  rateLimitStore.set(ip, validTimestamps);
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - validTimestamps.length, resetMs: RATE_LIMIT_WINDOW_MS };
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 静态资源、页面、API文档等直接放行
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname === '/' ||
    pathname.startsWith('/api/hello')
  ) {
    return NextResponse.next();
  }

  // 速率限制检查（针对热点API）
  const isRateLimited = RATE_LIMITED_PATHS.some(p => pathname.startsWith(p));
  if (isRateLimited) {
    const ip = getClientIp(request);
    const { allowed, remaining, resetMs } = checkRateLimit(ip);

    if (!allowed) {
      return NextResponse.json(
        { success: false, error: '请求过于频繁，请稍后再试' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(resetMs / 1000)),
            'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(resetMs / 1000)),
          },
        }
      );
    }

    // 通过时添加速率限制响应头
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(RATE_LIMIT_MAX_REQUESTS));
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    return response;
  }

  // 只读GET允许（但selection-pool/POST需保护）
  const isReadonly = READONLY_PATHS.some(p => pathname === p);
  const isWriteProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p));

  // 写操作需要认证
  if (isWriteProtected && request.method !== 'GET') {
    const authHeader = request.headers.get('authorization');
    const sessionToken = request.cookies.get('session_token')?.value;

    if (!authHeader && !sessionToken) {
      return NextResponse.json(
        { success: false, error: '需要认证' },
        { status: 401 }
      );
    }

    // 验证Authorization header（Bearer token）
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      if (!token || token.length < 10) {
        return NextResponse.json(
          { success: false, error: '无效的token' },
          { status: 401 }
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
