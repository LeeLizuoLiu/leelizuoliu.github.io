// MA1508 Section 3.9 companion — linear approximation and Taylor polynomials.
import {
  linearizationState, taylor, cosTaylor, errorBound,
  cube, cubePrime, expFn, expPrime, sqrt, sqrtPrime, cbrt, cbrtPrime,
  applications, applicationState,
} from './math.mjs';

const $ = id => document.getElementById(id);
const fmt = (v, d = 6) => {
  if (!Number.isFinite(v)) return String(v);
  if (Object.is(v, -0)) return '0';
  if (v !== 0 && Math.abs(v) < 1e-4) return v.toExponential(3);
  return String(Number(v.toFixed(d)));
};
const sci = (v, d = 3) => (Number.isFinite(v) ? v.toExponential(d) : String(v));

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
};
const line = (x1, y1, x2, y2, stroke, width = 2, extra = {}) =>
  el('line', { x1, y1, x2, y2, stroke, 'stroke-width': width, ...extra });
const dot = (cx, cy, stroke, r = 5, fill = stroke) =>
  el('circle', { cx, cy, r, stroke, fill, 'stroke-width': 2 });
const label = (x, y, text, attrs = {}) => {
  const t = el('text', { x, y, ...attrs });
  t.textContent = text;
  return t;
};
const draw = (svg, nodes) => svg.replaceChildren(...nodes);

function makeMap(box) {
  const { x0, x1, y0, y1, w, h, pad } = box;
  return {
    sx: x => pad.l + (x - x0) / (x1 - x0) * (w - pad.l - pad.r),
    sy: y => h - pad.b - (y - y0) / (y1 - y0) * (h - pad.t - pad.b),
  };
}
function axes(map, box, xTicks, yTicks, xLabel = 'x', yLabel = 'y') {
  const out = [];
  for (const t of xTicks) {
    out.push(line(map.sx(t), box.pad.t, map.sx(t), box.h - box.pad.b, '#ebe6df', 1));
    out.push(label(map.sx(t), box.h - box.pad.b + 19, String(t), { 'text-anchor': 'middle', fill: '#6c6a64', 'font-size': '12' }));
  }
  for (const t of yTicks) {
    out.push(line(box.pad.l, map.sy(t), box.w - box.pad.r, map.sy(t), '#ebe6df', 1));
    out.push(label(box.pad.l - 7, map.sy(t) + 4, String(t), { 'text-anchor': 'end', fill: '#6c6a64', 'font-size': '12' }));
  }
  if (box.y0 < 0 && box.y1 > 0) out.push(line(box.pad.l, map.sy(0), box.w - box.pad.r, map.sy(0), '#b0aea5', 1.5));
  if (box.x0 < 0 && box.x1 > 0) out.push(line(map.sx(0), box.pad.t, map.sx(0), box.h - box.pad.b, '#b0aea5', 1.5));
  out.push(label(box.w - box.pad.r, box.h - box.pad.b + 19, xLabel, { 'text-anchor': 'end', fill: '#6c6a64' }));
  out.push(label(box.pad.l - 7, box.pad.t - 2, yLabel, { 'text-anchor': 'end', fill: '#6c6a64' }));
  return out;
}
function path(map, f, from, to, box, steps = 500) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const x = from + (to - from) * i / steps;
    const y = f(x);
    if (!Number.isFinite(y)) continue;
    pts.push(`${map.sx(x).toFixed(2)},${map.sy(y).toFixed(2)}`);
  }
  return pts.length ? `M ${pts.join(' L ')}` : '';
}

/* ------------------------------------------------------------------ */
/* Function catalogue                                                  */
/* ------------------------------------------------------------------ */

const FUNCS = {
  cube: {
    f: cube, fp: cubePrime, a: 1, lo: -1.6, hi: 2.4, ylo: -4, yhi: 12,
    label: 'f(x) = x³', xTicks: [-1, 0, 1, 2], yTicks: [-4, 0, 4, 8, 12],
    tangent: 'L(x) = 1 + 3(x − 1) = 3x − 2',
  },
  exp: {
    f: expFn, fp: expPrime, a: 0, lo: -2.4, hi: 2.4, ylo: -1, yhi: 8,
    label: 'f(x) = eˣ', xTicks: [-2, -1, 0, 1, 2], yTicks: [0, 2, 4, 6, 8],
    tangent: 'L(x) = 1 + 1·(x − 0) = 1 + x',
  },
  sqrt: {
    f: sqrt, fp: sqrtPrime, a: 4, lo: 0.2, hi: 9, ylo: 0, yhi: 4,
    label: 'f(x) = √x', xTicks: [0, 2, 4, 6, 8], yTicks: [0, 1, 2, 3, 4],
    tangent: 'L(x) = 2 + ¼(x − 4) = x/4 + 1',
  },
  cbrt: {
    f: cbrt, fp: cbrtPrime, a: 8, lo: 0.4, hi: 27, ylo: 0, yhi: 5,
    label: 'f(x) = ∛x', xTicks: [0, 5, 10, 15, 20, 25], yTicks: [0, 1, 2, 3, 4, 5],
    tangent: 'L(x) = 2 + (1/12)(x − 8)',
  },
  quad: {
    f: x => 3 * x * x - 2 * x + 4, fp: x => 6 * x - 2, a: 1, lo: -1.4, hi: 3.4, ylo: 0, yhi: 26,
    label: 'f(x) = 3x² − 2x + 4', xTicks: [-1, 0, 1, 2, 3], yTicks: [0, 5, 10, 15, 20, 25],
    tangent: 'L(x) = 5 + 4(x − 1) = 4x + 1',
  },
};

