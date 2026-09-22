import { NextResponse } from 'next/server';
import { MELI_CONFIG } from '@/lib/config';

export async function GET() {
  const authUrl = new URL(MELI_CONFIG.authUrl);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', MELI_CONFIG.clientId);
  authUrl.searchParams.set('redirect_uri', MELI_CONFIG.redirectUri);
  authUrl.searchParams.set('state', 'CBT');

  return NextResponse.redirect(authUrl.toString());
}
