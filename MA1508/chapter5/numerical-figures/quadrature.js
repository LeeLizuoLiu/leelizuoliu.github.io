(function (root) {
  'use strict';
  const cases={
    exp:{label:'eˣ on [0, 1]',a:0,b:1,f:Math.exp,exact:Math.E-1,k2:Math.E,k4:Math.E,derivatives:'|f″| ≤ e, |f⁽⁴⁾| ≤ e'},
    sin:{label:'sin x on [0, π]',a:0,b:Math.PI,f:Math.sin,exact:2,k2:1,k4:1,derivatives:'|f″| ≤ 1, |f⁽⁴⁾| ≤ 1'},
    quartic:{label:'x⁴ on [0, 1]',a:0,b:1,f:x=>x**4,exact:1/5,k2:12,k4:24,derivatives:'|f″| ≤ 12, |f⁽⁴⁾| ≤ 24'},
    square:{label:'x² on [0, 1]',a:0,b:1,f:x=>x*x,exact:1/3,k2:2,k4:0,derivatives:'|f″| ≤ 2, f⁽⁴⁾ = 0'}
  };
  function calc(c,n){
    const h=(c.b-c.a)/n,values=Array.from({length:n+1},(_,i)=>c.f(c.a+i*h));
    let ts=(values[0]+values[n])/2,ss=values[0]+values[n];
    for(let i=1;i<n;i++){ts+=values[i];ss+=(i%2?4:2)*values[i];}
    const T=h*ts,S=h*ss/3,clean=x=>Math.abs(x)<1e-14?0:Math.abs(x);
    return {n,h,values,T,S,errorT:clean(T-c.exact),errorS:clean(S-c.exact),boundT:c.k2*(c.b-c.a)**3/(12*n*n),boundS:c.k4*(c.b-c.a)**5/(180*n**4)};
  }
  root.MA1508Quadrature={cases,calc};
  if(typeof document==='undefined')return;
  const studio=document.getElementById('quadrature-studio');if(!studio)return;
  const $=s=>studio.querySelector(s),select=$('[data-function]'),slider=$('[data-count]'),button=$('[data-play]');
  const ns='http://www.w3.org/2000/svg';
  const el=(name,attrs={},text)=>{const e=document.createElementNS(ns,name);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);if(text!==undefined)e.textContent=text;return e;};
  const fmt=x=>x===0?'0':Math.abs(x)<0.0001?x.toExponential(3):Number(x.toFixed(6)).toString();
  const teal='#357b70',coral='#c46d51',purple='#544260',ink='#363b39',muted='#68726e';
  function drawMethod(svg,c,r,method){
    const L=51,R=426,top=38,base=220,X=x=>L+(x-c.a)/(c.b-c.a)*(R-L);
    const ymax=Math.max(...Array.from({length:101},(_,i)=>c.f(c.a+i*(c.b-c.a)/100)))*1.1;
    const Y=y=>base-(y/ymax)*(base-top);
    svg.replaceChildren(el('title',{},method==='T'?'Trapezoidal approximation':'Simpson approximation'));
    for(let i=0;i<=4;i++){
      let xx=L+i*(R-L)/4,yy=base-i*(base-top)/4;
      svg.append(el('line',{x1:xx,y1:top,x2:xx,y2:base,stroke:'#eeeae3'}),el('line',{x1:L,y1:yy,x2:R,y2:yy,stroke:'#eeeae3'}));
      let x=c.a+i*(c.b-c.a)/4;svg.append(el('text',{x:xx,y:241,'text-anchor':'middle',fill:muted,'font-size':11},fmt(x)),el('text',{x:L-8,y:yy+4,'text-anchor':'end',fill:muted,'font-size':11},String(Number((ymax*i/4).toFixed(2)))));
    }
    const fill=method==='T'?'#c6ded4':'#f1d0bf',stroke=method==='T'?teal:coral;
    const h=r.h;
    if(method==='T'){
      for(let i=0;i<r.n;i++){
        let x0=X(c.a+i*h),x1=X(c.a+(i+1)*h),y0=Y(r.values[i]),y1=Y(r.values[i+1]);
        svg.append(el('path',{d:`M${x0} ${base} L${x0} ${y0} L${x1} ${y1} L${x1} ${base} Z`,fill,stroke,'stroke-width':1.1}));
      }
    }else{
      for(let i=0;i<r.n;i+=2){
        let x0=X(c.a+i*h),xm=X(c.a+(i+1)*h),x1=X(c.a+(i+2)*h),y0=Y(r.values[i]),ym=Y(r.values[i+1]),y1=Y(r.values[i+2]),control=2*ym-(y0+y1)/2;
        svg.append(el('path',{d:`M${x0} ${base} L${x0} ${y0} Q${xm} ${control} ${x1} ${y1} L${x1} ${base} Z`,fill,stroke,'stroke-width':1.2}));
      }
    }
    let path='';for(let i=0;i<=220;i++){let x=c.a+i*(c.b-c.a)/220;path+=`${i?'L':'M'}${X(x)} ${Y(c.f(x))} `;}
    svg.append(el('path',{d:path,fill:'none',stroke:purple,'stroke-width':2.7}));
    svg.append(el('line',{x1:L,y1:base,x2:R+6,y2:base,stroke:ink}),el('line',{x1:L,y1:base,x2:L,y2:top-8,stroke:ink}));
    for(let i=0;i<=r.n;i++)svg.append(el('circle',{cx:X(c.a+i*h),cy:Y(r.values[i]),r:r.n>20?1.8:2.8,fill:stroke,stroke:'#fff', 'stroke-width':.7}));
    svg.append(el('text',{x:L,y:20,fill:ink,'font-size':13,'font-weight':600},method==='T'?'Straight-line panels':'Parabolic panels'),el('text',{x:8,y:28,fill:ink,'font-size':12},'f(x)'),el('text',{x:R,y:263,'text-anchor':'end',fill:ink,'font-size':12},'x'));
  }
  function drawErrors(svg,c,selected){
    const L=67,R=814,top=30,base=218,X=n=>L+(n-2)/38*(R-L),rates=Array.from({length:20},(_,i)=>calc(c,2+2*i));
    const data=[['errorT',teal,false],['boundT',teal,true],['errorS',coral,false],['boundS',coral,true]];
    const positives=data.flatMap(([k])=>rates.map(r=>r[k])).filter(v=>v>0);
    let high=Math.ceil(Math.log10(Math.max(...positives))),low=Math.max(-14,Math.floor(Math.log10(Math.min(...positives))));
    if(high-low<3)low=high-3;
    const Y=v=>base-(Math.log10(Math.max(10**low,v))-low)/(high-low)*(base-top);
    svg.replaceChildren(el('title',{},'Absolute error and theoretical bounds as the number of subintervals increases'));
    const tickstep=Math.max(1,Math.ceil((high-low)/5));
    for(let e=high;e>=low;e-=tickstep){let y=Y(10**e);svg.append(el('line',{x1:L,y1:y,x2:R,y2:y,stroke:'#ece8e1'}),el('text',{x:L-9,y:y+4,'text-anchor':'end',fill:muted,'font-size':12},`10^${e}`));}
    for(const n of [2,10,20,30,40])svg.append(el('text',{x:X(n),y:239,'text-anchor':'middle',fill:muted,'font-size':12},String(n)));
    for(const [key,color,dashed] of data){
      const valid=rates.filter(r=>r[key]>0);if(!valid.length)continue;
      let d=valid.map((r,i)=>`${i?'L':'M'}${X(r.n)} ${Y(r[key])}`).join(' ');
      svg.append(el('path',{d,fill:'none',stroke:color,'stroke-width':dashed?2:2.8,...(dashed?{'stroke-dasharray':'6 5'}:{})}));
      if(selected[key]>0)svg.append(el('circle',{cx:X(selected.n),cy:Y(selected[key]),r:dashed?3:4.5,fill:dashed?'#fff':color,stroke:color,'stroke-width':1.7}));
    }
    svg.append(el('line',{x1:X(selected.n),y1:top,x2:X(selected.n),y2:base,stroke:'#9a938b','stroke-dasharray':'3 4'}),el('line',{x1:L,y1:base,x2:R,y2:base,stroke:ink}),el('line',{x1:L,y1:top,x2:L,y2:base,stroke:ink}));
    svg.append(el('text',{x:R,y:260,'text-anchor':'end',fill:ink,'font-size':12},'number of subintervals n'),el('text',{x:L,y:17,fill:ink,'font-size':12},'Absolute error · logarithmic scale'));
  }
  let frame=0,start=null,lastn=null;
  function render(){
    const c=cases[select.value],n=Number(slider.value),r=calc(c,n);
    $('[data-count-value]').textContent=n;$('[data-step]').textContent=fmt(r.h);$('[data-exact]').textContent=fmt(c.exact);$('[data-derivatives]').textContent=c.derivatives;
    $('[data-t-value]').textContent=fmt(r.T);$('[data-s-value]').textContent=fmt(r.S);
    $('[data-t-error]').textContent=fmt(r.errorT);$('[data-s-error]').textContent=fmt(r.errorS);
    $('[data-t-bound]').textContent=fmt(r.boundT);$('[data-s-bound]').textContent=fmt(r.boundS);
    $('[data-t-status]').textContent=r.boundT?fmt(100*r.errorT/r.boundT)+'% of bound':'zero bound';
    $('[data-s-status]').textContent=r.boundS?fmt(100*r.errorS/r.boundS)+'% of bound':'exact for this quadratic';
    drawMethod($('[data-trapezoid]'),c,r,'T');drawMethod($('[data-simpson]'),c,r,'S');drawErrors($('[data-errors]'),c,r);
  }
  function stop(){if(frame)cancelAnimationFrame(frame);frame=0;start=null;lastn=null;button.textContent='▶ Play refinement';}
  function tick(ts){if(start===null)start=ts;let p=Math.min(1,(ts-start)/11000),n=2+2*Math.floor(p*19);if(n!==lastn){slider.value=n;lastn=n;render();}if(p>=1){stop();return;}frame=requestAnimationFrame(tick);}
  button.addEventListener('click',()=>{if(frame){stop();return;}slider.value=2;render();button.textContent='❚❚ Pause';frame=requestAnimationFrame(tick);});
  slider.addEventListener('input',()=>{stop();render();});select.addEventListener('change',()=>{stop();render();});
  $('[data-reset]').addEventListener('click',()=>{stop();select.value='exp';slider.value=4;render();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});render();
})(globalThis);

