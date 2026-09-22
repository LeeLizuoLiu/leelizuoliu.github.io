// MA1508 Section 3.6 — derivatives of logarithmic functions.
// Pure functions only: no DOM, no display rounding.

export const E = Math.E;

/** ln(x + h) - ln(x), computed as ln(1 + h/x) so that tiny h does not cancel. */
export function logDifference(x, h) {
  if (!Number.isFinite(x) || x <= 0) throw new RangeError('x must be a positive number.');
  if (!Number.isFinite(h)) throw new RangeError('Use a finite increment h.');
  if (x + h <= 0) throw new RangeError('x + h must stay positive.');
  return Math.log1p(h / x);
}

/**
 * State for the secant-to-tangent picture of y = ln x at x.
 * `secant` is null exactly at h = 0, where the difference quotient is undefined.
 */
export function lnSecant(x, h) {
  if (!Number.isFinite(x) || x <= 0) throw new RangeError('x must be a positive number.');
  if (!Number.isFinite(h)) throw new RangeError('Use a finite increment h.');
  if (x + h <= 0) throw new RangeError('x + h must stay positive.');
  const value = Math.log(x);
  const shifted = Math.log(x + h);
  const secant = h === 0 ? null : logDifference(x, h) / h;
  const tangent = 1 / x;
  const linear = value + h / x; // ln x + h * (1/x)
  return {
    x, h, value, shifted,
    secant, tangent, linear,
    error: shifted - linear,
    ratio: secant === null ? null : secant / tangent,
  };
}

function checkBase(a) {
  if (!Number.isFinite(a) || a <= 0) throw new RangeError('The base a must be positive.');
  if (a === 1) throw new RangeError('The base a cannot be 1.');
}

function checkPositive(x) {
  if (!Number.isFinite(x) || x <= 0) throw new RangeError('x must be a positive number.');
}

/** log_a(x) = ln x / ln a. */
export function logBase(a, x) {
  checkBase(a); checkPositive(x);
  return Math.log(x) / Math.log(a);
}

/** d/dx log_a(x) = 1 / (x ln a). */
export function logBaseDerivative(a, x) {
  checkBase(a); checkPositive(x);
  return 1 / (x * Math.log(a));
}

/** The slope of y = log_a x at x = 1 is 1 / ln a. */
export function slopeAtOne(a) {
  checkBase(a);
  return 1 / Math.log(a);
}

/** The base whose logarithm has slope exactly 1 at x = 1 is e. */
export function baseForUnitSlope() {
  return E;
}

/** d/dx ln(g(x)) = g'(x) / g(x), the chain rule with the logarithm outside. */
export function lnChain(g, gp, x) {
  const gx = g(x);
  if (!(gx > 0)) throw new RangeError('g(x) must be positive for ln(g(x)).');
  return { x, gx, gp: gp(x), derivative: gp(x) / gx };
}

/** Convenience: the error of the linear approximation ln x + h/x, in units of h^2. */
export function curvatureScale(x) {
  checkPositive(x);
  return -1 / (2 * x * x);
}
