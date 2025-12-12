import { Card } from '@/components/ui/Card';
import { Badge, DifficultyBadge } from '@/components/ui/Badge';
import { MathText } from '@/components/ui/Math';
import { TrueFalse } from './TrueFalse';
import { MultipleChoice } from './MultipleChoice';
import { Matching } from './Matching';
import { Feedback } from './Feedback';
import { PhasePortrait, BifurcationDiagram } from '@/components/diagrams';
import {
  type Question,
  type TrueFalseQuestion,
  type MultipleChoiceQuestion,
  type MatchingQuestion,
  QuestionType,
  TOPIC_LABELS,
} from '@/types/question';

interface QuestionCardProps {
  question: Question;
  onAnswer: (answer: unknown) => void;
  showFeedback: boolean;
  userAnswer?: unknown;
}

function checkAnswer(question: Question, answer: unknown): boolean {
  switch (question.type) {
    case QuestionType.TRUE_FALSE:
      return answer === (question as TrueFalseQuestion).correctAnswer;
    case QuestionType.MULTIPLE_CHOICE:
      return answer === (question as MultipleChoiceQuestion).correctIndex;
    case QuestionType.MATCHING: {
      const mq = question as MatchingQuestion;
      const userMapping = answer as number[];
      return mq.correctMapping.every((correct, i) => correct === userMapping[i]);
    }
    default:
      return false;
  }
}

export function QuestionCard({
  question,
  onAnswer,
  showFeedback,
  userAnswer,
}: QuestionCardProps) {
  const renderAnswerArea = () => {
    switch (question.type) {
      case QuestionType.TRUE_FALSE:
        return (
          <TrueFalse
            question={question as TrueFalseQuestion}
            onAnswer={onAnswer}
            disabled={showFeedback}
            selectedAnswer={userAnswer as boolean | undefined}
          />
        );
      case QuestionType.MULTIPLE_CHOICE:
        return (
          <MultipleChoice
            question={question as MultipleChoiceQuestion}
            onAnswer={onAnswer}
            disabled={showFeedback}
            selectedAnswer={userAnswer as number | undefined}
          />
        );
      case QuestionType.MATCHING:
        return (
          <Matching
            question={question as MatchingQuestion}
            onAnswer={onAnswer}
            disabled={showFeedback}
            selectedAnswer={userAnswer as number[] | undefined}
          />
        );
      default:
        return <div className="text-gray-500">Question type not supported yet</div>;
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      {/* Header with badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge variant="info">{TOPIC_LABELS[question.topic]}</Badge>
        <DifficultyBadge difficulty={question.difficulty} />
        <Badge variant="default">
          {question.type === QuestionType.TRUE_FALSE
            ? 'True/False'
            : question.type === QuestionType.MATCHING
            ? 'Matching'
            : 'Multiple Choice'}
        </Badge>
      </div>

      {/* Question prompt */}
      <div className="text-lg text-gray-900 leading-relaxed mb-2">
        <MathText content={question.prompt} />
      </div>

      {/* Diagram if present */}
      {question.diagram && (
        <div className="flex justify-center my-4">
          {question.diagram.type === 'phase_portrait' && question.diagram.portraitType && (
            <PhasePortrait type={question.diagram.portraitType} size={180} />
          )}
          {question.diagram.type === 'bifurcation' && question.diagram.bifurcationType && (
            <BifurcationDiagram type={question.diagram.bifurcationType} size={220} />
          )}
        </div>
      )}

      {/* Answer area */}
      {renderAnswerArea()}

      {/* Feedback */}
      {showFeedback && userAnswer !== undefined && (
        <Feedback question={question} isCorrect={checkAnswer(question, userAnswer)} />
      )}
    </Card>
  );
}

export { checkAnswer };