(function () {
  'use strict';
  if (typeof document === 'undefined') return;
  const host = document.querySelector('[data-three-point-rules]');
  if (!host) return;
  const $ = selector => host.querySelector(selector);
  const slider = $('[data-three-height]');
  const ns = 'http://www.w3.org/2000/svg';
  const node = (name, attrs = {}, text) => {
    const item = document.createElementNS(ns, name);
    Object.entries(attrs).forEach(([key, value]) => item.setAttribute(key, value));
    if (text !== undefined) item.textContent = text;
    return item;
  };
  const label = (x, y, text, attrs = {}) => node('text', {x, y, fill:'#68726e', 'font-size':12, ...attrs}, text);

  function draw(svg, method, y1) {
    const L = 34, R = 300, top = 27, base = 221;
    const X = t => L + (t + 1.5) * (R - L) / 3;
    const Y = y => base - y * (base - top) / 3.2;
    const samples = [[-1,1.2], [0,y1], [1,2]];
    const color = {midpoint:'#357b70', trapezoid:'#c46d51', simpson:'#65507d'}[method];
    const fill = {midpoint:'#cce2d7', trapezoid:'#f1d3c4', simpson:'#e2d6ed'}[method];
    const titles = {midpoint:'Three midpoint rectangles', trapezoid:'Two straight-line trapezoids', simpson:'The quadratic through all three samples'};
    svg.replaceChildren(node('title', {}, titles[method]), node('desc', {}, `Samples at minus h, zero and h have heights 1.2, ${y1.toFixed(2)} and 2. ${method === 'midpoint' ? 'The three rectangles are centred at these samples and cover minus three h over two to three h over two.' : 'The shaded region runs from minus h to h.'}`));
    for (const y of [0,1,2,3]) {
      svg.append(node('line', {x1:L,y1:Y(y),x2:R,y2:Y(y),stroke:'#eeece5'}), label(L-8,Y(y)+4,String(y),{'text-anchor':'end','font-size':11}));
    }
    if (method === 'midpoint') {
      for (const [t,y] of samples) svg.append(node('rect', {x:X(t-.5),y:Y(y),width:X(t+.5)-X(t-.5),height:base-Y(y),fill,stroke:color,'stroke-width':1.5}));
    } else if (method === 'trapezoid') {
      for (let i=0; i<2; i++) {
        const [t0,y0]=samples[i], [t1,nextY]=samples[i+1];
        svg.append(node('path', {d:`M${X(t0)} ${base} L${X(t0)} ${Y(y0)} L${X(t1)} ${Y(nextY)} L${X(t1)} ${base} Z`,fill,stroke:color,'stroke-width':1.8}));
      }
    } else {
      // A quadratic Bezier midpoint equals half its control height plus a quarter of each endpoint height.
      const controlY = 2*Y(y1)-(Y(1.2)+Y(2))/2;
      svg.append(node('path', {d:`M${X(-1)} ${base} L${X(-1)} ${Y(1.2)} Q${X(0)} ${controlY} ${X(1)} ${Y(2)} L${X(1)} ${base} Z`,fill,stroke:color,'stroke-width':1.8}));
    }
    svg.append(node('line', {x1:L,y1:base,x2:R+5,y2:base,stroke:'#68726e'}));
    for (const [i,[t,y]] of samples.entries()) {
      svg.append(node('circle', {cx:X(t),cy:Y(y),r:i===1?5:4,fill:i===1?'#c46d51':color,stroke:'#fffefb','stroke-width':1.4}));
      svg.append(label(X(t),Y(y)-11,`y${['₀','₁','₂'][i]} = ${y.toFixed(2)}`,{'text-anchor':'middle',fill:'#34433e','font-size':11,'font-weight':600}));
      svg.append(label(X(t),base+22,['−h','0','h'][i],{'text-anchor':'middle'}));
    }
    svg.append(label(R,base+37,'t',{'text-anchor':'end','font-style':'italic'}));
  }
  function render() {
    const y1 = Number(slider.value);
    $('[data-three-height-value]').textContent = y1.toFixed(2);
    for (const method of ['midpoint','trapezoid','simpson']) draw($(`[data-three-${method}]`),method,y1);
  }
  slider.addEventListener('input', render);
  render();
})();

