import {
  QuestionType,
  Topic,
  Difficulty,
  type MultipleChoiceQuestion,
  type TrueFalseQuestion,
  type Question,
  type BifurcationDiagramType,
} from '@/types/question';
import { BaseGenerator, type GeneratorConfig } from '../types';
import {
  createRng,
  randomChoice,
  generateId,
  shuffle,
  randomInt,
} from '../utils/random';

type BifurcationType = BifurcationDiagramType;

interface BifurcationTemplate {
  type: BifurcationType;
  latex: (params: Record<string, number>) => string;
  bifurcationValue: (params: Record<string, number>) => number;
  description: string;
}

const TEMPLATES: BifurcationTemplate[] = [
  // Saddle-node: x' = r + x^2
  {
    type: 'saddle_node',
    latex: (p) => `x' = ${p.r >= 0 ? '' : '-'}${Math.abs(p.r)} + x^2`,
    bifurcationValue: () => 0,
    description: 'saddle-node bifurcation',
  },
  // Saddle-node: x' = r - x^2
  {
    type: 'saddle_node',
    latex: (p) => `x' = ${p.r >= 0 ? '' : '-'}${Math.abs(p.r)} - x^2`,
    bifurcationValue: () => 0,
    description: 'saddle-node bifurcation',
  },
  // Transcritical: x' = rx - x^2
  {
    type: 'transcritical',
    latex: (p) => `x' = ${p.r === 1 ? '' : p.r === -1 ? '-' : p.r}rx - x^2`,
    bifurcationValue: () => 0,
    description: 'transcritical bifurcation',
  },
  // Supercritical pitchfork: x' = rx - x^3
  {
    type: 'pitchfork_super',
    latex: (p) => `x' = ${p.r === 1 ? '' : p.r === -1 ? '-' : p.r}rx - x^3`,
    bifurcationValue: () => 0,
    description: 'supercritical pitchfork bifurcation',
  },
  // Subcritical pitchfork: x' = rx + x^3
  {
    type: 'pitchfork_sub',
    latex: (p) => `x' = ${p.r === 1 ? '' : p.r === -1 ? '-' : p.r}rx + x^3`,
    bifurcationValue: () => 0,
    description: 'subcritical pitchfork bifurcation',
  },
];

export class BifurcationGenerator extends BaseGenerator {
  topics = [
    Topic.BIFURCATION_SADDLE_NODE,
    Topic.BIFURCATION_TRANSCRITICAL,
    Topic.BIFURCATION_PITCHFORK,
  ];
  types = [QuestionType.MULTIPLE_CHOICE, QuestionType.TRUE_FALSE];
  difficulties = [Difficulty.LIGHT, Difficulty.MODERATE];

  generate(config: GeneratorConfig): Question {
    const seed = config.seed ?? Math.floor(Math.random() * 2147483647);
    const rng = createRng(seed);

    if (config.type === QuestionType.TRUE_FALSE) {
      return this.generateTrueFalse(rng, config.topic, seed);
    }

    const variants = [
      this.questionIdentifyType,
      this.questionBifurcationValue,
      this.questionEquilibriaCount,
      this.questionStabilityChange,
      this.questionIdentifyFromDiagram,
      this.questionDiagramToEquation,
    ];

    const variant = randomChoice(rng, variants);
    return variant.call(this, rng, config.topic, seed);
  }

  private getTemplatesForTopic(topic: Topic): BifurcationTemplate[] {
    switch (topic) {
      case Topic.BIFURCATION_SADDLE_NODE:
        return TEMPLATES.filter((t) => t.type === 'saddle_node');
      case Topic.BIFURCATION_TRANSCRITICAL:
        return TEMPLATES.filter((t) => t.type === 'transcritical');
      case Topic.BIFURCATION_PITCHFORK:
        return TEMPLATES.filter((t) => t.type.startsWith('pitchfork'));
      default:
        return TEMPLATES;
    }
  }

