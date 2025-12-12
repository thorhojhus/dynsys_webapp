import { create } from 'zustand';
import type { Question, Topic, Difficulty, QuestionType } from '@/types/question';
import { generateQuestion } from '@/generators';

interface SessionStats {
  attempted: number;
  correct: number;
}

interface PracticeState {
  // Filters
  selectedTopics: Topic[];
  selectedDifficulties: Difficulty[];
  selectedTypes: QuestionType[];
  diagramsOnly: boolean;

  // Current question state
  currentQuestion: Question | null;
  userAnswer: unknown;
  showFeedback: boolean;

  // Session stats
  sessionStats: SessionStats;

  // Actions
  setSelectedTopics: (topics: Topic[]) => void;
  setSelectedDifficulties: (difficulties: Difficulty[]) => void;
  setSelectedTypes: (types: QuestionType[]) => void;
  setDiagramsOnly: (value: boolean) => void;
  generateNewQuestion: () => void;
  submitAnswer: (answer: unknown) => void;
  nextQuestion: () => void;
  resetSession: () => void;
}

export const usePracticeStore = create<PracticeState>((set, get) => ({
  // Initial state
  selectedTopics: [],
  selectedDifficulties: [],
  selectedTypes: [],
  diagramsOnly: false,
  currentQuestion: null,
  userAnswer: undefined,
  showFeedback: false,
  sessionStats: { attempted: 0, correct: 0 },

  // Actions
  setSelectedTopics: (topics) => set({ selectedTopics: topics }),
  setSelectedDifficulties: (difficulties) => set({ selectedDifficulties: difficulties }),
  setSelectedTypes: (types) => set({ selectedTypes: types }),
  setDiagramsOnly: (value) => set({ diagramsOnly: value }),

  generateNewQuestion: () => {
    const { selectedTopics, selectedDifficulties, selectedTypes, diagramsOnly } = get();
    const question = generateQuestion({
      topics: selectedTopics.length > 0 ? selectedTopics : undefined,
      difficulties: selectedDifficulties.length > 0 ? selectedDifficulties : undefined,
      types: selectedTypes.length > 0 ? selectedTypes : undefined,
      diagramsOnly,
    });
    set({
      currentQuestion: question,
      userAnswer: undefined,
      showFeedback: false,
    });
  },

  submitAnswer: (answer) => {
    const { currentQuestion, sessionStats } = get();
    if (!currentQuestion) return;

    let isCorrect = false;
    if (currentQuestion.type === 'true_false') {
      isCorrect = answer === (currentQuestion as { correctAnswer: boolean }).correctAnswer;
    } else if (currentQuestion.type === 'multiple_choice') {
      isCorrect = answer === (currentQuestion as { correctIndex: number }).correctIndex;
    } else if (currentQuestion.type === 'matching') {
      const correctMapping = (currentQuestion as { correctMapping: number[] }).correctMapping;
      const userMapping = answer as number[];
      isCorrect = Array.isArray(userMapping) &&
        userMapping.length === correctMapping.length &&
        userMapping.every((val, idx) => val === correctMapping[idx]);
    }

    set({
      userAnswer: answer,
      showFeedback: true,
      sessionStats: {
        attempted: sessionStats.attempted + 1,
        correct: sessionStats.correct + (isCorrect ? 1 : 0),
      },
    });
  },

  nextQuestion: () => {
    get().generateNewQuestion();
  },

  resetSession: () => {
    set({
      currentQuestion: null,
      userAnswer: undefined,
      showFeedback: false,
      sessionStats: { attempted: 0, correct: 0 },
    });
  },
}));
