import { useState, useRef, useEffect } from 'react';
import { exportData, importDataWithValidation, type ImportMode } from '../lib/decisionService';
import { validateDecisions, parseImportData, type ValidationResult } from '../lib/validation';
import {
  getStoredToken,
  setStoredToken,
  clearStoredToken,
  getStoredGistId,
  pushToGist,
  syncFromGist,
  verifyToken,
} from '../lib/gistSync';
import type { Decision } from '../lib/types';

interface ImportPreview {
  decisions: Decision[];
  validation: ValidationResult;
  isLegacy: boolean;
}

export function Settings() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>('replace');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gist sync state
  const [gistToken, setGistToken] = useState('');
  const [hasToken, setHasToken] = useState(false);
  const [gistId, setGistId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    setHasToken(!!token);
    setGistId(getStoredGistId());
  }, []);

  const handleExport = async () => {
    const data = await exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `decision-log-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Export complete!');
    setError('');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage('');
    setError('');

    try {
      const text = await file.text();
      const { data, isLegacy, error: parseError } = parseImportData(text);

      if (parseError || !data) {
        setError(parseError || 'Failed to parse file');
        return;
      }

      const validation = validateDecisions(data.decisions);

      setImportPreview({
        decisions: validation.decisions,
        validation,
        isLegacy,
      });
    } catch (err) {
      setError('Failed to read file');
    }
  };

  const handleConfirmImport = async () => {
    if (!importPreview) return;

    try {
      const result = await importDataWithValidation(importPreview.decisions, importMode);

      if (importMode === 'merge') {
        setMessage(`Imported ${result.imported} decisions, skipped ${result.skipped} duplicates`);
      } else {
        setMessage(`Imported ${result.imported} decisions successfully!`);
      }

      setImportPreview(null);
      setError('');

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError('Import failed');
    }
  };

  const handleCancelImport = () => {
    setImportPreview(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveToken = async () => {
    if (!gistToken.trim()) return;

    setError('');
    const valid = await verifyToken(gistToken);
    if (!valid) {
      setError('Invalid GitHub token. Make sure it has gist permissions.');
      return;
    }

    setStoredToken(gistToken);
    setHasToken(true);
    setGistToken('');
    setMessage('GitHub token saved successfully!');
  };

  const handleDisconnect = () => {
    clearStoredToken();
    setHasToken(false);
    setGistId(null);
    setMessage('GitHub sync disconnected');
  };

  const handlePushToGist = async () => {
    const token = getStoredToken();
    if (!token) return;

    setSyncing(true);
    setError('');
    try {
      await pushToGist(token);
      setGistId(getStoredGistId());
      setMessage('Pushed to GitHub Gist successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to push to gist');
    } finally {
      setSyncing(false);
    }
  };

  const handlePullFromGist = async () => {
    const token = getStoredToken();
    const id = getStoredGistId();
    if (!token || !id) return;

    if (!confirm('This will replace all local data with the gist backup. Continue?')) {
      return;
    }

    setSyncing(true);
    setError('');
    try {
      const count = await syncFromGist(token, id);
      setMessage(`Pulled ${count} decisions from GitHub Gist!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pull from gist');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Export Data</h2>
          <p className="text-sm text-gray-600 mb-4">
            Download all your decisions as a JSON file for backup.
          </p>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Export to JSON
          </button>
        </div>

        <hr />

        <div>
          <h2 className="text-lg font-semibold mb-2">Import Data</h2>
          <p className="text-sm text-gray-600 mb-4">
            Restore from a backup file.
          </p>

          {!importPreview ? (
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              ref={fileInputRef}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-md">
                <h3 className="font-medium mb-2">Import Preview</h3>
                <p className="text-sm text-gray-600">
                  {importPreview.validation.decisions.length} valid decisions found
                  {importPreview.isLegacy && ' (legacy format)'}
                </p>

                {importPreview.validation.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-red-600">
                      {importPreview.validation.errors.length} validation errors:
                    </p>
                    <ul className="mt-1 text-xs text-red-500 list-disc list-inside max-h-32 overflow-y-auto">
                      {importPreview.validation.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Import Mode
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                    />
                    <span className="text-sm">Replace all existing data</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                    />
                    <span className="text-sm">Merge (skip duplicates)</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleConfirmImport}
                  disabled={importPreview.validation.decisions.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Import {importPreview.validation.decisions.length} Decisions
                </button>
                <button
                  onClick={handleCancelImport}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <hr />

        <div>
          <h2 className="text-lg font-semibold mb-2">GitHub Gist Sync</h2>
          <p className="text-sm text-gray-600 mb-4">
            Sync your decisions to a private GitHub Gist for backup and cross-device access.
          </p>

          {!hasToken ? (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                Create a personal access token at GitHub Settings → Developer settings → Personal access tokens.
                The token needs the "gist" scope.
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={gistToken}
                  onChange={e => setGistToken(e.target.value)}
                  placeholder="GitHub personal access token"
                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                />
                <button
                  onClick={handleSaveToken}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  Connect
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <span>Connected to GitHub</span>
                {gistId && <span className="text-gray-400">(Gist: {gistId.slice(0, 8)}...)</span>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePushToGist}
                  disabled={syncing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:bg-gray-300"
                >
                  {syncing ? 'Syncing...' : 'Push to Gist'}
                </button>
                {gistId && (
                  <button
                    onClick={handlePullFromGist}
                    disabled={syncing}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm disabled:bg-gray-100"
                  >
                    Pull from Gist
                  </button>
                )}
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-md text-sm"
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>

        {message && (
          <p className="text-sm text-green-600 font-medium">{message}</p>
        )}
        {error && (
          <p className="text-sm text-red-600 font-medium">{error}</p>
        )}
      </div>
    </div>
  );
}
