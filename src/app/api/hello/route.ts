// 极简健康检查：验证 Vercel 函数本身可访问
export const dynamic = 'force-dynamic';
export async function GET() {
  return Response.json({ ok: true, at: new Date().toISOString(), region: process.env.VERCEL_REGION || 'unknown' });
}
