import { describe, it, expect } from 'vitest';
import { calculateReviewDate } from './decisionService';

describe('calculateReviewDate', () => {
  it('adds 7 days for 1 week horizon', () => {
    const result = calculateReviewDate('2024-01-01', 7);
    expect(result).toBe('2024-01-08');
  });

  it('adds 30 days for 1 month horizon', () => {
    const result = calculateReviewDate('2024-01-15', 30);
    expect(result).toBe('2024-02-14');
  });

  it('handles month boundaries', () => {
    const result = calculateReviewDate('2024-01-31', 30);
    expect(result).toBe('2024-03-01');
  });

  it('handles year boundaries', () => {
    const result = calculateReviewDate('2024-12-15', 30);
    expect(result).toBe('2025-01-14');
  });

  it('adds 365 days for 1 year horizon', () => {
    const result = calculateReviewDate('2024-03-01', 365);
    expect(result).toBe('2025-03-01'); // 2024 is leap year so 365 days = exactly 1 year
  });
});
