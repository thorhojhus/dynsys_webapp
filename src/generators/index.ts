import { Topic, Difficulty, QuestionType, type Question } from '@/types/question';
import type { QuestionGenerator, GeneratorConfig } from './types';
import { trueFalsePool } from './pools/trueFalse';
import { Stability1DGenerator } from './templates/stability1D';
import { LinearSystems2DGenerator } from './templates/linearSystems2D';
import { BifurcationGenerator } from './templates/bifurcations';
import { PhasePortraitGenerator } from './templates/phasePortraits';
import { CenterManifoldGenerator } from './templates/centerManifold';
import { MatchingDiagramsGenerator } from './templates/matchingDiagrams';
import { HopfBifurcationGenerator } from './templates/hopfBifurcation';
import { LyapunovGenerator } from './templates/lyapunovFunctions';
import { IndexTheoryGenerator } from './templates/indexTheory';
import { HamiltonianGenerator } from './templates/hamiltonianSystems';
import { randomChoice, generateSeed, createRng, shuffle } from './utils/random';

// Registry of all generators
const generators: QuestionGenerator[] = [
  new Stability1DGenerator(),
  new LinearSystems2DGenerator(),
  new BifurcationGenerator(),
  new PhasePortraitGenerator(),
  new CenterManifoldGenerator(),
  new MatchingDiagramsGenerator(),
  new HopfBifurcationGenerator(),
  new LyapunovGenerator(),
  new IndexTheoryGenerator(),
  new HamiltonianGenerator(),
];

// Track used question IDs to avoid repetition in a session
let usedQuestionIds = new Set<string>();
let usedPoolIndices = new Set<number>();

export function resetUsedQuestions() {
  usedQuestionIds = new Set();
  usedPoolIndices = new Set();
}

// Find generators that can handle a given config
function findGenerators(config: Partial<GeneratorConfig>): QuestionGenerator[] {
  return generators.filter((g) => {
    if (config.topic && !g.topics.includes(config.topic)) return false;
    if (config.type && !g.types.includes(config.type)) return false;
    if (config.difficulty && !g.difficulties.includes(config.difficulty)) return false;
    return true;
  });
}

// Get questions from the True/False pool matching criteria
function getPoolQuestions(config: Partial<GeneratorConfig>): { question: Question; index: number }[] {
  return trueFalsePool
    .map((q, index) => ({ question: q, index }))
    .filter(({ question: q, index }) => {
      if (usedPoolIndices.has(index)) return false;
      if (config.topic && q.topic !== config.topic) return false;
      if (config.type && q.type !== config.type) return false;
      if (config.difficulty && q.difficulty !== config.difficulty) return false;
      return true;
    });
}

export interface GenerateOptions {
  topics?: Topic[];
  difficulties?: Difficulty[];
  types?: QuestionType[];
  diagramsOnly?: boolean;
  seed?: number;
}

// Generators that produce questions with diagrams
const diagramGenerators = new Set([
  'PhasePortraitGenerator',
  'BifurcationGenerator',
  'MatchingDiagramsGenerator',
]);

