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

// Lyapunov function verification problems
interface LyapunovProblem {
  system: string;
  candidates: { func: string; works: boolean; derivative: string }[];
  explanation: string;
}

const LYAPUNOV_PROBLEMS: LyapunovProblem[] = [
  {
    system: "\\dot{x} = -x + y^2 \\\\ \\dot{y} = -y",
    candidates: [
      { func: '$L = x^2 + y^2$', works: true, derivative: '$\\dot{L} = -2x^2 + 2xy^2 - 2y^2$' },
      { func: '$L = x^2 + 2y^2$', works: true, derivative: '$\\dot{L} = -2x^2 + 2xy^2 - 4y^2 < 0$' },
      { func: '$L = x + y$', works: false, derivative: 'Not positive definite' },
    ],
    explanation: 'A valid Lyapunov function must be positive definite and have a negative semi-definite derivative.',
  },
  {
    system: "\\dot{x} = -y \\\\ \\dot{y} = x - y^3",
    candidates: [
      { func: '$L = x^2 + y^2$', works: false, derivative: '$\\dot{L} = -2y^4$ is only semi-definite' },
      { func: '$L = \\frac{1}{2}x^2 + \\frac{1}{2}y^2$', works: false, derivative: '$\\dot{L} = -y^4$ semi-definite' },
      { func: '$L = x^2 + y^4$', works: false, derivative: 'Not standard form' },
    ],
    explanation: 'Finding Lyapunov functions can be difficult; standard quadratics may not work.',
  },
  {
    system: "\\dot{x} = y \\\\ \\dot{y} = -x - y",
    candidates: [
      { func: '$L = x^2 + y^2$', works: true, derivative: '$\\dot{L} = 2xy - 2xy - 2y^2 = -2y^2 \\leq 0$' },
      { func: '$L = x^2 + xy + y^2$', works: true, derivative: '$\\dot{L} = -x^2 - y^2 < 0$' },
      { func: '$L = x + y$', works: false, derivative: 'Not positive definite' },
    ],
    explanation: 'Multiple Lyapunov functions can work for the same system.',
  },
];

export class LyapunovGenerator extends BaseGenerator {
  topics = [Topic.LYAPUNOV_FUNCTIONS];
  types = [QuestionType.MULTIPLE_CHOICE, QuestionType.TRUE_FALSE];
  difficulties = [Difficulty.MODERATE, Difficulty.HEAVY];

  generate(config: GeneratorConfig): Question {
    const seed = config.seed ?? Math.floor(Math.random() * 2147483647);
    const rng = createRng(seed);

    if (config.type === QuestionType.TRUE_FALSE) {
      return this.generateTrueFalse(rng, seed);
    }

    const variants = [
      this.questionSelectLyapunov,
      this.questionVerifyLyapunov,
      this.questionLyapunovDerivative,
      this.questionStabilityFromLyapunov,
      this.questionLyapunovConditions,
    ];

    const variant = randomChoice(rng, variants);
    return variant.call(this, rng, seed);
  }

