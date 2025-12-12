import {
  QuestionType,
  Topic,
  Difficulty,
  type MultipleChoiceQuestion,
  type TrueFalseQuestion,
  type Question,
} from '@/types/question';
import { BaseGenerator, type GeneratorConfig } from '../types';
import {
  createRng,
  randomInt,
  randomChoice,
  generateId,
  shuffle,
} from '../utils/random';
import {
  type Polynomial,
  findRoots,
  analyzeStability1D,
  evaluatePolynomial,
  derivativePolynomial,
} from '../utils/polynomial';
import { formatPolynomial } from '../utils/latex';

type StabilityType = 'stable' | 'unstable' | 'semistable';

interface EquilibriumInfo {
  x: number;
  stability: StabilityType;
}

export class Stability1DGenerator extends BaseGenerator {
  topics = [Topic.STABILITY_1D];
  types = [QuestionType.MULTIPLE_CHOICE, QuestionType.TRUE_FALSE];
  difficulties = [Difficulty.LIGHT, Difficulty.MODERATE];

  generate(config: GeneratorConfig): Question {
    const seed = config.seed ?? Math.floor(Math.random() * 2147483647);
    const rng = createRng(seed);

    if (config.type === QuestionType.TRUE_FALSE) {
      return this.generateTrueFalse(rng, config.difficulty, seed);
    }
    return this.generateMultipleChoice(rng, config.difficulty, seed);
  }

  private generatePolynomial(rng: () => number, difficulty: Difficulty): Polynomial {
    // Generate polynomials with nice equilibria
    const templates = [
      // x(x-a)(x-b) form - has equilibria at 0, a, b
      () => {
        const a = randomInt(rng, 1, 3);
        const b = -randomInt(rng, 1, 3);
        // Expand x(x-a)(x-b) = x^3 - (a+b)x^2 + ab*x
        return {
          terms: [
            { coefficient: 1, power: 3 },
            { coefficient: -(a + b), power: 2 },
            { coefficient: a * b, power: 1 },
          ],
        };
      },
      // ax^2 + bx form - equilibria at 0 and -b/a
      () => {
        const a = randomChoice(rng, [-2, -1, 1, 2]);
        const b = randomInt(rng, -3, 3, true);
        return {
          terms: [
            { coefficient: a, power: 2 },
            { coefficient: b, power: 1 },
          ],
        };
      },
      // ax^3 + bx form (pitchfork-like)
      () => {
        const a = randomChoice(rng, [-1, 1]);
        const b = randomChoice(rng, [-2, -1, 1, 2]);
        return {
          terms: [
            { coefficient: a, power: 3 },
            { coefficient: b, power: 1 },
          ],
        };
      },
      // Simple power: ax^n
      () => {
        const a = randomChoice(rng, [-2, -1, 1, 2]);
        const n = randomInt(rng, 2, 4);
        return {
          terms: [{ coefficient: a, power: n }],
        };
      },
    ];

    const templateIdx = difficulty === Difficulty.LIGHT
      ? randomInt(rng, 1, 3) // Simpler templates
      : randomInt(rng, 0, templates.length - 1);

    return templates[templateIdx]();
  }

  private analyzeAllEquilibria(p: Polynomial): EquilibriumInfo[] {
    const roots = findRoots(p);
    return roots.map((x) => ({
      x,
      stability: analyzeStability1D(p, x),
    }));
  }

  private generateMultipleChoice(
    rng: () => number,
    difficulty: Difficulty,
    seed: number
  ): MultipleChoiceQuestion {
    const p = this.generatePolynomial(rng, difficulty);
    const equilibria = this.analyzeAllEquilibria(p);
    const systemLatex = `x' = ${formatPolynomial(p)}`;

    // Question variants
    const variants = [
      this.questionHowManyStable,
      this.questionHowManyUnstable,
      this.questionHowManyEquilibria,
      this.questionOriginStability,
    ];

    const variant = randomChoice(rng, variants);
    return variant.call(this, p, equilibria, systemLatex, rng, seed);
  }

