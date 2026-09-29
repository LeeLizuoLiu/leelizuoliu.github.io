// MA1508 Section 3.8 companion — rectilinear motion, visually.
import {
  position, velocity, acceleration, motionState, travel, turningPoints,
} from './math.mjs';

const $ = id => document.getElementById(id);
const fmt = (v, d = 4) => {
  if (!Number.isFinite(v)) return String(v);
  if (Object.is(v, -0)) return '0';
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
const rect = (x, y, w, h, fill, extra = {}) => el('rect', { x, y, width: w, height: h, fill, rx: 4, ...extra });
const draw = (svg, nodes) => svg.replaceChildren(...nodes);

const T0 = 0, T1 = 5;

/* ------------------------------------------------------------------ */
/* The number line                                                     */
/* ------------------------------------------------------------------ */

function renderTrack() {
  const W = 900, H = 150, padL = 60, padR = 40, y = 78;
  const sMin = 0, sMax = 24;
  const sx = s => padL + (s - sMin) / (sMax - sMin) * (W - padL - padR);

  const st = motionState(state.t);
  const out = [
    line(padL, y, W - padR, y, '#b0aea5', 2),
  ];
  for (let s = 0; s <= 24; s += 2) {
    out.push(line(sx(s), y - 7, sx(s), y + 7, '#b0aea5', 1.5));
    out.push(label(sx(s), y + 26, String(s), { 'text-anchor': 'middle', fill: '#6c6a64', 'font-size': '13' }));
  }
  // the turning points, marked
  for (const tp of turningPoints()) {
    out.push(dot(sx(tp.s), y, '#6b4fa0', 5, '#fffefb'));
    out.push(label(sx(tp.s), y - 16, `s=${tp.s} at t=${tp.t}`, { 'text-anchor': 'middle', fill: '#6b4fa0', 'font-size': '13' }));
  }
  // start and end
  out.push(dot(sx(position(0)), y, '#8e8b82', 4, '#fffefb'));
  out.push(dot(sx(position(5)), y, '#8e8b82', 4, '#fffefb'));

  // the particle
  out.push(dot(sx(st.s), y, '#cc785c', 9));
  out.push(label(sx(st.s), y + 52, `s = ${fmt(st.s, 3)} m`, { 'text-anchor': 'middle', fill: '#a9583e', 'font-size': '15', 'font-weight': '600' }));

  // direction arrow
  const dir = Math.abs(st.v) < 1e-9 ? 0 : Math.sign(st.v);
  if (dir !== 0) {
    const len = 34;
    const x0 = sx(st.s), x1 = x0 + dir * len;
    out.push(line(x0, y - 30, x1, y - 30, '#4a7a6b', 3));
    const tip = dir > 0
      ? `M ${x1},${y - 30} l -9,-5 l 0,10 z`
      : `M ${x1},${y - 30} l 9,-5 l 0,10 z`;
    out.push(el('path', { d: tip, fill: '#4a7a6b' }));
    out.push(label(x1 + dir * 8, y - 34, dir > 0 ? 'forward' : 'backward', {
      fill: '#4a7a6b', 'font-size': '13', 'text-anchor': dir > 0 ? 'start' : 'end',
    }));
  } else {
    out.push(label(sx(st.s), y - 34, 'at rest', { 'text-anchor': 'middle', fill: '#8a5a12', 'font-size': '14', 'font-weight': '600' }));
  }

  draw($('track'), out);
}

/* ------------------------------------------------------------------ */
/* The three graphs                                                    */
/* ------------------------------------------------------------------ */

function makeMap(box) {
  const { x0, x1, y0, y1, w, h, pad } = box;
  return {
    sx: x => pad.l + (x - x0) / (x1 - x0) * (w - pad.l - pad.r),
    sy: y => h - pad.b - (y - y0) / (y1 - y0) * (h - pad.t - pad.b),
  };
}
function frame(map, box, yTicks, yLabel) {
  const out = [];
  for (let t = T0; t <= T1; t++) {
    out.push(line(map.sx(t), box.pad.t, map.sx(t), box.h - box.pad.b, '#ebe6df', 1));
    out.push(label(map.sx(t), box.h - box.pad.b + 18, String(t), { 'text-anchor': 'middle', fill: '#6c6a64', 'font-size': '12' }));
  }
  for (const yv of yTicks) {
    out.push(line(box.pad.l, map.sy(yv), box.w - box.pad.r, map.sy(yv), '#ebe6df', 1));
    out.push(label(box.pad.l - 7, map.sy(yv) + 4, String(yv), { 'text-anchor': 'end', fill: '#6c6a64', 'font-size': '12' }));
  }
  out.push(line(box.pad.l, map.sy(0), box.w - box.pad.r, map.sy(0), '#b0aea5', 1.5));
  out.push(label(box.w - box.pad.r, box.h - box.pad.b + 18, 't', { 'text-anchor': 'end', fill: '#6c6a64', 'font-size': '13' }));
  out.push(label(box.pad.l - 7, box.pad.t + 2, yLabel, { 'text-anchor': 'end', fill: '#6c6a64', 'font-size': '12' }));
  return out;
}
function curve(map, f, box, stroke, steps = 400) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = T0 + (T1 - T0) * i / steps;
    pts.push(`${map.sx(t).toFixed(2)},${map.sy(f(t)).toFixed(2)}`);
  }
  return el('path', { d: `M ${pts.join(' L ')}`, fill: 'none', stroke, 'stroke-width': 2.5 });
}
function nowLine(map, box, color = '#141413') {
  return line(map.sx(state.t), box.pad.t, map.sx(state.t), box.h - box.pad.b, color, 1.5, { 'stroke-dasharray': '4 4' });
}