  private questionIdentifyType(
    rng: () => number,
    topic: Topic,
    seed: number
  ): MultipleChoiceQuestion {
    // Pick a random template (possibly from all types for variety)
    const template = randomChoice(rng, TEMPLATES);
    const params = { r: randomChoice(rng, [-2, -1, 1, 2]) };

    // For display, show generic form
    const systemLatex = this.getGenericForm(template.type);

    const options = [
      'Saddle-node',
      'Transcritical',
      'Supercritical pitchfork',
      'Subcritical pitchfork',
    ];

    const correctAnswer = this.getTypeName(template.type);
    const correctIndex = options.indexOf(correctAnswer);

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: topic,
      difficulty: Difficulty.MODERATE,
      prompt: `Identify the bifurcation type for the system:\n$$${systemLatex}$$`,
      options,
      correctIndex,
      explanation: this.getExplanation(template.type),
      seed,
    };
  }

  private questionBifurcationValue(
    rng: () => number,
    topic: Topic,
    seed: number
  ): MultipleChoiceQuestion {
    const templates = this.getTemplatesForTopic(topic);
    const template = randomChoice(rng, templates);
    const params = { r: 0 };

    const systemLatex = this.getGenericForm(template.type);
    const bifValue = template.bifurcationValue(params);

    const options = shuffle(rng, [
      `$r = ${bifValue}$`,
      `$r = ${bifValue + 1}$`,
      `$r = ${bifValue - 1}$`,
      `$r = ${bifValue + 2}$`,
    ]);
    const correctIndex = options.indexOf(`$r = ${bifValue}$`);

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: topic,
      difficulty: Difficulty.LIGHT,
      prompt: `At what value of $r$ does the bifurcation occur in the system:\n$$${systemLatex}$$`,
      options,
      correctIndex,
      explanation: `The bifurcation occurs when the equilibrium becomes non-hyperbolic, i.e., when the derivative at the equilibrium is zero. For this system, this happens at $r = ${bifValue}$.`,
      seed,
    };
  }

  private questionEquilibriaCount(
    rng: () => number,
    topic: Topic,
    seed: number
  ): MultipleChoiceQuestion {
    const templates = this.getTemplatesForTopic(topic);
    const template = randomChoice(rng, templates);
    const systemLatex = this.getGenericForm(template.type);

    // Ask about equilibria count for r > 0 or r < 0
    const rSign = randomChoice(rng, ['positive', 'negative']);

    let correctCount: number;
    switch (template.type) {
      case 'saddle_node':
        // x' = r + x^2: 0 equilibria for r > 0, 2 for r < 0
        // x' = r - x^2: 2 equilibria for r > 0, 0 for r < 0
        correctCount = rSign === 'positive' ? 0 : 2;
        break;
      case 'transcritical':
        // Always 2 equilibria (x=0 and x=r)
        correctCount = 2;
        break;
      case 'pitchfork_super':
      case 'pitchfork_sub':
        // 1 equilibrium for r < 0, 3 for r > 0 (supercritical)
        // 3 equilibria for r < 0, 1 for r > 0 (subcritical)
        if (template.type === 'pitchfork_super') {
          correctCount = rSign === 'positive' ? 3 : 1;
        } else {
          correctCount = rSign === 'positive' ? 1 : 3;
        }
        break;
      default:
        correctCount = 1;
    }

    const options = ['0', '1', '2', '3'];
    const correctIndex = options.indexOf(String(correctCount));

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: topic,
      difficulty: Difficulty.MODERATE,
      prompt: `For the system $${systemLatex}$, how many equilibrium points exist when $r ${rSign === 'positive' ? '> 0' : '< 0'}$?`,
      options,
      correctIndex,
      explanation: `For ${rSign} $r$, solving $f(x, r) = 0$ gives ${correctCount} equilibri${correctCount === 1 ? 'um' : 'a'}.`,
      seed,
    };
  }

  private questionStabilityChange(
    rng: () => number,
    topic: Topic,
    seed: number
  ): MultipleChoiceQuestion {
    const templates = this.getTemplatesForTopic(topic);
    const template = randomChoice(rng, templates);
    const systemLatex = this.getGenericForm(template.type);

    const options = [
      'The equilibrium changes from stable to unstable',
      'The equilibrium changes from unstable to stable',
      'Two equilibria exchange stability',
      'The equilibrium remains stable throughout',
    ];

    let correctIndex: number;
    switch (template.type) {
      case 'saddle_node':
        correctIndex = 0; // Generic - equilibria disappear
        break;
      case 'transcritical':
        correctIndex = 2; // Exchange stability
        break;
      case 'pitchfork_super':
        correctIndex = 0; // Origin loses stability
        break;
      case 'pitchfork_sub':
        correctIndex = 1; // Origin gains stability (in reverse direction)
        break;
      default:
        correctIndex = 0;
    }

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: topic,
      difficulty: Difficulty.MODERATE,
      prompt: `What happens to the stability of equilibria as $r$ increases through 0 in the system:\n$$${systemLatex}$$`,
      options,
      correctIndex,
      explanation: this.getStabilityExplanation(template.type),
      seed,
    };
  }

  // NEW: Show a bifurcation diagram and ask to identify the type
  private questionIdentifyFromDiagram(
    rng: () => number,
    topic: Topic,
    seed: number
  ): MultipleChoiceQuestion {
    const allTypes: BifurcationType[] = ['saddle_node', 'transcritical', 'pitchfork_super', 'pitchfork_sub'];
    const type = randomChoice(rng, allTypes);

    const options = [
      'Saddle-node',
      'Transcritical',
      'Supercritical pitchfork',
      'Subcritical pitchfork',
    ];

    const correctAnswer = this.getTypeName(type);
    const correctIndex = options.indexOf(correctAnswer);

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: topic,
      difficulty: Difficulty.LIGHT,
      prompt: `Identify the type of bifurcation shown in the diagram below:`,
      options,
      correctIndex,
      explanation: this.getExplanation(type),
      seed,
      diagram: {
        type: 'bifurcation',
        bifurcationType: type,
      },
    };
  }

  // NEW: Show diagram and ask which equation matches
  private questionDiagramToEquation(
    rng: () => number,
    topic: Topic,
    seed: number
  ): MultipleChoiceQuestion {
    const allTypes: BifurcationType[] = ['saddle_node', 'transcritical', 'pitchfork_super', 'pitchfork_sub'];
    const type = randomChoice(rng, allTypes);

    const equations = {
      saddle_node: "$x' = r + x^2$",
      transcritical: "$x' = rx - x^2$",
      pitchfork_super: "$x' = rx - x^3$",
      pitchfork_sub: "$x' = rx + x^3$",
    };

    const correctAnswer = equations[type];
    const options = shuffle(rng, Object.values(equations));
    const correctIndex = options.indexOf(correctAnswer);

    return {
      id: generateId(),
      type: QuestionType.MULTIPLE_CHOICE,
      topic: topic,
      difficulty: Difficulty.MODERATE,
      prompt: `Which equation produces the bifurcation diagram shown below?`,
      options,
      correctIndex,
      explanation: `This is a ${this.getTypeName(type)} bifurcation. ${this.getExplanation(type)}`,
      seed,
      diagram: {
        type: 'bifurcation',
        bifurcationType: type,
      },
    };
  }

  private generateTrueFalse(
    rng: () => number,
    topic: Topic,
    seed: number
  ): TrueFalseQuestion {
    const statements = [
      {
        prompt: 'In a saddle-node bifurcation, two equilibria collide and annihilate.',
        correct: true,
        topic: Topic.BIFURCATION_SADDLE_NODE,
      },
      {
        prompt: 'A transcritical bifurcation changes the total number of equilibria.',
        correct: false,
        topic: Topic.BIFURCATION_TRANSCRITICAL,
      },
      {
        prompt: 'In a supercritical pitchfork, the new equilibria that appear are stable.',
        correct: true,
        topic: Topic.BIFURCATION_PITCHFORK,
      },
      {
        prompt: 'A pitchfork bifurcation requires symmetry in the system.',
        correct: true,
        topic: Topic.BIFURCATION_PITCHFORK,
      },
      {
        prompt: 'At a transcritical bifurcation, two equilibria exchange stability.',
        correct: true,
        topic: Topic.BIFURCATION_TRANSCRITICAL,
      },
      {
        prompt: 'In a subcritical pitchfork, the bifurcating equilibria are unstable.',
        correct: true,
        topic: Topic.BIFURCATION_PITCHFORK,
      },
    ];

    // Filter to relevant topic or pick any
    const relevant = statements.filter((s) => s.topic === topic || topic === Topic.BIFURCATION_PITCHFORK);
    const statement = randomChoice(rng, relevant.length > 0 ? relevant : statements);

    return {
      id: generateId(),
      type: QuestionType.TRUE_FALSE,
      topic: statement.topic,
      difficulty: Difficulty.CONCEPTUAL,
      prompt: statement.prompt,
      correctAnswer: statement.correct,
      explanation: `This statement is ${statement.correct ? 'TRUE' : 'FALSE'}. ${this.getExplanation(
        statement.topic === Topic.BIFURCATION_SADDLE_NODE
          ? 'saddle_node'
          : statement.topic === Topic.BIFURCATION_TRANSCRITICAL
          ? 'transcritical'
          : 'pitchfork_super'
      )}`,
      seed,
    };
  }

  private getGenericForm(type: BifurcationType): string {
    switch (type) {
      case 'saddle_node':
        return "x' = r + x^2";
      case 'transcritical':
        return "x' = rx - x^2";
      case 'pitchfork_super':
        return "x' = rx - x^3";
      case 'pitchfork_sub':
        return "x' = rx + x^3";
    }
  }

  private getTypeName(type: BifurcationType): string {
    switch (type) {
      case 'saddle_node':
        return 'Saddle-node';
      case 'transcritical':
        return 'Transcritical';
      case 'pitchfork_super':
        return 'Supercritical pitchfork';
      case 'pitchfork_sub':
        return 'Subcritical pitchfork';
    }
  }

  private getExplanation(type: BifurcationType): string {
    switch (type) {
      case 'saddle_node':
        return 'In a saddle-node bifurcation, a stable and unstable equilibrium collide and annihilate (or appear) as the parameter crosses the bifurcation value. The normal form is $x\' = r \\pm x^2$.';
      case 'transcritical':
        return 'In a transcritical bifurcation, two equilibria exchange stability as they pass through each other. The normal form is $x\' = rx - x^2$. The total number of equilibria remains constant.';
      case 'pitchfork_super':
        return 'In a supercritical pitchfork, the origin loses stability at $r=0$ and two new stable equilibria emerge. The normal form is $x\' = rx - x^3$. Requires odd symmetry.';
      case 'pitchfork_sub':
        return 'In a subcritical pitchfork, unstable equilibria exist for $r<0$ and collide with the origin at $r=0$, making it unstable for $r>0$. The normal form is $x\' = rx + x^3$.';
    }
  }

  private getStabilityExplanation(type: BifurcationType): string {
    switch (type) {
      case 'saddle_node':
        return 'For $r < 0$: two equilibria exist (one stable, one unstable). At $r = 0$: they collide. For $r > 0$: no equilibria exist.';
      case 'transcritical':
        return 'The equilibrium at $x=0$ changes from stable ($r<0$) to unstable ($r>0$), while the equilibrium at $x=r$ does the opposite.';
      case 'pitchfork_super':
        return 'The origin is stable for $r<0$ and becomes unstable for $r>0$. Two new stable equilibria at $x = \\pm\\sqrt{r}$ appear for $r>0$.';
      case 'pitchfork_sub':
        return 'For $r<0$: origin is stable, two unstable equilibria exist at $x = \\pm\\sqrt{-r}$. At $r=0$: they collide with origin. For $r>0$: origin is unstable.';
    }
  }
}