const MAIN_BOX = { x0: -1, x1: 27, y0: -4, y1: 26, w: 560, h: 380, pad: { l: 50, r: 16, t: 18, b: 40 } };

/* ------------------------------------------------------------------ */
/* Stage 1                                                             */
/* ------------------------------------------------------------------ */

function renderMain() {
  const spec = FUNCS[state.fn];
  const x = state.x;
  const st = linearizationState(spec.f, spec.fp, spec.a, x);

  // view window follows the selected function so the picture stays legible
  const box = { ...MAIN_BOX, x0: spec.lo, x1: spec.hi, y0: spec.ylo, y1: spec.yhi };
  const map = makeMap(box);
  const out = axes(map, box, spec.xTicks, spec.yTicks);

  out.push(el('path', { d: path(map, spec.f, spec.lo, spec.hi, box), fill: 'none', stroke: '#cc785c', 'stroke-width': 2.8 }));

  // tangent line
  const L = t => st.fa + st.fpa * (t - spec.a);
  out.push(el('path', { d: path(map, L, spec.lo, spec.hi, box), fill: 'none', stroke: '#4a7a6b', 'stroke-width': 2.2, 'stroke-dasharray': '7 5' }));

  // base point and evaluation point
  out.push(dot(map.sx(spec.a), map.sy(st.fa), '#6b4fa0', 6));
  out.push(label(map.sx(spec.a), map.sy(st.fa) - 14, `a = ${spec.a}`, { 'text-anchor': 'middle', fill: '#6b4fa0', 'font-size': '14' }));
  if (Math.abs(x - spec.a) > 1e-9) {
    out.push(dot(map.sx(x), map.sy(st.actual), '#cc785c', 6));
    out.push(dot(map.sx(x), map.sy(st.L), '#8a5a12', 6, '#fffefb'));
    out.push(line(map.sx(x), map.sy(st.L), map.sx(x), map.sy(st.actual), '#8a5a12', 2));
    out.push(label(map.sx(x) + 8, map.sy(st.actual) + 4, `x = ${fmt(x, 3)}`, { fill: '#3d3d3a', 'font-size': '13' }));
  }
  draw($('main-graph'), out);

  $('r-fa').textContent = fmt(st.fa, 6);
  $('r-fpa').textContent = fmt(st.fpa, 6);
  $('r-L').textContent = fmt(st.L, 8);
  $('r-actual').textContent = fmt(st.actual, 8);
  $('r-error').textContent = sci(st.error, 4);
  $('tangent-line').textContent = spec.tangent;

  const rel = st.relativeError;
  $('quality').textContent = rel === null
    ? 'The true value is zero here, so a relative error is undefined.'
    : `The relative error is ${(rel * 100).toFixed(6)}%.`;

  const d = Math.abs(x - spec.a);
  const v = $('verdict');
  if (d < 1e-9) {
    v.innerHTML = '<b>x = a.</b> The tangent line passes through the point of tangency, so the approximation is exact here.';
  } else if (rel !== null && rel < 0.001) {
    v.innerHTML = `<b>Excellent.</b> x is ${fmt(d, 3)} away from a, and the relative error is under 0.1%. This is the regime where the linear approximation is worth using.`;
  } else if (rel !== null && rel < 0.05) {
    v.innerHTML = `<b>Usable, with care.</b> x is ${fmt(d, 3)} from a and the relative error is about ${(rel * 100).toFixed(2)}%.`;
  } else {
    v.innerHTML = `<b>Do not use this.</b> x is ${fmt(d, 3)} away from a and the relative error is about ${(rel * 100).toFixed(1)}%. The tangent line has drifted far from the curve — this is exactly the <i>∛25</i> trap.`;
  }
}

