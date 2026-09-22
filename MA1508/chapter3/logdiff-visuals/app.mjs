// MA1508 Section 3.7 companion — logarithmic differentiation.
import {
  partialRules, criticalPoint, minimumValue, xToTheX, xToTheXDerivative,
  lectureProduct, variablePower,
} from './math.mjs';

const $ = id => document.getElementById(id);
const fmt = (v, d = 6) => {
  if (!Number.isFinite(v)) return String(v);
  if (Object.is(v, -0)) return '0';
  if (v !== 0 && Math.abs(v) < 1e-4) return v.toExponential(3);
  return String(Number(v.toFixed(d)));
};
const sci = (v, d = 6) => (Number.isFinite(v) ? v.toExponential(d) : String(v));

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
function axes(map, box, xTicks, yTicks, xLabel = 'x') {
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
  out.push(label(box.w - box.pad.r, box.h - box.pad.b + 20, xLabel, { 'text-anchor': 'end', fill: '#6c6a64' }));
  return out;
}
function path(map, f, from, to, yMin, yMax, steps = 500) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const x = from + (to - from) * i / steps;
    const y = f(x);
    if (!Number.isFinite(y) || y < yMin - 2 || y > yMax + 2) continue;
    pts.push(`${map.sx(x).toFixed(2)},${map.sy(y).toFixed(2)}`);
  }
  return pts.length ? `M ${pts.join(' L ')}` : '';
}

/* ------------------------------------------------------------------ */
/* Stage 1: the product-of-powers check                                */
/* ------------------------------------------------------------------ */

function renderProductCheck() {
  const x = state.px;
  const r = lectureProduct(x);
  // independent product-rule evaluation
  const y = Math.pow(x + 1, 2) * Math.pow(x * x - 1, 3);
  const prod = 2 * (x + 1) * Math.pow(x * x - 1, 3)
    + Math.pow(x + 1, 2) * 3 * Math.pow(x * x - 1, 2) * 2 * x;
  $('p-y').textContent = fmt(r.value, 4);
  $('p-log').textContent = fmt(r.derivative, 4);
  $('p-prod').textContent = fmt(prod, 4);
  const rel = Math.abs(r.derivative - prod) / Math.max(1, Math.abs(prod));
  $('p-diff').textContent = rel === 0 ? 'exact' : sci(rel, 2);
}

/* ------------------------------------------------------------------ */
/* Stage 2: x^x                                                        */
/* ------------------------------------------------------------------ */

const XX_BOX = { x0: 0, x1: 4, y0: -1, y1: 30, w: 500, h: 340, pad: { l: 46, r: 16, t: 16, b: 38 } };

function renderXX() {
  const x = state.xx;
  const p = partialRules(x);

  const box = XX_BOX;
  const map = makeMap(box);
  const out = axes(map, box, [1, 2, 3, 4], [10, 20, 30]);
  out.push(el('path', {
    d: path(map, t => (t > 0.001 ? xToTheX(t) : NaN), 0.02, 4, box.y0, box.y1),
    fill: 'none', stroke: '#cc785c', 'stroke-width': 2.5,
  }));

  // the minimum at 1/e
  const c = criticalPoint();
  out.push(line(map.sx(c), box.pad.t, map.sx(c), box.h - box.pad.b, '#6b4fa0', 1.5, { 'stroke-dasharray': '5 4' }));
  out.push(dot(map.sx(c), map.sy(minimumValue()), '#6b4fa0', 5, '#fffefb'));
  out.push(label(map.sx(c) + 7, map.sy(minimumValue()) + 22, 'x = 1/e', { fill: '#6b4fa0', 'font-size': '14' }));

  // the tangent at the selected point
  if (p.value <= box.y1 + 5) {
    const slope = p.derivative;
    const tx0 = Math.max(0.02, x - 1.0), tx1 = Math.min(4, x + 1.0);
    const ty = t => p.value + slope * (t - x);
    out.push(el('path', {
      d: `M ${map.sx(tx0)},${map.sy(ty(tx0))} L ${map.sx(tx1)},${map.sy(ty(tx1))}`,
      fill: 'none', stroke: '#4a7a6b', 'stroke-width': 2.5, 'stroke-dasharray': '6 4',
    }));
    out.push(dot(map.sx(x), map.sy(p.value), '#cc785c', 6));
  }
  draw($('xx-graph'), out);

  $('xx-y').textContent = fmt(p.value, 6);
  $('xx-power').textContent = fmt(p.powerRule, 6);
  $('xx-exp').textContent = fmt(p.exponentialRule, 6);
  $('xx-sum').textContent = fmt(p.sum, 6);
  $('xx-true').textContent = fmt(p.derivative, 6);

  const gap = Math.abs(p.sum - p.derivative) / Math.max(1, Math.abs(p.derivative));
  const verdict = $('xx-verdict');
  if (gap < 1e-12) {
    verdict.innerHTML = '<b>Check passes.</b> At this x the sum of the two partial rules equals the true derivative to machine precision. '
      + (Math.abs(x - 1) < 1e-9
        ? 'Here x = 1 is the one point where the power rule alone also happens to be right, because ln 1 = 0.'
        : 'Notice that neither partial rule alone would have been correct.');
  } else {
    verdict.textContent = 'Unexpected mismatch — please report this.';
  }
}

