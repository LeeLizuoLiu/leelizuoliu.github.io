// MA1508 Section 3.9 — linear approximation and Taylor polynomials.
// Pure functions only: no DOM, no display rounding.

/** The linearization of f at a, returned as a function of x. */
export function linearize(f, fp, a) {
  const fa = f(a);
  const fpa = fp(a);
  if (!Number.isFinite(fa) || !Number.isFinite(fpa)) throw new RangeError('f or f\' is not finite at a.');
  return x => fa + fpa * (x - a);
}

/** L(a), L(x), the true value, and the signed error true - L. */
export function linearizationState(f, fp, a, x) {
  const fa = f(a);
  const fpa = fp(a);
  if (!Number.isFinite(fa) || !Number.isFinite(fpa)) throw new RangeError('f or f\' is not finite at a.');
  const L = fa + fpa * (x - a);
  const actual = f(x);
  return {
    a, x, fa, fpa, L, actual,
    error: actual - L,
    relativeError: actual === 0 ? null : Math.abs((actual - L) / actual),
    // the tangent line, written out for display
    tangentSlope: fpa,
    tangentIntercept: fa - fpa * a,
  };
}

/**
 * The Taylor polynomial of degree n built from the values of f and its
 * derivatives at a: derivatives[k] = f^(k)(a).
 */
export function taylor(derivatives, a, x, n) {
  if (!Array.isArray(derivatives) || derivatives.length === 0) throw new RangeError('Give the derivative values.');
  if (n < 0) throw new RangeError('The degree must be non-negative.');
  let sum = 0;
  let factorial = 1;
  for (let k = 0; k <= n; k++) {
    if (k > 0) factorial *= k;
    const dk = derivatives[k];
    if (dk === undefined) throw new RangeError(`Missing f^(${k})(a).`);
    sum += dk / factorial * Math.pow(x - a, k);
  }
  return sum;
}

/** cos at a = 0: f = [1, 0, -1, 0, 1, ...] so T1 = 1 and T2 = T3 = 1 - x^2/2. */
export function cosTaylor(x, n) {
  const derivatives = [1, 0, -1, 0, 1, 0, -1, 0];
  return taylor(derivatives, 0, x, n);
}

/** A safe upper bound for the error of the linearization on [a, x]. */
export function errorBound(fpp, a, x, samples = 400) {
  const lo = Math.min(a, x);
  const hi = Math.max(a, x);
  let peak = 0;
  for (let i = 0; i <= samples; i++) {
    const t = lo + (hi - lo) * i / samples;
    peak = Math.max(peak, Math.abs(fpp(t)));
  }
  return peak / 2 * (x - a) ** 2;
}

/* ------------------------------------------------------------------ */
/* The lecture's worked applications, with exact reference values.     */
/* ------------------------------------------------------------------ */

export const cube = x => x ** 3;
export const cubePrime = x => 3 * x * x;
export const expFn = x => Math.exp(x);
export const expPrime = x => Math.exp(x);
export const sqrt = x => Math.sqrt(x);
export const sqrtPrime = x => 1 / (2 * Math.sqrt(x));
export const cbrt = x => Math.cbrt(x);
export const cbrtPrime = x => 1 / (3 * Math.cbrt(x) ** 2);

/** The lecture's g: g(2) = -4 and g'(x) = sqrt(x^2 + 5). */
export function gAntiderivative(x) {
  const base = x / 2 * Math.sqrt(x * x + 5) + 2.5 * Math.log(x + Math.sqrt(x * x + 5));
  const atTwo = 2 / 2 * Math.sqrt(4 + 5) + 2.5 * Math.log(2 + Math.sqrt(4 + 5));
  return base - atTwo - 4; // fixes g(2) = -4
}

export const gPrime = x => Math.sqrt(x * x + 5);
export const gSecond = x => x / Math.sqrt(x * x + 5);

/** Named approximations from the lecture, each with its exact companion. */
export const applications = [
  { id: 'cube', label: '(0.99)^3', f: cube, fp: cubePrime, a: 1, x: 0.99 },
  { id: 'exp', label: 'e^(-0.01)', f: expFn, fp: expPrime, a: 0, x: -0.01 },
  { id: 'sqrt', label: 'sqrt(4.01)', f: sqrt, fp: sqrtPrime, a: 4, x: 4.01 },
  { id: 'cbrtNear', label: 'cuberoot(8.05)', f: cbrt, fp: cbrtPrime, a: 8, x: 8.05 },
  { id: 'cbrtFar', label: 'cuberoot(25)', f: cbrt, fp: cbrtPrime, a: 8, x: 25 },
];

export function applicationState(id) {
  const app = applications.find(e => e.id === id);
  if (!app) throw new RangeError(`Unknown application "${id}".`);
  return { ...app, ...linearizationState(app.f, app.fp, app.a, app.x) };
}
