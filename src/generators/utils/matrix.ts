import { randomInt, randomChoice } from './random';

export type Matrix2x2 = [[number, number], [number, number]];

export function trace(m: Matrix2x2): number {
  return m[0][0] + m[1][1];
}

export function det(m: Matrix2x2): number {
  return m[0][0] * m[1][1] - m[0][1] * m[1][0];
}

export function multiply(a: Matrix2x2, b: Matrix2x2): Matrix2x2 {
  return [
    [
      a[0][0] * b[0][0] + a[0][1] * b[1][0],
      a[0][0] * b[0][1] + a[0][1] * b[1][1],
    ],
    [
      a[1][0] * b[0][0] + a[1][1] * b[1][0],
      a[1][0] * b[0][1] + a[1][1] * b[1][1],
    ],
  ];
}

export function inverse(m: Matrix2x2): Matrix2x2 {
  const d = det(m);
  if (Math.abs(d) < 1e-10) throw new Error('Matrix is singular');
  return [
    [m[1][1] / d, -m[0][1] / d],
    [-m[1][0] / d, m[0][0] / d],
  ];
}

export type EigenvalueType =
  | 'real_distinct_negative'    // stable node
  | 'real_distinct_positive'    // unstable node
  | 'real_distinct_mixed'       // saddle
  | 'real_repeated_negative'    // stable degenerate node
  | 'real_repeated_positive'    // unstable degenerate node
  | 'complex_negative_real'     // stable spiral
  | 'complex_positive_real'     // unstable spiral
  | 'pure_imaginary';           // center

export interface EigenvalueInfo {
  type: EigenvalueType;
  lambda1: { real: number; imag: number };
  lambda2: { real: number; imag: number };
}

export function classifyEigenvalues(m: Matrix2x2): EigenvalueInfo {
  const t = trace(m);
  const d = det(m);
  const discriminant = t * t - 4 * d;

  if (discriminant > 0) {
    // Real distinct eigenvalues
    const sqrtDisc = Math.sqrt(discriminant);
    const l1 = (t + sqrtDisc) / 2;
    const l2 = (t - sqrtDisc) / 2;

    let type: EigenvalueType;
    if (l1 < 0 && l2 < 0) type = 'real_distinct_negative';
    else if (l1 > 0 && l2 > 0) type = 'real_distinct_positive';
    else type = 'real_distinct_mixed';

    return {
      type,
      lambda1: { real: l1, imag: 0 },
      lambda2: { real: l2, imag: 0 },
    };
  } else if (discriminant < 0) {
    // Complex eigenvalues
    const realPart = t / 2;
    const imagPart = Math.sqrt(-discriminant) / 2;

    let type: EigenvalueType;
    if (Math.abs(realPart) < 1e-10) type = 'pure_imaginary';
    else if (realPart < 0) type = 'complex_negative_real';
    else type = 'complex_positive_real';

    return {
      type,
      lambda1: { real: realPart, imag: imagPart },
      lambda2: { real: realPart, imag: -imagPart },
    };
  } else {
    // Repeated eigenvalue
    const l = t / 2;
    return {
      type: l < 0 ? 'real_repeated_negative' : 'real_repeated_positive',
      lambda1: { real: l, imag: 0 },
      lambda2: { real: l, imag: 0 },
    };
  }
}

export function getEquilibriumName(type: EigenvalueType): string {
  switch (type) {
    case 'real_distinct_negative':
      return 'stable node';
    case 'real_distinct_positive':
      return 'unstable node';
    case 'real_distinct_mixed':
      return 'saddle';
    case 'real_repeated_negative':
      return 'stable degenerate node';
    case 'real_repeated_positive':
      return 'unstable degenerate node';
    case 'complex_negative_real':
      return 'stable spiral (focus)';
    case 'complex_positive_real':
      return 'unstable spiral (focus)';
    case 'pure_imaginary':
      return 'center';
  }
}

export function isStable(type: EigenvalueType): boolean {
  return (
    type === 'real_distinct_negative' ||
    type === 'real_repeated_negative' ||
    type === 'complex_negative_real'
  );
}

// Generate a 2x2 matrix with specific eigenvalue type
export function generateMatrixWithEigenvalues(
  targetType: EigenvalueType,
  rng: () => number
): Matrix2x2 {
  switch (targetType) {
    case 'real_distinct_negative': {
      const l1 = -randomInt(rng, 2, 4);
      const l2 = -randomInt(rng, 1, Math.abs(l1) - 1);
      return matrixFromRealEigenvalues(l1, l2, rng);
    }
    case 'real_distinct_positive': {
      const l1 = randomInt(rng, 1, 3);
      const l2 = randomInt(rng, l1 + 1, 4);
      return matrixFromRealEigenvalues(l1, l2, rng);
    }
    case 'real_distinct_mixed': {
      const l1 = randomInt(rng, 1, 3);
      const l2 = -randomInt(rng, 1, 3);
      return matrixFromRealEigenvalues(l1, l2, rng);
    }
    case 'real_repeated_negative': {
      const l = -randomInt(rng, 1, 3);
      return matrixFromRepeatedEigenvalue(l, rng);
    }
    case 'real_repeated_positive': {
      const l = randomInt(rng, 1, 3);
      return matrixFromRepeatedEigenvalue(l, rng);
    }
    case 'complex_negative_real': {
      const alpha = -randomInt(rng, 1, 2);
      const beta = randomInt(rng, 1, 3);
      return matrixFromComplexEigenvalues(alpha, beta);
    }
    case 'complex_positive_real': {
      const alpha = randomInt(rng, 1, 2);
      const beta = randomInt(rng, 1, 3);
      return matrixFromComplexEigenvalues(alpha, beta);
    }
    case 'pure_imaginary': {
      const beta = randomInt(rng, 1, 3);
      return matrixFromComplexEigenvalues(0, beta);
    }
  }
}

function matrixFromRealEigenvalues(l1: number, l2: number, rng: () => number): Matrix2x2 {
  // Simple diagonal or near-diagonal form for nice numbers
  const useSimple = rng() > 0.5;

  if (useSimple) {
    // Diagonal matrix
    return [[l1, 0], [0, l2]];
  }

  // Upper triangular with small off-diagonal
  const offDiag = randomChoice(rng, [-1, 1, 2, -2]);
  return [[l1, offDiag], [0, l2]];
}

function matrixFromRepeatedEigenvalue(l: number, rng: () => number): Matrix2x2 {
  // Can be diagonal (star node) or with Jordan block (degenerate node)
  const isDiagonal = rng() > 0.5;

  if (isDiagonal) {
    return [[l, 0], [0, l]];
  }

  // Jordan form
  return [[l, 1], [0, l]];
}

function matrixFromComplexEigenvalues(alpha: number, beta: number): Matrix2x2 {
  // Standard form for complex eigenvalues alpha +/- i*beta
  return [
    [alpha, -beta],
    [beta, alpha],
  ];
}

export function generateRandomMatrix(rng: () => number): Matrix2x2 {
  const types: EigenvalueType[] = [
    'real_distinct_negative',
    'real_distinct_positive',
    'real_distinct_mixed',
    'complex_negative_real',
    'complex_positive_real',
    'pure_imaginary',
  ];
  const type = randomChoice(rng, types);
  return generateMatrixWithEigenvalues(type, rng);
}
