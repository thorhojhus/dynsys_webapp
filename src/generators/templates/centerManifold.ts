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
  randomInt,
} from '../utils/random';

// Center manifold problem templates
// Standard form: x' = Ax + f(x,y), y' = By + g(x,y) where A has zero eigenvalue, B has negative eigenvalue
interface CenterManifoldTemplate {
  // System coefficients for x' = ax + bxy + cx^2 + ...
  // y' = -λy + dx^2 + exy + ...
  lambda: number; // negative eigenvalue
  // Nonlinear terms coefficients
  bCoeff: number; // xy term in x equation
  cCoeff: number; // x^2 term in x equation
  dCoeff: number; // x^2 term in y equation
  eCoeff: number; // xy term in y equation
  // Center manifold h(x) = αx^2 + O(x^3)
  hCoeff: number; // α coefficient
  // Reduced dynamics on center manifold
  reducedCoeff: number; // coefficient of x^2 in reduced system
}

function computeCenterManifoldCoeff(lambda: number, d: number): number {
  // For y' = -λy + dx^2, h(x) = αx^2 where α = d/λ
  return d / lambda;
}

function computeReducedCoeff(c: number, b: number, alpha: number): number {
  // For x' = cx^2 + bxy with y = αx^2, reduced: x' = cx^2 + bα x^3 ≈ cx^2
  // At leading order it's just c
  return c;
}

// Generate templates with small integer coefficients
function generateTemplates(rng: () => number): CenterManifoldTemplate[] {
  const templates: CenterManifoldTemplate[] = [];

  // Simple cases with clean coefficients
  const lambdas = [1, 2];
  const dCoeffs = [-2, -1, 1, 2];
  const cCoeffs = [-1, 1];
  const bCoeffs = [0, 1, -1];
  const eCoeffs = [0];

  for (const lambda of lambdas) {
    for (const d of dCoeffs) {
      for (const c of cCoeffs) {
        for (const b of bCoeffs) {
          const h = computeCenterManifoldCoeff(lambda, d);
          // Only include if h is a nice fraction
          if (Number.isInteger(h) || h === 0.5 || h === -0.5) {
            templates.push({
              lambda,
              bCoeff: b,
              cCoeff: c,
              dCoeff: d,
              eCoeff: 0,
              hCoeff: h,
              reducedCoeff: c,
            });
          }
        }
      }
    }
  }

  return templates;
}

export class CenterManifoldGenerator extends BaseGenerator {
  topics = [Topic.CENTER_MANIFOLD];
  types = [QuestionType.MULTIPLE_CHOICE, QuestionType.TRUE_FALSE];
  difficulties = [Difficulty.MODERATE, Difficulty.HEAVY];

  generate(config: GeneratorConfig): Question {
    const seed = config.seed ?? Math.floor(Math.random() * 2147483647);
    const rng = createRng(seed);

    if (config.type === QuestionType.TRUE_FALSE) {
      return this.generateTrueFalse(rng, seed);
    }

    const variants = [
      this.questionComputeHCoefficient,
      this.questionIdentifyLeadingOrder,
      this.questionReducedStability,
      this.questionWhenToApply,
      this.questionComputeReducedDynamics,
    ];

    const variant = randomChoice(rng, variants);
    return variant.call(this, rng, seed);
  }

