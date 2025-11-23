import { useState, useEffect } from 'react';
import {
  getCustomCategories,
  addCustomCategory,
  deleteCustomCategory,
  renameCategory,
  mergeCategories,
  getAllUsedCategories,
  type CustomCategory,
} from '../lib/db';
import { CATEGORIES } from '../lib/types';

export function Categories() {
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [usedCategories, setUsedCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [renameFrom, setRenameFrom] = useState('');
  const [renameTo, setRenameTo] = useState('');
  const [mergeSource, setMergeSource] = useState<string[]>([]);
  const [mergeTarget, setMergeTarget] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [custom, used] = await Promise.all([
        getCustomCategories(),
        getAllUsedCategories(),
      ]);
      setCustomCategories(custom);
      setUsedCategories(used);
    } catch (err) {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }

  const allCategories = Array.from(
    new Set([...CATEGORIES, ...customCategories.map(c => c.name), ...usedCategories])
  ).sort();

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;

    const name = newCategory.toLowerCase().trim();
    if (allCategories.includes(name)) {
      setError('Category already exists');
      return;
    }

    try {
      await addCustomCategory(name);
      setNewCategory('');
      setMessage(`Added category "${name}"`);
      setError('');
      loadData();
    } catch (err) {
      setError('Failed to add category');
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (usedCategories.includes(name)) {
      setError(`Cannot delete "${name}" - it's being used by decisions`);
      return;
    }

    if (!confirm(`Delete category "${name}"?`)) return;

    try {
      await deleteCustomCategory(id);
      setMessage(`Deleted category "${name}"`);
      setError('');
      loadData();
    } catch (err) {
      setError('Failed to delete category');
    }
  };

  const handleRename = async () => {
    if (!renameFrom || !renameTo.trim()) return;

    const newName = renameTo.toLowerCase().trim();
    if (allCategories.includes(newName) && newName !== renameFrom) {
      setError('Target category name already exists');
      return;
    }

    try {
      const count = await renameCategory(renameFrom, newName);
      setMessage(`Renamed "${renameFrom}" to "${newName}" (${count} decisions updated)`);
      setError('');
      setRenameFrom('');
      setRenameTo('');
      loadData();
    } catch (err) {
      setError('Failed to rename category');
    }
  };

  const handleMerge = async () => {
    if (mergeSource.length === 0 || !mergeTarget) return;

    if (!confirm(`Merge ${mergeSource.length} categories into "${mergeTarget}"?`)) return;

    try {
      const count = await mergeCategories(mergeSource, mergeTarget);
      setMessage(`Merged into "${mergeTarget}" (${count} decisions updated)`);
      setError('');
      setMergeSource([]);
      setMergeTarget('');
      loadData();
    } catch (err) {
      setError('Failed to merge categories');
    }
  };

  const toggleMergeSource = (cat: string) => {
    setMergeSource(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading categories...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Manage Categories</h1>

      {/* Add new category */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Add Custom Category</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            placeholder="New category name"
            className="flex-1 px-3 py-2 border rounded-md"
            onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
          />
          <button
            onClick={handleAddCategory}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add
          </button>
        </div>
      </div>

      {/* Current categories */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Current Categories</h2>
        <div className="space-y-2">
          {allCategories.map(cat => {
            const isDefault = CATEGORIES.includes(cat);
            const isUsed = usedCategories.includes(cat);
            const customCat = customCategories.find(c => c.name === cat);

            return (
              <div
                key={cat}
                className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded"
              >
                <div>
                  <span className="font-medium">{cat}</span>
                  {isDefault && (
                    <span className="ml-2 text-xs text-gray-500">(default)</span>
                  )}
                  {isUsed && (
                    <span className="ml-2 text-xs text-green-600">(in use)</span>
                  )}
                </div>
                {customCat && !isUsed && (
                  <button
                    onClick={() => handleDeleteCategory(customCat.id, cat)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Rename category */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Rename Category</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From
            </label>
            <select
              value={renameFrom}
              onChange={e => setRenameFrom(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Select category</option>
              {usedCategories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To
            </label>
            <input
              type="text"
              value={renameTo}
              onChange={e => setRenameTo(e.target.value)}
              placeholder="New name"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>
        <button
          onClick={handleRename}
          disabled={!renameFrom || !renameTo.trim()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
        >
          Rename
        </button>
      </div>

      {/* Merge categories */}
      {usedCategories.length >= 2 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Merge Categories</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select categories to merge
              </label>
              <div className="flex flex-wrap gap-2">
                {usedCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => toggleMergeSource(cat)}
                    className={`px-3 py-1 rounded text-sm ${
                      mergeSource.includes(cat)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Merge into
              </label>
              <select
                value={mergeTarget}
                onChange={e => setMergeTarget(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select target category</option>
                {allCategories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleMerge}
              disabled={mergeSource.length === 0 || !mergeTarget}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-300"
            >
              Merge {mergeSource.length} Categories
            </button>
          </div>
        </div>
      )}

      {message && (
        <p className="text-sm text-green-600 font-medium">{message}</p>
      )}
      {error && (
        <p className="text-sm text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
}
