import type { Decision } from './types';

export interface Stats {
  totalDecisions: number;
  reviewedDecisions: number;
  pendingReviews: number;
  avgConfidence: number;
  avgRating: number;
  calibrationGap: number;
  decisionsThisMonth: number;
  categoryBreakdown: Record<string, { count: number; avgRating: number }>;
}

export function calculateStats(decisions: Decision[]): Stats {
  const reviewed = decisions.filter(d => d.reviewedAt && d.rating);
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];

  const thisMonth = decisions.filter(d => d.date >= monthStart);
  const pending = decisions.filter(d => !d.reviewedAt && d.reviewDate <= todayStr);

  const avgConfidence = reviewed.length > 0
    ? reviewed.reduce((sum, d) => sum + d.confidence, 0) / reviewed.length
    : 0;

  const avgRating = reviewed.length > 0
    ? reviewed.reduce((sum, d) => sum + (d.rating || 0), 0) / reviewed.length
    : 0;

  // Calibration: convert rating (1-5) to 0-100 scale, then compare to confidence
  const normalizedRating = (avgRating - 1) * 25; // 1->0, 5->100
  const calibrationGap = avgConfidence - normalizedRating;

  // Category breakdown
  const categoryBreakdown: Record<string, { count: number; avgRating: number }> = {};
  for (const d of reviewed) {
    if (!categoryBreakdown[d.category]) {
      categoryBreakdown[d.category] = { count: 0, avgRating: 0 };
    }
    categoryBreakdown[d.category].count++;
    categoryBreakdown[d.category].avgRating += d.rating || 0;
  }
  for (const cat of Object.keys(categoryBreakdown)) {
    categoryBreakdown[cat].avgRating /= categoryBreakdown[cat].count;
  }

  return {
    totalDecisions: decisions.length,
    reviewedDecisions: reviewed.length,
    pendingReviews: pending.length,
    avgConfidence: Math.round(avgConfidence),
    avgRating: Math.round(avgRating * 10) / 10,
    calibrationGap: Math.round(calibrationGap),
    decisionsThisMonth: thisMonth.length,
    categoryBreakdown,
  };
}

export function getConfidenceLabel(confidence: number): string {
  if (confidence <= 10) return 'Total guess';
  if (confidence <= 30) return 'Shrug';
  if (confidence <= 50) return 'Coin flip';
  if (confidence <= 70) return 'Reasonably confident';
  if (confidence <= 85) return 'Pretty sure';
  return "I'd bet my cat";
}
