export enum QuestionType {
  TRUE_FALSE = 'true_false',
  MULTIPLE_CHOICE = 'multiple_choice',
  MATCHING = 'matching',
  CLASSIFICATION = 'classification',
}

export enum Topic {
  STABILITY_1D = 'stability_1d',
  LINEAR_SYSTEMS_2D = 'linear_systems_2d',
  EQUILIBRIUM_CLASSIFICATION = 'equilibrium_classification',
  BIFURCATION_SADDLE_NODE = 'bifurcation_saddle_node',
  BIFURCATION_TRANSCRITICAL = 'bifurcation_transcritical',
  BIFURCATION_PITCHFORK = 'bifurcation_pitchfork',
  BIFURCATION_HOPF = 'bifurcation_hopf',
  CENTER_MANIFOLD = 'center_manifold',
  INVARIANT_MANIFOLDS = 'invariant_manifolds',
  PHASE_PORTRAITS = 'phase_portraits',
  TOPOLOGICAL_INDEX = 'topological_index',
  LYAPUNOV_FUNCTIONS = 'lyapunov_functions',
  HAMILTONIAN_SYSTEMS = 'hamiltonian_systems',
}

export enum Difficulty {
  CONCEPTUAL = 'conceptual',
  LIGHT = 'light',
  MODERATE = 'moderate',
  HEAVY = 'heavy',
}

// Diagram types for visual questions
export type PhasePortraitType =
  | 'stable_node'
  | 'unstable_node'
  | 'saddle'
  | 'stable_spiral'
  | 'unstable_spiral'
  | 'center';

export type BifurcationDiagramType =
  | 'saddle_node'
  | 'transcritical'
  | 'pitchfork_super'
  | 'pitchfork_sub';

export interface DiagramData {
  type: 'phase_portrait' | 'bifurcation';
  portraitType?: PhasePortraitType;
  bifurcationType?: BifurcationDiagramType;
}

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  topic: Topic;
  difficulty: Difficulty;
  prompt: string;
  explanation: string;
  seed?: number;
  diagram?: DiagramData;
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: QuestionType.TRUE_FALSE;
  correctAnswer: boolean;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: QuestionType.MULTIPLE_CHOICE;
  options: string[];
  correctIndex: number;
}

export interface MatchingQuestion extends BaseQuestion {
  type: QuestionType.MATCHING;
  leftItems: string[];
  rightItems: string[];
  correctMapping: number[];
}

export interface ClassificationQuestion extends BaseQuestion {
  type: QuestionType.CLASSIFICATION;
  items: string[];
  categories: string[];
  correctCategories: number[];
}

export type Question =
  | TrueFalseQuestion
  | MultipleChoiceQuestion
  | MatchingQuestion
  | ClassificationQuestion;

export const TOPIC_LABELS: Record<Topic, string> = {
  [Topic.STABILITY_1D]: '1D Stability',
  [Topic.LINEAR_SYSTEMS_2D]: '2D Linear Systems',
  [Topic.EQUILIBRIUM_CLASSIFICATION]: 'Equilibrium Classification',
  [Topic.BIFURCATION_SADDLE_NODE]: 'Saddle-Node Bifurcation',
  [Topic.BIFURCATION_TRANSCRITICAL]: 'Transcritical Bifurcation',
  [Topic.BIFURCATION_PITCHFORK]: 'Pitchfork Bifurcation',
  [Topic.BIFURCATION_HOPF]: 'Hopf Bifurcation',
  [Topic.CENTER_MANIFOLD]: 'Center Manifold',
  [Topic.INVARIANT_MANIFOLDS]: 'Invariant Manifolds',
  [Topic.PHASE_PORTRAITS]: 'Phase Portraits',
  [Topic.TOPOLOGICAL_INDEX]: 'Topological Index',
  [Topic.LYAPUNOV_FUNCTIONS]: 'Lyapunov Functions',
  [Topic.HAMILTONIAN_SYSTEMS]: 'Hamiltonian Systems',
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  [Difficulty.CONCEPTUAL]: 'Conceptual',
  [Difficulty.LIGHT]: 'Light',
  [Difficulty.MODERATE]: 'Moderate',
  [Difficulty.HEAVY]: 'Heavy',
};

export const TOPIC_GROUPS = {
  'Stability & Equilibria': [
    Topic.STABILITY_1D,
    Topic.LINEAR_SYSTEMS_2D,
    Topic.EQUILIBRIUM_CLASSIFICATION,
  ],
  'Bifurcations': [
    Topic.BIFURCATION_SADDLE_NODE,
    Topic.BIFURCATION_TRANSCRITICAL,
    Topic.BIFURCATION_PITCHFORK,
    Topic.BIFURCATION_HOPF,
  ],
  'Manifolds & Topology': [
    Topic.CENTER_MANIFOLD,
    Topic.INVARIANT_MANIFOLDS,
    Topic.TOPOLOGICAL_INDEX,
  ],
  'Other Topics': [
    Topic.PHASE_PORTRAITS,
    Topic.LYAPUNOV_FUNCTIONS,
    Topic.HAMILTONIAN_SYSTEMS,
  ],
};
