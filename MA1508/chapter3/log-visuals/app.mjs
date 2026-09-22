// MA1508 Section 3.6 companion — the derivative of ln x, visually.
import { lnSecant, logBase, logBaseDerivative, slopeAtOne } from './math.mjs';

const $ = id => document.getElementById(id);
const fmt = (v, d = 6) => {
  if (v === null || v === undefined) return 'undefined (0/0)';
  if (!Number.isFinite(v)) return String(v);
  if (Object.is(v, -0)) return '0';
  if (v !== 0 && Math.abs(v) < 1e-4) return v.toExponential(3);
  return String(Number(v.toFixed(d)));
};

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
function draw(svg, nodes) {
  svg.replaceChildren(...nodes);
}

/* ------------------------------------------------------------------ */
/* Stage 1: the difference quotient of ln x                            */
/* ------------------------------------------------------------------ */

const CURVE = { x0: 0.15, x1: 6.2, y0: -2.1, y1: 2.0, w: 500, h: 340, pad: { l: 46, r: 16, t: 16, b: 38 } };

function makeMap(box) {
  const { x0, x1, y0, y1, w, h, pad } = box;
  const sx = x => pad.l + (x - x0) / (x1 - x0) * (w - pad.l - pad.r);
  const sy = y => h - pad.b - (y - y0) / (y1 - y0) * (h - pad.t - pad.b);
  const ux = px => x0 + (px - pad.l) / (w - pad.l - pad.r) * (x1 - x0);
  const uy = py => y0 + (h - pad.b - py) / (h - pad.t - pad.b) * (y1 - y0);
  return { sx, sy, ux, uy };
}

function axes(map, box, xTicks, yTicks) {
  const out = [];
  for (const t of xTicks) {
    out.push(line(map.sx(t), box.pad.t, map.sx(t), box.h - box.pad.b, '#ebe6df', 1));
    out.push(label(map.sx(t), box.h - box.pad.b + 20, String(t), { 'text-anchor': 'middle', fill: '#6c6a64', 'font-size': '13' }));
  }
  for (const t of yTicks) {
    out.push(line(box.pad.l, map.sy(t), box.w - box.pad.r, map.sy(t), '#ebe6df', 1));
    out.push(label(box.pad.l - 8, map.sy(t) + 5, String(t), { 'text-anchor': 'end', fill: '#6c6a64', 'font-size': '13' }));
  }
  out.push(line(box.pad.l, map.sy(0), box.w - box.pad.r, map.sy(0), '#b0aea5', 1.5));
  out.push(line(map.sx(0), box.pad.t, map.sx(0), box.h - box.pad.b, '#b0aea5', 1.5));
  out.push(label(box.w - box.pad.r, box.h - box.pad.b + 20, 'x', { 'text-anchor': 'end', fill: '#6c6a64' }));
  return out;
}

function path(map, f, from, to, steps = 400) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const x = from + (to - from) * i / steps;
    const y = f(x);
    if (!Number.isFinite(y) || y < CURVE.y0 - 1 || y > CURVE.y1 + 1) continue;
    pts.push(`${map.sx(x).toFixed(2)},${map.sy(y).toFixed(2)}`);
  }
  return pts.length ? `M ${pts.join(' L ')}` : '';
}

