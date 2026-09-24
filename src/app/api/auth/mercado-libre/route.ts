import { NextResponse } from 'next/server';
import { MELI_CONFIG } from '@/lib/config';
import { randomBytes } from 'crypto';

export async function GET() {
  // C1修复：生成随机state防CSRF，存入httpOnly cookie
  const state = randomBytes(16).toString('hex');
  const authUrl = new URL(MELI_CONFIG.authUrl);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', MELI_CONFIG.clientId);
  authUrl.searchParams.set('redirect_uri', MELI_CONFIG.redirectUri);
  authUrl.searchParams.set('state', state);

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10分钟过期
    path: '/api/auth/callback',
  });

  return response;
}
