// MA1508 Section 3.8 — rates of change for rectilinear motion.
// s(t) = t^3 - 6t^2 + 9t + 2, the lecture's position function.
// Pure functions only: no DOM, no display rounding.

/** Position, in metres, at time t seconds. */
export const position = t => t ** 3 - 6 * t * t + 9 * t + 2;

/** Velocity v(t) = s'(t) = 3(t-1)(t-3). */
export const velocity = t => 3 * t * t - 12 * t + 9;

/** Acceleration a(t) = v'(t) = s''(t) = 6(t-2). */
export const acceleration = t => 6 * t - 12;

const EPS = 1e-12;

/** Everything the lesson reports at one instant. */
export function motionState(t) {
  if (!Number.isFinite(t)) throw new RangeError('Use a finite time t.');
  const s = position(t);
  const v = velocity(t);
  const a = acceleration(t);
  let direction;
  if (Math.abs(v) < EPS) direction = 'at rest';
  else direction = v > 0 ? 'forward' : 'backward';

  // Speeding up means |v| is increasing, that is v and a share a sign.
  let change;
  if (Math.abs(v) < EPS) change = 'momentarily at rest';
  else if (Math.abs(a) < EPS) change = 'neither speeding up nor slowing down';
  else if (v * a > 0) change = 'speeding up';
  else change = 'slowing down';

  return { t, s, v, a, speed: Math.abs(v), direction, change };
}

/**
 * All zeros of f in [t0, t1]. A sample that lands exactly on a zero is
 * recorded directly; every sign change between samples is refined by
 * bisection. Both cases matter: the velocity here vanishes exactly at
 * integer times, which a sign-change-only scan would skip.
 */
export function roots(f, t0, t1, samples = 4000) {
  if (!(t1 > t0)) throw new RangeError('Require t1 > t0.');
  const found = [];
  const push = r => {
    if (!found.some(q => Math.abs(q - r) < 1e-9)) found.push(r);
  };
  let prevT = t0;
  let prevV = f(t0);
  if (prevV === 0) push(t0);
  for (let i = 1; i <= samples; i++) {
    const t = t0 + (t1 - t0) * i / samples;
    const v = f(t);
    if (v === 0) {
      push(t);
    } else if (prevV !== 0 && prevV * v < 0) {
      let lo = prevT;
      let hi = t;
      let flo = prevV;
      for (let k = 0; k < 100; k++) {
        const mid = (lo + hi) / 2;
        const fm = f(mid);
        if (fm === 0) { lo = mid; hi = mid; break; }
        if (flo * fm < 0) hi = mid;
        else { lo = mid; flo = fm; }
      }
      push((lo + hi) / 2);
    }
    prevT = t;
    prevV = v;
  }
  return found.sort((a, b) => a - b);
}

/** The particle is at rest at t = 1 and t = 3. */
export function restTimes() {
  return roots(velocity, 0, 5);
}

/**
 * Total distance travelled and net displacement on [t0, t1].
 * The interval is cut at every instant where the velocity vanishes, because
 * distance adds |ds| while displacement adds ds.
 */
export function travel(t0, t1) {
  const cuts = [t0, ...roots(velocity, t0, t1), t1].sort((a, b) => a - b);
  let distance = 0;
  const legs = [];
  for (let i = 0; i < cuts.length - 1; i++) {
    const a = cuts[i];
    const b = cuts[i + 1];
    const ds = position(b) - position(a);
    distance += Math.abs(ds);
    legs.push({ from: a, to: b, change: ds, length: Math.abs(ds) });
  }
  return { t0, t1, cuts, legs, distance, displacement: position(t1) - position(t0) };
}

/** Position at the two turning points, s(1) = 6 and s(3) = 2. */
export function turningPoints() {
  return restTimes().map(t => ({ t, s: position(t), v: velocity(t) }));
}
