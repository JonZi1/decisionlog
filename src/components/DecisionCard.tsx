import { Link } from 'react-router-dom';
import type { Decision } from '../lib/types';

interface DecisionCardProps {
  decision: Decision;
}

export function DecisionCard({ decision }: DecisionCardProps) {
  const today = new Date().toISOString().split('T')[0];
  const isDue = !decision.reviewedAt && decision.reviewDate <= today;
  const isReviewed = !!decision.reviewedAt;

  const stakesColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };

  return (
    <Link
      to={`/decision/${decision.id}`}
      className="block p-4 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-medium text-gray-900">{decision.title}</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${stakesColors[decision.stakes]}`}>
          {decision.stakes}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-2">{decision.chosenOption}</p>
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span>{decision.category}</span>
        <span>Confidence: {decision.confidence}%</span>
        {isDue && <span className="text-orange-600 font-medium">Review due!</span>}
        {isReviewed && (
          <span className="text-green-600">Reviewed ({decision.rating}/5)</span>
        )}
      </div>
    </Link>
  );
}
