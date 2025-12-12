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
  type EigenvalueType,
  generateMatrixWithEigenvalues,
  classifyEigenvalues,
  getEquilibriumName,
  isStable,
  trace,
  det,
} from '../utils/matrix';
import { format2DLinearSystem, formatMatrix, formatEigenvalue } from '../utils/latex';

export class LinearSystems2DGenerator extends BaseGenerator {
  topics = [Topic.LINEAR_SYSTEMS_2D, Topic.EQUILIBRIUM_CLASSIFICATION];
  types = [QuestionType.MULTIPLE_CHOICE];
  difficulties = [Difficulty.LIGHT, Difficulty.MODERATE];

  generate(config: GeneratorConfig): Question {
    const seed = config.seed ?? Math.floor(Math.random() * 2147483647);
    const rng = createRng(seed);

    const variants = [
      this.questionClassifyEquilibrium,
      this.questionIsStable,
      this.questionEigenvalueType,
      this.questionTraceAndDet,
      this.questionDiscriminantSign,
      this.questionParameterStability,
      this.questionTraceDeterminantRegion,
    ];

    const variant = randomChoice(rng, variants);
    return variant.call(this, rng, config.difficulty, seed);
  }

  private generateMatrix(rng: () => number): { matrix: Matrix2x2; type: EigenvalueType } {
    const types: EigenvalueType[] = [
      'real_distinct_negative',
      'real_distinct_positive',
      'real_distinct_mixed',
      'complex_negative_real',
      'complex_positive_real',
      'pure_imaginary',
    ];
    const type = randomChoice(rng, types);
    const matrix = generateMatrixWithEigenvalues(type, rng);
    return { matrix, type };
  }

