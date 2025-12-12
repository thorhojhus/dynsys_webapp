import {
  QuestionType,
  Topic,
  Difficulty,
  type MultipleChoiceQuestion,
  type Question,
} from '@/types/question';
import { BaseGenerator, type GeneratorConfig } from '../types';
import {
  createRng,
  randomChoice,
  generateId,
  shuffle,
  randomInt,
} from '../utils/random';
import {
  type Matrix2x2,
  classifyEigenvalues,
  generateMatrixWithEigenvalues,
  type EigenvalueType,
} from '../utils/matrix';
import { formatMatrix } from '../utils/latex';

export class InvariantManifoldsGenerator extends BaseGenerator {
  topics = [Topic.INVARIANT_MANIFOLDS];
  types = [QuestionType.MULTIPLE_CHOICE];
  difficulties = [Difficulty.LIGHT, Difficulty.MODERATE];

  generate(config: GeneratorConfig): Question {
    const seed = config.seed ?? Math.floor(Math.random() * 2147483647);
    const rng = createRng(seed);

    const lightVariants = [
      this.questionManifoldDimension,
      this.questionEigenvalueCount,
      this.questionHomoclinicHeteroclinic,
    ];

    const moderateVariants = [
      this.questionTangentSpace,
      this.questionManifoldIntersection,
      this.questionFlowDirection,
    ];

    const variants =
      config.difficulty === Difficulty.LIGHT ? lightVariants : moderateVariants;
    const variant = randomChoice(rng, variants);
    return variant.call(this, rng, config.difficulty, seed);
  }

