import { v4 as uuidv4 } from 'uuid';
import { db } from './db';
import type { Decision, DecisionFilters, SortField, SortOrder } from './types';

export function calculateReviewDate(date: string, horizonDays: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + horizonDays);
  return d.toISOString().split('T')[0];
}

export async function createDecision(
  data: Omit<Decision, 'id' | 'reviewDate' | 'reviewedAt' | 'actualOutcome' | 'rating' | 'lessonsLearned' | 'sameChoiceAgain'>
): Promise<Decision> {
  const decision: Decision = {
    ...data,
    id: uuidv4(),
    reviewDate: calculateReviewDate(data.date, data.horizonDays),
  };
  await db.decisions.add(decision);
  return decision;
}

export async function updateDecision(id: string, updates: Partial<Decision>): Promise<void> {
  await db.decisions.update(id, updates);
}

export async function deleteDecision(id: string): Promise<void> {
  await db.decisions.delete(id);
}

export async function getDecision(id: string): Promise<Decision | undefined> {
  return db.decisions.get(id);
}

export async function getAllDecisions(): Promise<Decision[]> {
  return db.decisions.toArray();
}

export async function getFilteredDecisions(
  filters: DecisionFilters,
  sortField: SortField = 'date',
  sortOrder: SortOrder = 'desc'
): Promise<Decision[]> {
  let decisions = await getAllDecisions();

  // Apply filters
  if (filters.category) {
    decisions = decisions.filter(d => d.category === filters.category);
  }
  if (filters.stakes) {
    decisions = decisions.filter(d => d.stakes === filters.stakes);
  }
  if (filters.reviewed !== undefined) {
    decisions = decisions.filter(d =>
      filters.reviewed ? d.reviewedAt !== undefined : d.reviewedAt === undefined
    );
  }
  if (filters.needsReview) {
    const today = new Date().toISOString().split('T')[0];
    decisions = decisions.filter(d =>
      !d.reviewedAt && d.reviewDate <= today
    );
  }
  if (filters.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    decisions = decisions.filter(d =>
      d.title.toLowerCase().includes(term) ||
      d.reasoning.toLowerCase().includes(term) ||
      d.tags.some(t => t.toLowerCase().includes(term))
    );
  }

  // Sort
  const stakesOrder = { low: 1, medium: 2, high: 3 };
  decisions.sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case 'date':
        cmp = a.date.localeCompare(b.date);
        break;
      case 'confidence':
        cmp = a.confidence - b.confidence;
        break;
      case 'reviewDate':
        cmp = a.reviewDate.localeCompare(b.reviewDate);
        break;
      case 'stakes':
        cmp = stakesOrder[a.stakes] - stakesOrder[b.stakes];
        break;
    }
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  return decisions;
}

export async function getDueReviews(): Promise<Decision[]> {
  const today = new Date().toISOString().split('T')[0];
  const decisions = await getAllDecisions();
  return decisions.filter(d => !d.reviewedAt && d.reviewDate <= today);
}

export async function exportData(): Promise<string> {
  const decisions = await getAllDecisions();
  return JSON.stringify(decisions, null, 2);
}

export async function importData(jsonString: string): Promise<number> {
  const decisions: Decision[] = JSON.parse(jsonString);
  await db.decisions.clear();
  await db.decisions.bulkAdd(decisions);
  return decisions.length;
}
