import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllDecisions, getDueReviews } from '../lib/decisionService';
import { calculateStats, type Stats } from '../lib/stats';
import type { Decision } from '../lib/types';
import { DecisionCard } from '../components/DecisionCard';

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [dueReviews, setDueReviews] = useState<Decision[]>([]);
  const [recentDecisions, setRecentDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError('');
        const decisions = await getAllDecisions();
        setStats(calculateStats(decisions));
        setDueReviews(await getDueReviews());
        setRecentDecisions(
          decisions.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
        );
      } catch (err) {
        setError('Failed to load decisions. Please refresh the page.');
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading decisions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
        {error}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link
          to="/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Log Decision
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">This Month</p>
          <p className="text-2xl font-bold">{stats.decisionsThisMonth}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">Pending Reviews</p>
          <p className="text-2xl font-bold text-orange-600">{stats.pendingReviews}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">Avg Confidence</p>
          <p className="text-2xl font-bold">{stats.avgConfidence}%</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">Avg Rating</p>
          <p className="text-2xl font-bold">{stats.avgRating}/5</p>
        </div>
      </div>

      {stats.calibrationGap !== 0 && stats.reviewedDecisions > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="font-medium mb-2">Calibration</h2>
          <p className="text-sm text-gray-600">
            {stats.calibrationGap > 10
              ? `You tend to be overconfident by ~${stats.calibrationGap} points. Consider being more cautious in your predictions.`
              : stats.calibrationGap < -10
              ? `You tend to be underconfident by ~${Math.abs(stats.calibrationGap)} points. Trust yourself more!`
              : `You're well-calibrated! Your confidence matches your actual outcomes.`}
          </p>
        </div>
      )}

      {dueReviews.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Ready for Review</h2>
          <div className="space-y-3">
            {dueReviews.slice(0, 5).map(d => (
              <DecisionCard key={d.id} decision={d} />
            ))}
          </div>
        </div>
      )}

      {recentDecisions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Recent Decisions</h2>
          <div className="space-y-3">
            {recentDecisions.map(d => (
              <DecisionCard key={d.id} decision={d} />
            ))}
          </div>
        </div>
      )}

      {stats.totalDecisions === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No decisions logged yet</p>
          <Link
            to="/new"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Log your first decision
          </Link>
        </div>
      )}
    </div>
  );
}