  // Variant 1: Given eigenvalues, determine dim(W^s) or dim(W^u)
  private questionManifoldDimension(
    rng: () => number,
    difficulty: Difficulty,
    seed: number
  ): MultipleChoiceQuestion {
    // Generate eigenvalues for a 2D or 3D system
    const is3D = rng() > 0.5;

    let eigenvalues: number[];
    let stableDim: number;
    let unstableDim: number;

    if (is3D) {
      // 3D system with real eigenvalues
      const configs = [
        { eigs: [-2, -1, 3], stable: 2, unstable: 1 },
        { eigs: [-3, 1, 2], stable: 1, unstable: 2 },
        { eigs: [-2, -1, -3], stable: 3, unstable: 0 },
        { eigs: [1, 2, 3], stable: 0, unstable: 3 },
        { eigs: [-1, 2, 3], stable: 1, unstable: 2 },
      ];
      const config = randomChoice(rng, configs);
      eigenvalues = config.eigs;
      stableDim = config.stable;
      unstableDim = config.unstable;
    } else {
      // 2D system
      const configs = [
        { eigs: [-2, -1], stable: 2, unstable: 0 },
        { eigs: [1, 2], stable: 0, unstable: 2 },
        { eigs: [-1, 2], stable: 1, unstable: 1 },
        { eigs: [-3, 1], stable: 1, unstable: 1 },
      ];
      const config = randomChoice(rng, configs);
      eigenvalues = config.eigs;
      stableDim = config.stable;
      unstableDim = config.unstable;
    }

    const askStable = rng() > 0.5;
    const correctDim = askStable ? stableDim : unstableDim;
    const manifoldType = askStable ? 'W^s' : 'W^u';
    const manifoldName = askStable ? 'stable manifold' : 'unstable manifold';

    const eigStr = eigenvalues.map((e) => (e > 0 ? `${e}` : `${e}`)).join(', ');
    const dim = eigenvalues.length;

    const prompt = `A ${dim}D linear system has eigenvalues $\\lambda = ${eigStr}$. What is the dimension of the ${manifoldName} $${manifoldType}$?`;

    const options = ['0', '1', '2'];
    if (is3D) options.push('3');
    const correctAnswer = `${correctDim}`;

    const shuffledOptions = shuffle(rng, options);

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.INVARIANT_MANIFOLDS,
      difficulty,
      prompt,
      options: shuffledOptions,
      correctIndex: shuffledOptions.indexOf(correctAnswer),
      explanation: `The ${manifoldName} $${manifoldType}$ is spanned by eigenvectors corresponding to eigenvalues with ${askStable ? 'negative' : 'positive'} real parts. Here, ${askStable ? eigenvalues.filter((e) => e < 0).length : eigenvalues.filter((e) => e > 0).length} eigenvalue(s) have ${askStable ? 'negative' : 'positive'} real part, so $\\dim(${manifoldType}) = ${correctDim}$.`,
      seed,
    };
  }

  // Variant 2: Count stable/unstable eigenvalues from matrix
  private questionEigenvalueCount(
    rng: () => number,
    difficulty: Difficulty,
    seed: number
  ): MultipleChoiceQuestion {
    const type: EigenvalueType = randomChoice(rng, [
      'real_distinct_negative',
      'real_distinct_positive',
      'real_distinct_mixed',
    ]);

    const matrix = generateMatrixWithEigenvalues(type, rng);
    const info = classifyEigenvalues(matrix);

    const askStable = rng() > 0.5;

    let correctCount: number;
    if (type === 'real_distinct_negative') {
      correctCount = askStable ? 2 : 0;
    } else if (type === 'real_distinct_positive') {
      correctCount = askStable ? 0 : 2;
    } else {
      correctCount = 1; // mixed: one stable, one unstable
    }

    const prompt = `For the linear system $\\mathbf{x}' = A\\mathbf{x}$ with $A = ${formatMatrix(matrix)}$, how many eigenvalues have ${askStable ? 'negative' : 'positive'} real part?`;

    const options = shuffle(rng, ['0', '1', '2']);

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.INVARIANT_MANIFOLDS,
      difficulty,
      prompt,
      options,
      correctIndex: options.indexOf(`${correctCount}`),
      explanation: `Computing eigenvalues: $\\lambda_1 = ${info.lambda1.real.toFixed(1)}$, $\\lambda_2 = ${info.lambda2.real.toFixed(1)}$. ${correctCount} eigenvalue(s) have ${askStable ? 'negative' : 'positive'} real part, which determines $\\dim(${askStable ? 'W^s' : 'W^u'}) = ${correctCount}$.`,
      seed,
    };
  }

  // Variant 3: Classify orbit as homoclinic or heteroclinic
  private questionHomoclinicHeteroclinic(
    rng: () => number,
    difficulty: Difficulty,
    seed: number
  ): MultipleChoiceQuestion {
    const scenarios = [
      {
        description:
          'approaches saddle point $S$ as $t \\to -\\infty$ and the same saddle $S$ as $t \\to +\\infty$',
        answer: 'Homoclinic orbit',
        explanation:
          'A homoclinic orbit connects a saddle point to itself, leaving along the unstable manifold and returning along the stable manifold.',
      },
      {
        description:
          'approaches saddle point $S_1$ as $t \\to -\\infty$ and a different saddle $S_2$ as $t \\to +\\infty$',
        answer: 'Heteroclinic orbit',
        explanation:
          'A heteroclinic orbit connects two different equilibrium points, traveling from the unstable manifold of one to the stable manifold of another.',
      },
      {
        description:
          'leaves saddle $S_1$ along its unstable manifold and arrives at saddle $S_2$ along its stable manifold',
        answer: 'Heteroclinic orbit',
        explanation:
          'This describes a heteroclinic connection between two distinct saddle points.',
      },
      {
        description:
          'forms a loop starting and ending at the same saddle point $S$',
        answer: 'Homoclinic orbit',
        explanation:
          'A loop connecting a saddle to itself is called a homoclinic orbit.',
      },
    ];

    const scenario = randomChoice(rng, scenarios);

    const prompt = `An orbit ${scenario.description}. This is called a:`;

    const options = shuffle(rng, [
      'Homoclinic orbit',
      'Heteroclinic orbit',
      'Periodic orbit',
      'Separatrix',
    ]);

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.INVARIANT_MANIFOLDS,
      difficulty,
      prompt,
      options,
      correctIndex: options.indexOf(scenario.answer),
      explanation: scenario.explanation,
      seed,
    };
  }

  // Variant 4: Identify tangent direction of stable manifold
  private questionTangentSpace(
    rng: () => number,
    difficulty: Difficulty,
    seed: number
  ): MultipleChoiceQuestion {
    // Create a diagonal or simple saddle system
    const configs = [
      {
        system: "x' = -2x, \\quad y' = 3y",
        stableDir: 'x',
        unstableDir: 'y',
        stableExpl: 'x has the stable eigenvalue (-2)',
        unstableExpl: 'y has the unstable eigenvalue (3)',
      },
      {
        system: "x' = x, \\quad y' = -y",
        stableDir: 'y',
        unstableDir: 'x',
        stableExpl: 'y has the stable eigenvalue (-1)',
        unstableExpl: 'x has the unstable eigenvalue (1)',
      },
      {
        system: "x' = 2x, \\quad y' = -3y",
        stableDir: 'y',
        unstableDir: 'x',
        stableExpl: 'y has the stable eigenvalue (-3)',
        unstableExpl: 'x has the unstable eigenvalue (2)',
      },
      {
        system: "x' = -x, \\quad y' = 2y",
        stableDir: 'x',
        unstableDir: 'y',
        stableExpl: 'x has the stable eigenvalue (-1)',
        unstableExpl: 'y has the unstable eigenvalue (2)',
      },
    ];

    const config = randomChoice(rng, configs);
    const askStable = rng() > 0.5;

    const manifoldType = askStable ? 'W^s' : 'W^u';
    const correctDir = askStable ? config.stableDir : config.unstableDir;
    const explanation = askStable ? config.stableExpl : config.unstableExpl;

    const prompt = `For the system $${config.system}$, the ${askStable ? 'stable' : 'unstable'} manifold $${manifoldType}$ at the origin is tangent to:`;

    const options = shuffle(rng, [
      'the $x$-axis',
      'the $y$-axis',
      'the line $y = x$',
      'the line $y = -x$',
    ]);

    const correctAnswer = `the $${correctDir}$-axis`;

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.INVARIANT_MANIFOLDS,
      difficulty,
      prompt,
      options,
      correctIndex: options.indexOf(correctAnswer),
      explanation: `The ${askStable ? 'stable' : 'unstable'} manifold is tangent to the eigenspace of the ${askStable ? 'stable' : 'unstable'} eigenvalue. Here, ${explanation}, so $${manifoldType}$ is tangent to the $${correctDir}$-axis.`,
      seed,
    };
  }

  // Variant 5: Where do stable and unstable manifolds intersect?
  private questionManifoldIntersection(
    rng: () => number,
    difficulty: Difficulty,
    seed: number
  ): MultipleChoiceQuestion {
    const scenarios = [
      {
        context: 'at a saddle point',
        correct: 'At the saddle point itself',
        explanation:
          'The stable and unstable manifolds of a saddle point always intersect at the equilibrium point itself. This is where both manifolds originate.',
      },
      {
        context: 'for a hyperbolic equilibrium with a 1D stable and 1D unstable manifold',
        correct: 'At the equilibrium point',
        explanation:
          'For any hyperbolic equilibrium, $W^s$ and $W^u$ intersect precisely at the equilibrium point. Away from this point, they may or may not intersect (forming homoclinic orbits if they do).',
      },
    ];

    const scenario = randomChoice(rng, scenarios);

    const prompt = `For a 2D system, where do the stable manifold $W^s$ and unstable manifold $W^u$ always intersect ${scenario.context}?`;

    const options = shuffle(rng, [
      'At the saddle point itself',
      'At the equilibrium point',
      'They never intersect',
      'Along the entire $x$-axis',
      'At infinity',
    ].slice(0, 4));

    // Find which correct answer variant is in options
    let correctIdx = options.indexOf(scenario.correct);
    if (correctIdx === -1) {
      // Try the other variant
      correctIdx = options.indexOf('At the equilibrium point');
      if (correctIdx === -1) {
        correctIdx = options.indexOf('At the saddle point itself');
      }
    }

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.INVARIANT_MANIFOLDS,
      difficulty,
      prompt,
      options,
      correctIndex: correctIdx,
      explanation: scenario.explanation,
      seed,
    };
  }

  // Variant 6: Flow direction on manifolds
  private questionFlowDirection(
    rng: () => number,
    difficulty: Difficulty,
    seed: number
  ): MultipleChoiceQuestion {
    const askStable = rng() > 0.5;
    const manifoldType = askStable ? 'W^s' : 'W^u';
    const manifoldName = askStable ? 'stable manifold' : 'unstable manifold';

    const timeDir = rng() > 0.5 ? 'increases' : 'decreases';
    const isForward = timeDir === 'increases';

    let correctBehavior: string;
    if (askStable) {
      // Stable manifold: trajectories approach equilibrium as t -> +inf
      correctBehavior = isForward ? 'toward' : 'away from';
    } else {
      // Unstable manifold: trajectories leave equilibrium as t -> +inf
      correctBehavior = isForward ? 'away from' : 'toward';
    }

    const prompt = `On the ${manifoldName} $${manifoldType}$ of a saddle point, trajectories move ___ the equilibrium as time ${timeDir}.`;

    const options = shuffle(rng, [
      'toward',
      'away from',
      'parallel to',
      'perpendicular to',
    ]);

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.INVARIANT_MANIFOLDS,
      difficulty,
      prompt,
      options,
      correctIndex: options.indexOf(correctBehavior),
      explanation: `On the ${manifoldName}, trajectories ${askStable ? 'approach' : 'leave'} the equilibrium as $t \\to +\\infty$. Therefore, as time ${timeDir}, they move ${correctBehavior} the equilibrium.`,
      seed,
    };
  }
}
