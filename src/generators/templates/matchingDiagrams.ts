import {
  QuestionType,
  Topic,
  Difficulty,
  type MatchingQuestion,
  type Question,
  type PhasePortraitType,
  type BifurcationDiagramType,
} from '@/types/question';
import { BaseGenerator, type GeneratorConfig } from '../types';
import {
  createRng,
  randomChoice,
  generateId,
  shuffle,
} from '../utils/random';

const PORTRAIT_TYPES: PhasePortraitType[] = [
  'stable_node',
  'unstable_node',
  'saddle',
  'stable_spiral',
  'unstable_spiral',
  'center',
];

const PORTRAIT_NAMES: Record<PhasePortraitType, string> = {
  stable_node: 'Stable Node',
  unstable_node: 'Unstable Node',
  saddle: 'Saddle',
  stable_spiral: 'Stable Spiral',
  unstable_spiral: 'Unstable Spiral',
  center: 'Center',
};

const PORTRAIT_EIGENVALUES: Record<PhasePortraitType, string> = {
  stable_node: 'Real, distinct, both negative',
  unstable_node: 'Real, distinct, both positive',
  saddle: 'Real, opposite signs',
  stable_spiral: 'Complex with negative real part',
  unstable_spiral: 'Complex with positive real part',
  center: 'Purely imaginary',
};

const PORTRAIT_STABILITY: Record<PhasePortraitType, string> = {
  stable_node: 'Asymptotically stable',
  unstable_node: 'Unstable',
  saddle: 'Unstable',
  stable_spiral: 'Asymptotically stable',
  unstable_spiral: 'Unstable',
  center: 'Stable (not asymptotically)',
};

const BIFURCATION_TYPES: BifurcationDiagramType[] = [
  'saddle_node',
  'transcritical',
  'pitchfork_super',
  'pitchfork_sub',
];

const BIFURCATION_NAMES: Record<BifurcationDiagramType, string> = {
  saddle_node: 'Saddle-Node',
  transcritical: 'Transcritical',
  pitchfork_super: 'Supercritical Pitchfork',
  pitchfork_sub: 'Subcritical Pitchfork',
};

const BIFURCATION_EQUATIONS: Record<BifurcationDiagramType, string> = {
  saddle_node: "$x' = r + x^2$",
  transcritical: "$x' = rx - x^2$",
  pitchfork_super: "$x' = rx - x^3$",
  pitchfork_sub: "$x' = rx + x^3$",
};

// 2D system equations with their phase portrait types
const SYSTEM_EQUATIONS: Array<{
  equation: string;
  portrait: PhasePortraitType;
  description: string;
}> = [
  { equation: "$\\dot{x} = -x, \\; \\dot{y} = -2y$", portrait: 'stable_node', description: 'Both eigenvalues negative: -1, -2' },
  { equation: "$\\dot{x} = x, \\; \\dot{y} = 2y$", portrait: 'unstable_node', description: 'Both eigenvalues positive: 1, 2' },
  { equation: "$\\dot{x} = x, \\; \\dot{y} = -y$", portrait: 'saddle', description: 'Eigenvalues of opposite sign: 1, -1' },
  { equation: "$\\dot{x} = -x - y, \\; \\dot{y} = x - y$", portrait: 'stable_spiral', description: 'Complex eigenvalues with negative real part' },
  { equation: "$\\dot{x} = x - y, \\; \\dot{y} = x + y$", portrait: 'unstable_spiral', description: 'Complex eigenvalues with positive real part' },
  { equation: "$\\dot{x} = -y, \\; \\dot{y} = x$", portrait: 'center', description: 'Purely imaginary eigenvalues: ±i' },
  { equation: "$\\dot{x} = 2x - 3y, \\; \\dot{y} = 3x + 2y$", portrait: 'unstable_spiral', description: 'Matrix has trace 4 > 0, complex eigenvalues' },
  { equation: "$\\dot{x} = -2x + y, \\; \\dot{y} = -y$", portrait: 'stable_node', description: 'Upper triangular, eigenvalues -2, -1' },
  { equation: "$\\dot{x} = 3x, \\; \\dot{y} = -2y$", portrait: 'saddle', description: 'Diagonal matrix with opposite signs' },
  { equation: "$\\dot{x} = -x + 2y, \\; \\dot{y} = -2x - y$", portrait: 'stable_spiral', description: 'Trace = -2 < 0, det = 5 > 0, complex eigenvalues' },
];

