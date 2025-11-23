import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllDecisions, getDueReviews } from '../lib/decisionService';
import { calculateStats, calculateTimeSeries, type Stats, type TimeSeriesDataPoint } from '../lib/stats';
import { checkAndNotifyDueReviews } from '../lib/notifications';
import type { Decision } from '../lib/types';
import { DecisionCard } from '../components/DecisionCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend } from 'recharts';

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesDataPoint[]>([]);
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
        setTimeSeries(calculateTimeSeries(decisions));
        const due = await getDueReviews();
        setDueReviews(due);
        setRecentDecisions(
          decisions.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
        );
        // Check for notifications
        checkAndNotifyDueReviews(due.length);
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

      {timeSeries.length >= 2 && (
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="font-medium mb-4">Trends Over Time</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={timeSeries.map(d => ({
                  ...d,
                  // Convert rating to 0-100 scale for comparison
                  ratingScaled: d.rating ? (d.rating - 1) * 25 : null,
                }))}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis
                  dataKey="date"
                  fontSize={12}
                  tickFormatter={d => {
                    const [year, month] = d.split('-');
                    return `${month}/${year.slice(2)}`;
                  }}
                />
                <YAxis domain={[0, 100]} fontSize={12} />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'confidence') return [`${value}%`, 'Avg Confidence'];
                    if (name === 'ratingScaled') return [`${Math.round(value / 25 + 1)}/5`, 'Avg Rating'];
                    return [value, name];
                  }}
                  labelFormatter={label => {
                    const [year, month] = label.split('-');
                    return `${month}/${year}`;
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="confidence"
                  stroke="#3b82f6"
                  name="confidence"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="ratingScaled"
                  stroke="#22c55e"
                  name="ratingScaled"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Blue: Average confidence | Green: Average rating (scaled to 0-100)
          </p>
        </div>
      )}

      {Object.keys(stats.categoryBreakdown).length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="font-medium mb-4">Performance by Category</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.entries(stats.categoryBreakdown).map(([name, data]) => ({
                  name: name.charAt(0).toUpperCase() + name.slice(1),
                  rating: Math.round(data.avgRating * 10) / 10,
                  count: data.count,
                }))}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis dataKey="name" fontSize={12} />
                <YAxis domain={[0, 5]} fontSize={12} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    name === 'rating' ? `${value}/5` : value,
                    name === 'rating' ? 'Avg Rating' : 'Decisions'
                  ]}
                />
                <Bar dataKey="rating" name="rating">
                  {Object.entries(stats.categoryBreakdown).map(([, data], index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={data.avgRating >= 4 ? '#22c55e' : data.avgRating >= 3 ? '#eab308' : '#ef4444'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Average rating by category (green = 4+, yellow = 3+, red = &lt;3)
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
