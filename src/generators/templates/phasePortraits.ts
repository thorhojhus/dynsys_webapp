import {
  QuestionType,
  Topic,
  Difficulty,
  type MultipleChoiceQuestion,
  type Question,
  type PhasePortraitType,
} from '@/types/question';
import { BaseGenerator, type GeneratorConfig } from '../types';
import {
  createRng,
  randomChoice,
  generateId,
  shuffle,
} from '../utils/random';

type PortraitType = PhasePortraitType;

// Map portrait types to their characteristics
const PORTRAIT_INFO: Record<
  PortraitType,
  {
    eigenvalues: string;
    stability: string;
    traceSign: string;
    detSign: string;
    description: string;
  }
> = {
  stable_node: {
    eigenvalues: 'real, distinct, both negative',
    stability: 'asymptotically stable',
    traceSign: 'negative',
    detSign: 'positive',
    description: 'Trajectories approach the origin along straight lines',
  },
  unstable_node: {
    eigenvalues: 'real, distinct, both positive',
    stability: 'unstable',
    traceSign: 'positive',
    detSign: 'positive',
    description: 'Trajectories move away from the origin along straight lines',
  },
  saddle: {
    eigenvalues: 'real, distinct, opposite signs',
    stability: 'unstable',
    traceSign: 'can be any',
    detSign: 'negative',
    description: 'Trajectories approach along one axis, move away along the other',
  },
  stable_spiral: {
    eigenvalues: 'complex with negative real part',
    stability: 'asymptotically stable',
    traceSign: 'negative',
    detSign: 'positive',
    description: 'Trajectories spiral inward toward the origin',
  },
  unstable_spiral: {
    eigenvalues: 'complex with positive real part',
    stability: 'unstable',
    traceSign: 'positive',
    detSign: 'positive',
    description: 'Trajectories spiral outward from the origin',
  },
  center: {
    eigenvalues: 'purely imaginary',
    stability: 'stable (but not asymptotically)',
    traceSign: 'zero',
    detSign: 'positive',
    description: 'Closed orbits around the origin',
  },
};

const ALL_PORTRAIT_TYPES: PortraitType[] = [
  'stable_node',
  'unstable_node',
  'saddle',
  'stable_spiral',
  'unstable_spiral',
  'center',
];

const PORTRAIT_NAMES: Record<PortraitType, string> = {
  stable_node: 'Stable Node',
  unstable_node: 'Unstable Node',
  saddle: 'Saddle',
  stable_spiral: 'Stable Spiral (Focus)',
  unstable_spiral: 'Unstable Spiral (Focus)',
  center: 'Center',
};

export class PhasePortraitGenerator extends BaseGenerator {
  topics = [Topic.PHASE_PORTRAITS, Topic.EQUILIBRIUM_CLASSIFICATION, Topic.LINEAR_SYSTEMS_2D];
  types = [QuestionType.MULTIPLE_CHOICE];
  difficulties = [Difficulty.LIGHT, Difficulty.MODERATE];

  generate(config: GeneratorConfig): Question {
    const seed = config.seed ?? Math.floor(Math.random() * 2147483647);
    const rng = createRng(seed);

    const variants = [
      this.questionIdentifyFromDiagram,
      this.questionIdentifyFromDescription,
      this.questionIdentifyFromEigenvalues,
      this.questionIdentifyStability,
      this.questionIdentifyFromTraceAndDet,
      this.questionWhichHasProperty,
      this.questionDiagramProperties,
    ];

    const variant = randomChoice(rng, variants);
    return variant.call(this, rng, seed);
  }