// Bifurcation characteristics for detailed matching
const BIFURCATION_CHARACTERISTICS: Record<BifurcationDiagramType, string> = {
  saddle_node: 'Two equilibria collide and disappear',
  transcritical: 'Two equilibria exchange stability',
  pitchfork_super: 'One equilibrium splits into three (stable outer branches)',
  pitchfork_sub: 'One equilibrium splits into three (unstable outer branches)',
};

export class MatchingDiagramsGenerator extends BaseGenerator {
  topics = [
    Topic.PHASE_PORTRAITS,
    Topic.EQUILIBRIUM_CLASSIFICATION,
    Topic.BIFURCATION_SADDLE_NODE,
    Topic.BIFURCATION_TRANSCRITICAL,
    Topic.BIFURCATION_PITCHFORK,
  ];
  types = [QuestionType.MATCHING];
  difficulties = [Difficulty.LIGHT, Difficulty.MODERATE];

  generate(config: GeneratorConfig): Question {
    const seed = config.seed ?? Math.floor(Math.random() * 2147483647);
    const rng = createRng(seed);

    const variants = [
      this.matchPortraitsToNames,
      this.matchPortraitsToEigenvalues,
      this.matchPortraitsToStability,
      this.matchBifurcationsToNames,
      this.matchBifurcationsToEquations,
      this.matchPortraitsToSystems,
      this.matchBifurcationsToCharacteristics,
      this.matchSystemsToDescriptions,
    ];

    const variant = randomChoice(rng, variants);
    return variant.call(this, rng, seed);
  }

  private matchPortraitsToNames(
    rng: () => number,
    seed: number
  ): MatchingQuestion {
    // Select 4 random portrait types
    const selectedTypes = shuffle(rng, [...PORTRAIT_TYPES]).slice(0, 4);

    // Left items are diagram references
    const leftItems = selectedTypes.map(t => `portrait:${t}`);

    // Right items are names (shuffled order)
    const rightItems = shuffle(rng, selectedTypes.map(t => PORTRAIT_NAMES[t]));

    // Compute correct mapping
    const correctMapping = selectedTypes.map(t =>
      rightItems.indexOf(PORTRAIT_NAMES[t])
    );

    return {
      id: generateId(),
      type: QuestionType.MATCHING,
      topic: Topic.PHASE_PORTRAITS,
      difficulty: Difficulty.MODERATE,
      prompt: 'Match each phase portrait to its equilibrium type:',
      leftItems,
      rightItems,
      correctMapping,
      explanation: `The phase portraits show different equilibrium types based on the eigenvalue structure of the linearized system.`,
      seed,
    };
  }

  private matchPortraitsToEigenvalues(
    rng: () => number,
    seed: number
  ): MatchingQuestion {
    const selectedTypes = shuffle(rng, [...PORTRAIT_TYPES]).slice(0, 4);

    const leftItems = selectedTypes.map(t => `portrait:${t}`);
    const rightItems = shuffle(rng, selectedTypes.map(t => PORTRAIT_EIGENVALUES[t]));

    const correctMapping = selectedTypes.map(t =>
      rightItems.indexOf(PORTRAIT_EIGENVALUES[t])
    );

    return {
      id: generateId(),
      type: QuestionType.MATCHING,
      topic: Topic.EQUILIBRIUM_CLASSIFICATION,
      difficulty: Difficulty.MODERATE,
      prompt: 'Match each phase portrait to the eigenvalue type that produces it:',
      leftItems,
      rightItems,
      correctMapping,
      explanation: `The eigenvalues of the Jacobian matrix determine the type of phase portrait: real eigenvalues give nodes or saddles, complex eigenvalues give spirals or centers.`,
      seed,
    };
  }