  private questionComputeHCoefficient(
    rng: () => number,
    seed: number
  ): MultipleChoiceQuestion {
    const templates = generateTemplates(rng);
    const t = randomChoice(rng, templates);

    // Format the system
    const xEqn = this.formatXEquation(t);
    const yEqn = this.formatYEquation(t);

    const systemLatex = `\\begin{align*} x' &= ${xEqn} \\\\ y' &= ${yEqn} \\end{align*}`;

    // Generate options including correct answer
    const correctH = t.hCoeff;
    const wrongOptions = [-2, -1, -0.5, 0, 0.5, 1, 2].filter(v => v !== correctH);
    const options = shuffle(rng, [correctH, ...wrongOptions.slice(0, 3)]).map(v =>
      v === 0 ? '$h(x) = 0$' : `$h(x) = ${this.formatCoeff(v)}x^2 + O(x^3)$`
    );

    const correctAnswer = correctH === 0 ? '$h(x) = 0$' : `$h(x) = ${this.formatCoeff(correctH)}x^2 + O(x^3)$`;
    const correctIndex = options.indexOf(correctAnswer);

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.CENTER_MANIFOLD,
      difficulty: Difficulty.HEAVY,
      prompt: `For the system:\n$$${systemLatex}$$\nFind the center manifold $y = h(x)$ to leading order.`,
      options,
      correctIndex: correctIndex >= 0 ? correctIndex : 0,
      explanation: `To find $h(x)$, substitute $y = h(x)$ into the invariance equation: $h'(x) \\cdot x' = y'$. At leading order $h(x) = \\alpha x^2$, this gives $\\alpha = \\frac{${t.dCoeff}}{${t.lambda}} = ${this.formatCoeff(correctH)}$.`,
      seed,
    };
  }

  private questionIdentifyLeadingOrder(
    rng: () => number,
    seed: number
  ): MultipleChoiceQuestion {
    const templates = generateTemplates(rng);
    const t = randomChoice(rng, templates);

    const xEqn = this.formatXEquation(t);
    const yEqn = this.formatYEquation(t);
    const systemLatex = `\\begin{align*} x' &= ${xEqn} \\\\ y' &= ${yEqn} \\end{align*}`;

    const options = [
      '$h(x) = ax + O(x^2)$',
      '$h(x) = ax^2 + O(x^3)$',
      '$h(x) = ax^3 + O(x^4)$',
      '$h(x) = a + bx + O(x^2)$',
    ];

    // For these systems, center manifold is tangent to x-axis at origin, so h(0) = h'(0) = 0
    // Leading order is x^2
    const correctIndex = 1;

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.CENTER_MANIFOLD,
      difficulty: Difficulty.MODERATE,
      prompt: `For the system:\n$$${systemLatex}$$\nWhat is the leading-order form of the center manifold $y = h(x)$?`,
      options,
      correctIndex,
      explanation: `The center manifold is tangent to the center eigenspace at the origin. Since the center eigenspace is the $x$-axis, we have $h(0) = 0$ and $h'(0) = 0$. Thus the leading order term is $x^2$, giving $h(x) = ax^2 + O(x^3)$.`,
      seed,
    };
  }

  private questionReducedStability(
    rng: () => number,
    seed: number
  ): MultipleChoiceQuestion {
    // Reduced dynamics on center manifold determines stability
    const cases = [
      { coeff: -1, stability: 'asymptotically stable', latex: "x' = -x^2" },
      { coeff: 1, stability: 'unstable', latex: "x' = x^2" },
      { coeff: -1, cubic: true, stability: 'asymptotically stable', latex: "x' = -x^3" },
      { coeff: 1, cubic: true, stability: 'unstable', latex: "x' = x^3" },
    ];

    const c = randomChoice(rng, cases);

    const options = [
      'Asymptotically stable',
      'Unstable',
      'Stable but not asymptotically stable',
      'Cannot be determined from the reduced dynamics',
    ];

    let correctIndex: number;
    if (c.stability === 'asymptotically stable') {
      correctIndex = 0;
    } else {
      correctIndex = 1;
    }

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.CENTER_MANIFOLD,
      difficulty: Difficulty.MODERATE,
      prompt: `If the reduced dynamics on the center manifold is:\n$$${c.latex}$$\nWhat is the stability of the origin in the full system?`,
      options,
      correctIndex,
      explanation: `By center manifold theory, the stability of the origin in the full system is determined by the stability in the reduced system. For $${c.latex}$: ${c.coeff < 0 ? 'trajectories flow toward the origin' : 'trajectories flow away from the origin'}, so the origin is **${c.stability}**.`,
      seed,
    };
  }

  private questionWhenToApply(
    rng: () => number,
    seed: number
  ): MultipleChoiceQuestion {
    const scenarios = [
      {
        eigenvalues: '$\\lambda_1 = 0$, $\\lambda_2 = -1$',
        canApply: true,
        reason: 'One zero eigenvalue with a stable eigenvalue',
      },
      {
        eigenvalues: '$\\lambda_{1,2} = \\pm i$',
        canApply: false,
        reason: 'Purely imaginary eigenvalues (use normal form/Hopf theory instead)',
      },
      {
        eigenvalues: '$\\lambda_1 = -1$, $\\lambda_2 = -2$',
        canApply: false,
        reason: 'All eigenvalues have negative real part (origin is stable, no center manifold needed)',
      },
      {
        eigenvalues: '$\\lambda_1 = 0$, $\\lambda_2 = 1$',
        canApply: false,
        reason: 'Has unstable eigenvalue (center manifold exists but doesn\'t capture full dynamics)',
      },
    ];

    const s = randomChoice(rng, scenarios);

    const options = [
      'Yes, center manifold reduction applies directly',
      'No, linearization suffices since the origin is hyperbolic',
      'No, use Hopf bifurcation theory instead',
      'No, the system has an unstable direction not captured by the center manifold',
    ];

    let correctIndex: number;
    if (s.canApply) {
      correctIndex = 0;
    } else if (s.eigenvalues.includes('pm i')) {
      correctIndex = 2;
    } else if (s.eigenvalues.includes('-1') && s.eigenvalues.includes('-2')) {
      correctIndex = 1;
    } else {
      correctIndex = 3;
    }

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.CENTER_MANIFOLD,
      difficulty: Difficulty.MODERATE,
      prompt: `For a 2D system with eigenvalues ${s.eigenvalues}, should you use center manifold reduction to determine stability?`,
      options,
      correctIndex,
      explanation: `${s.reason}. Center manifold reduction is most useful when there's a zero eigenvalue and the remaining eigenvalues have negative real parts.`,
      seed,
    };
  }

  private questionComputeReducedDynamics(
    rng: () => number,
    seed: number
  ): MultipleChoiceQuestion {
    // Given h(x) = αx^2, compute reduced dynamics
    const cases = [
      {
        xPrime: "x' = x^2 + xy",
        h: '$h(x) = x^2$',
        reduced: "$x' = x^2 + x^3$",
        leadingOrder: "$x' = x^2$",
      },
      {
        xPrime: "x' = -x^2 + 2xy",
        h: '$h(x) = -x^2$',
        reduced: "$x' = -x^2 - 2x^3$",
        leadingOrder: "$x' = -x^2$",
      },
      {
        xPrime: "x' = xy",
        h: '$h(x) = x^2$',
        reduced: "$x' = x^3$",
        leadingOrder: "$x' = x^3$",
      },
    ];

    const c = randomChoice(rng, cases);

    const options = shuffle(rng, [
      "$x' = x^2$",
      "$x' = -x^2$",
      "$x' = x^3$",
      "$x' = -x^3$",
    ]);

    const correctIndex = options.indexOf(c.leadingOrder);

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: Topic.CENTER_MANIFOLD,
      difficulty: Difficulty.HEAVY,
      prompt: `Given $${c.xPrime}$ and center manifold ${c.h}, what is the reduced dynamics on the center manifold to leading nonlinear order?`,
      options,
      correctIndex: correctIndex >= 0 ? correctIndex : 0,
      explanation: `Substituting $y = h(x)$ into $${c.xPrime}$ gives the reduced dynamics ${c.reduced}. The leading nonlinear term is ${c.leadingOrder}.`,
      seed,
    };
  }

  private generateTrueFalse(
    rng: () => number,
    seed: number
  ): TrueFalseQuestion {
    const statements = [
      {
        prompt: 'The center manifold is always unique.',
        correct: false,
        explanation: 'The center manifold is generally NOT unique. While the Taylor expansion at the origin is unique, different center manifolds can have the same local expansion.',
      },
      {
        prompt: 'The center manifold is tangent to the center eigenspace at the equilibrium.',
        correct: true,
        explanation: 'This is a fundamental property of center manifolds - they are tangent to the center eigenspace (span of eigenvectors with zero real part) at the equilibrium point.',
      },
      {
        prompt: 'The stability of the origin in the reduced system on the center manifold determines the stability in the full system.',
        correct: true,
        explanation: 'This is the main theorem of center manifold theory: if all other eigenvalues have negative real part, the stability is determined entirely by the dynamics on the center manifold.',
      },
      {
        prompt: 'Center manifold reduction requires all non-center eigenvalues to be stable.',
        correct: true,
        explanation: 'For center manifold reduction to determine stability, we need the non-center eigenvalues to have negative real parts. Otherwise, instability from those directions dominates.',
      },
      {
        prompt: 'The center manifold passes through the origin.',
        correct: true,
        explanation: 'By definition, the center manifold is invariant under the flow and contains the equilibrium point (origin in the standard form).',
      },
      {
        prompt: 'For $x\' = rx - x^3$, center manifold reduction is needed to determine stability at $r = 0$.',
        correct: true,
        explanation: 'At $r = 0$, the linearization has a zero eigenvalue, so center manifold reduction (or direct analysis) is needed. The reduced dynamics shows the origin is stable due to the $-x^3$ term.',
      },
    ];

    const statement = randomChoice(rng, statements);

    return {
      id: generateId(),
      type: QuestionType.TRUE_FALSE,
      topic: Topic.CENTER_MANIFOLD,
      difficulty: Difficulty.CONCEPTUAL,
      prompt: statement.prompt,
      correctAnswer: statement.correct,
      explanation: statement.explanation,
      seed,
    };
  }

  private formatXEquation(t: CenterManifoldTemplate): string {
    let terms: string[] = [];

    if (t.cCoeff !== 0) {
      terms.push(t.cCoeff === 1 ? 'x^2' : t.cCoeff === -1 ? '-x^2' : `${t.cCoeff}x^2`);
    }
    if (t.bCoeff !== 0) {
      const sign = t.bCoeff > 0 && terms.length > 0 ? '+' : '';
      terms.push(t.bCoeff === 1 ? `${sign}xy` : t.bCoeff === -1 ? '-xy' : `${sign}${t.bCoeff}xy`);
    }

    return terms.length > 0 ? terms.join(' ') : '0';
  }

  private formatYEquation(t: CenterManifoldTemplate): string {
    let terms: string[] = [`-${t.lambda === 1 ? '' : t.lambda}y`];

    if (t.dCoeff !== 0) {
      const sign = t.dCoeff > 0 ? '+' : '';
      terms.push(t.dCoeff === 1 ? `${sign}x^2` : t.dCoeff === -1 ? '-x^2' : `${sign}${t.dCoeff}x^2`);
    }
    if (t.eCoeff !== 0) {
      const sign = t.eCoeff > 0 ? '+' : '';
      terms.push(t.eCoeff === 1 ? `${sign}xy` : t.eCoeff === -1 ? '-xy' : `${sign}${t.eCoeff}xy`);
    }

    return terms.join(' ');
  }

  private formatCoeff(v: number): string {
    if (v === 0) return '0';
    if (v === 1) return '';
    if (v === -1) return '-';
    if (v === 0.5) return '\\frac{1}{2}';
    if (v === -0.5) return '-\\frac{1}{2}';
    return String(v);
  }
}
