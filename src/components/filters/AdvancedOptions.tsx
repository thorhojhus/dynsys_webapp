interface AdvancedOptionsProps {
  diagramsOnly: boolean;
  onDiagramsOnlyChange: (value: boolean) => void;
  className?: string;
}

export function AdvancedOptions({
  diagramsOnly,
  onDiagramsOnlyChange,
  className = '',
}: AdvancedOptionsProps) {
  return (
    <div className={className}>
      <h3 className="font-semibold text-gray-900 mb-3">Advanced Options</h3>

      <div className="space-y-3">
        <label className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
          <input
            type="checkbox"
            checked={diagramsOnly}
            onChange={(e) => onDiagramsOnlyChange(e.target.checked)}
            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <div className="text-sm font-medium text-gray-900">Diagrams Only</div>
            <div className="text-xs text-gray-500">
              Only show questions with phase portraits or bifurcation diagrams
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}