  private questionSelectLyapunov(
    rng: () => number,
    seed: number
  ): MultipleChoiceQuestion {
    // Classic exam question: which function proves stability?
    const systems = [
      {
        system: "\\dot{x} = -y \\\\ \\dot{y} = 2x - y^3",
        correct: '$L(x,y) = 2x^2 + y^2$',
        wrong: ['$L(x,y) = x^2 + y^2$', '$L(x,y) = x^2 + y^4$', '$L(x,y) = x + y^2$'],
        explanation: 'For this system, $\\dot{L} = 4x(-y) + 2y(2x - y^3) = -4xy + 4xy - 2y^4 = -2y^4 \\leq 0$.',
      },
      {
        system: "\\dot{x} = -x^3 \\\\ \\dot{y} = -y",
        correct: '$L(x,y) = x^4 + y^2$',
        wrong: ['$L(x,y) = x^2 + y^2$', '$L(x,y) = x + y$', '$L(x,y) = x^2 + y^4$'],
        explanation: '$\\dot{L} = 4x^3(-x^3) + 2y(-y) = -4x^6 - 2y^2 < 0$ for $(x,y) \\neq (0,0)$.',
      },
      {
        system: "\\dot{x} = -x + xy \\\\ \\dot{y} = -y",
        correct: '$L(x,y) = x^2 + y^2$',
        wrong: ['$L(x,y) = x - y$', '$L(x,y) = xy$', '$L(x,y) = e^{x^2+y^2}$'],
        explanation: '$\\dot{L} = 2x(-x + xy) + 2y(-y) = -2x^2 + 2x^2y - 2y^2$. For small $|y|$, this is negative definite.',
      },
    ];

    const sys = randomChoice(rng, systems);
    const options = shuffle(rng, [sys.correct, ...sys.wrong]);
    const correctIndex = options.indexOf(sys.correct);

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.LYAPUNOV_FUNCTIONS,
      difficulty: Difficulty.HEAVY,
      prompt: `Which function is a valid Lyapunov function proving stability of the origin for:\n$$\\begin{aligned} ${sys.system} \\end{aligned}$$`,
      options,
      correctIndex,
      explanation: sys.explanation,
      seed,
    };
  }

  private questionVerifyLyapunov(
    rng: () => number,
    seed: number
  ): MultipleChoiceQuestion {
    const options = [
      'It must be positive definite ($L(x) > 0$ for $x \\neq 0$, $L(0) = 0$)',
      'It must be negative everywhere',
      'It must have $\\dot{L} > 0$ along trajectories',
      'It must be linear in the state variables',
    ];

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.LYAPUNOV_FUNCTIONS,
      difficulty: Difficulty.LIGHT,
      prompt: 'For $L(x)$ to be a Lyapunov function candidate, what is the first requirement?',
      options,
      correctIndex: 0,
      explanation: 'A Lyapunov function must be positive definite: $L(0) = 0$ and $L(x) > 0$ for all $x \\neq 0$ in a neighborhood of the origin.',
      seed,
    };
  }

  private questionLyapunovDerivative(
    rng: () => number,
    seed: number
  ): MultipleChoiceQuestion {
    const conclusions = [
      {
        condition: '$\\dot{L}(x) < 0$ for all $x \\neq 0$',
        conclusion: 'Asymptotically stable',
        explanation: 'Negative definite $\\dot{L}$ implies asymptotic stability.',
      },
      {
        condition: '$\\dot{L}(x) \\leq 0$ for all $x$',
        conclusion: 'Stable (not necessarily asymptotically)',
        explanation: 'Negative semi-definite $\\dot{L}$ only guarantees stability, not asymptotic stability.',
      },
      {
        condition: '$\\dot{L}(x) > 0$ for some $x \\neq 0$',
        conclusion: 'No conclusion about stability',
        explanation: 'The Lyapunov function candidate is not useful if $\\dot{L}$ can be positive.',
      },
    ];

    const c = randomChoice(rng, conclusions);

    const options = shuffle(rng, [
      c.conclusion,
      'Asymptotically stable',
      'Unstable',
      'Stable (not necessarily asymptotically)',
    ].filter((v, i, a) => a.indexOf(v) === i)); // unique

    const correctIndex = options.indexOf(c.conclusion);

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.LYAPUNOV_FUNCTIONS,
      difficulty: Difficulty.MODERATE,
      prompt: `If $L(x)$ is positive definite and ${c.condition}, the origin is:`,
      options,
      correctIndex: correctIndex >= 0 ? correctIndex : 0,
      explanation: c.explanation,
      seed,
    };
  }

  private questionStabilityFromLyapunov(
    rng: () => number,
    seed: number
  ): MultipleChoiceQuestion {
    // Given system and L, what's the stability?
    const problems = [
      {
        system: "\\dot{x} = -x^3, \\quad L = x^2",
        derivative: '$\\dot{L} = 2x \\cdot (-x^3) = -2x^4 < 0$',
        stability: 'Asymptotically stable',
      },
      {
        system: "\\dot{x} = -y, \\; \\dot{y} = x, \\quad L = x^2 + y^2",
        derivative: '$\\dot{L} = 2x(-y) + 2y(x) = 0$',
        stability: 'Stable (not asymptotically)',
      },
      {
        system: "\\dot{x} = x^3, \\quad L = x^2",
        derivative: '$\\dot{L} = 2x^4 > 0$',
        stability: 'Unstable',
      },
    ];

    const p = randomChoice(rng, problems);

    const options = [
      'Asymptotically stable',
      'Stable (not asymptotically)',
      'Unstable',
      'Cannot be determined',
    ];

    const correctIndex = options.indexOf(p.stability);

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.LYAPUNOV_FUNCTIONS,
      difficulty: Difficulty.MODERATE,
      prompt: `For the system $${p.system}$, what is the stability of the origin?`,
      options,
      correctIndex,
      explanation: `Computing ${p.derivative}. Since $L$ is positive definite and the sign of $\\dot{L}$ is as computed, the origin is **${p.stability}**.`,
      seed,
    };
  }

  private questionLyapunovConditions(
    rng: () => number,
    seed: number
  ): MultipleChoiceQuestion {
    const questions = [
      {
        question: 'For the origin to be asymptotically stable using Lyapunov\'s direct method, we need:',
        correct: '$L$ positive definite and $\\dot{L}$ negative definite',
        wrong: [
          '$L$ positive definite and $\\dot{L}$ positive definite',
          '$L$ negative definite and $\\dot{L}$ negative definite',
          '$L$ and $\\dot{L}$ both positive semi-definite',
        ],
      },
      {
        question: 'If $L$ is positive definite and $\\dot{L} = 0$ everywhere, the system is:',
        correct: 'Conservative (energy is preserved)',
        wrong: [
          'Asymptotically stable',
          'Unstable',
          'Has a limit cycle',
        ],
      },
      {
        question: 'The LaSalle invariance principle extends Lyapunov\'s method by:',
        correct: 'Allowing $\\dot{L} \\leq 0$ and examining where $\\dot{L} = 0$',
        wrong: [
          'Requiring $\\dot{L} < 0$ everywhere',
          'Only applying to linear systems',
          'Constructing $L$ automatically',
        ],
      },
    ];

    const q = randomChoice(rng, questions);
    const options = shuffle(rng, [q.correct, ...q.wrong]);
    const correctIndex = options.indexOf(q.correct);

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.LYAPUNOV_FUNCTIONS,
      difficulty: Difficulty.MODERATE,
      prompt: q.question,
      options,
      correctIndex,
      explanation: `${q.correct} is the correct statement about Lyapunov's direct method.`,
      seed,
    };
  }

  private generateTrueFalse(
    rng: () => number,
    seed: number
  ): TrueFalseQuestion {
    const statements = [
      {
        prompt: 'If we cannot find a Lyapunov function, the origin must be unstable.',
        correct: false,
        explanation: 'The inability to find a Lyapunov function does not imply instability; it may just mean we haven\'t found the right function.',
      },
      {
        prompt: 'A system can have multiple valid Lyapunov functions.',
        correct: true,
        explanation: 'Many different positive definite functions can serve as Lyapunov functions for the same system.',
      },
      {
        prompt: 'For a linear system $\\dot{x} = Ax$, a quadratic Lyapunov function $L = x^T P x$ exists if and only if all eigenvalues have negative real parts.',
        correct: true,
        explanation: 'This is the Lyapunov equation theorem: a positive definite solution $P$ to $A^T P + PA = -Q$ exists iff the system is stable.',
      },
      {
        prompt: 'If $\\dot{L} < 0$ except at the origin, trajectories must converge to the origin.',
        correct: true,
        explanation: 'This is Lyapunov\'s theorem on asymptotic stability: negative definite $\\dot{L}$ implies asymptotic stability.',
      },
      {
        prompt: 'The energy function $H = \\frac{1}{2}(p^2 + q^2)$ is always a Lyapunov function for any Hamiltonian system.',
        correct: false,
        explanation: 'For Hamiltonian systems, $\\dot{H} = 0$, so $H$ can only prove stability, not asymptotic stability.',
      },
      {
        prompt: 'Lyapunov\'s direct method can prove global asymptotic stability if $L \\to \\infty$ as $|x| \\to \\infty$.',
        correct: true,
        explanation: 'A radially unbounded Lyapunov function with $\\dot{L} < 0$ proves global asymptotic stability.',
      },
    ];

    const statement = randomChoice(rng, statements);

    return {
      id: generateId(),
      type: QuestionType.TRUE_FALSE,
      topic: Topic.LYAPUNOV_FUNCTIONS,
      difficulty: Difficulty.CONCEPTUAL,
      prompt: statement.prompt,
      correctAnswer: statement.correct,
      explanation: statement.explanation,
      seed,
    };
  }
}
