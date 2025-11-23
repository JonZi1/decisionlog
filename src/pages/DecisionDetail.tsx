import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getDecision, updateDecision, deleteDecision, calculateReviewDate } from '../lib/decisionService';
import { getConfidenceLabel } from '../lib/stats';
import type { Decision, Rating } from '../lib/types';
import { ReviewForm } from '../components/ReviewForm';
import { DecisionForm } from '../components/DecisionForm';

export function DecisionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [decision, setDecision] = useState<Decision | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        if (id) {
          const d = await getDecision(id);
          if (!d) {
            setError('Decision not found');
          } else {
            setDecision(d);
          }
        }
      } catch (err) {
        setError('Failed to load decision');
        console.error('DecisionDetail load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading decision...</div>
      </div>
    );
  }

  if (error || !decision) {
    return (
      <div className="space-y-4">
        <Link to="/decisions" className="text-blue-600 hover:text-blue-800">
          &larr; Back to decisions
        </Link>
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          {error || 'Decision not found'}
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const isDue = !decision.reviewedAt && decision.reviewDate <= today;
  const daysUntilReview = Math.ceil(
    (new Date(decision.reviewDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const handleReview = async (data: {
    actualOutcome: string;
    rating: Rating;
    lessonsLearned: string;
    sameChoiceAgain: boolean;
    outcomeMatchedExpectation?: 'exceeded' | 'met' | 'partial' | 'missed';
    contributingFactors?: string[];
    decisionQuality?: 'excellent' | 'good' | 'fair' | 'poor';
  }) => {
    await updateDecision(decision.id, {
      ...data,
      reviewedAt: new Date().toISOString(),
    });
    const updated = await getDecision(decision.id);
    setDecision(updated || null);
    setShowReview(false);
  };

  const handleDelete = async () => {
    if (confirm('Delete this decision?')) {
      await deleteDecision(decision.id);
      navigate('/decisions');
    }
  };

  const handleEdit = async (
    data: Omit<Decision, 'id' | 'reviewDate' | 'reviewedAt' | 'actualOutcome' | 'rating' | 'lessonsLearned' | 'sameChoiceAgain'>
  ) => {
    const reviewDate = calculateReviewDate(data.date, data.horizonDays);
    await updateDecision(decision.id, { ...data, reviewDate });
    const updated = await getDecision(decision.id);
    setDecision(updated || null);
    setShowEdit(false);
  };

  const stakesColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };

  if (showEdit) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowEdit(false)}
            className="text-blue-600 hover:text-blue-800"
          >
            &larr; Cancel edit
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Decision</h1>
          <DecisionForm onSubmit={handleEdit} initialData={decision} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/decisions" className="text-blue-600 hover:text-blue-800">
          &larr; Back to decisions
        </Link>
        <div className="flex gap-4">
          <button
            onClick={() => setShowEdit(true)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{decision.title}</h1>
          <span className={`text-sm px-3 py-1 rounded-full ${stakesColors[decision.stakes]}`}>
            {decision.stakes} stakes
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <span className="text-gray-500">Date:</span>{' '}
            {new Date(decision.date).toLocaleDateString()}
          </div>
          <div>
            <span className="text-gray-500">Category:</span>{' '}
            {decision.category}
          </div>
          <div>
            <span className="text-gray-500">Confidence:</span>{' '}
            {decision.confidence}% ({getConfidenceLabel(decision.confidence)})
          </div>
          <div>
            <span className="text-gray-500">Review date:</span>{' '}
            {new Date(decision.reviewDate).toLocaleDateString()}
            {!decision.reviewedAt && daysUntilReview > 0 && (
              <span className="text-gray-400"> ({daysUntilReview} days)</span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-700 mb-1">Options considered</h3>
            <ul className="list-disc list-inside text-sm text-gray-600">
              {decision.options.map((o, i) => (
                <li key={i} className={o === decision.chosenOption ? 'font-medium text-gray-900' : ''}>
                  {o} {o === decision.chosenOption && '(chosen)'}
                </li>
              ))}
            </ul>
          </div>

          {decision.reasoning && (
            <div>
              <h3 className="font-medium text-gray-700 mb-1">Reasoning</h3>
              <p className="text-sm text-gray-600">{decision.reasoning}</p>
            </div>
          )}

          {decision.expectedOutcome && (
            <div>
              <h3 className="font-medium text-gray-700 mb-1">Expected outcome</h3>
              <p className="text-sm text-gray-600">{decision.expectedOutcome}</p>
            </div>
          )}

          {decision.tags.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-700 mb-1">Tags</h3>
              <div className="flex gap-2">
                {decision.tags.map(t => (
                  <span key={t} className="text-xs px-2 py-1 bg-gray-100 rounded">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {decision.reviewedAt ? (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Review</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-700 mb-1">Actual outcome</h3>
              <p className="text-sm text-gray-600">{decision.actualOutcome}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-1">Rating</h3>
              <p className="text-sm text-gray-600">{decision.rating}/5</p>
            </div>
            {decision.lessonsLearned && (
              <div>
                <h3 className="font-medium text-gray-700 mb-1">Lessons learned</h3>
                <p className="text-sm text-gray-600">{decision.lessonsLearned}</p>
              </div>
            )}
            <div>
              <h3 className="font-medium text-gray-700 mb-1">Would choose again?</h3>
              <p className="text-sm text-gray-600">
                {decision.sameChoiceAgain ? 'Yes' : 'No'}
              </p>
            </div>
          </div>
        </div>
      ) : showReview ? (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Review this decision</h2>
          <ReviewForm onSubmit={handleReview} onCancel={() => setShowReview(false)} />
        </div>
      ) : (
        <div className="text-center">
          {isDue ? (
            <button
              onClick={() => setShowReview(true)}
              className="px-6 py-3 bg-orange-600 text-white font-medium rounded-md hover:bg-orange-700"
            >
              Review Now
            </button>
          ) : (
            <p className="text-gray-500">
              Review available in {daysUntilReview} days
              <button
                onClick={() => setShowReview(true)}
                className="ml-4 text-blue-600 hover:text-blue-800"
              >
                Review early
              </button>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