(function () {
  'use strict';
  if (typeof document === 'undefined') return;
  const host = document.querySelector('[data-sample-rules]');
  if (!host) return;
  const $ = selector => host.querySelector(selector);
  const position = $('[data-sample-position]'), shape = $('[data-sample-shape]');
  const samplePlay = $('[data-sample-play]'), shapePlay = $('[data-shape-play]');
  const ns = 'http://www.w3.org/2000/svg', h = .25, f = x => x*x;
  const colors = {teal:'#357b70', coral:'#c46d51', purple:'#65507d', muted:'#68726e', gold:'#aa7b30'};
  const node = (name, attrs = {}, text) => {
    const item = document.createElementNS(ns, name);
    Object.entries(attrs).forEach(([key,value]) => item.setAttribute(key,value));
    if (text !== undefined) item.textContent = text;
    return item;
  };
  const label = (x,y,text,attrs = {}) => node('text',{x,y,fill:colors.muted,'font-size':12,...attrs},text);
  let frame = 0, started = null, playing = null;

  function heights(left,theta,blend) {
    if (blend === 0) return [f(left+theta*h),f(left+theta*h)];
    const middle = f(left+h/2);
    return [(1-blend)*middle+blend*f(left), (1-blend)*middle+blend*f(left+h)];
  }
  function draw(svg,detail,theta,blend) {
    const L = detail ? 46 : 48, R = detail ? 288 : 486;
    const top = 34, base = 250, end = detail ? h : 1, ymax = detail ? .075 : 1.12;
    const X = x => L+x/end*(R-L), Y = y => base-y/ymax*(base-top);
    const color = blend === 0 ? colors.teal : colors.coral;
    const fill = blend === 0 ? '#cce2d7' : '#f1d3c4';
    svg.replaceChildren(node('title',{},detail?'First interval: sample height and endpoint chord':'Fixed intervals with moving samples and changing panel shapes'), node('desc',{},`The function is x squared. Samples are at fraction ${theta.toFixed(2)} of each interval. The transition from midpoint rectangles to endpoint chords is ${Math.round(blend*100)} percent complete.`));
    const ticks = detail ? [[0,'0'],[1/32,'1/32'],[1/16,'1/16']] : [[0,'0'],[.5,'0.5'],[1,'1']];
    for (const [y,text] of ticks) svg.append(node('line',{x1:L,y1:Y(y),x2:R,y2:Y(y),stroke:'#ecebe4'}), label(L-8,Y(y)+4,text,{'text-anchor':'end','font-size':11}));
    for (let i=0;i<(detail?1:4);i++) {
      const left=i*h,right=left+h,[p0,p1]=heights(left,theta,blend);
      svg.append(node('path',{d:`M${X(left)} ${base} L${X(left)} ${Y(p0)} L${X(right)} ${Y(p1)} L${X(right)} ${base} Z`,fill,stroke:color,'stroke-width':i===0?2:1.2,'fill-opacity':i===0?1:.75}));
    }
    let curve='';
    for(let i=0;i<=180;i++){const x=end*i/180;curve+=`${i?'L':'M'}${X(x)} ${Y(f(x))} `;}
    svg.append(node('path',{d:curve,fill:'none',stroke:colors.purple,'stroke-width':2.8}));
    svg.append(node('line',{x1:L,y1:base,x2:R+6,y2:base,stroke:colors.muted}));
    const xTicks=detail?[[0,'0'],[h/2,'h/2'],[h,'h']]:[[0,'0'],[.25,'1/4'],[.5,'1/2'],[.75,'3/4'],[1,'1']];
    for (const [x,text] of xTicks) svg.append(label(X(x),base+23,text,{'text-anchor':'middle'}));
    svg.append(label(R+4,base+41,'x',{'font-style':'italic'}), label(L,20,detail?'First interval, enlarged':'Four fixed intervals',{'font-size':13}));
    if (blend===0) {
      for(let i=0;i<(detail?1:4);i++){
        const x=(i+theta)*h;
        svg.append(node('circle',{cx:X(x),cy:Y(f(x)),r:detail?5:4.5,fill:colors.coral,stroke:'#fffefb','stroke-width':1.4}));
      }
    } else {
      for(let i=0;i<=(detail?1:4);i++)svg.append(node('circle',{cx:X(i*h),cy:Y(f(i*h)),r:detail?4.5:3.7,fill:colors.coral,stroke:'#fffefb','stroke-width':1.2}));
    }
    if(detail && theta===.5){
      const midpoint=f(h/2), average=(f(0)+f(h))/2;
      const current=heights(0,theta,blend).reduce((a,b)=>a+b,0)/2;
      svg.append(node('line',{x1:L,y1:Y(midpoint),x2:R,y2:Y(midpoint),stroke:'#9b9e94','stroke-dasharray':'3 5'}));
      svg.append(node('line',{x1:L,y1:Y(average),x2:R,y2:Y(average),stroke:colors.gold,'stroke-dasharray':'5 4'}));
      svg.append(label(L+8,Y(midpoint)+18,'f(midpoint)',{'font-size':12,fill:colors.purple}), label(L+8,Y(average)-9,'Endpoint average',{'font-size':12,fill:colors.gold}));
      svg.append(node('line',{x1:X(h/2),y1:Y(midpoint),x2:X(h/2),y2:Y(current),stroke:colors.coral,'stroke-dasharray':'3 3'}));
      svg.append(node('circle',{cx:X(h/2),cy:Y(midpoint),r:4,fill:colors.purple,stroke:'#fffefb','stroke-width':1}));
      if(blend>0)svg.append(node('circle',{cx:X(h/2),cy:Y(current),r:5,fill:'#fffefb',stroke:color,'stroke-width':2}));
    }
  }
  function render() {
    const theta=Number(position.value)/100,blend=Number(shape.value)/100;
    let area=0;
    for(let i=0;i<4;i++)area+=h*heights(i*h,theta,blend).reduce((a,b)=>a+b,0)/2;
    $('[data-position-value]').textContent=theta.toFixed(2);
    $('[data-shape-value]').textContent=`${Math.round(blend*100)}%`;
    $('[data-sample-estimate]').textContent=area.toFixed(6);
    $('[data-sample-mode]').textContent=blend===1?'Trapezoidal Rule':blend>0?`Midpoint → trapezoids · ${Math.round(blend*100)}%`:theta===0?'Left endpoint rectangles':theta===.5?'Midpoint Rule':theta===1?'Right endpoint rectangles':`Rectangles · sample fraction ${theta.toFixed(2)}`;
    draw($('[data-sample-overview]'),false,theta,blend);
    draw($('[data-sample-detail]'),true,theta,blend);
  }
  function stop() {
    if(frame)cancelAnimationFrame(frame);
    frame=0;started=null;playing=null;
    samplePlay.textContent='▶ Play left → right';shapePlay.textContent='▶ Play midpoint → trapezoids';
    samplePlay.setAttribute('aria-pressed','false');shapePlay.setAttribute('aria-pressed','false');
  }
  function tick(now) {
    if(started===null)started=now;
    const elapsed=now-started;
    let done;
    if(playing==='samples'){
      // Pause at the midpoint so its rule can be identified before continuing right.
      const theta=elapsed<2600?elapsed/5200:elapsed<3800?.5:Math.min(1,.5+(elapsed-3800)/5200);
      position.value=String(Math.round(100*theta));shape.value='0';done=elapsed>=6400;
    }else{
      position.value='50';shape.value=String(Math.round(100*Math.min(1,elapsed/4000)));done=elapsed>=4000;
    }
    render();
    if(done){stop();return;}
    frame=requestAnimationFrame(tick);
  }
  function start(kind) {
    if(playing===kind){stop();return;}
    stop();playing=kind;position.value=kind==='samples'?'0':'50';shape.value='0';
    const button=kind==='samples'?samplePlay:shapePlay;
    button.textContent='❚❚ Pause';button.setAttribute('aria-pressed','true');
    render();frame=requestAnimationFrame(tick);
  }
  position.addEventListener('input',()=>{stop();shape.value='0';render();});
  shape.addEventListener('input',()=>{stop();position.value='50';render();});
  samplePlay.addEventListener('click',()=>start('samples'));
  shapePlay.addEventListener('click',()=>start('shape'));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  render();
})();