export function generateQuestion(options: GenerateOptions = {}): Question | null {
  // Always use a fresh seed for variety
  const seed = options.seed ?? generateSeed();
  const rng = createRng(seed);

  const topics = options.topics?.length ? options.topics : Object.values(Topic) as Topic[];
  const difficulties = options.difficulties?.length
    ? options.difficulties
    : Object.values(Difficulty) as Difficulty[];
  const types = options.types?.length ? options.types : Object.values(QuestionType) as QuestionType[];
  const diagramsOnly = options.diagramsOnly ?? false;

  // If diagramsOnly, skip pool questions (they don't have diagrams) and filter generators
  const usePool = !diagramsOnly && rng() < 0.3 && difficulties.includes(Difficulty.CONCEPTUAL);

  if (usePool) {
    // Try to get a pool question
    const poolConfig = {
      topic: randomChoice(rng, topics),
      difficulty: Difficulty.CONCEPTUAL,
      type: QuestionType.TRUE_FALSE,
    };
    const availablePool = getPoolQuestions(poolConfig);

    if (availablePool.length > 0) {
      const selected = randomChoice(rng, availablePool);
      usedPoolIndices.add(selected.index);
      return selected.question;
    }
  }

  // Try generators (with multiple attempts for variety)
  for (let attempt = 0; attempt < 10; attempt++) {
    const config: GeneratorConfig = {
      topic: randomChoice(rng, topics),
      difficulty: randomChoice(rng, difficulties),
      type: randomChoice(rng, types),
      seed: generateSeed(), // Fresh seed for each attempt
    };

    let availableGenerators = findGenerators(config);

    // Filter for diagram generators if diagramsOnly is set
    if (diagramsOnly) {
      availableGenerators = availableGenerators.filter(g =>
        diagramGenerators.has(g.constructor.name)
      );
    }

    if (availableGenerators.length > 0) {
      const generator = randomChoice(rng, availableGenerators);
      try {
        const question = generator.generate(config);

        // Check if we've used this question before
        if (!usedQuestionIds.has(question.id)) {
          usedQuestionIds.add(question.id);
          return question;
        }
      } catch (e) {
        console.warn('Generator failed:', e);
        continue;
      }
    }
  }

  // Fallback: try any pool question we haven't used (but not if diagramsOnly)
  if (!diagramsOnly) {
    const allAvailablePool = trueFalsePool
      .map((q, i) => ({ question: q, index: i }))
      .filter(({ index }) => !usedPoolIndices.has(index))
      .filter(({ question: q }) => {
        if (!topics.some(t => t === q.topic)) return false;
        return true;
      });

    if (allAvailablePool.length > 0) {
      const selected = randomChoice(rng, allAvailablePool);
      usedPoolIndices.add(selected.index);
      return selected.question;
    }

    // If all questions used, reset and try again
    if (usedPoolIndices.size >= trueFalsePool.length * 0.8) {
      resetUsedQuestions();
      return generateQuestion(options);
    }

    // Last resort: return any pool question
    if (trueFalsePool.length > 0) {
      return randomChoice(rng, trueFalsePool);
    }
  }

  return null;
}

// Get all available topics
export function getAvailableTopics(): Topic[] {
  const topicsFromGenerators = new Set<Topic>();
  generators.forEach((g) => g.topics.forEach((t) => topicsFromGenerators.add(t)));
  trueFalsePool.forEach((q) => topicsFromGenerators.add(q.topic));
  return Array.from(topicsFromGenerators);
}

// Get available difficulties for a topic
export function getAvailableDifficulties(topic?: Topic): Difficulty[] {
  const difficulties = new Set<Difficulty>();

  if (topic) {
    generators
      .filter((g) => g.topics.includes(topic))
      .forEach((g) => g.difficulties.forEach((d) => difficulties.add(d)));
    trueFalsePool
      .filter((q) => q.topic === topic)
      .forEach((q) => difficulties.add(q.difficulty));
  } else {
    generators.forEach((g) => g.difficulties.forEach((d) => difficulties.add(d)));
    trueFalsePool.forEach((q) => difficulties.add(q.difficulty));
  }

  return Array.from(difficulties);
}

// Get available question types
export function getAvailableTypes(topic?: Topic): QuestionType[] {
  const types = new Set<QuestionType>();

  if (topic) {
    generators
      .filter((g) => g.topics.includes(topic))
      .forEach((g) => g.types.forEach((t) => types.add(t)));
    trueFalsePool
      .filter((q) => q.topic === topic)
      .forEach((q) => types.add(q.type));
  } else {
    generators.forEach((g) => g.types.forEach((t) => types.add(t)));
    trueFalsePool.forEach((q) => types.add(q.type));
  }

  return Array.from(types);
}

export { trueFalsePool, resetUsedQuestions as resetSession };
