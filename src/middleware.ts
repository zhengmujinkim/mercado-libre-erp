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
