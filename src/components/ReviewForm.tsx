import { useState } from 'react';
import type { Rating } from '../lib/types';
import { CONTRIBUTING_FACTORS } from '../lib/types';

interface ReviewFormProps {
  onSubmit: (data: {
    actualOutcome: string;
    rating: Rating;
    lessonsLearned: string;
    sameChoiceAgain: boolean;
    outcomeMatchedExpectation?: 'exceeded' | 'met' | 'partial' | 'missed';
    contributingFactors?: string[];
    decisionQuality?: 'excellent' | 'good' | 'fair' | 'poor';
  }) => void;
  onCancel: () => void;
}

export function ReviewForm({ onSubmit, onCancel }: ReviewFormProps) {
  const [actualOutcome, setActualOutcome] = useState('');
  const [rating, setRating] = useState<Rating>(3);
  const [lessonsLearned, setLessonsLearned] = useState('');
  const [sameChoiceAgain, setSameChoiceAgain] = useState(true);
  const [outcomeMatchedExpectation, setOutcomeMatchedExpectation] = useState<'exceeded' | 'met' | 'partial' | 'missed' | ''>('');
  const [contributingFactors, setContributingFactors] = useState<string[]>([]);
  const [decisionQuality, setDecisionQuality] = useState<'excellent' | 'good' | 'fair' | 'poor' | ''>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      actualOutcome,
      rating,
      lessonsLearned,
      sameChoiceAgain,
      outcomeMatchedExpectation: outcomeMatchedExpectation || undefined,
      contributingFactors: contributingFactors.length > 0 ? contributingFactors : undefined,
      decisionQuality: decisionQuality || undefined,
    });
  };

  const toggleFactor = (factor: string) => {
    setContributingFactors(prev =>
      prev.includes(factor)
        ? prev.filter(f => f !== factor)
        : [...prev, factor]
    );
  };

  const ratingLabels = ['Loss', 'Poor', 'Meh', 'Good', 'Win'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">What actually happened?</label>
        <textarea
          value={actualOutcome}
          onChange={e => setActualOutcome(e.target.value)}
          rows={3}
          required
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="Describe the outcome..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Did outcome match expectations?</label>
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'exceeded', label: 'Exceeded' },
            { value: 'met', label: 'Met' },
            { value: 'partial', label: 'Partially' },
            { value: 'missed', label: 'Missed' },
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setOutcomeMatchedExpectation(opt.value as typeof outcomeMatchedExpectation)}
              className={`px-3 py-1 rounded-md text-sm ${
                outcomeMatchedExpectation === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setRating(r as Rating)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium ${
                rating === r
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {r} - {ratingLabels[r - 1]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Contributing factors</label>
        <div className="flex flex-wrap gap-2">
          {CONTRIBUTING_FACTORS.map(factor => (
            <button
              key={factor}
              type="button"
              onClick={() => toggleFactor(factor)}
              className={`px-2 py-1 rounded text-xs ${
                contributingFactors.includes(factor)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {factor}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Decision quality (process, not outcome)</label>
        <div className="flex gap-2">
          {[
            { value: 'excellent', label: 'Excellent' },
            { value: 'good', label: 'Good' },
            { value: 'fair', label: 'Fair' },
            { value: 'poor', label: 'Poor' },
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDecisionQuality(opt.value as typeof decisionQuality)}
              className={`flex-1 py-1 px-2 rounded-md text-sm ${
                decisionQuality === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">What did you learn?</label>
        <textarea
          value={lessonsLearned}
          onChange={e => setLessonsLearned(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="Key takeaways..."
        />
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={sameChoiceAgain}
            onChange={e => setSameChoiceAgain(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-gray-700">Would make the same choice again</span>
        </label>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="flex-1 py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
        >
          Save Review
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="py-2 px-4 bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
