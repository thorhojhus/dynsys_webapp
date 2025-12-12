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

// Hopf bifurcation templates
interface HopfTemplate {
  system: string;
  criticalParam: number;
  criticalPoint: string;
  type: 'supercritical' | 'subcritical';
  eigenvaluesAtCritical: string;
}

const HOPF_TEMPLATES: HopfTemplate[] = [
  {
    system: "\\dot{x} = \\mu x - y - x(x^2 + y^2) \\\\ \\dot{y} = x + \\mu y - y(x^2 + y^2)",
    criticalParam: 0,
    criticalPoint: "(0, 0)",
    type: 'supercritical',
    eigenvaluesAtCritical: '\\pm i',
  },
  {
    system: "\\dot{x} = \\mu x - y + x(x^2 + y^2) \\\\ \\dot{y} = x + \\mu y + y(x^2 + y^2)",
    criticalParam: 0,
    criticalPoint: "(0, 0)",
    type: 'subcritical',
    eigenvaluesAtCritical: '\\pm i',
  },
  {
    system: "\\dot{x} = -y + x(\\mu - x^2 - y^2) \\\\ \\dot{y} = x + y(\\mu - x^2 - y^2)",
    criticalParam: 0,
    criticalPoint: "(0, 0)",
    type: 'supercritical',
    eigenvaluesAtCritical: '\\pm i',
  },
  {
    system: "\\dot{r} = \\mu r - r^3 \\\\ \\dot{\\theta} = 1",
    criticalParam: 0,
    criticalPoint: "r = 0",
    type: 'supercritical',
    eigenvaluesAtCritical: '\\pm i',
  },
];

export class HopfBifurcationGenerator extends BaseGenerator {
  topics = [Topic.BIFURCATION_HOPF];
  types = [QuestionType.MULTIPLE_CHOICE, QuestionType.TRUE_FALSE];
  difficulties = [Difficulty.MODERATE, Difficulty.HEAVY];

  generate(config: GeneratorConfig): Question {
    const seed = config.seed ?? Math.floor(Math.random() * 2147483647);
    const rng = createRng(seed);

    if (config.type === QuestionType.TRUE_FALSE) {
      return this.generateTrueFalse(rng, seed);
    }

    const variants = [
      this.questionIdentifyHopfType,
      this.questionHopfConditions,
      this.questionCriticalParameter,
      this.questionEigenvaluesAtHopf,
      this.questionLimitCycleStability,
      this.questionHopfNormalForm,
    ];

    const variant = randomChoice(rng, variants);
    return variant.call(this, rng, seed);
  }

