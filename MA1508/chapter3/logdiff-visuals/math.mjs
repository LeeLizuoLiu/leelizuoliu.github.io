// MA1508 Section 3.7 — logarithmic differentiation.
// Pure functions only: no DOM, no display rounding.

/**
 * y = product of base(x)^power.
 * ln y = sum power * ln(base), so y'/y = sum power * base'/base.
 * factors: [{base, derivative, power}]
 */
export function powerProductDerivative(factors, x) {
  if (!Array.isArray(factors) || factors.length === 0) throw new RangeError('Give at least one factor.');
  let value = 1;
  let logDerivative = 0;
  const terms = [];
  for (const f of factors) {
    const b = f.base(x);
    const d = f.derivative(x);
    if (!(b > 0)) throw new RangeError('Every base must be positive at this x.');
    value *= Math.pow(b, f.power);
    const term = f.power * d / b;
    logDerivative += term;
    terms.push({ power: f.power, base: b, derivative: d, term });
  }
  return { x, value, terms, logDerivative, derivative: value * logDerivative };
}

/**
 * y = u(x)^v(x) with u > 0. Taking logarithms gives ln y = v ln u, hence
 * y' = u^v * ( v' ln u + v u'/u ).
 */
export function variablePower(u, up, v, vp, x) {
  const base = u(x);
  const exponent = v(x);
  if (!(base > 0)) throw new RangeError('The base u(x) must be positive.');
  if (!Number.isFinite(exponent)) throw new RangeError('The exponent v(x) must be finite.');
  const value = Math.pow(base, exponent);
  const logDerivative = vp(x) * Math.log(base) + exponent * up(x) / base;
  return { x, base, exponent, value, logDerivative, derivative: value * logDerivative };
}

/** The two one-sided guesses for d/dx x^x, each of which is only half the answer. */
export function partialRules(x) {
  if (!(x > 0)) throw new RangeError('x must be positive.');
  const y = Math.pow(x, x);
  return {
    x,
    value: y,
    powerRule: x * Math.pow(x, x - 1),      // treats the exponent as constant
    exponentialRule: y * Math.log(x),        // treats the base as constant
    sum: x * Math.pow(x, x - 1) + y * Math.log(x),
    derivative: y * (Math.log(x) + 1),
  };
}

/** The stationary point of y = x^x is x = 1/e, where ln x + 1 = 0. */
export function criticalPoint() {
  return 1 / Math.E;
}

/** Value of x^x at its minimum, e^(-1/e). */
export function minimumValue() {
  return Math.pow(1 / Math.E, 1 / Math.E);
}

/** y = x^x, x > 0. */
export const xToTheX = x => {
  if (!(x > 0)) throw new RangeError('x must be positive.');
  return Math.pow(x, x);
};

/** d/dx x^x = x^x (ln x + 1). */
export const xToTheXDerivative = x => {
  if (!(x > 0)) throw new RangeError('x must be positive.');
  return Math.pow(x, x) * (Math.log(x) + 1);
};

/**
 * The lecture's quotient example, expanded by log laws:
 *   y = e^(x^2) * (x+1)^(1/3) / ( x (x^2+2)^2 )
 *   ln y = x^2 + (1/3) ln(x+1) - ln x - 2 ln(x^2+2)
 */
export function lectureQuotient(x) {
  if (!(x > 0)) throw new RangeError('x must be positive.');
  const y = Math.exp(x * x) * Math.cbrt(x + 1) / (x * Math.pow(x * x + 2, 2));
  const logDerivative =
    2 * x + 1 / (3 * (x + 1)) - 1 / x - 4 * x / (x * x + 2);
  return { x, value: y, logDerivative, derivative: y * logDerivative };
}

/**
 * A product of powers in the lecture's spirit:
 *   y = (x+1)^2 (x^2-1)^3, ln y = 2 ln(x+1) + 3 ln(x^2-1)
 */
export function lectureProduct(x) {
  if (!(x > 1)) throw new RangeError('x must exceed 1.');
  const y = Math.pow(x + 1, 2) * Math.pow(x * x - 1, 3);
  const logDerivative = 2 / (x + 1) + 6 * x / (x * x - 1);
  return { x, value: y, logDerivative, derivative: y * logDerivative };
}