const POS_BOX = { x0: 0, x1: 5, y0: -1, y1: 24, w: 500, h: 260, pad: { l: 42, r: 14, t: 14, b: 30 } };
const VEL_BOX = { x0: 0, x1: 5, y0: -5, y1: 25, w: 500, h: 260, pad: { l: 42, r: 14, t: 14, b: 30 } };
const ACC_BOX = { x0: 0, x1: 5, y0: -14, y1: 20, w: 900, h: 220, pad: { l: 42, r: 14, t: 14, b: 30 } };

function renderGraphs() {
  const st = motionState(state.t);

  const p = POS_BOX, mp = makeMap(p);
  const op = frame(mp, p, [0, 5, 10, 15, 20], 's');
  op.push(curve(mp, position, p, '#cc785c'));
  op.push(nowLine(mp, p));
  op.push(dot(mp.sx(state.t), mp.sy(st.s), '#cc785c', 6));
  draw($('g-pos'), op);

  const v = VEL_BOX, mv = makeMap(v);
  const ov = frame(mv, v, [0, 5, 10, 15, 20, 25], 'v');
  // shade where v < 0 to make backward motion visible
  const restTimes = turningPoints().map(x => x.t);
  ov.push(rect(mv.sx(restTimes[0]), mv.sy(0), mv.sx(restTimes[1]) - mv.sx(restTimes[0]), 5, '#f0e2d8'));
  ov.push(curve(mv, velocity, v, '#4a7a6b'));
  ov.push(nowLine(mv, v));
  ov.push(dot(mv.sx(state.t), mv.sy(st.v), '#4a7a6b', 6));
  draw($('g-vel'), ov);

  const a = ACC_BOX, ma = makeMap(a);
  const oa = frame(ma, a, [-12, -6, 0, 6, 12, 18], 'a');
  oa.push(curve(ma, acceleration, a, '#8a5a12'));
  oa.push(nowLine(ma, a));
  oa.push(dot(ma.sx(state.t), ma.sy(st.a), '#8a5a12', 6));
  draw($('g-acc'), oa);
}

/* ------------------------------------------------------------------ */
/* Sign table and the readouts                                         */
/* ------------------------------------------------------------------ */

const SIGN_ROWS = [
  { from: 0, to: 1, open: '[0, 1)' },
  { from: 1, to: 2, open: '(1, 2)' },
  { from: 2, to: 3, open: '(2, 3)' },
  { from: 3, to: 5, open: '(3, 5]' },
];

function signTable() {
  const rows = SIGN_ROWS.map(r => {
    const mid = (r.from + r.to) / 2;
    const v = velocity(mid), a = acceleration(mid);
    const vs = v > 0 ? 'positive' : 'negative';
    const as = a > 0 ? 'positive' : 'negative';
    const same = (v > 0) === (a > 0);
    return `<tr><td>${r.open}</td><td>${vs}</td><td>${as}</td>`
      + `<td>${same ? '<span class="tag ok">yes</span>' : '<span class="tag bad">no</span>'}</td>`
      + `<td>${same ? 'speeding up' : 'slowing down'}</td></tr>`;
  });
  $('sign-table').innerHTML = rows.join('');
}

