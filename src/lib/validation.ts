import type { Decision } from './types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  decisions: Decision[];
}

export function validateDecisions(data: unknown): ValidationResult {
  const errors: string[] = [];
  const decisions: Decision[] = [];

  if (!Array.isArray(data)) {
    return { valid: false, errors: ['Data must be an array of decisions'], decisions: [] };
  }

  data.forEach((item, index) => {
    const itemErrors: string[] = [];

    // Required string fields
    if (!item.id || typeof item.id !== 'string') {
      itemErrors.push('missing or invalid id');
    }
    if (!item.title || typeof item.title !== 'string') {
      itemErrors.push('missing or invalid title');
    }
    if (!item.date || typeof item.date !== 'string') {
      itemErrors.push('missing or invalid date');
    }
    if (!item.category || typeof item.category !== 'string') {
      itemErrors.push('missing or invalid category');
    }
    if (!item.chosenOption || typeof item.chosenOption !== 'string') {
      itemErrors.push('missing or invalid chosenOption');
    }
    if (!item.reviewDate || typeof item.reviewDate !== 'string') {
      itemErrors.push('missing or invalid reviewDate');
    }

    // Decision type
    if (!['binary', 'multi', 'open'].includes(item.decisionType)) {
      itemErrors.push('invalid decisionType');
    }

    // Stakes
    if (!['low', 'medium', 'high'].includes(item.stakes)) {
      itemErrors.push('invalid stakes');
    }

    // Options array
    if (!Array.isArray(item.options)) {
      itemErrors.push('options must be an array');
    }

    // Tags array
    if (!Array.isArray(item.tags)) {
      itemErrors.push('tags must be an array');
    }

    // Confidence number
    if (typeof item.confidence !== 'number' || item.confidence < 0 || item.confidence > 100) {
      itemErrors.push('confidence must be a number 0-100');
    }

    // Horizon days
    if (typeof item.horizonDays !== 'number' || item.horizonDays < 1) {
      itemErrors.push('horizonDays must be a positive number');
    }

    // Optional review fields
    if (item.rating !== undefined && (typeof item.rating !== 'number' || item.rating < 1 || item.rating > 5)) {
      itemErrors.push('rating must be 1-5');
    }

    if (itemErrors.length > 0) {
      errors.push(`Decision ${index + 1} (${item.title || 'untitled'}): ${itemErrors.join(', ')}`);
    } else {
      decisions.push(item as Decision);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    decisions,
  };
}

export const SCHEMA_VERSION = 1;

export interface ExportData {
  version: number;
  exportedAt: string;
  decisions: Decision[];
}

export function createExportData(decisions: Decision[]): ExportData {
  return {
    version: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    decisions,
  };
}

export function parseImportData(jsonString: string): { data: ExportData | null; isLegacy: boolean; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);

    // Check if it's new format with version
    if (parsed.version && parsed.decisions) {
      return { data: parsed, isLegacy: false };
    }

    // Legacy format: just an array
    if (Array.isArray(parsed)) {
      return {
        data: {
          version: 1,
          exportedAt: 'unknown',
          decisions: parsed,
        },
        isLegacy: true,
      };
    }

    return { data: null, isLegacy: false, error: 'Invalid format' };
  } catch (err) {
    return { data: null, isLegacy: false, error: 'Invalid JSON' };
  }
}
