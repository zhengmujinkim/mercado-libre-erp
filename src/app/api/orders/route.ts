import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/token-store';
import { MELI_CONFIG } from '@/lib/config';

function mapOrderStatus(status: string): string {
  const map: Record<string, string> = {
    'paid': 'paid',
    'confirmed': 'paid',
    'paid_pending_for_pickup': 'paid',
    'shipped': 'shipped',
    'delivered': 'shipped',
    'handling': 'shipped',
    'ready_to_ship': 'shipped',
    'not_yet_shipped': 'paid',
    'cancelled': 'cancelled',
    'invalid': 'cancelled',
  };
  return map[status] || 'pending';
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  try {
    const token = await getAccessToken();
    if (!token) {
      return NextResponse.json({ orders: [], total: 0, mock: false, message: '请先完成美客多授权' });
    }

    // Try multiple search endpoints for CBT compatibility
    let data: Record<string, unknown> = {};
    let apiSuccess = false;

    // Endpoint 1: /orders/search with seller param
    const res1 = await fetch(
      `${MELI_CONFIG.apiBase}/orders/search?seller=${MELI_CONFIG.userId}&sort=date_desc&limit=50`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }
    );

    if (res1.ok) {
      data = await res1.json();
      apiSuccess = true;
    }

    // Endpoint 2: /orders/recent if first endpoint returns empty
    if (!apiSuccess || ((data.results as unknown[]) || []).length === 0) {
      const res2 = await fetch(
        `${MELI_CONFIG.apiBase}/orders/recent?seller=${MELI_CONFIG.userId}&limit=50`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        }
      );
      if (res2.ok) {
        data = await res2.json();
        apiSuccess = true;
      }
    }

    if (!apiSuccess) {
      return NextResponse.json({ orders: [], total: 0, mock: false, message: '美客多订单API不可用，请检查授权状态' });
    }

    const mlOrders = (data.results as Array<Record<string, unknown>>) || [];

    const orders = mlOrders.map((o) => {
      const orderItems = (o.order_items as Array<Record<string, unknown>>) || [];
      const firstItem = orderItems[0]?.item as Record<string, unknown> || {};
      const buyer = (o.buyer as Record<string, unknown>) || {};
      const shipping = (o.shipping as Record<string, unknown>) || {};
      const statusDetail = (o.status as string) || 'pending';

      return {
        id: String(o.id),
        orderId: String(o.id),
        buyer: (buyer.first_name || buyer.last_name)
          ? `${buyer.first_name || ''} ${(buyer.last_name || '')}`.trim()
          : `User_${(buyer.id as string) || 'unknown'}`,
        product: (firstItem.title as string) || 'Unknown Item',
        amount: (o.total_amount as number) || 0,
        currency: (o.currency_id as string) || 'USD',
        status: mapOrderStatus(statusDetail),
        shipping: (shipping.status as string) || statusDetail,
        date: ((o.date_created as string) || '').split('T')[0] || new Date().toISOString().split('T')[0],
        site: ((o.marketplace as string) || 'MLM').replace('ML_', ''),
      };
    });

    let filtered = orders;
    if (status && status !== '全部状态') {
      filtered = filtered.filter((o) => o.status === status);
    }

    return NextResponse.json({
      orders: filtered,
      total: filtered.length,
      mock: false,
      message: filtered.length === 0 ? '暂无订单数据（新店铺需要等待买家下单）' : undefined,
    });
  } catch (err) {
    console.error('Orders API error:', err);
    return NextResponse.json({ orders: [], total: 0, mock: false, message: '美客多API连接失败，请稍后重试' });
  }
}
