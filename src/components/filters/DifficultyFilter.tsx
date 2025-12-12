import { Difficulty, DIFFICULTY_LABELS } from '@/types/question';

interface DifficultyFilterProps {
  selected: Difficulty[];
  onChange: (difficulties: Difficulty[]) => void;
  className?: string;
}

const DIFFICULTY_ORDER: Difficulty[] = [
  Difficulty.CONCEPTUAL,
  Difficulty.LIGHT,
  Difficulty.MODERATE,
  Difficulty.HEAVY,
];

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  [Difficulty.CONCEPTUAL]: 'bg-green-100 border-green-300 text-green-800',
  [Difficulty.LIGHT]: 'bg-blue-100 border-blue-300 text-blue-800',
  [Difficulty.MODERATE]: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  [Difficulty.HEAVY]: 'bg-red-100 border-red-300 text-red-800',
};

const DIFFICULTY_COLORS_SELECTED: Record<Difficulty, string> = {
  [Difficulty.CONCEPTUAL]: 'bg-green-500 border-green-500 text-white',
  [Difficulty.LIGHT]: 'bg-blue-500 border-blue-500 text-white',
  [Difficulty.MODERATE]: 'bg-yellow-500 border-yellow-500 text-white',
  [Difficulty.HEAVY]: 'bg-red-500 border-red-500 text-white',
};

export function DifficultyFilter({ selected, onChange, className = '' }: DifficultyFilterProps) {
  const toggleDifficulty = (difficulty: Difficulty) => {
    if (selected.includes(difficulty)) {
      onChange(selected.filter((d) => d !== difficulty));
    } else {
      onChange([...selected, difficulty]);
    }
  };

  const selectAll = () => {
    onChange([...DIFFICULTY_ORDER]);
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Difficulty</h3>
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

      <div className="flex flex-wrap gap-2">
        {DIFFICULTY_ORDER.map((difficulty) => {
          const isSelected = selected.includes(difficulty);
          return (
            <button
              key={difficulty}
              onClick={() => toggleDifficulty(difficulty)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-colors
                ${isSelected ? DIFFICULTY_COLORS_SELECTED[difficulty] : DIFFICULTY_COLORS[difficulty]}
              `}
            >
              {DIFFICULTY_LABELS[difficulty]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
