(function () {
  'use strict';
  const host = document.querySelector('[data-tail-lab]');
  if (!host) return;
  const $ = selector => host.querySelector(selector);
  const slider = $('[data-tail-cutoff]'), play = $('[data-tail-play]');
  const ns = 'http://www.w3.org/2000/svg';
  const node = (name, attrs = {}, text) => {
    const item = document.createElementNS(ns, name);
    Object.entries(attrs).forEach(([key, value]) => item.setAttribute(key, value));
    if (text !== undefined) item.textContent = text;
    return item;
  };
  const label = (x,y,text,attrs = {}) => node('text',{x,y,fill:'#68726e','font-size':12,...attrs},text);
  const maximum = Number(slider.max);
  let frame = 0, started = null, from = 2;

  function draw(svg, power, B) {
    const L=48, R=426, top=32, base=240;
    const X=x=>L+(x-1)/(maximum-1)*(R-L), Y=y=>base-y/1.1*(base-top);
    const f=x=>1/Math.pow(x,power);
    const color=power===2?'#357b70':'#c46d51',fill=power===2?'#cce2d7':'#f1d3c4';
    svg.replaceChildren(node('title',{},`Area under 1/x${power===2?' squared':''} from 1 to B = ${B.toFixed(1)}`),node('desc',{},`The shaded region ends at the finite upper limit ${B.toFixed(1)}. Axes stay fixed from x equals 1 to ${maximum}. Its exact area is ${power===2?(1-1/B).toFixed(6):Math.log(B).toFixed(6)}.`));
    for(const y of [0,.5,1])svg.append(node('line',{x1:L,y1:Y(y),x2:R,y2:Y(y),stroke:'#ecebe4'}),label(L-9,Y(y)+4,String(y),{'text-anchor':'end','font-size':11}));
    // Sample more densely near x=1, where the curves bend most; X remains linear.
    let area=`M${X(1)} ${base}`;
    for(let i=0;i<=360;i++){const x=Math.exp(Math.log(B)*i/360);area+=` L${X(x)} ${Y(f(x))}`;}
    area+=` L${X(B)} ${base} Z`;
    svg.append(node('path',{d:area,fill,stroke:'none'}));
    let curve='';
    for(let i=0;i<=420;i++){const x=Math.exp(Math.log(maximum)*i/420);curve+=`${i?'L':'M'}${X(x)} ${Y(f(x))} `;}
    svg.append(node('path',{d:curve,fill:'none',stroke:color,'stroke-width':2.8}));
    svg.append(node('line',{x1:L,y1:base,x2:R+12,y2:base,stroke:'#68726e'}),node('line',{x1:L,y1:base,x2:L,y2:top,stroke:'#9ba79e'}));
    for(const x of [1,5,10,15,20])svg.append(label(X(x),base+23,String(x),{'text-anchor':'middle'}));
    const bx=X(B),by=Y(f(B));
    svg.append(node('line',{x1:bx,y1:top,x2:bx,y2:base,stroke:'#65507d','stroke-width':1.4,'stroke-dasharray':'5 4'}));
    svg.append(node('circle',{cx:bx,cy:by,r:4,fill:color,stroke:'#fffefb','stroke-width':1.3}));
    svg.append(label(Math.max(L+29,Math.min(R-29,bx)),19,`B = ${B.toFixed(1)}`,{'text-anchor':'middle',fill:'#65507d','font-size':13,'font-weight':600}));
    const ey=Y(f(maximum));
    svg.append(node('line',{x1:R-4,y1:ey,x2:R+15,y2:ey,stroke:color,'stroke-width':1.6}),node('path',{d:`M${R+15} ${ey} L${R+9} ${ey-3} L${R+9} ${ey+3} Z`,fill:color,stroke:'none'}));
    svg.append(label(R+5,base+43,'x',{'text-anchor':'end','font-style':'italic'}));
  }
  function render() {
    const B=Number(slider.value);
    $('[data-tail-cutoff-value]').textContent=B.toFixed(1);
    $('[data-tail-square-value]').textContent=(1-1/B).toFixed(6);
    $('[data-tail-harmonic-value]').textContent=Math.log(B).toFixed(6);
    draw($('[data-tail-square]'),2,B);draw($('[data-tail-harmonic]'),1,B);
  }
  function stop() {
    if(frame)cancelAnimationFrame(frame);
    frame=0;started=null;play.textContent='▶ Increase B';play.setAttribute('aria-pressed','false');
  }
  function tick(now) {
    if(started===null)started=now;
    const progress=Math.max(0,Math.min(1,(now-started-600)/8000));
    slider.value=(from+(maximum-from)*progress).toFixed(1);
    render();
    if(progress>=1){stop();return;}
    frame=requestAnimationFrame(tick);
  }
  slider.addEventListener('input',()=>{stop();render();});
  play.addEventListener('click',()=>{
    if(frame){stop();return;}
    if(Number(slider.value)>=maximum)slider.value='2';
    from=Number(slider.value);started=null;
    play.textContent='❚❚ Pause';play.setAttribute('aria-pressed','true');
    render();frame=requestAnimationFrame(tick);
  });
  $('[data-tail-reset]').addEventListener('click',()=>{stop();slider.value='2';render();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  render();
})();

(function () {
  'use strict';
  const host=document.querySelector('[data-endpoint-lab]');
  if(!host)return;
  const $=selector=>host.querySelector(selector);
  const slider=$('[data-endpoint-cutoff]'),play=$('[data-endpoint-play]');
  const minimum=Number(slider.min),initial=.25;
  const ns='http://www.w3.org/2000/svg';
  const node=(name,attrs={},text)=>{
    const item=document.createElementNS(ns,name);
    Object.entries(attrs).forEach(([key,value])=>item.setAttribute(key,value));
    if(text!==undefined)item.textContent=text;
    return item;
  };
  const label=(x,y,text,attrs={})=>node('text',{x,y,fill:'#68726e','font-size':12,...attrs},text);
  let frame=0,started=null,from=initial;

  function draw(svg,power,epsilon) {
    const L=48,R=426,top=32,base=240,ymax=10;
    const X=x=>L+x*(R-L),Y=y=>base-y/ymax*(base-top);
    const f=x=>Math.pow(x,-power);
    const color=power===.5?'#357b70':'#c46d51',fill=power===.5?'#cce2d7':'#f1d3c4';
    const areaValue=power===.5?2-2*Math.sqrt(epsilon):-Math.log(epsilon);
    svg.replaceChildren(node('title',{},`Finite area from epsilon = ${epsilon.toFixed(3)} to one`),node('desc',{},`The function is ${power===.5?'one over square root x':'one over x'}. The exact finite area is ${areaValue.toFixed(6)}. The shaded region ends at x equals one and starts at the positive cutoff ${epsilon.toFixed(3)}. Heights above ten continue beyond the visible window and are included in the numeric area.`));
    for(const y of [0,5,10])svg.append(node('line',{x1:L,y1:Y(y),x2:R,y2:Y(y),stroke:'#ecebe4'}),label(L-9,Y(y)+4,String(y),{'text-anchor':'end','font-size':11}));
    // Intersect the shaded region with the fixed plotting window; do not cap the actual integral.
    let area=`M${X(epsilon)} ${base}`;
    for(let i=0;i<=500;i++){
      const x=Math.exp(Math.log(epsilon)*(1-i/500));
      area+=` L${X(x)} ${Y(Math.min(ymax,f(x)))}`;
    }
    area+=` L${X(1)} ${base} Z`;
    svg.append(node('path',{d:area,fill,stroke:'none'}));
    const visibleStart=Math.pow(ymax,-1/power);
    let curve='';
    for(let i=0;i<=420;i++){
      const x=Math.exp(Math.log(visibleStart)*(1-i/420));
      curve+=`${i?'L':'M'}${X(x)} ${Y(f(x))} `;
    }
    svg.append(node('path',{d:curve,fill:'none',stroke:color,'stroke-width':2.8}));
    const tipX=X(visibleStart);
    svg.append(node('line',{x1:tipX+3,y1:top+11,x2:tipX,y2:top-5,stroke:color,'stroke-width':1.8}),node('path',{d:`M${tipX} ${top-5} L${tipX-3} ${top+2} L${tipX+3} ${top+1} Z`,fill:color,stroke:'none'}));
    svg.append(node('line',{x1:L,y1:base,x2:R+10,y2:base,stroke:'#68726e'}),node('line',{x1:L,y1:base,x2:L,y2:top,stroke:'#9ba79e'}));
    for(const x of [0,.25,.5,.75,1])svg.append(label(X(x),base+23,String(x),{'text-anchor':'middle'}));
    const ex=X(epsilon);
    svg.append(node('line',{x1:ex,y1:top,x2:ex,y2:base,stroke:'#65507d','stroke-width':1.4,'stroke-dasharray':'5 4'}));
    if(f(epsilon)<=ymax)svg.append(node('circle',{cx:ex,cy:Y(f(epsilon)),r:4,fill:color,stroke:'#fffefb','stroke-width':1.3}));
    svg.append(label(Math.max(L+42,Math.min(R-42,ex)),19,`ε = ${epsilon.toFixed(3)}`,{'text-anchor':'middle',fill:'#65507d','font-size':13,'font-weight':600}),label(R+5,base+43,'x',{'text-anchor':'end','font-style':'italic'}));
  }
  function render() {
    const epsilon=Number(slider.value);
    $('[data-endpoint-cutoff-value]').textContent=epsilon.toFixed(3);
    $('[data-endpoint-root-value]').textContent=(2-2*Math.sqrt(epsilon)).toFixed(6);
    $('[data-endpoint-reciprocal-value]').textContent=(-Math.log(epsilon)).toFixed(6);
    draw($('[data-endpoint-root]'),.5,epsilon);draw($('[data-endpoint-reciprocal]'),1,epsilon);
  }
  function stop() {
    if(frame)cancelAnimationFrame(frame);
    frame=0;started=null;play.textContent='▶ Move ε toward 0';play.setAttribute('aria-pressed','false');
  }
  function tick(now) {
    if(started===null)started=now;
    const progress=Math.max(0,Math.min(1,(now-started-600)/8000));
    slider.value=Math.exp((1-progress)*Math.log(from)+progress*Math.log(minimum)).toFixed(3);
    render();
    if(progress>=1){stop();return;}
    frame=requestAnimationFrame(tick);
  }
  slider.addEventListener('input',()=>{stop();render();});
  play.addEventListener('click',()=>{
    if(frame){stop();return;}
    if(Number(slider.value)<=minimum)slider.value=String(initial);
    from=Number(slider.value);started=null;play.textContent='❚❚ Pause';play.setAttribute('aria-pressed','true');
    render();frame=requestAnimationFrame(tick);
  });
  $('[data-endpoint-reset]').addEventListener('click',()=>{stop();slider.value=String(initial);render();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  render();
})();
