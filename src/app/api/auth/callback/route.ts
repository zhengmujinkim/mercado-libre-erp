import { NextRequest, NextResponse } from 'next/server';
import { MELI_CONFIG } from '@/lib/config';
import { saveTokens } from '@/lib/token-store';

// C2修复：HTML实体转义函数，防止XSS
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  // C1修复：验证state防CSRF
  const cookieState = request.cookies.get('oauth_state')?.value;
  if (!state || !cookieState || state !== cookieState) {
    return new NextResponse(`
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head><meta charset="utf-8"><title>授权失败</title>
      <style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#111827;color:#fff}
      .card{background:#1f2937;padding:2rem;border-radius:1rem;max-width:400px;text-align:center}
      .error{color:#ef4444;margin:1rem 0}</style></head>
      <body><div class="card">
      <h1>❌ 授权失败</h1>
      <p class="error">CSRF验证失败，请重新授权</p>
      <a href="/" style="color:#3b82f6;text-decoration:underline">返回首页</a>
      </div></body></html>
    `, { status: 403, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  // 清除已使用的state cookie
  const clearState = NextResponse.next();
  clearState.cookies.delete('oauth_state');

  if (!code) {
    return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
  }

  try {
    const tokenResponse = await fetch(`${MELI_CONFIG.apiBase}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: MELI_CONFIG.clientId,
        client_secret: MELI_CONFIG.clientSecret,
        code,
        redirect_uri: MELI_CONFIG.redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      // C2修复：转义error和message，防止XSS
      const safeError = escapeHtml(String(tokenData.error || 'Unknown error'));
      const safeMessage = escapeHtml(String(tokenData.message || 'Token exchange failed'));
      
      return new NextResponse(`
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head><meta charset="utf-8"><title>授权失败</title>
        <style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#111827;color:#fff}
        .card{background:#1f2937;padding:2rem;border-radius:1rem;max-width:400px;text-align:center}
        .error{color:#ef4444;margin:1rem 0}</style></head>
        <body><div class="card">
        <h1>❌ 授权失败</h1>
        <p class="error">${safeError}: ${safeMessage}</p>
        <a href="/" style="color:#3b82f6;text-decoration:underline">返回首页</a>
        </div></body></html>
      `, { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
    
    // Save tokens to Vercel KV
    await saveTokens({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in || 21600,
      token_type: tokenData.token_type,
      scope: tokenData.scope,
      user_id: tokenData.user_id?.toString(),
    });

    // Redirect to home with success indicator
    return NextResponse.redirect(new URL('/?auth=success', request.url));
  } catch (error) {
    console.error('Token exchange error:', error);
    return new NextResponse(`
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head><meta charset="utf-8"><title>授权失败</title>
      <style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#111827;color:#fff}
      .card{background:#1f2937;padding:2rem;border-radius:1rem;max-width:400px;text-align:center}
      .error{color:#ef4444;margin:1rem 0}</style></head>
      <body><div class="card">
      <h1>❌ 授权失败</h1>
      <p class="error">网络错误，请重试</p>
      <a href="/" style="color:#3b82f6;text-decoration:underline">返回首页</a>
      </div></body></html>
    `, { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
}
