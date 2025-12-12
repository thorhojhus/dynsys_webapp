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
}
