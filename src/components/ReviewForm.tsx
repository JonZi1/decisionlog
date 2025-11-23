import { useState } from 'react';
import type { Rating } from '../lib/types';

interface ReviewFormProps {
  onSubmit: (data: {
    actualOutcome: string;
    rating: Rating;
    lessonsLearned: string;
    sameChoiceAgain: boolean;
  }) => void;
  onCancel: () => void;
}

export function ReviewForm({ onSubmit, onCancel }: ReviewFormProps) {
  const [actualOutcome, setActualOutcome] = useState('');
  const [rating, setRating] = useState<Rating>(3);
  const [lessonsLearned, setLessonsLearned] = useState('');
  const [sameChoiceAgain, setSameChoiceAgain] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ actualOutcome, rating, lessonsLearned, sameChoiceAgain });
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