function renderQuickTable() {
  const rows = applications.map(app => {
    const s = applicationState(app.id);
    return `<tr><td>${app.label}</td><td>${FUNCS[app.id === 'cbrtFar' ? 'cbrt' : app.id === 'cbrtNear' ? 'cbrt' : app.id].label.replace('f(x) = ', '')}</td>`
      + `<td class="num">${app.a}</td>`
      + `<td class="num">${fmt(s.L, 8)}</td>`
      + `<td class="num">${fmt(s.actual, 8)}</td>`
      + `<td class="num">${sci(s.error, 3)}</td></tr>`;
  });
  $('quick-table').innerHTML = rows.join('');
}

/* ------------------------------------------------------------------ */
/* Stage 2: error growth                                               */
/* ------------------------------------------------------------------ */

const ERR_BOX = { x0: -4, x1: 0.6, y0: -14, y1: 1, w: 560, h: 380, pad: { l: 56, r: 16, t: 18, b: 44 } };

function renderError() {
  const spec = FUNCS[state.efn];
  const a = spec.a;
  const distances = [1e-4, 1e-3, 1e-2, 1e-1, 0.5, 1, 2];

  const rows = distances.map(h => {
    const x = a + h;
    if (spec.f(x) === undefined || !Number.isFinite(spec.f(x))) return '';
    const s = linearizationState(spec.f, spec.fp, a, x);
    const ratio = s.error / (h * h);
    return `<tr><td class="num">${h}</td><td class="num">${sci(s.error, 3)}</td><td class="num">${fmt(ratio, 6)}</td></tr>`;
  }).join('');
  $('err-table').innerHTML = rows;

  // log-log plot of |error| against distance
  const map = makeMap(ERR_BOX);
  const out = [];
  // grid
  for (let e = -4; e <= 0; e++) {
    const px = map.sx(e);
    out.push(line(px, ERR_BOX.pad.t, px, ERR_BOX.h - ERR_BOX.pad.b, '#ebe6df', 1));
    out.push(label(px, ERR_BOX.h - ERR_BOX.pad.b + 20, `1e${e}`, { 'text-anchor': 'middle', fill: '#6c6a64', 'font-size': '12' }));
  }
  for (let e = -14; e <= 0; e += 2) {
    const py = map.sy(e);
    out.push(line(ERR_BOX.pad.l, py, ERR_BOX.w - ERR_BOX.pad.r, py, '#ebe6df', 1));
    out.push(label(ERR_BOX.pad.l - 7, py + 4, `1e${e}`, { 'text-anchor': 'end', fill: '#6c6a64', 'font-size': '12' }));
  }
  out.push(label(ERR_BOX.w - ERR_BOX.pad.r, ERR_BOX.h - ERR_BOX.pad.b + 20, '|x − a|', { 'text-anchor': 'end', fill: '#6c6a64' }));
  out.push(label(ERR_BOX.pad.l - 7, ERR_BOX.pad.t - 4, '|error|', { 'text-anchor': 'end', fill: '#6c6a64' }));

  // the measured error curve
  const pts = [];
  for (let i = 0; i <= 300; i++) {
    const h = Math.pow(10, -4 + 4 * i / 300);
    const x = a + h;
    const fx = spec.f(x);
    if (!Number.isFinite(fx)) continue;
    const s = linearizationState(spec.f, spec.fp, a, x);
    const err = Math.abs(s.error);
    if (err <= 0) continue;
    pts.push(`${map.sx(Math.log10(h)).toFixed(2)},${map.sy(Math.log10(err)).toFixed(2)}`);
  }
  out.push(el('path', { d: `M ${pts.join(' L ')}`, fill: 'none', stroke: '#cc785c', 'stroke-width': 2.8 }));

  // a slope-2 reference line through the smallest point
  const h0 = 1e-3;
  const s0 = linearizationState(spec.f, spec.fp, a, a + h0);
  const e0 = Math.abs(s0.error);
  const refPts = [];
  for (const h of [1e-4, 1e-3, 1e-2, 1e-1]) {
    const y = e0 * Math.pow(h / h0, 2);
    refPts.push(`${map.sx(Math.log10(h)).toFixed(2)},${map.sy(Math.log10(y)).toFixed(2)}`);
  }
  out.push(el('path', { d: `M ${refPts.join(' L ')}`, fill: 'none', stroke: '#4a7a6b', 'stroke-width': 2, 'stroke-dasharray': '7 5' }));
  out.push(label(map.sx(-2.0), map.sy(-4.2), 'slope 2 reference', { fill: '#4a7a6b', 'font-size': '13' }));

  draw($('err-graph'), out);

  $('err-note').textContent =
    `For ${spec.label} at a = ${a}, the error grows like the square of the distance from a. `
    + `At |x − a| = 1 the error is ${sci(Math.abs(linearizationState(spec.f, spec.fp, a, a + 1).error), 3)}, `
    + `but at |x − a| = 0.01 it has fallen to ${sci(Math.abs(linearizationState(spec.f, spec.fp, a, a + 0.01).error), 3)}.`;
}

