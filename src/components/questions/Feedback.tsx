import { MathText } from '@/components/ui/Math';
import type { Question } from '@/types/question';

interface FeedbackProps {
  question: Question;
  isCorrect: boolean;
  className?: string;
}

export function Feedback({ question, isCorrect, className = '' }: FeedbackProps) {
  return (
    <div
      className={`mt-6 p-4 rounded-lg ${
        isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      } ${className}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-2xl ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
          {isCorrect ? '✓' : '✗'}
        </span>
        <span className={`font-semibold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
          {isCorrect ? 'Correct!' : 'Incorrect'}
        </span>
      </div>
      <div className="text-gray-700 leading-relaxed">
        <MathText content={question.explanation} />
      </div>
    </div>
  );
}
