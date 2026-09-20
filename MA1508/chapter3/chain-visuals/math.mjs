export const defaults = Object.freeze({x:1,target:0.5,w1:0.8,w2:-0.6,b1:0.1,b2:0.2,v1:0.7,v2:-0.5,c:0.1});
export const parameterKeys = ['w1','b1','w2','b2','v1','v2','c'];
export function network(p) {
  for (const k of [...parameterKeys,'x','target']) if(!Number.isFinite(p[k])) throw new RangeError('Use finite inputs and parameters.');
  const z1=p.w1*p.x+p.b1,z2=p.w2*p.x+p.b2;
  const a1=Math.tanh(z1),a2=Math.tanh(z2),d1=1-a1*a1,d2=1-a2*a2;
  const prediction=p.v1*a1+p.v2*a2+p.c,error=prediction-p.target,loss=0.5*error*error;
  const delta1=error*p.v1*d1,delta2=error*p.v2*d2;
  const path1=delta1*p.w1,path2=delta2*p.w2;
  const gradients={w1:delta1*p.x,b1:delta1,w2:delta2*p.x,b2:delta2,v1:error*a1,v2:error*a2,c:error};
  return {z1,z2,a1,a2,d1,d2,prediction,error,loss,delta1,delta2,path1,path2,inputGradient:path1+path2,gradients};
}
export function gradientStep(p,rate) {
  if(!Number.isFinite(rate)||rate<=0)throw new RangeError('Use a positive learning rate.');
  const {gradients}=network(p);
  return {...p,...Object.fromEntries(parameterKeys.map(k=>[k,p[k]-rate*gradients[k]]))};
}
export const fmt = n => Math.abs(n)<1e-10?'0':Math.abs(n)<.0001?n.toExponential(3):String(Number(n.toFixed(4)));
