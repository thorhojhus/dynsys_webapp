import { Button } from '@/components/ui/Button';
import type { TrueFalseQuestion } from '@/types/question';

interface TrueFalseProps {
  question: TrueFalseQuestion;
  onAnswer: (answer: boolean) => void;
  disabled?: boolean;
  selectedAnswer?: boolean;
}

export function TrueFalse({ question, onAnswer, disabled, selectedAnswer }: TrueFalseProps) {
  const getButtonStyle = (value: boolean) => {
    if (disabled && selectedAnswer !== undefined) {
      if (value === question.correctAnswer) {
        return 'bg-green-100 border-green-500 text-green-800';
      }
      if (value === selectedAnswer && value !== question.correctAnswer) {
        return 'bg-red-100 border-red-500 text-red-800';
      }
    }
    if (selectedAnswer === value) {
      return 'bg-blue-100 border-blue-500 text-blue-800';
    }
    return '';
  };

  return (
    <div className="flex gap-4 justify-center mt-6">
      <button
        onClick={() => onAnswer(true)}
        disabled={disabled}
        className={`px-8 py-3 text-lg font-medium rounded-lg border-2 transition-colors
          ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}
          ${getButtonStyle(true) || 'border-gray-300 text-gray-700'}
        `}
      >
        True
      </button>
      <button
        onClick={() => onAnswer(false)}
        disabled={disabled}
        className={`px-8 py-3 text-lg font-medium rounded-lg border-2 transition-colors
          ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}
          ${getButtonStyle(false) || 'border-gray-300 text-gray-700'}
        `}
      >
        False
      </button>
    </div>
  );
}