  private questionIdentifyHopfType(
    rng: () => number,
    seed: number
  ): MultipleChoiceQuestion {
    const template = randomChoice(rng, HOPF_TEMPLATES);

    const options = [
      'Supercritical Hopf bifurcation',
      'Subcritical Hopf bifurcation',
      'Saddle-node bifurcation',
      'Transcritical bifurcation',
    ];

    const correctAnswer = template.type === 'supercritical'
      ? 'Supercritical Hopf bifurcation'
      : 'Subcritical Hopf bifurcation';
    const correctIndex = options.indexOf(correctAnswer);

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.BIFURCATION_HOPF,
      difficulty: Difficulty.MODERATE,
      prompt: `What type of bifurcation occurs at $\\mu = ${template.criticalParam}$ for the system:\n$$\\begin{aligned} ${template.system} \\end{aligned}$$`,
      options,
      correctIndex,
      explanation: `This is a **${correctAnswer}**. At $\\mu = ${template.criticalParam}$, the eigenvalues are ${template.eigenvaluesAtCritical} (purely imaginary), and a ${template.type === 'supercritical' ? 'stable' : 'unstable'} limit cycle is born.`,
      seed,
    };
  }

  private questionHopfConditions(
    rng: () => number,
    seed: number
  ): MultipleChoiceQuestion {
    const conditions = [
      {
        question: 'For a Hopf bifurcation to occur at parameter $\\mu = \\mu_0$, what must the eigenvalues be?',
        correct: 'Purely imaginary: $\\lambda = \\pm i\\omega$',
        wrong: [
          'Real and equal: $\\lambda_1 = \\lambda_2 < 0$',
          'Real and opposite: $\\lambda_1 = -\\lambda_2$',
          'Zero: $\\lambda = 0$',
        ],
      },
      {
        question: 'What is the transversality condition for a Hopf bifurcation?',
        correct: '$\\frac{d}{d\\mu}\\text{Re}(\\lambda)|_{\\mu=\\mu_0} \\neq 0$',
        wrong: [
          '$\\frac{d}{d\\mu}\\text{Im}(\\lambda)|_{\\mu=\\mu_0} = 0$',
          '$\\text{Re}(\\lambda)|_{\\mu=\\mu_0} = 1$',
          '$\\frac{d^2}{d\\mu^2}\\lambda|_{\\mu=\\mu_0} = 0$',
        ],
      },
      {
        question: 'In a supercritical Hopf bifurcation, what happens as $\\mu$ increases through $\\mu_0$?',
        correct: 'A stable limit cycle is born from an unstable equilibrium',
        wrong: [
          'An unstable limit cycle is absorbed into a stable equilibrium',
          'Two equilibria collide and annihilate',
          'A saddle and node exchange stability',
        ],
      },
    ];

    const cond = randomChoice(rng, conditions);
    const options = shuffle(rng, [cond.correct, ...cond.wrong]);
    const correctIndex = options.indexOf(cond.correct);

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.BIFURCATION_HOPF,
      difficulty: Difficulty.MODERATE,
      prompt: cond.question,
      options,
      correctIndex,
      explanation: `The correct answer is: ${cond.correct}. Hopf bifurcations occur when a pair of complex conjugate eigenvalues crosses the imaginary axis with non-zero speed.`,
      seed,
    };
  }

  private questionCriticalParameter(
    rng: () => number,
    seed: number
  ): MultipleChoiceQuestion {
    // System: x' = μx - y - x³, y' = x + μy - y³
    // Jacobian at origin: [[μ, -1], [1, μ]], eigenvalues: μ ± i
    // Hopf at μ = 0

    const systems = [
      {
        latex: "\\dot{x} = \\mu x - y - x^3 \\\\ \\dot{y} = x + \\mu y - y^3",
        criticalValue: 0,
        explanation: 'The Jacobian at origin has eigenvalues $\\mu \\pm i$. When $\\mu = 0$, eigenvalues are $\\pm i$ (purely imaginary).',
      },
      {
        latex: "\\dot{x} = (\\mu - 1)x - y \\\\ \\dot{y} = x + (\\mu - 1)y",
        criticalValue: 1,
        explanation: 'The Jacobian has eigenvalues $(\\mu-1) \\pm i$. When $\\mu = 1$, eigenvalues are $\\pm i$.',
      },
      {
        latex: "\\dot{x} = -y + x(\\mu + 2) \\\\ \\dot{y} = x + y(\\mu + 2)",
        criticalValue: -2,
        explanation: 'The Jacobian has eigenvalues $(\\mu+2) \\pm i$. When $\\mu = -2$, eigenvalues are $\\pm i$.',
      },
    ];

    const sys = randomChoice(rng, systems);
    const wrongValues = [-2, -1, 0, 1, 2].filter(v => v !== sys.criticalValue);
    const options = shuffle(rng, [
      `$\\mu = ${sys.criticalValue}$`,
      ...wrongValues.slice(0, 3).map(v => `$\\mu = ${v}$`),
    ]);
    const correctIndex = options.indexOf(`$\\mu = ${sys.criticalValue}$`);

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.BIFURCATION_HOPF,
      difficulty: Difficulty.MODERATE,
      prompt: `At what value of $\\mu$ does a Hopf bifurcation occur for the system:\n$$\\begin{aligned} ${sys.latex} \\end{aligned}$$`,
      options,
      correctIndex,
      explanation: sys.explanation,
      seed,
    };
  }

  private questionEigenvaluesAtHopf(
    rng: () => number,
    seed: number
  ): MultipleChoiceQuestion {
    const options = [
      '$\\lambda = \\pm i\\omega$ (purely imaginary)',
      '$\\lambda = 0$ (zero eigenvalue)',
      '$\\lambda_1, \\lambda_2 < 0$ (both negative real)',
      '$\\lambda_1 > 0, \\lambda_2 < 0$ (opposite signs)',
    ];

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.BIFURCATION_HOPF,
      difficulty: Difficulty.LIGHT,
      prompt: 'At a Hopf bifurcation point, the eigenvalues of the Jacobian are:',
      options,
      correctIndex: 0,
      explanation: 'A Hopf bifurcation occurs when a pair of complex conjugate eigenvalues crosses the imaginary axis, so at the bifurcation point they are purely imaginary: $\\lambda = \\pm i\\omega$ for some $\\omega > 0$.',
      seed,
    };
  }

  private questionLimitCycleStability(
    rng: () => number,
    seed: number
  ): MultipleChoiceQuestion {
    const scenarios = [
      {
        type: 'supercritical',
        question: 'In a supercritical Hopf bifurcation, the limit cycle that emerges is:',
        correct: 'Stable (attracting)',
        explanation: 'In a supercritical Hopf bifurcation, a stable limit cycle is born as the equilibrium becomes unstable.',
      },
      {
        type: 'subcritical',
        question: 'In a subcritical Hopf bifurcation, the limit cycle that exists before the bifurcation is:',
        correct: 'Unstable (repelling)',
        explanation: 'In a subcritical Hopf bifurcation, an unstable limit cycle shrinks and collides with the equilibrium, destabilizing it.',
      },
    ];

    const scenario = randomChoice(rng, scenarios);
    const options = [
      'Stable (attracting)',
      'Unstable (repelling)',
      'Semi-stable',
      'Cannot be determined',
    ];

    const correctIndex = options.indexOf(scenario.correct);

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.BIFURCATION_HOPF,
      difficulty: Difficulty.MODERATE,
      prompt: scenario.question,
      options,
      correctIndex,
      explanation: scenario.explanation,
      seed,
    };
  }

  private questionHopfNormalForm(
    rng: () => number,
    seed: number
  ): MultipleChoiceQuestion {
    const options = [
      '$\\dot{r} = \\mu r + ar^3$, $\\dot{\\theta} = \\omega + br^2$',
      '$\\dot{x} = \\mu + x^2$',
      '$\\dot{x} = \\mu x - x^2$',
      '$\\dot{x} = \\mu x - x^3$',
    ];

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.BIFURCATION_HOPF,
      difficulty: Difficulty.HEAVY,
      prompt: 'The normal form for a Hopf bifurcation (in polar coordinates) is:',
      options,
      correctIndex: 0,
      explanation: 'The Hopf bifurcation normal form in polar coordinates is $\\dot{r} = \\mu r + ar^3$, $\\dot{\\theta} = \\omega + br^2$. When $a < 0$: supercritical; when $a > 0$: subcritical.',
      seed,
    };
  }

  private generateTrueFalse(
    rng: () => number,
    seed: number
  ): TrueFalseQuestion {
    const statements = [
      {
        prompt: 'A Hopf bifurcation can only occur in systems of dimension 2 or higher.',
        correct: true,
        explanation: 'Hopf bifurcations require complex eigenvalues, which need at least a 2D system.',
      },
      {
        prompt: 'At a Hopf bifurcation, the equilibrium point must be non-hyperbolic.',
        correct: true,
        explanation: 'The eigenvalues are purely imaginary at the bifurcation point, making the equilibrium non-hyperbolic.',
      },
      {
        prompt: 'In a supercritical Hopf bifurcation, the limit cycle exists after the bifurcation (for $\\mu > \\mu_0$).',
        correct: true,
        explanation: 'In supercritical Hopf, the stable limit cycle appears for $\\mu > \\mu_0$ as the equilibrium loses stability.',
      },
      {
        prompt: 'A Hopf bifurcation always produces a stable limit cycle.',
        correct: false,
        explanation: 'Subcritical Hopf bifurcations produce unstable limit cycles.',
      },
      {
        prompt: 'The frequency of oscillation at a Hopf bifurcation is determined by the imaginary part of the eigenvalues.',
        correct: true,
        explanation: 'If eigenvalues are $\\pm i\\omega$, the oscillation frequency is $\\omega/(2\\pi)$.',
      },
      {
        prompt: 'A Hopf bifurcation can occur in a 1D system.',
        correct: false,
        explanation: '1D systems have real eigenvalues only; complex eigenvalues require at least 2D.',
      },
    ];

    const statement = randomChoice(rng, statements);

    return {
      id: generateId(),
      type: QuestionType.TRUE_FALSE,
      topic: Topic.BIFURCATION_HOPF,
      difficulty: Difficulty.CONCEPTUAL,
      prompt: statement.prompt,
      correctAnswer: statement.correct,
      explanation: statement.explanation,
      seed,
    };
  }
}
