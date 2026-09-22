import { NextRequest, NextResponse } from 'next/server';

// In-memory notification store (max 200)
let notifications: Array<{
  id: string;
  topic: string;
  resource: string;
  userId: string;
  timestamp: string;
  site: string;
}> = [];

export async function GET() {
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
    const notification = {
      id: `N${Date.now()}`,
      topic: body.topic || 'unknown',
      resource: body.resource || '',
      userId: body.user_id || '',
      timestamp: new Date().toISOString(),
      site: body.site || 'MLM',
    };
    
    notifications.unshift(notification);
    if (notifications.length > 200) {
      notifications = notifications.slice(0, 200);
    }

    return NextResponse.json({ received: true, id: notification.id });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
