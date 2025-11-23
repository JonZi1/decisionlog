import { describe, it, expect } from 'vitest';
import { calculateStats, getConfidenceLabel } from './stats';
import type { Decision } from './types';

const makeDecision = (overrides: Partial<Decision> = {}): Decision => ({
  id: '1',
  title: 'Test',
  date: '2024-01-01',
  category: 'work',
  decisionType: 'binary',
  options: ['yes', 'no'],
  chosenOption: 'yes',
  reasoning: 'test',
  expectedOutcome: 'test',
  confidence: 50,
  stakes: 'medium',
  horizonDays: 30,
  reviewDate: '2024-01-31',
  tags: [],
  ...overrides,
});

describe('calculateStats', () => {
  it('returns zeros for empty decisions', () => {
    const stats = calculateStats([]);
    expect(stats.totalDecisions).toBe(0);
    expect(stats.avgConfidence).toBe(0);
    expect(stats.avgRating).toBe(0);
  });

  it('calculates average confidence for reviewed decisions', () => {
    const decisions = [
      makeDecision({ id: '1', confidence: 80, reviewedAt: '2024-02-01', rating: 4 }),
      makeDecision({ id: '2', confidence: 60, reviewedAt: '2024-02-01', rating: 3 }),
    ];
    const stats = calculateStats(decisions);
    expect(stats.avgConfidence).toBe(70);
    expect(stats.reviewedDecisions).toBe(2);
  });

  it('calculates average rating', () => {
    const decisions = [
      makeDecision({ id: '1', reviewedAt: '2024-02-01', rating: 5 }),
      makeDecision({ id: '2', reviewedAt: '2024-02-01', rating: 3 }),
    ];
    const stats = calculateStats(decisions);
    expect(stats.avgRating).toBe(4);
  });

  it('calculates calibration gap', () => {
    // Confidence 80, rating 3 (normalized to 50) = gap of 30
    const decisions = [
      makeDecision({ id: '1', confidence: 80, reviewedAt: '2024-02-01', rating: 3 }),
    ];
    const stats = calculateStats(decisions);
    expect(stats.calibrationGap).toBe(30); // 80 - 50
  });

  it('groups by category', () => {
    const decisions = [
      makeDecision({ id: '1', category: 'work', reviewedAt: '2024-02-01', rating: 4 }),
      makeDecision({ id: '2', category: 'work', reviewedAt: '2024-02-01', rating: 2 }),
      makeDecision({ id: '3', category: 'health', reviewedAt: '2024-02-01', rating: 5 }),
    ];
    const stats = calculateStats(decisions);
    expect(stats.categoryBreakdown['work'].count).toBe(2);
    expect(stats.categoryBreakdown['work'].avgRating).toBe(3);
    expect(stats.categoryBreakdown['health'].count).toBe(1);
    expect(stats.categoryBreakdown['health'].avgRating).toBe(5);
  });
});

describe('getConfidenceLabel', () => {
  it('returns correct labels', () => {
    expect(getConfidenceLabel(5)).toBe('Total guess');
    expect(getConfidenceLabel(25)).toBe('Shrug');
    expect(getConfidenceLabel(50)).toBe('Coin flip');
    expect(getConfidenceLabel(75)).toBe('Pretty sure');
    expect(getConfidenceLabel(95)).toBe("I'd bet my cat");
  });
});