/* ------------------------------------------------------------------ */
/* Stage 3: Taylor                                                     */
/* ------------------------------------------------------------------ */

const TAY_BOX = { x0: -2.6, x1: 2.6, y0: -1.6, y1: 2.2, w: 560, h: 380, pad: { l: 50, r: 16, t: 18, b: 40 } };
const DEG_COLORS = { 1: '#4a7a6b', 2: '#6b4fa0', 4: '#8a5a12', 6: '#456b2e', 8: '#b03a3a' };

function renderTaylor() {
  const x = state.tx;
  const box = TAY_BOX;
  const map = makeMap(box);
  const out = axes(map, box, [-2, -1, 0, 1, 2], [-1, 0, 1, 2]);

  out.push(el('path', { d: path(map, Math.cos, box.x0, box.x1, box), fill: 'none', stroke: '#cc785c', 'stroke-width': 3 }));
  for (const deg of [1, 2, 4, 6, 8]) {
    out.push(el('path', {
      d: path(map, t => cosTaylor(t, deg), box.x0, box.x1, box),
      fill: 'none', stroke: DEG_COLORS[deg], 'stroke-width': 1.8, opacity: 0.85,
    }));
  }
  out.push(line(map.sx(x), box.pad.t, map.sx(x), box.h - box.pad.b, '#141413', 1.5, { 'stroke-dasharray': '4 4' }));
  out.push(dot(map.sx(x), map.sy(Math.cos(x)), '#cc785c', 6));
  draw($('taylor-graph'), out);

  const trueV = Math.cos(x);
  $('t-true').textContent = fmt(trueV, 8);
  const rows = [];
  for (const deg of [1, 2, 4, 6, 8]) {
    const v = cosTaylor(x, deg);
    const err = Math.abs(v - trueV);
    $(`t-${deg}`).textContent = fmt(v, 8);
    rows.push(`<tr><td>T<sub>${deg}</sub></td><td class="num">${fmt(v, 8)}</td><td class="num">${sci(err, 3)}</td></tr>`);
  }
  $('t-table').innerHTML = rows.join('');

  const e1 = Math.abs(cosTaylor(x, 1) - trueV);
  const e2 = Math.abs(cosTaylor(x, 2) - trueV);
  const e8 = Math.abs(cosTaylor(x, 8) - trueV);
  $('t-verdict').innerHTML = Math.abs(x) < 1e-9
    ? '<b>x = 0.</b> Every Taylor polynomial is exact at the expansion point, because all the terms beyond the constant vanish.'
    : `<b>Watch the error shrink.</b> |T₁ − cos x| = ${sci(e1, 3)}, |T₂ − cos x| = ${sci(e2, 3)}, and |T₈ − cos x| = ${sci(e8, 3)}. Each extra pair of terms buys several more correct digits near x = 0.`;
}

/* ------------------------------------------------------------------ */
/* Wiring                                                              */
/* ------------------------------------------------------------------ */

const state = { fn: 'cube', x: 1, efn: 'cbrt', tx: 0.5, deg: 2, stage: 'local' };

function refresh() {
  $('x-value').textContent = state.x.toFixed(3);
  $('x').value = String(state.x);
  $('tx-value').textContent = state.tx.toFixed(3);
  $('tx').value = String(state.tx);

  if (state.stage === 'local') renderMain();
  else if (state.stage === 'error') renderError();
  else renderTaylor();
}

function showStage(name) {
  state.stage = name;
  for (const b of document.querySelectorAll('nav button')) {
    b.setAttribute('aria-pressed', String(b.dataset.stage === name));
  }
  for (const id of ['local', 'error', 'taylor']) $(id).hidden = id !== name;
  refresh();
}

for (const b of document.querySelectorAll('nav button')) {
  b.addEventListener('click', () => showStage(b.dataset.stage));
}
$('fn').addEventListener('change', e => {
  state.fn = e.target.value;
  state.x = FUNCS[state.fn].a;
  refresh();
});
$('x').addEventListener('input', e => { state.x = Number(e.target.value); refresh(); });
$('efn').addEventListener('change', e => { state.efn = e.target.value; refresh(); });
$('tx').addEventListener('input', e => { state.tx = Number(e.target.value); refresh(); });
$('snap').addEventListener('click', () => { state.x = FUNCS[state.fn].a; refresh(); });
for (const b of document.querySelectorAll('button[data-x]')) {
  b.addEventListener('click', () => { state.x = Number(b.dataset.x); refresh(); });
}
for (const b of document.querySelectorAll('button[data-deg]')) {
  b.addEventListener('click', () => { state.deg = Number(b.dataset.deg); refresh(); });
}

renderQuickTable();
refresh();
