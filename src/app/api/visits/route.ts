import { NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/token-store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from') || '2026-09-01';
  const to = searchParams.get('to') || '2026-09-30';
  const userId = searchParams.get('userId') || '3650205937';

  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ error: 'No valid token' }, { status: 401 });
  }

  const res = await fetch(
    `https://api.mercadolibre.com/users/${userId}/items_visits?date_from=${from}&date_to=${to}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  return NextResponse.json(data);
}
