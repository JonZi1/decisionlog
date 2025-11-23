export type DecisionType = 'binary' | 'multi' | 'open';
export type Stakes = 'low' | 'medium' | 'high';
export type Rating = 1 | 2 | 3 | 4 | 5;

export interface Decision {
  id: string;
  title: string;
  date: string; // ISO
  category: string;
  decisionType: DecisionType;
  options: string[];
  chosenOption: string;
  reasoning: string;
  expectedOutcome: string;
  confidence: number; // 0-100
  stakes: Stakes;
  horizonDays: number;
  reviewDate: string; // ISO
  tags: string[];

  // Review fields (nullable until reviewed)
  reviewedAt?: string;
  actualOutcome?: string;
  rating?: Rating;
  lessonsLearned?: string;
  sameChoiceAgain?: boolean;

  // Structured review fields (optional)
  outcomeMatchedExpectation?: 'exceeded' | 'met' | 'partial' | 'missed';
  contributingFactors?: string[];
  decisionQuality?: 'excellent' | 'good' | 'fair' | 'poor';
}

export const CONTRIBUTING_FACTORS = [
  'Good information',
  'Right timing',
  'Proper research',
  'Intuition',
  'Luck',
  'Poor information',
  'Bad timing',
  'External factors',
  'Rushed decision',
  'Overthinking',
];

export interface DecisionFilters {
  category?: string;
  stakes?: Stakes;
  reviewed?: boolean;
  needsReview?: boolean;
  searchTerm?: string;
}

export type SortField = 'date' | 'confidence' | 'reviewDate' | 'stakes';
export type SortOrder = 'asc' | 'desc';

export const CATEGORIES = [
  'work',
  'money',
  'health',
  'relationships',
  'fun',
  'personal',
  'other'
];

export const HORIZON_OPTIONS = [
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '1 month', days: 30 },
  { label: '3 months', days: 90 },
  { label: '6 months', days: 180 },
  { label: '1 year', days: 365 },
];

export const CONFIDENCE_LABELS: Record<number, string> = {
  0: 'Total guess',
  25: 'Shrug',
  50: 'Coin flip',
  75: 'Pretty sure',
  100: "I'd bet my cat",
};
