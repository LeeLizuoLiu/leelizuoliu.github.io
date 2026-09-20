// Stable identities avoid subtracting nearly equal sine/cosine values.
export function sinc(x) {
  if (!Number.isFinite(x)) throw new RangeError('Use a finite angle.');
  if (Math.abs(x) < 1e-4) { const z=x*x; return 1-z/6+z*z/120; }
  return Math.sin(x)/x;
}
export function trigState(theta,h,kind='sin') {
  if (!Number.isFinite(theta)||theta<0||theta>2*Math.PI||!Number.isFinite(h)||Math.abs(h)>.8) throw new RangeError('Angle or increment outside the lesson range.');
  if (!['sin','cos'].includes(kind)) throw new RangeError('Choose sine or cosine.');
  const c=theta===0||theta===2*Math.PI?1:theta===Math.PI?-1:theta===Math.PI/2||theta===3*Math.PI/2?0:Math.cos(theta);
  const s=theta===0||theta===Math.PI||theta===2*Math.PI?0:theta===Math.PI/2?1:theta===3*Math.PI/2?-1:Math.sin(theta);
  const a=Math.abs(h), A=h===0?null:sinc(h), B=h===0?null:-Math.sin(h/2)*sinc(h/2);
  const term1=h===0?null:(kind==='sin'?s:c)*B;
  const term2=h===0?null:(kind==='sin'?c:-s)*A;
  const slope=kind==='sin'?c:-s;
  return {theta,h,kind,alpha:a,A,B,term1,term2,slope,value:kind==='sin'?s:c,
    quotient:h===0?null:term1+term2,
    areas:{inner:Math.sin(a)/2,sector:a/2,outer:Math.tan(a)/2},lower:Math.cos(h)};
}
export const fmt=x=>x===null?'Undefined (0/0)':Object.is(x,-0)||x===0?'0':Math.abs(x)<1e-4?x.toExponential(3):String(Number(x.toFixed(6)));
