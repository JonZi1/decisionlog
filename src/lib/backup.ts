import { db } from './db';
import { getAllDecisions } from './decisionService';
import type { Decision } from './types';

const BACKUP_KEY = 'decision-log-backup';
const MAX_BACKUPS = 5;

export interface Backup {
  id: string;
  timestamp: string;
  reason: string;
  decisions: Decision[];
}

export function getBackups(): Backup[] {
  const stored = localStorage.getItem(BACKUP_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveBackups(backups: Backup[]): void {
  localStorage.setItem(BACKUP_KEY, JSON.stringify(backups));
}

export async function createBackup(reason: string): Promise<Backup> {
  const decisions = await getAllDecisions();
  const backup: Backup = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    reason,
    decisions,
  };

  const backups = getBackups();
  backups.unshift(backup);

  // Keep only last N backups
  while (backups.length > MAX_BACKUPS) {
    backups.pop();
  }

  saveBackups(backups);
  return backup;
}

export async function restoreBackup(backupId: string): Promise<number> {
  const backups = getBackups();
  const backup = backups.find(b => b.id === backupId);

  if (!backup) {
    throw new Error('Backup not found');
  }

  // Create a backup of current state before restoring
  await createBackup('Before restore');

  await db.decisions.clear();
  await db.decisions.bulkAdd(backup.decisions);

  return backup.decisions.length;
}

export function deleteBackup(backupId: string): void {
  const backups = getBackups();
  const filtered = backups.filter(b => b.id !== backupId);
  saveBackups(filtered);
}

export function clearAllBackups(): void {
  localStorage.removeItem(BACKUP_KEY);
}

// Helper to auto-backup before destructive operations
export async function withBackup<T>(
  reason: string,
  operation: () => Promise<T>
): Promise<T> {
  await createBackup(reason);
  return operation();
}
