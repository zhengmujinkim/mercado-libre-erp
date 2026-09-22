import { NextRequest, NextResponse } from 'next/server';
import { kvGet, kvSet } from '@/lib/kv';

const KV_KEY = 'notifications';

interface Notification {
  id: string;
  topic: string;
  resource: string;
  userId: string;
  timestamp: string;
  site: string;
}

async function loadNotifications(): Promise<Notification[]> {
  const data = await kvGet<Notification[]>(KV_KEY);
  return data || [];
}

async function saveNotifications(items: Notification[]): Promise<void> {
  await kvSet(KV_KEY, items);
}

export async function GET() {
  const notifications = await loadNotifications();
  return NextResponse.json({
    notifications: notifications.slice(0, 200),
    total: notifications.length,
    latestAt: notifications.length > 0 ? notifications[0].timestamp : null,
    latestTopic: notifications.length > 0 ? notifications[0].topic : null,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const notification: Notification = {
      id: `N${Date.now()}`,
      topic: body.topic || 'unknown',
      resource: body.resource || '',
      userId: body.user_id || '',
      timestamp: new Date().toISOString(),
      site: body.site || 'MLM',
    };
    
    const notifications = await loadNotifications();
    notifications.unshift(notification);
    const trimmed = notifications.slice(0, 200);
    await saveNotifications(trimmed);

    return NextResponse.json({ received: true, id: notification.id });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
