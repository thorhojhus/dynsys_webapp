interface ProgressProps {
  correct: number;
  total: number;
  className?: string;
}

export function Progress({ correct, total, className = '' }: ProgressProps) {
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">
          {correct} / {total} correct
        </span>
        <span className="font-medium text-gray-900">{percentage}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface StreakProps {
  current: number;
  best: number;
  className?: string;
}

export function Streak({ current, best, className = '' }: StreakProps) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-2xl">🔥</span>
        <div>
          <div className="text-lg font-bold text-gray-900">{current}</div>
          <div className="text-xs text-gray-500">Current</div>
        </div>
      </div>
      <div className="h-8 w-px bg-gray-200" />
      <div>
        <div className="text-lg font-bold text-gray-900">{best}</div>
        <div className="text-xs text-gray-500">Best</div>
      </div>
    </div>
  );
}
