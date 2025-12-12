import { Button, Card, Progress } from '@/components/ui';
import { QuestionCard } from '@/components/questions';
import { TopicSelector, DifficultyFilter, QuestionTypeFilter, AdvancedOptions } from '@/components/filters';
import { usePracticeStore } from '@/stores/practiceStore';

export function Practice() {
  const {
    selectedTopics,
    selectedDifficulties,
    selectedTypes,
    diagramsOnly,
    setSelectedTopics,
    setSelectedDifficulties,
    setSelectedTypes,
    setDiagramsOnly,
    currentQuestion,
    userAnswer,
    showFeedback,
    sessionStats,
    generateNewQuestion,
    submitAnswer,
    nextQuestion,
    resetSession,
  } = usePracticeStore();

  const canStart = selectedTopics.length > 0 || selectedDifficulties.length > 0;

  // Show setup or question
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Dynamical Systems Practice
            </h1>
            <p className="text-gray-600">
              Select topics and difficulty levels to start practicing
            </p>
          </div>

          {sessionStats.attempted > 0 && (
            <Card className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Previous Session</h3>
                  <Progress
                    correct={sessionStats.correct}
                    total={sessionStats.attempted}
                    className="w-64"
                  />
                </div>
                <Button variant="ghost" onClick={resetSession}>
                  Reset
                </Button>
              </div>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card>
              <TopicSelector
                selected={selectedTopics}
                onChange={setSelectedTopics}
              />
            </Card>
            <Card>
              <DifficultyFilter
                selected={selectedDifficulties}
                onChange={setSelectedDifficulties}
              />
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card>
              <QuestionTypeFilter
                selected={selectedTypes}
                onChange={setSelectedTypes}
              />
            </Card>
            <Card>
              <AdvancedOptions
                diagramsOnly={diagramsOnly}
                onDiagramsOnlyChange={setDiagramsOnly}
              />
            </Card>
          </div>

          <div className="text-center">
            <Button
              size="lg"
              onClick={generateNewQuestion}
              disabled={!canStart}
            >
              Start Practice
            </Button>
            {!canStart && (
              <p className="mt-2 text-sm text-gray-500">
                Select at least one topic or difficulty to begin
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => usePracticeStore.setState({ currentQuestion: null })}>
            ← Back to Setup
          </Button>
          <Progress
            correct={sessionStats.correct}
            total={sessionStats.attempted}
            className="w-48"
          />
        </div>

        {/* Question */}
        <QuestionCard
          question={currentQuestion}
          onAnswer={submitAnswer}
          showFeedback={showFeedback}
          userAnswer={userAnswer}
        />

        {/* Next button */}
        {showFeedback && (
          <div className="mt-6 text-center">
            <Button size="lg" onClick={nextQuestion}>
              Next Question
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