  private questionClassifyEquilibrium(
    rng: () => number,
    difficulty: Difficulty,
    seed: number
  ): MultipleChoiceQuestion {
    const { matrix, type } = this.generateMatrix(rng);
    const systemLatex = format2DLinearSystem(matrix);
    const correctName = getEquilibriumName(type);

    const allNames = [
      'stable node',
      'unstable node',
      'saddle',
      'stable spiral (focus)',
      'unstable spiral (focus)',
      'center',
    ];

    // Create options: correct + 3 distractors
    const distractors = allNames.filter((n) => n !== correctName);
    const shuffledDistractors = shuffle(rng, distractors).slice(0, 3);
    const options = shuffle(rng, [correctName, ...shuffledDistractors]);
    const correctIndex = options.indexOf(correctName);

    const eigenInfo = classifyEigenvalues(matrix);
    const l1 = formatEigenvalue(eigenInfo.lambda1.real, eigenInfo.lambda1.imag);
    const l2 = formatEigenvalue(eigenInfo.lambda2.real, eigenInfo.lambda2.imag);

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.EQUILIBRIUM_CLASSIFICATION,
      difficulty: Difficulty.MODERATE,
      prompt: `Classify the equilibrium at the origin for the system:\n$$${systemLatex}$$`,
      options,
      correctIndex,
      explanation: `The matrix is $A = ${formatMatrix(matrix)}$.\n\nEigenvalues: $\\lambda_1 = ${l1}$, $\\lambda_2 = ${l2}$.\n\nThis corresponds to a **${correctName}**.`,
      seed,
    };
  }

  private questionIsStable(
    rng: () => number,
    difficulty: Difficulty,
    seed: number
  ): MultipleChoiceQuestion {
    const { matrix, type } = this.generateMatrix(rng);
    const systemLatex = format2DLinearSystem(matrix);
    const stable = isStable(type);

    const options = [
      'Asymptotically stable',
      'Unstable',
      'Stable but not asymptotically stable',
      'Cannot be determined from this information',
    ];

    let correctIndex: number;
    if (stable) {
      correctIndex = 0;
    } else if (type === 'pure_imaginary') {
      correctIndex = 2; // Center is Lyapunov stable but not asymptotically stable
    } else {
      correctIndex = 1;
    }

    const eigenInfo = classifyEigenvalues(matrix);
    const t = trace(matrix);
    const d = det(matrix);

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.LINEAR_SYSTEMS_2D,
      difficulty: Difficulty.LIGHT,
      prompt: `Determine the stability of the origin for the system:\n$$${systemLatex}$$`,
      options,
      correctIndex,
      explanation: `For the matrix $A$: $\\text{tr}(A) = ${t}$, $\\det(A) = ${d}$.\n\n${
        stable
          ? 'Since $\\text{tr}(A) < 0$ and $\\det(A) > 0$, the origin is asymptotically stable.'
          : type === 'pure_imaginary'
          ? 'The eigenvalues are purely imaginary, so the origin is a center (stable but not asymptotically stable).'
          : 'Since ' + (d < 0 ? '$\\det(A) < 0$ (saddle)' : '$\\text{tr}(A) > 0$') + ', the origin is unstable.'
      }`,
      seed,
    };
  }

  private questionEigenvalueType(
    rng: () => number,
    difficulty: Difficulty,
    seed: number
  ): MultipleChoiceQuestion {
    const { matrix, type } = this.generateMatrix(rng);
    const systemLatex = format2DLinearSystem(matrix);

    const isComplex = type.includes('complex') || type === 'pure_imaginary';
    const isRepeated = type.includes('repeated');

    const options = [
      'Real and distinct',
      'Real and repeated',
      'Complex conjugate',
      'Purely imaginary',
    ];

    let correctIndex: number;
    if (type === 'pure_imaginary') {
      correctIndex = 3;
    } else if (isComplex) {
      correctIndex = 2;
    } else if (isRepeated) {
      correctIndex = 1;
    } else {
      correctIndex = 0;
    }

    const t = trace(matrix);
    const d = det(matrix);
    const disc = t * t - 4 * d;

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.LINEAR_SYSTEMS_2D,
      difficulty: Difficulty.LIGHT,
      prompt: `What type of eigenvalues does the following system have?\n$$${systemLatex}$$`,
      options,
      correctIndex,
      explanation: `For matrix $A$: $\\text{tr}(A) = ${t}$, $\\det(A) = ${d}$.\n\nDiscriminant: $\\Delta = \\text{tr}^2 - 4\\det = ${t * t} - ${4 * d} = ${disc}$.\n\n${
        disc > 0
          ? '$\\Delta > 0$ implies real distinct eigenvalues.'
          : disc < 0
          ? '$\\Delta < 0$ implies complex conjugate eigenvalues.'
          : '$\\Delta = 0$ implies repeated eigenvalues.'
      }`,
      seed,
    };
  }

  private questionTraceAndDet(
    rng: () => number,
    difficulty: Difficulty,
    seed: number
  ): MultipleChoiceQuestion {
    const { matrix } = this.generateMatrix(rng);
    const matrixLatex = formatMatrix(matrix);
    const t = trace(matrix);
    const d = det(matrix);

    const askTrace = rng() > 0.5;
    const correctValue = askTrace ? t : d;

    // Generate plausible distractors
    const distractors = [
      correctValue + randomChoice(rng, [1, -1, 2, -2]),
      correctValue * -1,
      correctValue + matrix[0][0],
    ].filter((v) => v !== correctValue);

    const options = shuffle(rng, [correctValue, ...distractors.slice(0, 3)]).map(String);
    const correctIndex = options.indexOf(String(correctValue));

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.LINEAR_SYSTEMS_2D,
      difficulty: Difficulty.LIGHT,
      prompt: `What is the ${askTrace ? 'trace' : 'determinant'} of the matrix $A = ${matrixLatex}$?`,
      options,
      correctIndex,
      explanation: askTrace
        ? `$\\text{tr}(A) = a_{11} + a_{22} = ${matrix[0][0]} + ${matrix[1][1]} = ${t}$`
        : `$\\det(A) = a_{11}a_{22} - a_{12}a_{21} = (${matrix[0][0]})(${matrix[1][1]}) - (${matrix[0][1]})(${matrix[1][0]}) = ${d}$`,
      seed,
    };
  }

  // NEW: Test discriminant understanding
  private questionDiscriminantSign(
    rng: () => number,
    difficulty: Difficulty,
    seed: number
  ): MultipleChoiceQuestion {
    const { matrix, type } = this.generateMatrix(rng);
    const matrixLatex = formatMatrix(matrix);
    const t = trace(matrix);
    const d = det(matrix);
    const disc = t * t - 4 * d;

    const prompt = `For the matrix $A = ${matrixLatex}$, compute $\\Delta = \\text{tr}^2(A) - 4\\det(A)$ and determine the nature of eigenvalues.`;

    const discSign = disc > 0 ? 'positive' : disc < 0 ? 'negative' : 'zero';
    const eigenNature =
      disc > 0
        ? 'real and distinct'
        : disc < 0
          ? 'complex conjugate'
          : 'real and repeated';

    const correctAnswer = `$\\Delta ${disc > 0 ? '>' : disc < 0 ? '<' : '='} 0$, eigenvalues are ${eigenNature}`;

    const options = shuffle(rng, [
      '$\\Delta > 0$, eigenvalues are real and distinct',
      '$\\Delta < 0$, eigenvalues are complex conjugate',
      '$\\Delta = 0$, eigenvalues are real and repeated',
      '$\\Delta > 0$, eigenvalues are complex conjugate',
    ]);

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.LINEAR_SYSTEMS_2D,
      difficulty: Difficulty.MODERATE,
      prompt,
      options,
      correctIndex: options.indexOf(correctAnswer),
      explanation: `$\\text{tr}(A) = ${t}$, $\\det(A) = ${d}$.\n\n$\\Delta = ${t}^2 - 4(${d}) = ${t * t} - ${4 * d} = ${disc}$.\n\nSince $\\Delta ${disc > 0 ? '> 0' : disc < 0 ? '< 0' : '= 0'}$, eigenvalues are ${eigenNature}.`,
      seed,
    };
  }

  // NEW: Parameter stability conditions
  private questionParameterStability(
    rng: () => number,
    difficulty: Difficulty,
    seed: number
  ): MultipleChoiceQuestion {
    // Generate parameterized matrix problems
    const templates = [
      {
        matrix: '\\begin{pmatrix} a & 1 \\\\ 0 & -2 \\end{pmatrix}',
        question: 'For what values of $a$ is the origin asymptotically stable?',
        correct: '$a < 0$',
        wrong: ['$a > 0$', '$a < -2$', '$a > -2$'],
        explanation:
          'Eigenvalues are $\\lambda_1 = a$ and $\\lambda_2 = -2$. For asymptotic stability, both must have negative real parts. $\\lambda_2 = -2 < 0$ always. We need $\\lambda_1 = a < 0$.',
      },
      {
        matrix: '\\begin{pmatrix} -1 & 0 \\\\ 0 & b \\end{pmatrix}',
        question: 'For what values of $b$ is the origin asymptotically stable?',
        correct: '$b < 0$',
        wrong: ['$b > 0$', '$b < -1$', '$b > -1$'],
        explanation:
          'Eigenvalues are $\\lambda_1 = -1$ and $\\lambda_2 = b$. For asymptotic stability, both must be negative. $\\lambda_1 = -1 < 0$ always. We need $\\lambda_2 = b < 0$.',
      },
      {
        matrix: '\\begin{pmatrix} -2 & 1 \\\\ 0 & a \\end{pmatrix}',
        question: 'For what values of $a$ is the origin a saddle point?',
        correct: '$a > 0$',
        wrong: ['$a < 0$', '$a < -2$', '$a = 0$'],
        explanation:
          'Eigenvalues are $\\lambda_1 = -2$ and $\\lambda_2 = a$. For a saddle, eigenvalues must have opposite signs. Since $\\lambda_1 = -2 < 0$, we need $\\lambda_2 = a > 0$.',
      },
      {
        matrix: '\\begin{pmatrix} a & -2 \\\\ 2 & a \\end{pmatrix}',
        question: 'For what values of $a$ is the origin asymptotically stable?',
        correct: '$a < 0$',
        wrong: ['$a > 0$', '$|a| < 2$', '$a > 2$'],
        explanation:
          'This is a rotation matrix scaled by $a$ with $\\det = a^2 + 4 > 0$ always. Eigenvalues are $a \\pm 2i$ (complex). For stability, real part must be negative: $a < 0$.',
      },
    ];

    const template = randomChoice(rng, templates);
    const options = shuffle(rng, [template.correct, ...template.wrong]);

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.LINEAR_SYSTEMS_2D,
      difficulty: Difficulty.MODERATE,
      prompt: `Consider the system $\\mathbf{x}' = A\\mathbf{x}$ with $A = ${template.matrix}$.\n\n${template.question}`,
      options,
      correctIndex: options.indexOf(template.correct),
      explanation: template.explanation,
      seed,
    };
  }

  // NEW: Trace-determinant plane region identification
  private questionTraceDeterminantRegion(
    rng: () => number,
    difficulty: Difficulty,
    seed: number
  ): MultipleChoiceQuestion {
    const scenarios = [
      {
        condition: '$\\text{tr}(A) < 0$ and $\\det(A) > 0$ and $\\Delta > 0$',
        result: 'Stable node',
        explanation:
          '$\\det > 0$ means eigenvalues have the same sign. $\\text{tr} < 0$ means their sum is negative, so both are negative. $\\Delta > 0$ means real distinct. Result: stable node.',
      },
      {
        condition: '$\\text{tr}(A) > 0$ and $\\det(A) > 0$ and $\\Delta > 0$',
        result: 'Unstable node',
        explanation:
          '$\\det > 0$ means eigenvalues have the same sign. $\\text{tr} > 0$ means their sum is positive, so both are positive. $\\Delta > 0$ means real distinct. Result: unstable node.',
      },
      {
        condition: '$\\det(A) < 0$',
        result: 'Saddle',
        explanation:
          '$\\det < 0$ means eigenvalues have opposite signs (one positive, one negative). This is the definition of a saddle point.',
      },
      {
        condition: '$\\text{tr}(A) < 0$ and $\\det(A) > 0$ and $\\Delta < 0$',
        result: 'Stable spiral',
        explanation:
          '$\\Delta < 0$ means complex eigenvalues. $\\det > 0$ confirms non-saddle. $\\text{tr} < 0$ means negative real part. Result: stable spiral.',
      },
      {
        condition: '$\\text{tr}(A) = 0$ and $\\det(A) > 0$',
        result: 'Center',
        explanation:
          '$\\text{tr} = 0$ means real part of eigenvalues is zero. $\\det > 0$ means they are purely imaginary (not zero). Result: center.',
      },
    ];

    const scenario = randomChoice(rng, scenarios);

    const prompt = `If a $2 \\times 2$ matrix $A$ satisfies ${scenario.condition}, then the equilibrium at the origin is a:`;

    let options = [
      'Stable node',
      'Unstable node',
      'Saddle',
      'Stable spiral',
      'Center',
    ];

    // Ensure correct answer is in the first 4, then shuffle
    const otherOptions = options.filter((o) => o !== scenario.result);
    const finalOptions = shuffle(rng, [scenario.result, ...otherOptions.slice(0, 3)]);

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.EQUILIBRIUM_CLASSIFICATION,
      difficulty: Difficulty.MODERATE,
      prompt,
      options: finalOptions,
      correctIndex: finalOptions.indexOf(scenario.result),
      explanation: scenario.explanation,
      seed,
    };
  }
}
