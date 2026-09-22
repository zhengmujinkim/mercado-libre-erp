import { NextResponse } from 'next/server';
import { getTokenStatus, refreshAccessToken } from '@/lib/token-store';
import { MELI_CONFIG } from '@/lib/config';

export async function GET() {
  try {
    const status = await getTokenStatus();

    // If token exists but expired, try auto-refresh
    if (status.hasToken && !status.isValid) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        const newStatus = await getTokenStatus();
        return NextResponse.json({
          ...newStatus,
          authUrl: `${MELI_CONFIG.authUrl}?response_type=code&client_id=${MELI_CONFIG.clientId}&redirect_uri=${encodeURIComponent(MELI_CONFIG.redirectUri)}`,
        });
      }
    }

    return NextResponse.json({
      ...status,
      authUrl: `${MELI_CONFIG.authUrl}?response_type=code&client_id=${MELI_CONFIG.clientId}&redirect_uri=${encodeURIComponent(MELI_CONFIG.redirectUri)}`,
    });
  } catch (error) {
    console.error('Auth status error:', error);
    return NextResponse.json({
      hasToken: false,
      isValid: false,
      expiresAt: null,
      expiresIn: 0,
      userId: null,
      authUrl: `${MELI_CONFIG.authUrl}?response_type=code&client_id=${MELI_CONFIG.clientId}&redirect_uri=${encodeURIComponent(MELI_CONFIG.redirectUri)}`,
      error: 'Failed to check token status',
    });
  }
}
