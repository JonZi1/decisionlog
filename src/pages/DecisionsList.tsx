import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFilteredDecisions } from '../lib/decisionService';
import type { Decision, DecisionFilters, SortField, SortOrder, Stakes } from '../lib/types';
import { CATEGORIES } from '../lib/types';
import { DecisionCard } from '../components/DecisionCard';

export function DecisionsList() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [filters, setFilters] = useState<DecisionFilters>({});
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const results = await getFilteredDecisions(filters, sortField, sortOrder);
        setDecisions(results);
        setError('');
      } catch (err) {
        setError('Failed to load decisions');
        console.error('DecisionsList load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [filters, sortField, sortOrder]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">All Decisions</h1>
        <Link
          to="/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          New Decision
        </Link>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search..."
            value={filters.searchTerm || ''}
            onChange={e => setFilters({ ...filters, searchTerm: e.target.value || undefined })}
            className="px-3 py-2 border rounded-md"
          />
          <select
            value={filters.category || ''}
            onChange={e => setFilters({ ...filters, category: e.target.value || undefined })}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">All categories</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
          <select
            value={filters.stakes || ''}
            onChange={e => setFilters({ ...filters, stakes: (e.target.value as Stakes) || undefined })}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">All stakes</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <select
            value={filters.reviewed === undefined ? '' : filters.reviewed ? 'yes' : 'no'}
            onChange={e => setFilters({
              ...filters,
              reviewed: e.target.value === '' ? undefined : e.target.value === 'yes'
            })}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">All status</option>
            <option value="no">Unreviewed</option>
            <option value="yes">Reviewed</option>
          </select>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.needsReview || false}
              onChange={e => setFilters({ ...filters, needsReview: e.target.checked || undefined })}
              className="rounded"
            />
            <span className="text-sm">Needs review</span>
          </label>
        </div>
        <div className="flex gap-4">
          <select
            value={sortField}
            onChange={e => setSortField(e.target.value as SortField)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="date">Sort by date</option>
            <option value="confidence">Sort by confidence</option>
            <option value="reviewDate">Sort by review date</option>
            <option value="stakes">Sort by stakes</option>
          </select>
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value as SortOrder)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
            {error}
          </div>
        )}
        {loading ? (
          <p className="text-center text-gray-500 py-8">Loading...</p>
        ) : (
          <>
            {decisions.map(d => (
              <DecisionCard key={d.id} decision={d} />
            ))}
            {decisions.length === 0 && !error && (
              <p className="text-center text-gray-500 py-8">No decisions found</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