function renderCurve() {
  const box = CURVE;
  const map = makeMap(box);
  const out = axes(map, box, [1, 2, 3, 4, 5, 6], [-2, -1, 1, 2]);
  out.push(el('path', { d: path(map, Math.log, box.x0, box.x1), fill: 'none', stroke: '#cc785c', 'stroke-width': 2.5 }));

  const x = state.x, h = state.h;
  const y = Math.log(x);
  const P = [map.sx(x), map.sy(y)];

  // tangent: slope 1/x through P
  const tanX0 = Math.max(box.x0, x - 2.2), tanX1 = Math.min(box.x1, x + 2.2);
  const tanY = t => y + (t - x) / x;
  out.push(el('path', {
    d: `M ${map.sx(tanX0)},${map.sy(tanY(tanX0))} L ${map.sx(tanX1)},${map.sy(tanY(tanX1))}`,
    fill: 'none', stroke: '#4a7a6b', 'stroke-width': 2.5, 'stroke-dasharray': '6 4',
  }));

  if (h !== 0) {
    const xq = x + h;
    if (xq > 0) {
      const yq = Math.log(xq);
      const s = lnSecant(state.x, state.h).secant;
      const secY = t => y + s * (t - x);
      const sx0 = Math.max(box.x0, Math.min(x, xq) - 1.4);
      const sx1 = Math.min(box.x1, Math.max(x, xq) + 1.4);
      out.push(el('path', {
        d: `M ${map.sx(sx0)},${map.sy(secY(sx0))} L ${map.sx(sx1)},${map.sy(secY(sx1))}`,
        fill: 'none', stroke: '#8a5a12', 'stroke-width': 2,
      }));
      out.push(line(P[0], P[1], map.sx(xq), map.sy(yq), '#8a5a12', 1, { 'stroke-dasharray': '4 4' }));
      out.push(dot(map.sx(xq), map.sy(yq), '#8a5a12'));
      out.push(label(map.sx(xq) + 9, map.sy(yq) + (h > 0 ? 20 : -12), 'Q', { fill: '#8a5a12', 'font-size': '15' }));
    }
  }
  out.push(dot(P[0], P[1], '#cc785c', 6));
  out.push(label(P[0] - 24, P[1] + 22, h === 0 ? 'P = Q' : 'P', { fill: '#a9583e', 'font-size': '15' }));
  draw($('curve'), out);
}

const PROOF = [
  ['Start from the definition of the derivative.', 'd/dx ln x = lim(h→0) [ln(x+h) − ln x] / h'],
  ['Combine the two logarithms into one, using ln a − ln b = ln(a/b).', '= lim(h→0) (1/h) · ln( (x+h)/x )'],
  ['Simplify the fraction inside.', '= lim(h→0) (1/h) · ln(1 + h/x)'],
  ['Use r·ln A = ln(A^r) to move 1/h up as an exponent.', '= lim(h→0) ln( (1 + h/x)^(1/h) )'],
  ['Substitute u = h/x, so h = xu and 1/h = 1/(xu). As h→0, u→0.', '= lim(u→0) ln( (1+u)^(1/(xu)) )'],
  ['Split the exponent: 1/(xu) = (1/x)(1/u). The factor 1/x is constant.', '= lim(u→0) (1/x) · ln( (1+u)^(1/u) )'],
  ['The limit inside is the definition of e. Move it inside the logarithm — legitimate because ln is continuous.', '= (1/x) · ln( lim(u→0) (1+u)^(1/u) ) = (1/x) · ln e'],
  ['And ln e = 1, because e is the base of the natural logarithm.', '= 1/x  ∎'],
];

function renderProof() {
  const ol = $('proof-steps');
  ol.replaceChildren(...PROOF.map(([why, math]) => {
    const li = document.createElement('li');
    const p1 = document.createElement('div');
    p1.textContent = why;
    const p2 = document.createElement('div');
    p2.className = 'equation';
    p2.textContent = math;
    li.append(p1, p2);
    return li;
  }));
}

/* ------------------------------------------------------------------ */
/* Stage 2: which base has slope 1 at x = 1                            */
/* ------------------------------------------------------------------ */

const BASE_COLORS = { '2': '#6b4fa0', '2.718281828459045': '#cc785c', '3': '#4a7a6b', '10': '#8a5a12' };
const BASE_NAMES = { '2': '2', '2.718281828459045': 'e', '3': '3', '10': '10' };
const BASE_BOX = { x0: 0, x1: 5, y0: -2.4, y1: 2.0, w: 500, h: 340, pad: { l: 46, r: 16, t: 16, b: 38 } };

