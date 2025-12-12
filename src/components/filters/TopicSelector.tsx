import { Topic, TOPIC_LABELS, TOPIC_GROUPS } from '@/types/question';

interface TopicSelectorProps {
  selected: Topic[];
  onChange: (topics: Topic[]) => void;
  className?: string;
}

export function TopicSelector({ selected, onChange, className = '' }: TopicSelectorProps) {
  const toggleTopic = (topic: Topic) => {
    if (selected.includes(topic)) {
      onChange(selected.filter((t) => t !== topic));
    } else {
      onChange([...selected, topic]);
    }
  };

  const toggleGroup = (topics: Topic[]) => {
    const allSelected = topics.every((t) => selected.includes(t));
    if (allSelected) {
      onChange(selected.filter((t) => !topics.includes(t)));
    } else {
      const newSelected = new Set([...selected, ...topics]);
      onChange(Array.from(newSelected));
    }
  };

  const selectAll = () => {
    onChange(Object.values(Topic));
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Topics</h3>
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

      <div className="space-y-4">
        {Object.entries(TOPIC_GROUPS).map(([groupName, topics]) => (
          <div key={groupName}>
            <button
              onClick={() => toggleGroup(topics)}
              className="text-sm font-medium text-gray-700 hover:text-gray-900 mb-2 flex items-center gap-2"
            >
              <input
                type="checkbox"
                checked={topics.every((t) => selected.includes(t))}
                onChange={() => toggleGroup(topics)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              {groupName}
            </button>
            <div className="ml-6 space-y-1">
              {topics.map((topic) => (
                <label
                  key={topic}
                  className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-900"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(topic)}
                    onChange={() => toggleTopic(topic)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  {TOPIC_LABELS[topic]}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
