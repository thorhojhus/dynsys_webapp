import type { Polynomial, Term } from './polynomial';
import type { Matrix2x2 } from './matrix';

// Format a number, hiding 1 and -1 coefficients when appropriate
export function formatCoefficient(n: number, showOne = false, leadingSign = false): string {
  if (n === 0) return '0';

  const sign = n < 0 ? '-' : (leadingSign ? '+' : '');
  const absN = Math.abs(n);

  if (absN === 1 && !showOne) {
    return sign;
  }

  return leadingSign && n > 0 ? `+ ${absN}` : `${sign}${absN}`;
}

// Format a single term like "3x^2" or "-x"
export function formatTerm(term: Term, isFirst = false): string {
  const { coefficient, power } = term;

  if (coefficient === 0) return '';

  let coefStr: string;
  if (power === 0) {
    // Constant term - always show the number
    coefStr = isFirst ? `${coefficient}` : (coefficient > 0 ? `+ ${coefficient}` : `- ${Math.abs(coefficient)}`);
    return coefStr;
  }

  // Terms with x
  const absCoef = Math.abs(coefficient);
  const sign = coefficient < 0 ? '-' : (isFirst ? '' : '+');

  if (absCoef === 1) {
    coefStr = sign;
  } else {
    coefStr = isFirst ? `${coefficient}` : `${sign} ${absCoef}`;
  }

  const varPart = power === 1 ? 'x' : `x^{${power}}`;

  if (absCoef === 1) {
    return isFirst
      ? (coefficient < 0 ? `-${varPart}` : varPart)
      : ` ${sign} ${varPart}`;
  }

  return isFirst ? `${coefStr}${varPart}` : ` ${coefStr}${varPart}`;
}

// Format a polynomial as LaTeX
export function formatPolynomial(p: Polynomial): string {
  if (p.terms.length === 0) return '0';

  // Sort by power descending
  const sorted = [...p.terms].sort((a, b) => b.power - a.power);

  let result = '';
  sorted.forEach((term, i) => {
    const termStr = formatTerm(term, i === 0);
    if (termStr) result += termStr;
  });

  return result || '0';
}

// Format a 1D system x' = f(x)
export function format1DSystem(p: Polynomial): string {
  return `x' = ${formatPolynomial(p)}`;
}

// Format a 2x2 matrix as LaTeX
export function formatMatrix(m: Matrix2x2): string {
  return `\\begin{pmatrix} ${m[0][0]} & ${m[0][1]} \\\\ ${m[1][0]} & ${m[1][1]} \\end{pmatrix}`;
}

// Format a 2D linear system x' = Ax
export function format2DLinearSystem(m: Matrix2x2): string {
  const a = m[0][0], b = m[0][1], c = m[1][0], d = m[1][1];

  const formatLinear = (coef1: number, coef2: number, var1: string, var2: string): string => {
    const parts: string[] = [];

    if (coef1 !== 0) {
      if (coef1 === 1) parts.push(var1);
      else if (coef1 === -1) parts.push(`-${var1}`);
      else parts.push(`${coef1}${var1}`);
    }

    if (coef2 !== 0) {
      if (parts.length === 0) {
        if (coef2 === 1) parts.push(var2);
        else if (coef2 === -1) parts.push(`-${var2}`);
        else parts.push(`${coef2}${var2}`);
      } else {
        if (coef2 === 1) parts.push(`+ ${var2}`);
        else if (coef2 === -1) parts.push(`- ${var2}`);
        else if (coef2 > 0) parts.push(`+ ${coef2}${var2}`);
        else parts.push(`- ${Math.abs(coef2)}${var2}`);
      }
    }

    return parts.length > 0 ? parts.join(' ') : '0';
  };

  const xEq = formatLinear(a, b, 'x', 'y');
  const yEq = formatLinear(c, d, 'x', 'y');

  return `\\begin{cases} x' = ${xEq} \\\\ y' = ${yEq} \\end{cases}`;
}

// Format eigenvalues
export function formatEigenvalue(real: number, imag: number): string {
  if (Math.abs(imag) < 1e-10) {
    return `${real}`;
  }

  const imagSign = imag >= 0 ? '+' : '-';
  const imagAbs = Math.abs(imag);

  if (Math.abs(real) < 1e-10) {
    return imag > 0 ? `${imagAbs}i` : `-${imagAbs}i`;
  }

  return `${real} ${imagSign} ${imagAbs}i`;
}

// Format a simple number, rounding if needed
export function formatNumber(n: number, decimals = 2): string {
  if (Number.isInteger(n)) return `${n}`;
  return n.toFixed(decimals).replace(/\.?0+$/, '');
}

// Format bifurcation parameter system like x' = rx - x^3
export function formatBifurcationSystem(
  type: 'saddle_node' | 'transcritical' | 'pitchfork_super' | 'pitchfork_sub',
  params: { r?: string; a?: number; b?: number }
): string {
  const r = params.r ?? 'r';

  switch (type) {
    case 'saddle_node':
      return `x' = ${r} + x^2`;
    case 'transcritical':
      return `x' = ${r}x - x^2`;
    case 'pitchfork_super':
      return `x' = ${r}x - x^3`;
    case 'pitchfork_sub':
      return `x' = ${r}x + x^3`;
  }
}
