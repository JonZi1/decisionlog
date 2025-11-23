import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFilteredDecisions } from '../lib/decisionService';
import type { Decision, DecisionFilters, SortField, SortOrder, Stakes } from '../lib/types';
import { CATEGORIES } from '../lib/types';
import { DecisionCard } from '../components/DecisionCard';

const PAGE_SIZE = 20;

export function DecisionsList() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [filters, setFilters] = useState<DecisionFilters>({});
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const results = await getFilteredDecisions(filters, sortField, sortOrder);
        setDecisions(results);
        setError('');
        setPage(1); // Reset to first page when filters change
      } catch (err) {
        setError('Failed to load decisions');
        console.error('DecisionsList load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [filters, sortField, sortOrder]);

  const totalPages = Math.ceil(decisions.length / PAGE_SIZE);
  const paginatedDecisions = decisions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
          <div>
            <label htmlFor="search-input" className="sr-only">Search decisions</label>
            <input
              id="search-input"
              type="text"
              placeholder="Search..."
              value={filters.searchTerm || ''}
              onChange={e => setFilters({ ...filters, searchTerm: e.target.value || undefined })}
              className="px-3 py-2 border rounded-md"
              aria-label="Search decisions"
            />
          </div>
          <div>
            <label htmlFor="category-filter" className="sr-only">Filter by category</label>
            <select
              id="category-filter"
              value={filters.category || ''}
              onChange={e => setFilters({ ...filters, category: e.target.value || undefined })}
              className="px-3 py-2 border rounded-md"
              aria-label="Filter by category"
            >
              <option value="">All categories</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="stakes-filter" className="sr-only">Filter by stakes</label>
            <select
              id="stakes-filter"
              value={filters.stakes || ''}
              onChange={e => setFilters({ ...filters, stakes: (e.target.value as Stakes) || undefined })}
              className="px-3 py-2 border rounded-md"
              aria-label="Filter by stakes"
            >
              <option value="">All stakes</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label htmlFor="status-filter" className="sr-only">Filter by review status</label>
            <select
              id="status-filter"
              value={filters.reviewed === undefined ? '' : filters.reviewed ? 'yes' : 'no'}
              onChange={e => setFilters({
                ...filters,
                reviewed: e.target.value === '' ? undefined : e.target.value === 'yes'
              })}
              className="px-3 py-2 border rounded-md"
              aria-label="Filter by review status"
            >
              <option value="">All status</option>
              <option value="no">Unreviewed</option>
              <option value="yes">Reviewed</option>
            </select>
          </div>
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
          <div>
            <label htmlFor="sort-field" className="sr-only">Sort by</label>
            <select
              id="sort-field"
              value={sortField}
              onChange={e => setSortField(e.target.value as SortField)}
              className="px-3 py-2 border rounded-md"
              aria-label="Sort by"
            >
              <option value="date">Sort by date</option>
              <option value="confidence">Sort by confidence</option>
              <option value="reviewDate">Sort by review date</option>
              <option value="stakes">Sort by stakes</option>
            </select>
          </div>
          <div>
            <label htmlFor="sort-order" className="sr-only">Sort order</label>
            <select
              id="sort-order"
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value as SortOrder)}
              className="px-3 py-2 border rounded-md"
              aria-label="Sort order"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
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
            {decisions.length > 0 && (
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, decisions.length)} of {decisions.length}
              </p>
            )}
            {paginatedDecisions.map(d => (
              <DecisionCard key={d.id} decision={d} />
            ))}
            {decisions.length === 0 && !error && (
              <p className="text-center text-gray-500 py-8">No decisions found</p>
            )}
            {totalPages > 1 && (
              <nav className="flex items-center justify-center gap-2 pt-4" aria-label="Pagination">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  aria-label="Go to previous page"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600" aria-current="page">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  aria-label="Go to next page"
                >
                  Next
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
