(() => {
  const plot = document.getElementById('newton-plot-content');
  if (!plot) return;
  const current = document.getElementById('newton-current');
  const nextText = document.getElementById('newton-next');
  const description = document.getElementById('newton-plot-desc');
  const draw = document.getElementById('newton-draw');
  const take = document.getElementById('newton-take');
  const reset = document.getElementById('newton-reset');
  const subs = ['₀', '₁', '₂', '₃', '₄'];
  let x = 1, n = 0, tangent = false;
  const f = value => value * value - 2;
  const X = value => 64 + (value - 0.7) / 1.1 * 452;
  const Y = value => 255 - (value + 1.6) / 2.9 * 220;
  const number = value => Math.abs(value) < 1e-8 && value !== 0 ? value.toExponential(4) : value.toFixed(10).replace(/\.?0+$/, '');
  const path = fn => Array.from({length: 201}, (_, i) => {
    const value = 0.7 + 1.1 * i / 200;
    return `${i ? 'L' : 'M'}${X(value).toFixed(2)},${Y(fn(value)).toFixed(2)}`;
  }).join(' ');

  function render() {
    const y = f(x), next = x - y / (2 * x);
    let svg = '<defs><clipPath id="newton-step-clip"><rect x="64" y="35" width="452" height="220"/></clipPath></defs><g font-family="Arial,sans-serif" font-size="17" fill="#3d3d3a">';
    for (const tick of [0.8, 1, 1.2, 1.4, 1.6, 1.8]) {
      svg += `<path d="M${X(tick)} 35V255" stroke="#e6dfd8"/><text x="${X(tick)}" y="280" text-anchor="middle">${tick.toFixed(1)}</text>`;
    }
    for (const tick of [-1, 0, 1]) {
      svg += `<path d="M64 ${Y(tick)}H516" stroke="#e6dfd8"/><text x="53" y="${Y(tick) + 6}" text-anchor="end">${tick}</text>`;
    }
    svg += `<path d="M64 35V255M64 ${Y(0)}H516" stroke="#8e8b82" fill="none"/><text x="64" y="22">g(x) = x² − 2</text><text x="516" y="320" text-anchor="end">x</text><g clip-path="url(#newton-step-clip)">`;
    if (tangent) {
      svg += `<path d="M${X(x)} ${Y(0)}V${Y(y)}L${X(next)} ${Y(0)}Z" fill="#fbe9d9"/><path d="${path(value => y + 2 * x * (value - x))}" fill="none" stroke="#a9583e" stroke-width="2.5" stroke-dasharray="7 5"/>`;
    }
    svg += `<path d="${path(f)}" fill="none" stroke="#3f5f8a" stroke-width="3.5"/></g><path d="M${X(x)} ${Y(0)}V${Y(y)}" stroke="#a9583e" stroke-width="2" stroke-dasharray="5 4"/><circle cx="${X(x)}" cy="${Y(y)}" r="5" fill="#a9583e"/><circle cx="${X(x)}" cy="${Y(0)}" r="4" fill="#a9583e"/>`;
    svg += `<text x="${X(x)}" y="${Y(0) + 25}" text-anchor="middle" fill="#a9583e">current x${subs[n]}</text>`;
    if (tangent) {
      svg += `<circle cx="${X(next)}" cy="${Y(0)}" r="5" fill="#456b2e"/><text x="${X(next)}" y="${Y(0) + 48}" text-anchor="middle" fill="#456b2e">next x${subs[n + 1]}</text>`;
    }
    plot.innerHTML = svg + '</g>';
    current.textContent = `Step ${n}: current guess x${subs[n]} = ${number(x)}; g(x${subs[n]}) = ${number(y)}.`;
    current.dataset.step = String(n);
    current.dataset.value = String(x);
    current.dataset.residual = String(y);
    if (n === 4) {
      nextText.textContent = 'Four steps completed. The residual is about 4.51 × 10⁻¹² using the unrounded guess. Reset to watch again.';
    } else if (tangent) {
      nextText.textContent = `The tangent is y = ${number(y)} + ${number(2 * x)}(x − ${number(x)}). Its intercept is x${subs[n + 1]} = ${number(next)}. Use that intercept as the next guess.`;
    } else {
      nextText.textContent = 'Draw the tangent at this point, then use its intercept as the next guess.';
    }
    description.textContent = tangent
      ? `At step ${n}, the current point is (${x}, ${y}). The tangent crosses the axis at ${next}, which is the next guess.`
      : `At step ${n}, the current guess is ${x} and the curve value is ${y}. Draw its tangent to find the next guess.`;
    draw.disabled = tangent || n === 4;
    take.disabled = !tangent || n === 4;
  }
  draw.addEventListener('click', () => { tangent = true; render(); });
  take.addEventListener('click', () => { x -= f(x) / (2 * x); n += 1; tangent = false; render(); });
  reset.addEventListener('click', () => { x = 1; n = 0; tangent = false; render(); });
  render();
})();
