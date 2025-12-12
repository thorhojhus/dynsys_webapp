import type { Question, Topic, Difficulty, QuestionType } from '@/types/question';

export interface GeneratorConfig {
  topic: Topic;
  difficulty: Difficulty;
  type: QuestionType;
  seed?: number;
}

export interface QuestionGenerator {
  topics: Topic[];
  types: QuestionType[];
  difficulties: Difficulty[];
  generate(config: GeneratorConfig): Question;
  canGenerate(config: GeneratorConfig): boolean;
}

export abstract class BaseGenerator implements QuestionGenerator {
  abstract topics: Topic[];
  abstract types: QuestionType[];
  abstract difficulties: Difficulty[];

  abstract generate(config: GeneratorConfig): Question;

  canGenerate(config: GeneratorConfig): boolean {
    return (
      this.topics.includes(config.topic) &&
      this.types.includes(config.type) &&
      this.difficulties.includes(config.difficulty)
    );
  }
}
