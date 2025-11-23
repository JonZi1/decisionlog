import { useState } from 'react';
import type { Decision, DecisionType, Stakes } from '../lib/types';
import { CATEGORIES, HORIZON_OPTIONS } from '../lib/types';
import { getConfidenceLabel } from '../lib/stats';

interface DecisionFormProps {
  onSubmit: (data: Omit<Decision, 'id' | 'reviewDate' | 'reviewedAt' | 'actualOutcome' | 'rating' | 'lessonsLearned' | 'sameChoiceAgain'>) => void;
  initialData?: Partial<Decision>;
}

export function DecisionForm({ onSubmit, initialData }: DecisionFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(initialData?.category || 'work');
  const [decisionType, setDecisionType] = useState<DecisionType>(initialData?.decisionType || 'binary');
  const [options, setOptions] = useState<string[]>(initialData?.options || ['', '']);
  const [chosenOption, setChosenOption] = useState(initialData?.chosenOption || '');
  const [reasoning, setReasoning] = useState(initialData?.reasoning || '');
  const [expectedOutcome, setExpectedOutcome] = useState(initialData?.expectedOutcome || '');
  const [confidence, setConfidence] = useState(initialData?.confidence || 50);
  const [stakes, setStakes] = useState<Stakes>(initialData?.stakes || 'medium');
  const [horizonDays, setHorizonDays] = useState(initialData?.horizonDays || 30);
  const [tags, setTags] = useState(initialData?.tags?.join(', ') || '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate options
    const validOptions = options.map(o => o.trim()).filter(Boolean);
    if (validOptions.length < 2) {
      setError('Please enter at least 2 options');
      return;
    }

    // Validate chosen option matches one of the options
    const trimmedChosen = chosenOption.trim();
    if (!validOptions.includes(trimmedChosen)) {
      setError('Chosen option must match one of the options considered');
      return;
    }

    // Normalize tags
    const normalizedTags = tags
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(Boolean)
      .filter((t, i, arr) => arr.indexOf(t) === i); // Remove duplicates

    onSubmit({
      title: title.trim(),
      date,
      category,
      decisionType,
      options: validOptions,
      chosenOption: trimmedChosen,
      reasoning: reasoning.trim(),
      expectedOutcome: expectedOutcome.trim(),
      confidence,
      stakes,
      horizonDays,
      tags: normalizedTags,
    });
  };

  const addOption = () => setOptions([...options, '']);
  const removeOption = (index: number) => setOptions(options.filter((_, i) => i !== index));
  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
          {error}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="What's the decision?"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Decision Type</label>
          <select
            value={decisionType}
            onChange={e => setDecisionType(e.target.value as DecisionType)}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="binary">Binary (Yes/No)</option>
            <option value="multi">Multiple Options</option>
            <option value="open">Open-ended</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stakes</label>
          <select
            value={stakes}
            onChange={e => setStakes(e.target.value as Stakes)}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Options Considered</label>
        {options.map((option, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input
              type="text"
              value={option}
              onChange={e => updateOption(i, e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder={`Option ${i + 1}`}
            />
            {options.length > 2 && (
              <button type="button" onClick={() => removeOption(i)} className="px-3 py-2 text-red-600 hover:bg-red-50 rounded">
                Remove
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={addOption} className="text-sm text-blue-600 hover:text-blue-800">
          + Add option
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Chosen Option</label>
        <input
          type="text"
          value={chosenOption}
          onChange={e => setChosenOption(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="What did you decide?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Reasoning</label>
        <textarea
          value={reasoning}
          onChange={e => setReasoning(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="Why did you choose this?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Expected Outcome</label>
        <textarea
          value={expectedOutcome}
          onChange={e => setExpectedOutcome(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="What do you expect to happen?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Confidence: {confidence}% - {getConfidenceLabel(confidence)}
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={confidence}
          onChange={e => setConfidence(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Review Timeline</label>
        <select
          value={horizonDays}
          onChange={e => setHorizonDays(Number(e.target.value))}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
        >
          {HORIZON_OPTIONS.map(h => (
            <option key={h.days} value={h.days}>{h.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
        <input
          type="text"
          value={tags}
          onChange={e => setTags(e.target.value)}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., career, big-purchase, relationship"
        />
      </div>

      <button
        type="submit"
        className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Save Decision
      </button>
    </form>
  );
}