function renderXXTable() {
  const rows = [0.5, 1, 2, 3].map(x => {
    const p = partialRules(x);
    return `<tr><td class="num">${x}</td><td class="num">${p.value.toFixed(6)}</td>`
      + `<td class="num">${p.powerRule.toFixed(6)}</td>`
      + `<td class="num">${p.exponentialRule.toFixed(6)}</td>`
      + `<td class="num">${p.derivative.toFixed(6)}</td></tr>`;
  });
  $('xx-table').innerHTML = rows.join('');
}

/* ------------------------------------------------------------------ */
/* Stage 3: general variable powers                                    */
/* ------------------------------------------------------------------ */

const VF = {
  cos: {
    f: Math.cos, fp: x => -Math.sin(x),
    g: x => x, gp: () => 1,
    lo: 0.05, hi: Math.PI / 2 - 0.08,
    note: 'The base is cos x, which must stay positive, so we restrict to 0 < x < π/2.',
    y: x => Math.pow(Math.cos(x), x),
  },
  sinln: {
    f: Math.sin, fp: Math.cos,
    g: Math.log, gp: x => 1 / x,
    lo: 0.15, hi: Math.PI - 0.15,
    note: 'The base sin x must be positive and the exponent ln x needs x > 0, so we restrict to 0 < x < π.',
    y: x => Math.pow(Math.sin(x), Math.log(x)),
  },
  sqrt: {
    f: Math.sqrt, fp: x => 1 / (2 * Math.sqrt(x)),
    g: x => x, gp: () => 1,
    lo: 0.1, hi: 3,
    note: 'Here y = (√x)^x = x^(x/2). The formula gives x^(x/2)·(½ln x + ½).',
    y: x => Math.pow(Math.sqrt(x), x),
  },
};

const VF_BOX = { x0: 0, x1: 3.1, y0: -1, y1: 3, w: 500, h: 340, pad: { l: 46, r: 16, t: 16, b: 38 } };

function renderVF() {
  const spec = VF[state.vf];
  const x = Math.min(Math.max(state.vx, spec.lo + 0.01), spec.hi - 0.01);
  state.vx = x;

  const r = variablePower(spec.f, spec.fp, spec.g, spec.gp, x);
  const h = 1e-6;
  const numeric = (spec.y(x + h) - spec.y(x - h)) / (2 * h);

  const box = VF_BOX;
  const map = makeMap(box);
  const out = axes(map, box, [1, 2, 3], [-1, 1, 2, 3]);
  out.push(el('path', {
    d: path(map, t => (spec.f(t) > 0 ? spec.y(t) : NaN), spec.lo, spec.hi, box.y0, box.y1),
    fill: 'none', stroke: '#cc785c', 'stroke-width': 2.5,
  }));
  if (r.value >= box.y0 && r.value <= box.y1) {
    const tx0 = Math.max(spec.lo, x - 0.6), tx1 = Math.min(spec.hi, x + 0.6);
    const ty = t => r.value + r.derivative * (t - x);
    out.push(el('path', {
      d: `M ${map.sx(tx0)},${map.sy(ty(tx0))} L ${map.sx(tx1)},${map.sy(ty(tx1))}`,
      fill: 'none', stroke: '#4a7a6b', 'stroke-width': 2.5, 'stroke-dasharray': '6 4',
    }));
    out.push(dot(map.sx(x), map.sy(r.value), '#cc785c', 6));
  }
  draw($('vf-graph'), out);

  $('vf-f').textContent = fmt(r.base, 6);
  $('vf-g').textContent = fmt(r.exponent, 6);
  $('vf-y').textContent = fmt(r.value, 6);
  $('vf-dy').textContent = fmt(r.derivative, 6);
  $('vf-num').textContent = fmt(numeric, 6);
  $('vf-note').textContent = spec.note;
}

/* ------------------------------------------------------------------ */
/* State + wiring                                                      */
/* ------------------------------------------------------------------ */

const state = { px: 2, xx: 2, vf: 'cos', vx: 1, stage: 'laws' };

function refresh() {
  $('px-value').textContent = state.px.toFixed(2);
  $('px').value = String(state.px);
  $('xx-x-value').textContent = state.xx.toFixed(4);
  $('xx-x').value = String(state.xx);
  $('vx-value').textContent = state.vx.toFixed(2);
  $('vx').value = String(state.vx);

  if (state.stage === 'laws') renderProductCheck();
  else if (state.stage === 'xx') renderXX();
  else renderVF();
}

function showStage(name) {
  state.stage = name;
  for (const b of document.querySelectorAll('nav button')) {
    b.setAttribute('aria-pressed', String(b.dataset.stage === name));
  }
  for (const id of ['laws', 'xx', 'general']) $(id).hidden = id !== name;
  refresh();
}

for (const b of document.querySelectorAll('nav button')) {
  b.addEventListener('click', () => showStage(b.dataset.stage));
}
$('px').addEventListener('input', e => { state.px = Number(e.target.value); refresh(); });
$('xx-x').addEventListener('input', e => { state.xx = Number(e.target.value); refresh(); });
$('vx').addEventListener('input', e => { state.vx = Number(e.target.value); refresh(); });
for (const b of document.querySelectorAll('button[data-xx]')) {
  b.addEventListener('click', () => { state.xx = Number(b.dataset.xx); refresh(); });
}
$('vf').addEventListener('change', e => {
  state.vf = e.target.value;
  const spec = VF[state.vf];
  state.vx = Math.min(Math.max(state.vx, spec.lo + 0.05), spec.hi - 0.05);
  refresh();
});

renderXXTable();
refresh();
