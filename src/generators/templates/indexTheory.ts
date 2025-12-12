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
  randomChoice,
  generateId,
  shuffle,
} from '../utils/random';

export class IndexTheoryGenerator extends BaseGenerator {
  topics = [Topic.TOPOLOGICAL_INDEX];
  types = [QuestionType.MULTIPLE_CHOICE, QuestionType.TRUE_FALSE];
  difficulties = [Difficulty.MODERATE, Difficulty.HEAVY];

  generate(config: GeneratorConfig): Question {
    const seed = config.seed ?? Math.floor(Math.random() * 2147483647);
    const rng = createRng(seed);

    if (config.type === QuestionType.TRUE_FALSE) {
      return this.generateTrueFalse(rng, seed);
    }

    const variants = [
      this.questionIndexOfEquilibrium,
      this.questionIndexOfCurve,
      this.questionIndexSum,
      this.questionIndexProperties,
      this.questionComputeIndex,
      this.questionLimitCyclePossibility,
      this.questionMinimumEquilibria,
    ];

    const variant = randomChoice(rng, variants);
    return variant.call(this, rng, seed);
  }

  private questionIndexOfEquilibrium(
    rng: () => number,
    seed: number
  ): MultipleChoiceQuestion {
    const equilibria = [
      {
        type: 'Stable node',
        index: 1,
        explanation: 'A node (stable or unstable) has index +1 because the vector field makes one complete counterclockwise rotation around it.',
      },
      {
        type: 'Unstable node',
        index: 1,
        explanation: 'A node (stable or unstable) has index +1.',
      },
      {
        type: 'Stable spiral (focus)',
        index: 1,
        explanation: 'A spiral/focus has index +1, same as a node.',
      },
      {
        type: 'Unstable spiral (focus)',
        index: 1,
        explanation: 'A spiral/focus has index +1.',
      },
      {
        type: 'Saddle point',
        index: -1,
        explanation: 'A saddle point has index -1 because the vector field rotates clockwise (or makes one clockwise rotation) around it.',
      },
      {
        type: 'Center',
        index: 1,
        explanation: 'A center has index +1.',
      },
    ];

    const eq = randomChoice(rng, equilibria);

    const options = ['$+1$', '$-1$', '$0$', '$+2$'];

    const correctAnswer = eq.index === 1 ? '$+1$' : eq.index === -1 ? '$-1$' : '$0$';
    const correctIndex = options.indexOf(correctAnswer);

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.TOPOLOGICAL_INDEX,
      difficulty: Difficulty.MODERATE,
      prompt: `What is the index of a **${eq.type}**?`,
      options,
      correctIndex,
      explanation: eq.explanation,
      seed,
    };
  }

  private questionIndexOfCurve(
    rng: () => number,
    seed: number
  ): MultipleChoiceQuestion {
    // Given equilibria inside a curve, what's the total index?
    const scenarios = [
      {
        contents: 'one stable node and one saddle',
        index: 0,
        calculation: '$1 + (-1) = 0$',
      },
      {
        contents: 'two stable nodes and one saddle',
        index: 1,
        calculation: '$1 + 1 + (-1) = 1$',
      },
      {
        contents: 'one unstable focus',
        index: 1,
        calculation: '$1$',
      },
      {
        contents: 'one saddle',
        index: -1,
        calculation: '$-1$',
      },
      {
        contents: 'one center and two saddles',
        index: -1,
        calculation: '$1 + (-1) + (-1) = -1$',
      },
    ];

    const s = randomChoice(rng, scenarios);

    const options = ['$+1$', '$-1$', '$0$', '$+2$'];

    const correctAnswer = s.index === 1 ? '$+1$' : s.index === -1 ? '$-1$' : s.index === 0 ? '$0$' : '$+2$';
    const correctIndex = options.indexOf(correctAnswer);

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.TOPOLOGICAL_INDEX,
      difficulty: Difficulty.MODERATE,
      prompt: `A simple closed curve $C$ encloses ${s.contents}. What is the index of the vector field with respect to $C$?`,
      options,
      correctIndex,
      explanation: `The index of a curve equals the sum of indices of equilibria inside: ${s.calculation}.`,
      seed,
    };
  }

  private questionIndexSum(
    rng: () => number,
    seed: number
  ): MultipleChoiceQuestion {
    const options = [
      'The sum of indices of all equilibria inside equals the index of the curve',
      'The index is always positive',
      'The index equals the number of equilibria inside',
      'The index is independent of the equilibria inside',
    ];

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.TOPOLOGICAL_INDEX,
      difficulty: Difficulty.MODERATE,
      prompt: 'For a simple closed curve $C$ not passing through any equilibrium, which statement about the index $I_f(C)$ is correct?',
      options,
      correctIndex: 0,
      explanation: 'By the index theorem, the index of a curve equals the sum of indices of all equilibria contained within it: $I_f(C) = \\sum_{x_i \\in \\text{int}(C)} I_f(x_i)$.',
      seed,
    };
  }

  private questionIndexProperties(
    rng: () => number,
    seed: number
  ): MultipleChoiceQuestion {
    const properties = [
      {
        question: 'If $I_f(C) = 1$ for a simple closed curve $C$, what can we conclude?',
        correct: 'There is at least one equilibrium inside $C$',
        wrong: [
          'There is exactly one equilibrium inside $C$',
          'There are no equilibria inside $C$',
          '$C$ is a limit cycle',
        ],
      },
      {
        question: 'A limit cycle must have index:',
        correct: '$+1$',
        wrong: ['$-1$', '$0$', 'Depends on stability'],
      },
      {
        question: 'If $C$ encloses no equilibria, the index $I_f(C)$ equals:',
        correct: '$0$',
        wrong: ['$+1$', '$-1$', 'Undefined'],
      },
      {
        question: 'If we reverse the direction of the vector field (replace $f$ with $-f$), the index:',
        correct: 'Stays the same',
        wrong: ['Changes sign', 'Becomes zero', 'Doubles'],
      },
    ];

    const p = randomChoice(rng, properties);
    const options = shuffle(rng, [p.correct, ...p.wrong]);
    const correctIndex = options.indexOf(p.correct);

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.TOPOLOGICAL_INDEX,
      difficulty: Difficulty.MODERATE,
      prompt: p.question,
      options,
      correctIndex,
      explanation: `The correct answer is: ${p.correct}.`,
      seed,
    };
  }

  private questionComputeIndex(
    rng: () => number,
    seed: number
  ): MultipleChoiceQuestion {
    // Compute index from vector field at origin
    const fields = [
      {
        field: '$f(x,y) = (x, y)$',
        index: 1,
        explanation: 'This is an unstable node (source), which has index +1.',
      },
      {
        field: '$f(x,y) = (-x, -y)$',
        index: 1,
        explanation: 'This is a stable node (sink), which has index +1.',
      },
      {
        field: '$f(x,y) = (x, -y)$',
        index: -1,
        explanation: 'This is a saddle point, which has index -1.',
      },
      {
        field: '$f(x,y) = (-y, x)$',
        index: 1,
        explanation: 'This is a center (rotation), which has index +1.',
      },
      {
        field: '$f(x,y) = (x^2 + y^2, (1-x^2-y^2)y)$',
        index: 1,
        explanation: 'Analyze the field on a small circle around origin; it has index +1.',
      },
    ];

    const f = randomChoice(rng, fields);

    const options = ['$+1$', '$-1$', '$0$', '$+2$'];

    const correctAnswer = f.index === 1 ? '$+1$' : f.index === -1 ? '$-1$' : '$0$';
    const correctIndex = options.indexOf(correctAnswer);

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.TOPOLOGICAL_INDEX,
      difficulty: Difficulty.HEAVY,
      prompt: `What is the index of the equilibrium at the origin for the vector field ${f.field}?`,
      options,
      correctIndex,
      explanation: f.explanation,
      seed,
    };
  }

  // NEW: Can a limit cycle surround these equilibria?
  private questionLimitCyclePossibility(
    rng: () => number,
    seed: number
  ): MultipleChoiceQuestion {
    const scenarios = [
      {
        config: 'two stable nodes',
        indexSum: 2,
        possible: false,
        explanation: 'Index sum = 1 + 1 = 2. A limit cycle requires index = +1 inside, so this configuration cannot be surrounded by a limit cycle.',
      },
      {
        config: 'one stable node and one saddle',
        indexSum: 0,
        possible: false,
        explanation: 'Index sum = 1 + (-1) = 0. A limit cycle requires index = +1 inside, so this configuration cannot be surrounded by a limit cycle.',
      },
      {
        config: 'one unstable focus',
        indexSum: 1,
        possible: true,
        explanation: 'Index sum = +1. This is exactly what a limit cycle requires, so a limit cycle could surround this equilibrium.',
      },
      {
        config: 'two stable nodes and one saddle',
        indexSum: 1,
        possible: true,
        explanation: 'Index sum = 1 + 1 + (-1) = 1. This equals +1, so a limit cycle could surround these equilibria.',
      },
      {
        config: 'three saddles',
        indexSum: -3,
        possible: false,
        explanation: 'Index sum = -1 + (-1) + (-1) = -3. A limit cycle requires index = +1 inside, so this is impossible.',
      },
      {
        config: 'one center',
        indexSum: 1,
        possible: true,
        explanation: 'Index sum = +1. This matches the requirement for a limit cycle, though whether one actually exists depends on the specific system.',
      },
    ];

    const s = randomChoice(rng, scenarios);

    const options = shuffle(rng, [
      'Yes, a limit cycle could surround them',
      'No, the index sum is wrong',
      'Only if they are all stable',
      'Only in nonlinear systems',
    ]);

    const correctAnswer = s.possible
      ? 'Yes, a limit cycle could surround them'
      : 'No, the index sum is wrong';

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.TOPOLOGICAL_INDEX,
      difficulty: Difficulty.MODERATE,
      prompt: `A region contains ${s.config}. Can a limit cycle surround all of them?`,
      options,
      correctIndex: options.indexOf(correctAnswer),
      explanation: s.explanation,
      seed,
    };
  }

  // NEW: Minimum equilibria inside a limit cycle
  private questionMinimumEquilibria(
    rng: () => number,
    seed: number
  ): MultipleChoiceQuestion {
    const questions = [
      {
        prompt: 'A limit cycle must contain at least how many equilibrium point(s) inside?',
        correct: '1',
        explanation: 'Since a limit cycle has index +1, and the sum of indices inside must equal +1, there must be at least one equilibrium. The minimum is one equilibrium with index +1 (a node, focus, or center).',
      },
      {
        prompt: 'What is the minimum number of saddle points that a limit cycle can enclose?',
        correct: '0',
        explanation: 'A limit cycle can enclose zero saddles. For example, it could surround a single unstable focus (index +1) with no saddles.',
      },
      {
        prompt: 'If a limit cycle encloses exactly two saddle points, what is the minimum number of nodes or foci it must also enclose?',
        correct: '3',
        explanation: 'Two saddles contribute index -2. To reach total index +1, we need +3 from nodes/foci. So at least 3 nodes or foci are required.',
      },
    ];

    const q = randomChoice(rng, questions);
    const options = shuffle(rng, ['0', '1', '2', '3']);

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.TOPOLOGICAL_INDEX,
      difficulty: Difficulty.MODERATE,
      prompt: q.prompt,
      options,
      correctIndex: options.indexOf(q.correct),
      explanation: q.explanation,
      seed,
    };
  }

  private generateTrueFalse(
    rng: () => number,
    seed: number
  ): TrueFalseQuestion {
    const statements = [
      {
        prompt: 'The index of a simple closed curve is a topological invariant under continuous deformation (as long as no equilibria cross the curve).',
        correct: true,
        explanation: 'The index is indeed a topological invariant and remains constant under homotopy that doesn\'t cross equilibria.',
      },
      {
        prompt: 'If a closed curve has index zero, it cannot be a limit cycle.',
        correct: true,
        explanation: 'A limit cycle must enclose at least one equilibrium with total index +1, so it cannot have index 0.',
      },
      {
        prompt: 'A limit cycle can enclose multiple equilibria.',
        correct: true,
        explanation: 'A limit cycle can enclose multiple equilibria as long as their indices sum to +1.',
      },
      {
        prompt: 'All hyperbolic equilibria have index $\\pm 1$.',
        correct: true,
        explanation: 'Hyperbolic equilibria (nodes, foci, saddles) have index +1 or -1 depending on type.',
      },
      {
        prompt: 'A non-hyperbolic equilibrium always has index 0.',
        correct: false,
        explanation: 'Non-hyperbolic equilibria can have various indices; a center (non-hyperbolic) has index +1.',
      },
      {
        prompt: 'If $I_f(C) \\neq 0$, then $C$ must contain at least one equilibrium.',
        correct: true,
        explanation: 'A non-zero index implies there must be equilibria inside the curve.',
      },
    ];

    const statement = randomChoice(rng, statements);

    return {
      id: generateId(),
      type: QuestionType.TRUE_FALSE,
      topic: Topic.TOPOLOGICAL_INDEX,
      difficulty: Difficulty.CONCEPTUAL,
      prompt: statement.prompt,
      correctAnswer: statement.correct,
      explanation: statement.explanation,
      seed,
    };
  }
}
