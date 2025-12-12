import { MathText } from '@/components/ui/Math';
import type { MultipleChoiceQuestion } from '@/types/question';

interface MultipleChoiceProps {
  question: MultipleChoiceQuestion;
  onAnswer: (index: number) => void;
  disabled?: boolean;
  selectedAnswer?: number;
}

export function MultipleChoice({
  question,
  onAnswer,
  disabled,
  selectedAnswer,
}: MultipleChoiceProps) {
  const getOptionStyle = (index: number) => {
    if (disabled && selectedAnswer !== undefined) {
      if (index === question.correctIndex) {
        return 'bg-green-50 border-green-500 text-green-800';
      }
      if (index === selectedAnswer && index !== question.correctIndex) {
        return 'bg-red-50 border-red-500 text-red-800';
      }
    }
    if (selectedAnswer === index) {
      return 'bg-blue-50 border-blue-500 text-blue-800';
    }
    return 'border-gray-200 hover:border-gray-300 hover:bg-gray-50';
  };

  const getIndicator = (index: number) => {
    if (disabled && selectedAnswer !== undefined) {
      if (index === question.correctIndex) {
        return (
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-sm">
            ✓
          </span>
        );
      }
      if (index === selectedAnswer && index !== question.correctIndex) {
        return (
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-sm">
            ✗
          </span>
        );
      }
    }
    return (
      <span className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-sm font-medium">
        {String.fromCharCode(65 + index)}
      </span>
    );
  };

  return (
    <div className="space-y-3 mt-6">
      {question.options.map((option, index) => (
        <button
          key={index}
          onClick={() => onAnswer(index)}
          disabled={disabled}
          className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-colors
            ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
            ${getOptionStyle(index)}
          `}
        >
          {getIndicator(index)}
          <span className="flex-1">
            <MathText content={option} />
          </span>
        </button>
      ))}
    </div>
  );
}
