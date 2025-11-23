import { useNavigate } from 'react-router-dom';
import { DecisionForm } from '../components/DecisionForm';
import { createDecision } from '../lib/decisionService';
import type { Decision } from '../lib/types';

export function NewDecision() {
  const navigate = useNavigate();

  const handleSubmit = async (
    data: Omit<Decision, 'id' | 'reviewDate' | 'reviewedAt' | 'actualOutcome' | 'rating' | 'lessonsLearned' | 'sameChoiceAgain'>
  ) => {
    await createDecision(data);
    navigate('/decisions');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Log New Decision</h1>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <DecisionForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