  private matchPortraitsToStability(
    rng: () => number,
    seed: number
  ): MatchingQuestion {
    // Select types with different stabilities for variety
    const stableTypes: PhasePortraitType[] = ['stable_node', 'stable_spiral'];
    const unstableTypes: PhasePortraitType[] = ['unstable_node', 'unstable_spiral', 'saddle'];
    const marginalTypes: PhasePortraitType[] = ['center'];

    // Pick a mix
    const selectedTypes = shuffle(rng, [
      randomChoice(rng, stableTypes),
      randomChoice(rng, unstableTypes),
      'center',
      randomChoice(rng, ['saddle', ...stableTypes.filter(t => t !== selectedTypes[0])]),
    ]).slice(0, 4) as PhasePortraitType[];

    const leftItems = selectedTypes.map(t => `portrait:${t}`);
    const rightItems = shuffle(rng, selectedTypes.map(t => PORTRAIT_STABILITY[t]));

    const correctMapping = selectedTypes.map(t =>
      rightItems.indexOf(PORTRAIT_STABILITY[t])
    );

    return {
      id: generateId(),
      type: QuestionType.MATCHING,
      topic: Topic.EQUILIBRIUM_CLASSIFICATION,
      difficulty: Difficulty.MODERATE,
      prompt: 'Match each phase portrait to its stability classification:',
      leftItems,
      rightItems,
      correctMapping,
      explanation: `Stability is determined by eigenvalues: negative real parts give asymptotic stability, positive real parts give instability, purely imaginary eigenvalues give neutral stability (centers).`,
      seed,
    };
  }

  private matchBifurcationsToNames(
    rng: () => number,
    seed: number
  ): MatchingQuestion {
    const selectedTypes = shuffle(rng, [...BIFURCATION_TYPES]);

    const leftItems = selectedTypes.map(t => `bifurcation:${t}`);
    const rightItems = shuffle(rng, selectedTypes.map(t => BIFURCATION_NAMES[t]));

    const correctMapping = selectedTypes.map(t =>
      rightItems.indexOf(BIFURCATION_NAMES[t])
    );

    return {
      id: generateId(),
      type: QuestionType.MATCHING,
      topic: Topic.PHASE_PORTRAITS,
      difficulty: Difficulty.MODERATE,
      prompt: 'Match each bifurcation diagram to its type:',
      leftItems,
      rightItems,
      correctMapping,
      explanation: `Each bifurcation type has a characteristic diagram: saddle-node shows creation/annihilation, transcritical shows exchange of stability, pitchfork shows symmetric branching.`,
      seed,
    };
  }

  private matchBifurcationsToEquations(
    rng: () => number,
    seed: number
  ): MatchingQuestion {
    const selectedTypes = shuffle(rng, [...BIFURCATION_TYPES]);

    const leftItems = selectedTypes.map(t => `bifurcation:${t}`);
    const rightItems = shuffle(rng, selectedTypes.map(t => BIFURCATION_EQUATIONS[t]));

    const correctMapping = selectedTypes.map(t =>
      rightItems.indexOf(BIFURCATION_EQUATIONS[t])
    );

    return {
      id: generateId(),
      type: QuestionType.MATCHING,
      topic: Topic.PHASE_PORTRAITS,
      difficulty: Difficulty.MODERATE,
      prompt: 'Match each bifurcation diagram to the normal form equation that produces it:',
      leftItems,
      rightItems,
      correctMapping,
      explanation: `The normal forms are: Saddle-node: $x' = r \\pm x^2$, Transcritical: $x' = rx - x^2$, Supercritical pitchfork: $x' = rx - x^3$, Subcritical pitchfork: $x' = rx + x^3$.`,
      seed,
    };
  }

