import { NextResponse } from 'next/server';
import { inspectAllListings } from '@/lib/listing-inspector';

/**
 * GET /api/listing-inspect
 * 
 * Scans all listings for image quality issues.
 * Returns list of problematic items with details.
 */
export async function GET() {
  try {
    const result = await inspectAllListings();
    
    return NextResponse.json({
      success: true,
      summary: {
        total: result.total,
        active: result.active,
        issuesFound: result.issues.length,
      },
      issues: result.issues,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}