function renderReadouts() {
  const st = motionState(state.t);
  $('r-s').textContent = fmt(st.s, 3);
  $('r-v').textContent = fmt(st.v, 3);
  $('r-a').textContent = fmt(st.a, 3);
  $('r-speed').textContent = fmt(st.speed, 3);
  $('t-value').textContent = state.t.toFixed(2);
  $('t').value = String(state.t);

  const v = $('verdict');
  const dirWord = st.direction === 'at rest' ? 'momentarily at rest' : `moving ${st.direction}`;
  v.innerHTML = `At <b>t = ${state.t.toFixed(2)} s</b> the particle is <b>${dirWord}</b> `
    + `and is <b>${st.change}</b>. Velocity is ${fmt(st.v, 3)} m/s and acceleration is ${fmt(st.a, 3)} m/s² — `
    + `${st.change === 'speeding up' ? 'the two have the same sign' : st.change === 'slowing down' ? 'the two have opposite signs' : 'one of them is zero'}.`;
}

/* ------------------------------------------------------------------ */
/* Distance versus displacement                                        */
/* ------------------------------------------------------------------ */

function renderTravel() {
  const r = travel(0, 5);
  const legs = r.legs.map((l, i) => {
    const dir = l.change > 0 ? 'forward' : 'backward';
    return `<tr><td>${i + 1}: ${l.from.toFixed(2)} → ${l.to.toFixed(2)} s</td>`
      + `<td class="num">${position(l.from).toFixed(2)}</td>`
      + `<td class="num">${position(l.to).toFixed(2)}</td>`
      + `<td class="num">${l.length.toFixed(2)} m (${dir})</td></tr>`;
  });
  $('legs').innerHTML = legs.join('');
  $('total-distance').textContent = fmt(r.distance, 2) + ' m';
  $('displacement').textContent = fmt(r.displacement, 2) + ' m';
  $('dist-gap').textContent = fmt(r.distance - r.displacement, 2) + ' m';

  // bar chart
  const W = 500, H = 300, padL = 70, padB = 60, padT = 24, padR = 40;
  const maxV = Math.max(r.distance, Math.abs(r.displacement)) * 1.15;
  const barW = 90;
  const baseY = H - padB;
  const scale = v => (baseY - padT) * v / maxV;
  const out = [
    line(padL - 10, baseY, W - padR, baseY, '#b0aea5', 2),
    label(padL - 20, padT + 4, String(Math.round(maxV)), { 'text-anchor': 'end', fill: '#6c6a64', 'font-size': '12' }),
    label(padL - 20, baseY + 4, '0', { 'text-anchor': 'end', fill: '#6c6a64', 'font-size': '12' }),
  ];
  const bars = [
    { x: padL + 50, v: r.distance, color: '#cc785c', name: 'distance', val: r.distance },
    { x: padL + 210, v: r.displacement, color: '#4a7a6b', name: 'displacement', val: r.displacement },
  ];
  for (const b of bars) {
    out.push(rect(b.x, baseY - scale(b.v), barW, scale(b.v), b.color));
    out.push(label(b.x + barW / 2, baseY - scale(b.v) - 10, `${b.val.toFixed(1)} m`, {
      'text-anchor': 'middle', fill: '#141413', 'font-size': '15', 'font-weight': '600',
    }));
    out.push(label(b.x + barW / 2, baseY + 24, b.name, { 'text-anchor': 'middle', fill: '#3d3d3a', 'font-size': '14' }));
  }
  out.push(label(W / 2, H - 12, `the 8 m gap is ground covered twice`, {
    'text-anchor': 'middle', fill: '#6c6a64', 'font-size': '13',
  }));
  draw($('g-dist'), out);
}

/* ------------------------------------------------------------------ */
/* Wiring                                                              */
/* ------------------------------------------------------------------ */

const state = { t: 0, playing: false, timer: null };

function refresh() {
  renderReadouts();
  renderTrack();
  renderGraphs();
}

$('t').addEventListener('input', e => {
  state.t = Number(e.target.value);
  refresh();
});
for (const b of document.querySelectorAll('button[data-t]')) {
  b.addEventListener('click', () => {
    state.t = Number(b.dataset.t);
    stop();
    refresh();
  });
}

function stop() {
  state.playing = false;
  $('play').textContent = 'Play';
  if (state.timer !== null) { clearInterval(state.timer); state.timer = null; }
}
$('play').addEventListener('click', () => {
  if (state.playing) { stop(); return; }
  state.playing = true;
  $('play').textContent = 'Pause';
  state.timer = setInterval(() => {
    state.t = state.t >= T1 - 1e-9 ? T0 : Math.min(T1, state.t + 0.02);
    refresh();
  }, 40);
});

signTable();
renderTravel();
refresh();