  // NEW: Match phase portraits to 2D system equations (exam-style)
  private matchPortraitsToSystems(
    rng: () => number,
    seed: number
  ): MatchingQuestion {
    // Select 4 systems with different portrait types
    const shuffledSystems = shuffle(rng, [...SYSTEM_EQUATIONS]);
    const usedPortraits = new Set<PhasePortraitType>();
    const selectedSystems: typeof SYSTEM_EQUATIONS = [];

    for (const sys of shuffledSystems) {
      if (!usedPortraits.has(sys.portrait) && selectedSystems.length < 4) {
        selectedSystems.push(sys);
        usedPortraits.add(sys.portrait);
      }
    }

    // Left items are diagrams, right items are equations
    const leftItems = selectedSystems.map(s => `portrait:${s.portrait}`);
    const rightItems = shuffle(rng, selectedSystems.map(s => s.equation));

    const correctMapping = selectedSystems.map(s =>
      rightItems.indexOf(s.equation)
    );

    return {
      id: generateId(),
      type: QuestionType.MATCHING,
      topic: Topic.PHASE_PORTRAITS,
      difficulty: Difficulty.MODERATE,
      prompt: 'Match each phase portrait to the dynamical system that produces it:',
      leftItems,
      rightItems,
      correctMapping,
      explanation: selectedSystems.map(s =>
        `${PORTRAIT_NAMES[s.portrait]}: ${s.equation} — ${s.description}`
      ).join('\n\n'),
      seed,
    };
  }

  // NEW: Match bifurcation diagrams to their characteristics
  private matchBifurcationsToCharacteristics(
    rng: () => number,
    seed: number
  ): MatchingQuestion {
    const selectedTypes = shuffle(rng, [...BIFURCATION_TYPES]);

    const leftItems = selectedTypes.map(t => `bifurcation:${t}`);
    const rightItems = shuffle(rng, selectedTypes.map(t => BIFURCATION_CHARACTERISTICS[t]));

    const correctMapping = selectedTypes.map(t =>
      rightItems.indexOf(BIFURCATION_CHARACTERISTICS[t])
    );

    return {
      id: generateId(),
      type: QuestionType.MATCHING,
      topic: Topic.BIFURCATION_PITCHFORK,
      difficulty: Difficulty.MODERATE,
      prompt: 'Match each bifurcation diagram to the behavior it exhibits:',
      leftItems,
      rightItems,
      correctMapping,
      explanation: `Saddle-node: equilibria appear/disappear. Transcritical: equilibria exchange stability. Pitchfork: one equilibrium branches into three.`,
      seed,
    };
  }

  // NEW: Match system equations to eigenvalue descriptions
  private matchSystemsToDescriptions(
    rng: () => number,
    seed: number
  ): MatchingQuestion {
    // Select 4 systems with different portrait types
    const shuffledSystems = shuffle(rng, [...SYSTEM_EQUATIONS]);
    const usedPortraits = new Set<PhasePortraitType>();
    const selectedSystems: typeof SYSTEM_EQUATIONS = [];

    for (const sys of shuffledSystems) {
      if (!usedPortraits.has(sys.portrait) && selectedSystems.length < 4) {
        selectedSystems.push(sys);
        usedPortraits.add(sys.portrait);
      }
    }

    // Left items are equations, right items are descriptions
    const leftItems = selectedSystems.map(s => s.equation);
    const rightItems = shuffle(rng, selectedSystems.map(s => PORTRAIT_NAMES[s.portrait]));

    const correctMapping = selectedSystems.map(s =>
      rightItems.indexOf(PORTRAIT_NAMES[s.portrait])
    );

    return {
      id: generateId(),
      type: QuestionType.MATCHING,
      topic: Topic.EQUILIBRIUM_CLASSIFICATION,
      difficulty: Difficulty.MODERATE,
      prompt: 'Match each dynamical system to the type of equilibrium it has at the origin:',
      leftItems,
      rightItems,
      correctMapping,
      explanation: selectedSystems.map(s =>
        `${s.equation} → ${PORTRAIT_NAMES[s.portrait]} (${s.description})`
      ).join('\n\n'),
      seed,
    };
  }
}
