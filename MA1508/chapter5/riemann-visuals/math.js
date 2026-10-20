/* A small expression grammar and the finite sums used by the visual. No eval. */
(function (root) {
  'use strict';
  const funcs = {sin:Math.sin, cos:Math.cos, tan:Math.tan, exp:Math.exp, log:Math.log, ln:Math.log, sqrt:Math.sqrt, abs:Math.abs};
  function compile(source) {
    if (!source.trim() || source.length > 160) throw Error('Enter a formula of at most 160 characters.');
    const tokens = source.toLowerCase().match(/(?:\d*\.\d+|\d+\.?\d*)(?:e[+-]?\d+)?|[a-z]+|\*\*|[+\-*/^()]/g) || [];
    if (tokens.join('') !== source.toLowerCase().replace(/\s+/g,'')) throw Error('Use x, numbers, + − * / ^, parentheses and the listed functions.');
    let pos=0, depth=0;
    const peek=()=>tokens[pos];
    const take=()=>tokens[pos++];
    function primary() {
      if (++depth>40) throw Error('Please simplify this formula.');
      const t=take(); let node;
      if(t==='('){node=add();if(take()!==')')throw Error('Close each parenthesis.');}
      else if(t==='x')node={type:'x'};
      else if(t==='pi'||t==='e')node={type:'num',v:t==='pi'?Math.PI:Math.E};
      else if(t && /^\d|^\.\d/.test(t))node={type:'num',v:Number(t)};
      else if(funcs[t]){if(take()!=='(')throw Error('Use parentheses, for example sin(x).');node={type:'fn',op:t,a:add()};if(take()!==')')throw Error('Close the function parenthesis.');}
      else throw Error('Expected x, a number, or a supported function.');
      depth--; return node;
    }
    function power(){let a=primary();if(peek()==='^'||peek()==='**'){take();a={type:'op',op:'^',a,b:unary()};}return a;}
    function unary(){if(peek()==='+'||peek()==='-'){const op=take();return {type:'unary',op,a:unary()};}return power();}
    function mul(){let a=unary();while(peek()==='*'||peek()==='/'){const op=take();a={type:'op',op,a,b:unary()};}return a;}
    function add(){let a=mul();while(peek()==='+'||peek()==='-'){const op=take();a={type:'op',op,a,b:mul()};}return a;}
    const tree=add();if(pos!==tokens.length)throw Error('Put * between multiplied quantities, for example 2*x.');
    function value(n,x){
      if(n.type==='num')return n.v;if(n.type==='x')return x;
      const a=value(n.a,x);if(n.type==='unary')return n.op==='-'?-a:a;
      if(n.type==='fn')return funcs[n.op](a);
      const b=value(n.b,x);return n.op==='+'?a+b:n.op==='-'?a-b:n.op==='*'?a*b:n.op==='/'?a/b:a**b;
    }
    const evaluate=x=>{const y=value(tree,x);if(!Number.isFinite(y))throw Error('The formula must stay real and finite throughout [a, b].');return y;};
    // Interval ranges detect domain problems such as a pole between plotted points.
    function range(n,x){
      if(n.type==='num')return [n.v,n.v];if(n.type==='x')return x;
      const a=range(n.a,x);let z;
      if(n.type==='unary')z=n.op==='-'?[-a[1],-a[0]]:a;
      else if(n.type==='fn'){
        if((n.op==='log'||n.op==='ln')&&a[0]<=0)throw Error('log needs a positive argument throughout the interval.');
        if(n.op==='sqrt'&&a[0]<0)throw Error('sqrt needs a nonnegative argument throughout the interval.');
        if(n.op==='tan'&&Math.ceil((a[0]-Math.PI/2)/Math.PI)<=Math.floor((a[1]-Math.PI/2)/Math.PI))throw Error('tan has a pole on this interval.');
        if(n.op==='sin'||n.op==='cos')z=[-1,1];
        else if(n.op==='abs')z=[a[0]<=0&&a[1]>=0?0:Math.min(Math.abs(a[0]),Math.abs(a[1])),Math.max(Math.abs(a[0]),Math.abs(a[1]))];
        else z=[funcs[n.op](a[0]),funcs[n.op](a[1])];
      } else {
        const b=range(n.b,x);
        if(n.op==='+')z=[a[0]+b[0],a[1]+b[1]];
        else if(n.op==='-')z=[a[0]-b[1],a[1]-b[0]];
        else if(n.op==='*'){const p=[a[0]*b[0],a[0]*b[1],a[1]*b[0],a[1]*b[1]];z=[Math.min(...p),Math.max(...p)];}
        else if(n.op==='/'){
          if(b[0]<=0&&b[1]>=0)throw Error('The denominator may be zero. Choose a continuous formula on [a, b].');
          const p=[a[0]/b[0],a[0]/b[1],a[1]/b[0],a[1]/b[1]];z=[Math.min(...p),Math.max(...p)];
        }else{
          if(b[0]===b[1]&&Number.isInteger(b[0])){
            const k=b[0];if(k<0&&a[0]<=0&&a[1]>=0)throw Error('A negative power cannot cross zero.');
            const p=[a[0]**k,a[1]**k];if(k>0&&k%2===0&&a[0]<=0&&a[1]>=0)p.push(0);z=[Math.min(...p),Math.max(...p)];
          }else{
            if(a[0]<0||(a[0]===0&&b[0]<=0))throw Error('Use a positive base for general real powers.');
            const p=[a[0]**b[0],a[0]**b[1],a[1]**b[0],a[1]**b[1]];if(a[0]<=1&&a[1]>=1)p.push(1);z=[Math.min(...p),Math.max(...p)];
          }
        }
      }
      if(!z.every(Number.isFinite))throw Error('The formula becomes too large or undefined on this interval.');return z;
    }
    return {source,evaluate,validate(a,b){if(!Number.isFinite(a)||!Number.isFinite(b)||!(a<b)||!Number.isFinite(b-a))throw Error('Choose finite endpoints with a < b.');for(let i=0;i<128;i++)range(tree,[a+(b-a)*i/128,a+(b-a)*(i+1)/128]);evaluate(a);evaluate(b);}};
  }
  function partition(a,b,n,shape='equal'){
    const weights=Array.from({length:n},(_,i)=>shape==='uneven'?0.35+((i*37+11)%19)/9:1);
    const total=weights.reduce((s,v)=>s+v,0);let t=0;
    const cuts=[a];for(let i=1;i<n;i++){t+=weights[i-1]/total;const u=shape==='left'?t*t:shape==='right'?1-(1-t)**2:t;cuts.push(a+(b-a)*u);}cuts.push(b);return cuts;
  }
  function moveCut(cuts,i,x){const gap=(cuts.at(-1)-cuts[0])*1e-5;cuts[i]=Math.min(cuts[i+1]-gap,Math.max(cuts[i-1]+gap,x));return cuts;}
  function refine(cuts,tau){const p=[cuts[0]],t=[];for(let i=0;i<tau.length;i++){p.push((cuts[i]+cuts[i+1])/2,cuts[i+1]);t.push(tau[i],tau[i]);}return {cuts:p,tau:t};}
  function sum(cuts,tau,f){let total=0,pos=0,neg=0;const terms=tau.map((t,i)=>{const width=cuts[i+1]-cuts[i],x=cuts[i]+Math.max(0,Math.min(1,t))*width,y=f(x),term=y*width;total+=term;if(term>=0)pos+=term;else neg+=term;return {i:i+1,left:cuts[i],right:cuts[i+1],width,x,y,term};});return {total,pos,neg,mesh:Math.max(...terms.map(t=>t.width)),terms};}
  function simpson(f,a,b,n){const h=(b-a)/n;let s=f(a)+f(b);for(let i=1;i<n;i++)s+=(i%2?4:2)*f(a+i*h);return s*h/3;}
  const api={compile,partition,moveCut,refine,sum,simpson};
  root.RiemannMath=api;
  if(typeof module==='object'&&module.exports)module.exports=api;
})(globalThis);