  // NEW: Show a diagram and ask to identify the type
  private questionIdentifyFromDiagram(
    rng: () => number,
    seed: number
  ): MultipleChoiceQuestion {
    const type = randomChoice(rng, ALL_PORTRAIT_TYPES);

    const options = shuffle(rng, Object.values(PORTRAIT_NAMES)).slice(0, 4);
    const correctAnswer = PORTRAIT_NAMES[type];

    if (!options.includes(correctAnswer)) {
      options[0] = correctAnswer;
    }
    const finalOptions = shuffle(rng, options);
    const correctIndex = finalOptions.indexOf(correctAnswer);

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.PHASE_PORTRAITS,
      difficulty: Difficulty.LIGHT,
      prompt: `Identify the type of equilibrium point shown in the phase portrait below:`,
      options: finalOptions,
      correctIndex,
      explanation: `This is a **${PORTRAIT_NAMES[type]}**. ${PORTRAIT_INFO[type].description}. The eigenvalues are ${PORTRAIT_INFO[type].eigenvalues}.`,
      seed,
      diagram: {
        type: 'phase_portrait',
        portraitType: type,
      },
    };
  }

  // NEW: Show diagram and ask about its properties
  private questionDiagramProperties(
    rng: () => number,
    seed: number
  ): MultipleChoiceQuestion {
    const type = randomChoice(rng, ALL_PORTRAIT_TYPES);
    const info = PORTRAIT_INFO[type];

    const propertyQuestions = [
      {
        question: `What are the eigenvalues of the system shown in the phase portrait below?`,
        correctAnswer: `${info.eigenvalues.charAt(0).toUpperCase() + info.eigenvalues.slice(1)}`,
        wrongAnswers: ALL_PORTRAIT_TYPES.filter(t => t !== type)
          .map(t => PORTRAIT_INFO[t].eigenvalues.charAt(0).toUpperCase() + PORTRAIT_INFO[t].eigenvalues.slice(1)),
      },
      {
        question: `What is the stability of the equilibrium shown below?`,
        correctAnswer: info.stability.charAt(0).toUpperCase() + info.stability.slice(1),
        wrongAnswers: ['Asymptotically stable', 'Stable (but not asymptotically)', 'Unstable']
          .filter(s => s.toLowerCase() !== info.stability.toLowerCase()),
      },
    ];

    const propQ = randomChoice(rng, propertyQuestions);

    let options = [propQ.correctAnswer, ...propQ.wrongAnswers.slice(0, 3)];
    options = shuffle(rng, options).slice(0, 4);

    if (!options.includes(propQ.correctAnswer)) {
      options[0] = propQ.correctAnswer;
      options = shuffle(rng, options);
    }
    const correctIndex = options.indexOf(propQ.correctAnswer);

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.PHASE_PORTRAITS,
      difficulty: Difficulty.MODERATE,
      prompt: propQ.question,
      options,
      correctIndex,
      explanation: `This is a **${PORTRAIT_NAMES[type]}**. It has eigenvalues that are ${info.eigenvalues}, making it ${info.stability}.`,
      seed,
      diagram: {
        type: 'phase_portrait',
        portraitType: type,
      },
    };
  }

  private questionIdentifyFromDescription(
    rng: () => number,
    seed: number
  ): MultipleChoiceQuestion {
    const type = randomChoice(rng, ALL_PORTRAIT_TYPES);
    const info = PORTRAIT_INFO[type];

    const options = shuffle(rng, Object.values(PORTRAIT_NAMES));
    const correctAnswer = PORTRAIT_NAMES[type];
    const correctIndex = options.indexOf(correctAnswer);

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.PHASE_PORTRAITS,
      difficulty: Difficulty.LIGHT,
      prompt: `Which type of equilibrium has the following property: "${info.description}"?`,
      options: options.slice(0, 4),
      correctIndex: options.slice(0, 4).indexOf(correctAnswer) >= 0
        ? options.slice(0, 4).indexOf(correctAnswer)
        : 0,
      explanation: `${info.description} This is characteristic of a **${PORTRAIT_NAMES[type]}**, which has ${info.eigenvalues} eigenvalues.`,
      seed,
    };
  }

  private questionIdentifyFromEigenvalues(
    rng: () => number,
    seed: number
  ): MultipleChoiceQuestion {
    const type = randomChoice(rng, ALL_PORTRAIT_TYPES);
    const info = PORTRAIT_INFO[type];

    const options = shuffle(rng, Object.values(PORTRAIT_NAMES)).slice(0, 4);
    const correctAnswer = PORTRAIT_NAMES[type];

    // Ensure correct answer is in options
    if (!options.includes(correctAnswer)) {
      options[0] = correctAnswer;
    }
    const finalOptions = shuffle(rng, options);
    const correctIndex = finalOptions.indexOf(correctAnswer);

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.EQUILIBRIUM_CLASSIFICATION,
      difficulty: Difficulty.MODERATE,
      prompt: `If a 2D linear system has eigenvalues that are ${info.eigenvalues}, what type of equilibrium is the origin?`,
      options: finalOptions,
      correctIndex,
      explanation: `Eigenvalues that are ${info.eigenvalues} produce a **${PORTRAIT_NAMES[type]}**. ${info.description}.`,
      seed,
    };
  }

  private questionIdentifyStability(
    rng: () => number,
    seed: number
  ): MultipleChoiceQuestion {
    const type = randomChoice(rng, ALL_PORTRAIT_TYPES);
    const info = PORTRAIT_INFO[type];

    const options = [
      'Asymptotically stable',
      'Stable but not asymptotically stable',
      'Unstable',
      'Cannot be determined',
    ];

    let correctIndex: number;
    if (info.stability === 'asymptotically stable') {
      correctIndex = 0;
    } else if (info.stability === 'stable (but not asymptotically)') {
      correctIndex = 1;
    } else {
      correctIndex = 2;
    }

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.EQUILIBRIUM_CLASSIFICATION,
      difficulty: Difficulty.LIGHT,
      prompt: `What is the stability of a **${PORTRAIT_NAMES[type]}**?`,
      options,
      correctIndex,
      explanation: `A ${PORTRAIT_NAMES[type]} has eigenvalues that are ${info.eigenvalues}, making it **${info.stability}**.`,
      seed,
    };
  }

  private questionIdentifyFromTraceAndDet(
    rng: () => number,
    seed: number
  ): MultipleChoiceQuestion {
    const scenarios = [
      { tr: 'tr(A) < 0', det: 'det(A) > 0', disc: 'Δ > 0', answer: 'Stable Node' },
      { tr: 'tr(A) > 0', det: 'det(A) > 0', disc: 'Δ > 0', answer: 'Unstable Node' },
      { tr: 'any', det: 'det(A) < 0', disc: 'N/A', answer: 'Saddle' },
      { tr: 'tr(A) < 0', det: 'det(A) > 0', disc: 'Δ < 0', answer: 'Stable Spiral (Focus)' },
      { tr: 'tr(A) > 0', det: 'det(A) > 0', disc: 'Δ < 0', answer: 'Unstable Spiral (Focus)' },
      { tr: 'tr(A) = 0', det: 'det(A) > 0', disc: 'Δ < 0', answer: 'Center' },
    ];

    const scenario = randomChoice(rng, scenarios);

    const conditions = scenario.det === 'det(A) < 0'
      ? `$\\det(A) < 0$`
      : scenario.tr === 'tr(A) = 0'
      ? `$\\text{tr}(A) = 0$ and $\\det(A) > 0$`
      : `$\\text{tr}(A) ${scenario.tr.includes('<') ? '<' : '>'} 0$, $\\det(A) > 0$, and $\\Delta ${scenario.disc.includes('>') ? '>' : '<'} 0$`;

    const options = shuffle(rng, [
      'Stable Node',
      'Unstable Node',
      'Saddle',
      'Stable Spiral (Focus)',
      'Unstable Spiral (Focus)',
      'Center',
    ]).slice(0, 4);

    if (!options.includes(scenario.answer)) {
      options[0] = scenario.answer;
    }
    const finalOptions = shuffle(rng, options);
    const correctIndex = finalOptions.indexOf(scenario.answer);

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.LINEAR_SYSTEMS_2D,
      difficulty: Difficulty.MODERATE,
      prompt: `For a 2D linear system $\\mathbf{x}' = A\\mathbf{x}$ with ${conditions}, the origin is a:`,
      options: finalOptions,
      correctIndex,
      explanation: `The trace-determinant conditions ${conditions} correspond to a **${scenario.answer}**.`,
      seed,
    };
  }

  private questionWhichHasProperty(
    rng: () => number,
    seed: number
  ): MultipleChoiceQuestion {
    const properties = [
      {
        question: 'Which equilibrium type has $\\det(A) < 0$?',
        answer: 'Saddle',
        explanation: 'A saddle has eigenvalues of opposite signs, so $\\det(A) = \\lambda_1 \\lambda_2 < 0$.',
      },
      {
        question: 'Which equilibrium type has $\\text{tr}(A) = 0$ with $\\det(A) > 0$?',
        answer: 'Center',
        explanation: 'A center has purely imaginary eigenvalues $\\pm i\\beta$, giving $\\text{tr}(A) = 0$ and $\\det(A) = \\beta^2 > 0$.',
      },
      {
        question: 'Which equilibrium type has complex eigenvalues with negative real part?',
        answer: 'Stable Spiral (Focus)',
        explanation: 'Complex eigenvalues with negative real part cause trajectories to spiral inward.',
      },
      {
        question: 'Which equilibrium type is stable but NOT asymptotically stable?',
        answer: 'Center',
        explanation: 'A center has closed orbits, so trajectories stay nearby (stable) but don\'t approach the origin (not asymptotically stable).',
      },
      {
        question: 'Which equilibrium type has all trajectories approaching the origin along straight lines?',
        answer: 'Stable Node',
        explanation: 'A stable node has real negative eigenvalues, so trajectories follow the eigenvector directions toward the origin.',
      },
    ];

    const prop = randomChoice(rng, properties);

    const options = shuffle(rng, [
      'Stable Node',
      'Unstable Node',
      'Saddle',
      'Stable Spiral (Focus)',
      'Unstable Spiral (Focus)',
      'Center',
    ]).slice(0, 4);

    if (!options.includes(prop.answer)) {
      options[0] = prop.answer;
    }
    const finalOptions = shuffle(rng, options);
    const correctIndex = finalOptions.indexOf(prop.answer);

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.EQUILIBRIUM_CLASSIFICATION,
      difficulty: Difficulty.MODERATE,
      prompt: prop.question,
      options: finalOptions,
      correctIndex,
      explanation: prop.explanation,
      seed,
    };
  }
}