function renderBases() {
  const box = BASE_BOX;
  const map = makeMap(box);
  const out = axes(map, box, [1, 2, 3, 4, 5], [-2, -1, 1, 2]);
  const list = [2, Math.E, 3, 10];
  for (const a of list) {
    const key = String(a);
    const selected = Math.abs(a - state.base) < 1e-9;
    out.push(el('path', {
      d: path(map, x => logBase(a, x), 0.02, box.x1),
      fill: 'none',
      stroke: BASE_COLORS[key],
      'stroke-width': selected ? 3.2 : 1.8,
      opacity: selected ? 1 : 0.5,
    }));
  }
  // the tangent of slope 1 at (1,0)
  out.push(el('path', {
    d: `M ${map.sx(0.1)},${map.sy(-0.9)} L ${map.sx(2.2)},${map.sy(1.2)}`,
    fill: 'none', stroke: '#141413', 'stroke-width': 2, 'stroke-dasharray': '7 5',
  }));
  out.push(label(map.sx(2.3), map.sy(1.2) - 6, 'slope 1', { fill: '#141413', 'font-size': '14' }));
  out.push(dot(map.sx(1), map.sy(0), '#141413', 5, '#fffefb'));
  out.push(label(map.sx(1) + 8, map.sy(0) + 20, '(1, 0)', { fill: '#3d3d3a', 'font-size': '14' }));
  draw($('bases'), out);
}

function renderBasePanel() {
  const a = state.base;
  const s = slopeAtOne(a);
  $('base-a').textContent = fmt(a, 6);
  $('base-slope').textContent = fmt(s, 10);
  $('base-cmp').textContent = Math.abs(s - 1) < 1e-9 ? 'exactly 1' : (s > 1 ? 'steeper than ln' : 'flatter than ln');
  const rows = [2, Math.E, 3, 10].map(v => {
    const slope = slopeAtOne(v);
    const rel = Math.abs(slope - 1) < 1e-9 ? 'the reference' : (slope > 1 ? 'steeper' : 'flatter');
    return `<tr><td>${BASE_NAMES[String(v)]}</td><td class="num">${slope.toFixed(10)}</td><td>${rel}</td></tr>`;
  });
  $('base-table').innerHTML = rows.join('');
}

/* ------------------------------------------------------------------ */
/* Stage 3: the chain rule for ln(g(x))                                */
/* ------------------------------------------------------------------ */

const FUNCS = {
  quad: {
    label: 'x² + 1',
    g: x => x * x + 1,
    gp: x => 2 * x,
    lo: 0.2, hi: 4.5,
    note: 'The inside is always positive, so ln(x²+1) is defined for every real x. The derivative is 2x/(x²+1).',
    line: x => `g(x) = x² + 1,  g′(x) = 2x  →  d/dx ln(x²+1) = 2x / (x² + 1)`,
  },
  sin: {
    label: 'sin x',
    g: Math.sin,
    gp: Math.cos,
    lo: 0.2, hi: Math.PI - 0.2,
    note: 'We must stay where sin x > 0, that is 0 < x < π. The derivative is cos x / sin x = cot x.',
    line: () => `g(x) = sin x,  g′(x) = cos x  →  d/dx ln(sin x) = cos x / sin x = cot x`,
  },
  tan: {
    label: 'tan x',
    g: Math.tan,
    gp: x => 1 / (Math.cos(x) ** 2),
    lo: 0.2, hi: 1.35,
    note: 'We stay where tan x > 0, that is 0 < x < π/2. The derivative is sec²x / tan x, which simplifies to 1/(sin x cos x).',
    line: () => `g(x) = tan x,  g′(x) = sec²x  →  d/dx ln(tan x) = sec²x / tan x = 1/(sin x cos x)`,
  },
  lin: {
    label: '3x',
    g: x => 3 * x,
    gp: () => 3,
    lo: 0.2, hi: 4.5,
    note: 'The answer 3/(3x) = 1/x matches ln x exactly, because ln(3x) = ln 3 + ln x and the constant differentiates to zero.',
    line: () => `g(x) = 3x,  g′(x) = 3  →  d/dx ln(3x) = 3 / (3x) = 1/x`,
  },
};

const CHAIN_BOX = { x0: 0.1, x1: 4.6, y0: -3.2, y1: 2.6, w: 500, h: 340, pad: { l: 46, r: 16, t: 16, b: 38 } };

