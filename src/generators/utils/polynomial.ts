// Polynomial utilities for 1D dynamical systems

export interface Term {
  coefficient: number;
  power: number;
}

export interface Polynomial {
  terms: Term[];
}

export function evaluatePolynomial(p: Polynomial, x: number): number {
  return p.terms.reduce((sum, term) => sum + term.coefficient * Math.pow(x, term.power), 0);
}

export function derivativePolynomial(p: Polynomial): Polynomial {
  const terms = p.terms
    .filter(t => t.power > 0)
    .map(t => ({ coefficient: t.coefficient * t.power, power: t.power - 1 }));
  return { terms: terms.length > 0 ? terms : [{ coefficient: 0, power: 0 }] };
}

// Find roots of simple polynomials numerically using Newton's method
export function findRoots(p: Polynomial, searchRange: [number, number] = [-10, 10], tolerance = 1e-8): number[] {
  const roots: number[] = [];
  const [min, max] = searchRange;
  const step = 0.5;
  const dp = derivativePolynomial(p);

  for (let x0 = min; x0 <= max; x0 += step) {
    let x = x0;
    for (let i = 0; i < 50; i++) {
      const fx = evaluatePolynomial(p, x);
      const dfx = evaluatePolynomial(dp, x);
      if (Math.abs(dfx) < 1e-12) break;
      const xNew = x - fx / dfx;
      if (Math.abs(xNew - x) < tolerance) {
        // Check if this root is new
        const isNew = !roots.some(r => Math.abs(r - xNew) < 0.01);
        if (isNew && Math.abs(evaluatePolynomial(p, xNew)) < 1e-6) {
          roots.push(Math.round(xNew * 1000) / 1000);
        }
        break;
      }
      x = xNew;
    }
  }

  return roots.sort((a, b) => a - b);
}

// Analyze stability at an equilibrium point for x' = f(x)
export function analyzeStability1D(p: Polynomial, x0: number): 'stable' | 'unstable' | 'semistable' {
  const dp = derivativePolynomial(p);
  const derivative = evaluatePolynomial(dp, x0);

  if (Math.abs(derivative) > 1e-8) {
    return derivative < 0 ? 'stable' : 'unstable';
  }

  // Non-hyperbolic case - check higher derivatives
  // For simplicity, return semistable (needs more sophisticated analysis)
  return 'semistable';
}

// Count stable equilibria
export function countStableEquilibria(p: Polynomial): number {
  const roots = findRoots(p);
  return roots.filter(r => analyzeStability1D(p, r) === 'stable').length;
}

// Simple polynomial types for generation
export type SimplePolynomialType =
  | 'linear'        // ax
  | 'quadratic'     // ax^2 + bx + c
  | 'cubic_simple'  // ax^3 + bx
  | 'power';        // ax^n

export function generateSimplePolynomial(
  type: SimplePolynomialType,
  params: { a: number; b?: number; c?: number; n?: number }
): Polynomial {
  switch (type) {
    case 'linear':
      return { terms: [{ coefficient: params.a, power: 1 }] };
    case 'quadratic':
      return {
        terms: [
          { coefficient: params.a, power: 2 },
          { coefficient: params.b ?? 0, power: 1 },
          { coefficient: params.c ?? 0, power: 0 },
        ].filter(t => t.coefficient !== 0),
      };
    case 'cubic_simple':
      return {
        terms: [
          { coefficient: params.a, power: 3 },
          { coefficient: params.b ?? 0, power: 1 },
        ].filter(t => t.coefficient !== 0),
      };
    case 'power':
      return { terms: [{ coefficient: params.a, power: params.n ?? 2 }] };
  }
}
