import { NextRequest, NextResponse } from 'next/server';
import { inspectAllListings } from '@/lib/listing-inspector';

/**
 * GET /api/listing-inspect
 * 
 * Scans all listings for image quality issues.
 * Supports Vercel Cron: called automatically every day at 12:00 UTC (9:00 BRT).
 */
export async function GET(request: NextRequest) {
  const isCron = request.headers.get('x-vercel-cron') === '1';

  try {
    const result = await inspectAllListings();
    const hasIssues = result.issues.length > 0;

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      triggeredBy: isCron ? 'cron' : 'manual',
      summary: {
        total: result.total,
        active: result.active,
        issuesFound: result.issues.length,
      },
      ...(hasIssues ? { issues: result.issues } : { message: 'All listings OK' }),
    };

    return NextResponse.json(response, {
      status: hasIssues ? 200 : 200,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: String(err), timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