function renderChain() {
  const f = FUNCS[state.fn];
  const x = Math.min(Math.max(state.xc, f.lo + 0.02), f.hi - 0.02);
  state.xc = x;
  const gx = f.g(x), gp = f.gp(x);
  const y = Math.log(gx);

  const box = CHAIN_BOX;
  const map = makeMap(box);
  const out = axes(map, box, [1, 2, 3, 4], [-3, -2, -1, 1, 2]);
  out.push(el('path', {
    d: path(map, t => (f.g(t) > 0 ? Math.log(f.g(t)) : NaN), f.lo, f.hi),
    fill: 'none', stroke: '#cc785c', 'stroke-width': 2.5,
  }));

  const slope = gp / gx;
  const tx0 = Math.max(f.lo, x - 1.1), tx1 = Math.min(f.hi, x + 1.1);
  const ty = t => y + slope * (t - x);
  out.push(el('path', {
    d: `M ${map.sx(tx0)},${map.sy(ty(tx0))} L ${map.sx(tx1)},${map.sy(ty(tx1))}`,
    fill: 'none', stroke: '#4a7a6b', 'stroke-width': 2.5, 'stroke-dasharray': '6 4',
  }));
  out.push(dot(map.sx(x), map.sy(y), '#cc785c', 6));
  out.push(label(map.sx(x) - 22, map.sy(y) + 22, 'P', { fill: '#a9583e', 'font-size': '15' }));

  draw($('chain-graph'), out);

  $('g-val').textContent = fmt(gx, 6);
  $('gp-val').textContent = fmt(gp, 6);
  $('chain-val').textContent = fmt(slope, 6);
  $('chain-line').textContent = f.line(x);
  $('chain-note').textContent = f.note;
}

/* ------------------------------------------------------------------ */
/* State + wiring                                                      */
/* ------------------------------------------------------------------ */

const state = { x: 2, h: 0.6, base: Math.E, fn: 'quad', xc: 1.2, stage: 'quotient' };

function refresh() {
  $('h-value').textContent = state.h.toFixed(3);
  $('h').value = String(state.h);
  $('x0-value').textContent = state.x.toFixed(2);
  $('x0').value = String(state.x);
  $('xc-value').textContent = state.xc.toFixed(2);
  $('xc').value = String(state.xc);

  if (state.stage === 'quotient') {
    const s = lnSecant(state.x, state.h);
    $('secant').textContent = fmt(s.secant, 8);
    $('tangent').textContent = fmt(s.tangent, 8);
    $('ratio').textContent = s.ratio === null ? 'undefined' : fmt(s.ratio, 6);
    renderCurve();
  } else if (state.stage === 'base') {
    renderBases();
    renderBasePanel();
  } else {
    renderChain();
  }
}

function showStage(name) {
  state.stage = name;
  for (const b of document.querySelectorAll('nav button')) {
    b.setAttribute('aria-pressed', String(b.dataset.stage === name));
  }
  for (const id of ['quotient', 'base', 'chain']) $(id).hidden = id !== name;
  refresh();
}

for (const b of document.querySelectorAll('nav button')) {
  b.addEventListener('click', () => showStage(b.dataset.stage));
}

$('h').addEventListener('input', e => { state.h = Number(e.target.value); refresh(); });
$('x0').addEventListener('input', e => { state.x = Number(e.target.value); refresh(); });
$('xc').addEventListener('input', e => { state.xc = Number(e.target.value); refresh(); });
$('fn').addEventListener('change', e => {
  state.fn = e.target.value;
  const f = FUNCS[state.fn];
  state.xc = Math.min(Math.max(state.xc, f.lo + 0.05), f.hi - 0.05);
  refresh();
});

$('halve').addEventListener('click', () => {
  state.h = Math.abs(state.h) < 1e-4 ? state.h : state.h / 2;
  refresh();
});
$('flip').addEventListener('click', () => { state.h = -state.h; refresh(); });
for (const b of document.querySelectorAll('button[data-h]')) {
  b.addEventListener('click', () => { state.h = Number(b.dataset.h); refresh(); });
}
for (const b of document.querySelectorAll('button[data-base]')) {
  b.addEventListener('click', () => { state.base = Number(b.dataset.base); refresh(); });
}
$('reset').addEventListener('click', () => {
  state.x = 2; state.h = 0.6; state.base = Math.E; state.fn = 'quad'; state.xc = 1.2;
  $('fn').value = 'quad';
  refresh();
});

renderProof();
refresh();
