import { useState, useRef } from 'react';
import { exportData, importData } from '../lib/decisionService';

export function Settings() {
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const count = await importData(text);
      setMessage(`Imported ${count} decisions successfully!`);
    } catch (err) {
      setMessage('Import failed. Please check the file format.');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
            Restore from a backup file. This will replace all existing data.
          </p>
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            ref={fileInputRef}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {message && (
          <p className="text-sm text-green-600 font-medium">{message}</p>
        )}
      </div>
    </div>
  );
}
