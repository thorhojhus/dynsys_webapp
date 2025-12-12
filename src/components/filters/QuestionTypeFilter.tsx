import { QuestionType } from '@/types/question';

const TYPE_LABELS: Record<QuestionType, string> = {
  [QuestionType.TRUE_FALSE]: 'True/False',
  [QuestionType.MULTIPLE_CHOICE]: 'Multiple Choice',
  [QuestionType.MATCHING]: 'Matching',
  [QuestionType.CLASSIFICATION]: 'Classification',
};

const TYPE_DESCRIPTIONS: Record<QuestionType, string> = {
  [QuestionType.TRUE_FALSE]: 'Answer true or false to statements',
  [QuestionType.MULTIPLE_CHOICE]: 'Select the correct answer from options',
  [QuestionType.MATCHING]: 'Match items from two columns',
  [QuestionType.CLASSIFICATION]: 'Categorize items into groups',
};

// Only show types that are actually implemented
const AVAILABLE_TYPES = [
  QuestionType.TRUE_FALSE,
  QuestionType.MULTIPLE_CHOICE,
  QuestionType.MATCHING,
];

interface QuestionTypeFilterProps {
  selected: QuestionType[];
  onChange: (types: QuestionType[]) => void;
  className?: string;
}

export function QuestionTypeFilter({ selected, onChange, className = '' }: QuestionTypeFilterProps) {
  const toggleType = (type: QuestionType) => {
    if (selected.includes(type)) {
      onChange(selected.filter((t) => t !== type));
    } else {
      onChange([...selected, type]);
    }
  };

  const selectAll = () => {
    onChange([...AVAILABLE_TYPES]);
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Question Types</h3>
        <div className="flex gap-2 text-sm">
          <button onClick={selectAll} className="text-blue-600 hover:text-blue-800">
            All
          </button>
          <span className="text-gray-300">|</span>
          <button onClick={clearAll} className="text-blue-600 hover:text-blue-800">
            None
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {AVAILABLE_TYPES.map((type) => (
          <label
            key={type}
            className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selected.includes(type)}
              onChange={() => toggleType(type)}
              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <div className="text-sm font-medium text-gray-900">{TYPE_LABELS[type]}</div>
              <div className="text-xs text-gray-500">{TYPE_DESCRIPTIONS[type]}</div>
            </div>
          </label>
        ))}
      </div>

      <p className="mt-3 text-xs text-gray-400">
        Leave empty to include all types
      </p>
    </div>
  );
}
