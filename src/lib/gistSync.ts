import { getAllDecisions } from './decisionService';
import { createExportData, parseImportData, validateDecisions } from './validation';
import type { Decision } from './types';
import { db } from './db';

const GIST_FILENAME = 'decision-log-backup.json';
const TOKEN_KEY = 'decision-log-gist-token';
const GIST_ID_KEY = 'decision-log-gist-id';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(GIST_ID_KEY);
}

export function getStoredGistId(): string | null {
  return localStorage.getItem(GIST_ID_KEY);
}

export function setStoredGistId(id: string): void {
  localStorage.setItem(GIST_ID_KEY, id);
}

interface GistResponse {
  id: string;
  files: Record<string, { content: string }>;
  updated_at: string;
}

export async function createGist(token: string): Promise<string> {
  const decisions = await getAllDecisions();
  const data = createExportData(decisions);

  const response = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: 'Decision Log Backup',
      public: false,
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(data, null, 2),
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create gist: ${error}`);
  }

  const gist: GistResponse = await response.json();
  setStoredGistId(gist.id);
  return gist.id;
}

export async function updateGist(token: string, gistId: string): Promise<void> {
  const decisions = await getAllDecisions();
  const data = createExportData(decisions);

  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(data, null, 2),
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update gist: ${error}`);
  }
}

export async function fetchGist(token: string, gistId: string): Promise<{
  decisions: Decision[];
  updatedAt: string;
}> {
  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: {
      Authorization: `token ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch gist: ${error}`);
  }

  const gist: GistResponse = await response.json();
  const file = gist.files[GIST_FILENAME];

  if (!file) {
    throw new Error('Backup file not found in gist');
  }

  const { data, error } = parseImportData(file.content);
  if (error || !data) {
    throw new Error(error || 'Invalid backup format');
  }

  const validation = validateDecisions(data.decisions);
  if (!validation.valid) {
    throw new Error(`Validation errors: ${validation.errors.join(', ')}`);
  }

  return {
    decisions: validation.decisions,
    updatedAt: gist.updated_at,
  };
}

export async function syncFromGist(token: string, gistId: string): Promise<number> {
  const { decisions } = await fetchGist(token, gistId);

  await db.decisions.clear();
  await db.decisions.bulkAdd(decisions);

  return decisions.length;
}

export async function pushToGist(token: string): Promise<void> {
  const gistId = getStoredGistId();

  if (gistId) {
    await updateGist(token, gistId);
  } else {
    await createGist(token);
  }
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `token ${token}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}
