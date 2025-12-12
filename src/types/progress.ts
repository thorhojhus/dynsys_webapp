import type { Topic, Difficulty, QuestionType } from './question';

export interface QuestionAttempt {
  questionId: string;
  topic: Topic;
  difficulty: Difficulty;
  type: QuestionType;
  correct: boolean;
  timestamp: number;
  timeSpent: number;
}

export interface TopicProgress {
  topic: Topic;
  attempted: number;
  correct: number;
  byDifficulty: Record<Difficulty, { attempted: number; correct: number }>;
}

export interface SessionProgress {
  sessionId: string;
  startTime: number;
  endTime?: number;
  attempts: QuestionAttempt[];
  topics: Topic[];
  difficulties: Difficulty[];
}

export interface OverallProgress {
  totalAttempted: number;
  totalCorrect: number;
  byTopic: Partial<Record<Topic, TopicProgress>>;
  sessions: SessionProgress[];
  streaks: {
    current: number;
    best: number;
    lastPracticeDate: string;
  };
}