  private questionHowManyStable(
    p: Polynomial,
    equilibria: EquilibriumInfo[],
    systemLatex: string,
    rng: () => number,
    seed: number
  ): MultipleChoiceQuestion {
    const stableCount = equilibria.filter((e) => e.stability === 'stable').length;
    const options = ['0', '1', '2', '3'];
    const correctIndex = Math.min(stableCount, 3);

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.STABILITY_1D,
      difficulty: Difficulty.MODERATE,
      prompt: `Consider the 1D system $${systemLatex}$. How many asymptotically stable equilibria does it have?`,
      options,
      correctIndex,
      explanation: this.generateStabilityExplanation(p, equilibria, 'stable'),
      seed,
    };
  }

  private questionHowManyUnstable(
    p: Polynomial,
    equilibria: EquilibriumInfo[],
    systemLatex: string,
    rng: () => number,
    seed: number
  ): MultipleChoiceQuestion {
    const unstableCount = equilibria.filter((e) => e.stability === 'unstable').length;
    const options = ['0', '1', '2', '3'];
    const correctIndex = Math.min(unstableCount, 3);

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.STABILITY_1D,
      difficulty: Difficulty.MODERATE,
      prompt: `Consider the 1D system $${systemLatex}$. How many unstable equilibria does it have?`,
      options,
      correctIndex,
      explanation: this.generateStabilityExplanation(p, equilibria, 'unstable'),
      seed,
    };
  }

  private questionHowManyEquilibria(
    p: Polynomial,
    equilibria: EquilibriumInfo[],
    systemLatex: string,
    rng: () => number,
    seed: number
  ): MultipleChoiceQuestion {
    const count = equilibria.length;
    const options = ['0', '1', '2', '3'];
    const correctIndex = Math.min(count, 3);

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.STABILITY_1D,
      difficulty: Difficulty.LIGHT,
      prompt: `Consider the 1D system $${systemLatex}$. How many equilibrium points does it have?`,
      options,
      correctIndex,
      explanation: `Setting $${formatPolynomial(p)} = 0$, we find equilibria at: ${equilibria.map((e) => `$x = ${e.x}$`).join(', ') || 'none'}.`,
      seed,
    };
  }

  private questionOriginStability(
    p: Polynomial,
    equilibria: EquilibriumInfo[],
    systemLatex: string,
    rng: () => number,
    seed: number
  ): MultipleChoiceQuestion {
    const originInfo = equilibria.find((e) => Math.abs(e.x) < 0.01);
    const dp = derivativePolynomial(p);
    const derivAtOrigin = evaluatePolynomial(dp, 0);

    let correctAnswer: string;
    let correctIndex: number;

    if (!originInfo) {
      correctAnswer = 'Not an equilibrium';
      correctIndex = 3;
    } else {
      correctAnswer = originInfo.stability === 'stable'
        ? 'Asymptotically stable'
        : originInfo.stability === 'unstable'
        ? 'Unstable'
        : 'Semistable (non-hyperbolic)';
      correctIndex = originInfo.stability === 'stable' ? 0 : originInfo.stability === 'unstable' ? 1 : 2;
    }

    const options = ['Asymptotically stable', 'Unstable', 'Semistable (non-hyperbolic)', 'Not an equilibrium'];

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.STABILITY_1D,
      difficulty: Difficulty.MODERATE,
      prompt: `Consider the 1D system $${systemLatex}$. What is the stability of the origin $x = 0$?`,
      options,
      correctIndex,
      explanation: originInfo
        ? `At $x = 0$: $f'(0) = ${derivAtOrigin}$. ${derivAtOrigin < 0 ? 'Since $f\'(0) < 0$, the origin is asymptotically stable.' : derivAtOrigin > 0 ? 'Since $f\'(0) > 0$, the origin is unstable.' : 'Since $f\'(0) = 0$, the origin is non-hyperbolic and requires further analysis.'}`
        : `$f(0) = ${evaluatePolynomial(p, 0)} \\neq 0$, so the origin is not an equilibrium.`,
      seed,
    };
  }

  private generateStabilityExplanation(
    p: Polynomial,
    equilibria: EquilibriumInfo[],
    targetType: StabilityType
  ): string {
    const dp = derivativePolynomial(p);
    const lines = [`Setting $f(x) = ${formatPolynomial(p)} = 0$, we find equilibria at:`];

    equilibria.forEach((eq) => {
      const deriv = evaluatePolynomial(dp, eq.x);
      const stabilityText =
        eq.stability === 'stable'
          ? 'stable'
          : eq.stability === 'unstable'
          ? 'unstable'
          : 'semistable';
      lines.push(`- $x = ${eq.x}$: $f'(${eq.x}) = ${deriv.toFixed(2)}$ (${stabilityText})`);
    });

    const count = equilibria.filter((e) => e.stability === targetType).length;
    lines.push(`Total ${targetType} equilibria: ${count}`);

    return lines.join('\n\n');
  }

  private generateTrueFalse(
    rng: () => number,
    difficulty: Difficulty,
    seed: number
  ): TrueFalseQuestion {
    const p = this.generatePolynomial(rng, difficulty);
    const equilibria = this.analyzeAllEquilibria(p);
    const systemLatex = `x' = ${formatPolynomial(p)}`;

    // Generate a statement about the system
    const stableCount = equilibria.filter((e) => e.stability === 'stable').length;
    const unstableCount = equilibria.filter((e) => e.stability === 'unstable').length;

    const statementTypes = [
      // True statement about stable count
      () => ({
        statement: `The system $${systemLatex}$ has exactly ${stableCount} asymptotically stable equilibrium point${stableCount !== 1 ? 's' : ''}.`,
        isTrue: true,
      }),
      // False statement (wrong count)
      () => ({
        statement: `The system $${systemLatex}$ has exactly ${(stableCount + 1) % 4} asymptotically stable equilibrium point${(stableCount + 1) % 4 !== 1 ? 's' : ''}.`,
        isTrue: false,
      }),
      // Statement about origin
      () => {
        const originEq = equilibria.find((e) => Math.abs(e.x) < 0.01);
        const originIsStable = originEq?.stability === 'stable';
        const askStable = rng() > 0.5;
        return {
          statement: `The origin is ${askStable ? 'asymptotically stable' : 'unstable'} for the system $${systemLatex}$.`,
          isTrue: askStable ? originIsStable : !originIsStable && originEq?.stability === 'unstable',
        };
      },
    ];

    const { statement, isTrue } = randomChoice(rng, statementTypes)();

    return {
      id: generateId(),
      type: QuestionType.TRUE_FALSE,
      topic: Topic.STABILITY_1D,
      difficulty,
      prompt: statement,
      correctAnswer: isTrue,
      explanation: this.generateStabilityExplanation(p, equilibria, 'stable'),
      seed,
    };
  }
}
