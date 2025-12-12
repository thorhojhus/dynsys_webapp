import { useState, useEffect } from 'react';
import { MathText } from '@/components/ui/Math';
import type { MatchingQuestion } from '@/types/question';
import { PhasePortrait, BifurcationDiagram } from '@/components/diagrams';
import type { PhasePortraitType, BifurcationDiagramType } from '@/types/question';

interface MatchingProps {
  question: MatchingQuestion;
  onAnswer: (mapping: number[]) => void;
  disabled?: boolean;
  selectedAnswer?: number[];
}

export function Matching({
  question,
  onAnswer,
  disabled,
  selectedAnswer,
}: MatchingProps) {
  const [currentMapping, setCurrentMapping] = useState<(number | null)[]>(
    () => question.leftItems.map(() => null)
  );
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);

  // Reset mapping when question changes
  useEffect(() => {
    setCurrentMapping(question.leftItems.map(() => null));
    setSelectedLeft(null);
  }, [question.id]);

  // Use selectedAnswer if provided (after submission)
  const displayMapping = selectedAnswer || currentMapping;

  const handleLeftClick = (index: number) => {
    if (disabled) return;
    setSelectedLeft(selectedLeft === index ? null : index);
  };

  const handleRightClick = (index: number) => {
    if (disabled || selectedLeft === null) return;

    const newMapping = [...currentMapping];
    // Remove any existing mapping to this right item
    const existingIndex = newMapping.indexOf(index);
    if (existingIndex !== -1 && existingIndex !== selectedLeft) {
      newMapping[existingIndex] = null;
    }
    // Set the new mapping
    newMapping[selectedLeft] = index;
    setCurrentMapping(newMapping);
    setSelectedLeft(null);

    // If all items are matched, submit the answer
    if (newMapping.every((m) => m !== null)) {
      onAnswer(newMapping as number[]);
    }
  };

  const clearMapping = (leftIndex: number) => {
    if (disabled) return;
    const newMapping = [...currentMapping];
    newMapping[leftIndex] = null;
    setCurrentMapping(newMapping);
  };

  const getLeftItemStyle = (index: number) => {
    if (disabled && selectedAnswer) {
      const isCorrect = selectedAnswer[index] === question.correctMapping[index];
      if (isCorrect) return 'border-green-500 bg-green-50';
      return 'border-red-500 bg-red-50';
    }
    if (selectedLeft === index) return 'border-blue-500 bg-blue-50';
    if (displayMapping[index] !== null) return 'border-gray-400 bg-gray-50';
    return 'border-gray-200 hover:border-gray-300';
  };

  const getRightItemStyle = (index: number) => {
    const isMatched = displayMapping.includes(index);
    if (isMatched) return 'border-gray-400 bg-gray-50 opacity-50';
    if (selectedLeft !== null) return 'border-blue-300 hover:border-blue-500 cursor-pointer';
    return 'border-gray-200';
  };

  // Check if item is a diagram reference
  const renderItem = (item: string, size: number = 120) => {
    if (item.startsWith('portrait:')) {
      const type = item.replace('portrait:', '') as PhasePortraitType;
      return <PhasePortrait type={type} size={size} />;
    }
    if (item.startsWith('bifurcation:')) {
      const type = item.replace('bifurcation:', '') as BifurcationDiagramType;
      return <BifurcationDiagram type={type} size={size} />;
    }
    return <MathText content={item} />;
  };

  return (
    <div className="mt-6">
      <div className="text-sm text-gray-600 mb-3">
        Click a left item, then click the matching right item.
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-700 mb-2">Match from:</div>
          {question.leftItems.map((item, index) => (
            <div
              key={`left-${index}`}
              className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${getLeftItemStyle(index)}`}
              onClick={() => handleLeftClick(index)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">{renderItem(item)}</div>
                {displayMapping[index] !== null && (
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-sm text-gray-500">
                      → {String.fromCharCode(65 + (displayMapping[index] as number))}
                    </span>
                    {!disabled && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearMapping(index);
                        }}
                        className="text-gray-400 hover:text-red-500"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Right column */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-700 mb-2">Match to:</div>
          {question.rightItems.map((item, index) => (
            <div
              key={`right-${index}`}
              className={`p-3 rounded-lg border-2 transition-colors ${getRightItemStyle(index)}`}
              onClick={() => handleRightClick(index)}
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">
                  {String.fromCharCode(65 + index)}
                </span>
                <div className="flex-1">{renderItem(item)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit button if not all matched */}
      {!disabled && currentMapping.some((m) => m === null) && (
        <div className="mt-4 text-sm text-gray-500">
          Match all items to submit your answer.
        </div>
      )}
    </div>
  );
}
