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
  // Enhanced analytics
  factorBreakdown: Record<string, { count: number; avgRating: number }>;
  stakesByRating: Record<string, { count: number; avgRating: number; avgConfidence: number }>;
  qualityVsOutcome: Record<string, { count: number; avgRating: number }>;
}

export interface TimeSeriesDataPoint {
  date: string;
  confidence: number;
  rating: number | null;
  count: number;
}

export function calculateTimeSeries(decisions: Decision[]): TimeSeriesDataPoint[] {
  // Group decisions by month
  const monthlyData: Record<string, { confidences: number[]; ratings: number[] }> = {};

  for (const d of decisions) {
    const month = d.date.slice(0, 7); // YYYY-MM
    if (!monthlyData[month]) {
      monthlyData[month] = { confidences: [], ratings: [] };
    }
    monthlyData[month].confidences.push(d.confidence);
    if (d.rating) {
      monthlyData[month].ratings.push(d.rating);
    }
  }

  // Convert to array and sort
  return Object.entries(monthlyData)
    .map(([date, data]) => ({
      date,
      confidence: Math.round(data.confidences.reduce((a, b) => a + b, 0) / data.confidences.length),
      rating: data.ratings.length > 0
        ? Math.round((data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length) * 10) / 10
        : null,
      count: data.confidences.length,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
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

  // Factor breakdown - which factors correlate with good/bad outcomes
  const factorBreakdown: Record<string, { count: number; avgRating: number }> = {};
  for (const d of reviewed) {
    if (d.contributingFactors) {
      for (const factor of d.contributingFactors) {
        if (!factorBreakdown[factor]) {
          factorBreakdown[factor] = { count: 0, avgRating: 0 };
        }
        factorBreakdown[factor].count++;
        factorBreakdown[factor].avgRating += d.rating || 0;
      }
    }
  }
  for (const factor of Object.keys(factorBreakdown)) {
    factorBreakdown[factor].avgRating /= factorBreakdown[factor].count;
  }

  // Stakes by rating - calibration by stakes level
  const stakesByRating: Record<string, { count: number; avgRating: number; avgConfidence: number }> = {};
  for (const d of reviewed) {
    if (!stakesByRating[d.stakes]) {
      stakesByRating[d.stakes] = { count: 0, avgRating: 0, avgConfidence: 0 };
    }
    stakesByRating[d.stakes].count++;
    stakesByRating[d.stakes].avgRating += d.rating || 0;
    stakesByRating[d.stakes].avgConfidence += d.confidence;
  }
  for (const stake of Object.keys(stakesByRating)) {
    stakesByRating[stake].avgRating /= stakesByRating[stake].count;
    stakesByRating[stake].avgConfidence /= stakesByRating[stake].count;
  }

  // Decision quality vs outcome
  const qualityVsOutcome: Record<string, { count: number; avgRating: number }> = {};
  for (const d of reviewed) {
    if (d.decisionQuality) {
      if (!qualityVsOutcome[d.decisionQuality]) {
        qualityVsOutcome[d.decisionQuality] = { count: 0, avgRating: 0 };
      }
      qualityVsOutcome[d.decisionQuality].count++;
      qualityVsOutcome[d.decisionQuality].avgRating += d.rating || 0;
    }
  }
  for (const quality of Object.keys(qualityVsOutcome)) {
    qualityVsOutcome[quality].avgRating /= qualityVsOutcome[quality].count;
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
    factorBreakdown,
    stakesByRating,
    qualityVsOutcome,
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
