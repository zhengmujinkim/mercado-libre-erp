// Mercado Libre Listing Image Quality Inspector
// Checks all active/pending listings for image quality issues

import { getAccessToken } from './token-store';
import { MELI_CONFIG } from './config';

export interface ListingIssue {
  itemId: string;
  title: string;
  siteId: string;
  status: string;
  subStatus: string;
  issues: string[];
  pictureCount: number;
  pictureUrls: string[];
}

/**
 * Fetch all listings and check for image quality issues
 */
export async function inspectAllListings(): Promise<{
  total: number;
  active: number;
  issues: ListingIssue[];
}> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('美客多 Token 未授权');
  }

  const userId = MELI_CONFIG.userId;
  const allIssues: ListingIssue[] = [];
  let total = 0;
  let active = 0;

  // Search all items across different statuses
  const statuses = ['active', 'paused', 'under_review'];
  
  for (const status of statuses) {
    let offset = 0;
    const limit = 50;

    while (true) {
      const searchUrl = `${MELI_CONFIG.apiBase}/users/${userId}/items/search?status=${status}&limit=${limit}&offset=${offset}`;
      
      const res = await fetch(searchUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (!res.ok) break;
      
      const data = await res.json();
      const items: string[] = data.results || [];
      
      if (items.length === 0) break;
      
      total += items.length;
      if (status === 'active') active += items.length;

      // Check each item for issues
      for (const itemId of items) {
        const issue = await inspectItem(itemId, accessToken);
        if (issue) {
          allIssues.push(issue);
        }
      }

      offset += limit;
      if (items.length < limit) break;
    }
  }

  return { total, active, issues: allIssues };
}

/**
 * Inspect a single item for image quality issues
 */
async function inspectItem(itemId: string, accessToken: string): Promise<ListingIssue | null> {
  try {
    const res = await fetch(`${MELI_CONFIG.apiBase}/items/${itemId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!res.ok) return null;

    const item = await res.json();
    const status = item.status || 'unknown';
    const subStatus = item.sub_status || '';
    const pictures = item.pictures || [];
    const tags = item.tags || [];

    // Check if item has image-related issues
    const issues: string[] = [];

    // Check status-based issues
    if (subStatus.includes('picture_quality') || subStatus.includes('photo')) {
      issues.push('图片质量不合格');
    }
    if (status === 'under_review') {
      issues.push('审核中');
    }

    // Check picture count
    if (pictures.length === 0) {
      issues.push('无图片');
    } else if (pictures.length === 1) {
      issues.push('仅有1张主图，建议补充场景图和详情图');
    }

    // Check for known rejection reasons in tags
    const rejectionTags = tags.filter((t: string) => 
      t.includes('picture') || t.includes('photo') || t.includes('image')
    );
    if (rejectionTags.length > 0) {
      issues.push(`标签异常: ${rejectionTags.join(', ')}`);
    }

    // If no issues found, skip
    if (issues.length === 0) return null;

    return {
      itemId,
      title: item.title || '',
      siteId: item.site_id || '',
      status,
      subStatus,
      issues,
      pictureCount: pictures.length,
      pictureUrls: pictures.map((p: any) => p.url || '').filter(Boolean),
    };
  } catch {
    return null;
  }
}

/**
 * Get detailed rejection reason for an item (from sub_status)
 */
export function parseRejectionReason(subStatus: string): string[] {
  const reasons: string[] = [];
  
  if (!subStatus) return reasons;
  
  const statusMap: Record<string, string> = {
    'picture_quality': '图片质量不合格',
    'pending_review': '等待审核',
    'immediate_payment_required': '需要立即付款',
    'reserved': '已预留',
    'not_renewable': '不可续期',
    'paused': '已暂停',
  };

  const parts = subStatus.split(',').map(s => s.trim());
  for (const part of parts) {
    if (statusMap[part]) {
      reasons.push(statusMap[part]);
    } else if (part) {
      reasons.push(part);
    }
  }

  return reasons;
}
