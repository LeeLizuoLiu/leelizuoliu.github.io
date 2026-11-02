(function () {
  'use strict';
  const NS='http://www.w3.org/2000/svg';
  const colors={ink:'#343535',muted:'#6c6a64',line:'#d9d4c9',purple:'#65507d',teal:'#377769',coral:'#c06b50'};
  const fmt=(v)=>Number(v.toFixed(3)).toString();
  const make=(name,attrs={},text)=>{const el=document.createElementNS(NS,name);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);if(text!==undefined)el.textContent=text;return el;};
  function plot(svg,{xmax,ymax,curve,lo,hi,label,xlabel,ylabel}) {
    const x0=60,x1=425,y0=252,y1=46,X=x=>x0+(x/xmax)*(x1-x0),Y=y=>y0-(y/ymax)*(y0-y1);
    svg.replaceChildren();svg.append(make('title',{},label));
    for(let i=0;i<=4;i++){
      const x=xmax*i/4,xx=X(x),y=ymax*i/4,yy=Y(y);
      svg.append(make('line',{x1:xx,y1:y1,x2:xx,y2:y0,stroke:'#eae6df'}),make('line',{x1:x0,y1:yy,x2:x1,y2:yy,stroke:'#eae6df'}));
      svg.append(make('text',{x:xx,y:272,'text-anchor':'middle',fill:colors.muted,'font-size':12},fmt(x)),make('text',{x:49,y:yy+4,'text-anchor':'end',fill:colors.muted,'font-size':12},fmt(y)));
    }
    const samples=Array.from({length:101},(_,i)=>xmax*i/100);
    const line=samples.map((x,i)=>`${i?'L':'M'}${X(x)} ${Y(curve(x))}`).join(' ');
    svg.append(make('path',{d:`${line} L${X(xmax)} ${y0} L${x0} ${y0} Z`,fill:'#eee9f2'}));
    const strip=Array.from({length:41},(_,i)=>lo+(hi-lo)*i/40);
    const area=strip.map((x,i)=>`${i?'L':'M'}${X(x)} ${Y(curve(x))}`).join(' ');
    svg.append(make('path',{d:`${area} L${X(hi)} ${y0} L${X(lo)} ${y0} Z`,fill:'#eabbaa',stroke:colors.coral,'stroke-width':1.5}));
    svg.append(make('path',{d:line,fill:'none',stroke:colors.purple,'stroke-width':3}));
    svg.append(make('line',{x1:x0,y1:y0,x2:x1+6,y2:y0,stroke:colors.ink}),make('line',{x1:x0,y1:y0,x2:x0,y2:y1-6,stroke:colors.ink}));
    svg.append(make('circle',{cx:X(lo),cy:Y(curve(lo)),r:4,fill:colors.coral}),make('circle',{cx:X(hi),cy:Y(curve(hi)),r:4,fill:colors.coral}));
    svg.append(make('text',{x:x0,y:24,fill:colors.ink,'font-size':14,'font-weight':'600'},ylabel),make('text',{x:x1,y:296,'text-anchor':'end',fill:colors.ink,'font-size':14},xlabel));
  }
  function controls(root,range,draw,duration){
    const slider=root.querySelector('input[type=range]'), button=root.querySelector('button'),output=root.querySelector('output');
    let frame=0,last=null;
    function render(){let x=Number(slider.value);output.textContent=fmt(x);draw(x);}
    function stop(){cancelAnimationFrame(frame);frame=0;last=null;button.textContent='▶ Play';button.setAttribute('aria-label','Play animation');}
    function tick(now){if(last!==null){let n=Number(slider.value)+(now-last)/duration*(range.max-range.min);slider.value=Math.min(range.max,n);render();if(n>=range.max){stop();return;}}last=now;frame=requestAnimationFrame(tick);}
    slider.addEventListener('input',()=>{stop();render();});
    button.addEventListener('click',()=>{if(frame){stop();return;}if(Number(slider.value)>=range.max-0.001)slider.value=range.min;render();button.textContent='❚❚ Pause';button.setAttribute('aria-label','Pause animation');frame=requestAnimationFrame(tick);});
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&frame)stop();});
    render();
  }
  const sub=document.querySelector('#substitution-animation');
  if(sub){
    const left=sub.querySelector('[data-plot=x]'),right=sub.querySelector('[data-plot=u]'), read=sub.querySelector('[data-reading]');
    controls(sub,{min:0,max:1.7},x=>{
      const x2=x+0.3,u=x*x,u2=x2*x2,du=u2-u;
      plot(left,{xmax:2,ymax:8.4,curve:t=>2*t*(1+t*t/4),lo:x,hi:x2,label:'Original integrand on the x-axis',xlabel:'x',ylabel:'Original height: f(x²) · 2x'});
      plot(right,{xmax:4,ymax:2.1,curve:t=>1+t/4,lo:u,hi:u2,label:'Transformed integrand on the u-axis',xlabel:'u = x²',ylabel:'New height: f(u) = 1 + u/4'});
      const area=(u2+u2*u2/8)-(u+u*u/8);
      read.innerHTML=`<span><b>x interval</b> [${fmt(x)}, ${fmt(x2)}] · Δx = 0.3</span><span><b>u interval</b> [${fmt(u)}, ${fmt(u2)}] · Δu = ${fmt(du)}</span><span><b>Exact shaded integral</b> ${fmt(area)} on each side</span>`;
    },8000);
  }
  const parts=document.querySelector('#parts-animation');
  if(parts){
    const svg=parts.querySelector('svg'), read=parts.querySelector('[data-reading]');
    controls(parts,{min:0,max:2},t=>{
      const x0=65,y0=260,X=u=>x0+170*u,Y=v=>y0-200*v,v=t*t/4;
      const pts=Array.from({length:101},(_,i)=>{const u=t*i/100;return [X(u),Y(u*u/4)];});
      const curve=pts.map(([x,y],i)=>`${i?'L':'M'}${x} ${y}`).join(' ');
      svg.replaceChildren(make('title',{},'A rectangle split into two areas by v equals u squared over four'));
      for(let i=0;i<=4;i++){
        const u=i/2,y=i/4;svg.append(make('line',{x1:X(u),y1:50,x2:X(u),y2:y0,stroke:'#eae6df'}),make('line',{x1:x0,y1:Y(y),x2:405,y2:Y(y),stroke:'#eae6df'}));
        svg.append(make('text',{x:X(u),y:280,'text-anchor':'middle',fill:colors.muted,'font-size':12},fmt(u)),make('text',{x:54,y:Y(y)+4,'text-anchor':'end',fill:colors.muted,'font-size':12},fmt(y)));
      }
      svg.append(make('path',{d:`M${X(0)} ${Y(v)} L${X(t)} ${Y(v)} ${pts.slice().reverse().map(([x,y])=>`L${x} ${y}`).join(' ')} Z`,fill:'#edc5b5'}));
      svg.append(make('path',{d:`${curve} L${X(t)} ${y0} L${x0} ${y0} Z`,fill:'#bcdacc'}));
      svg.append(make('path',{d:curve,fill:'none',stroke:colors.purple,'stroke-width':3}));
      svg.append(make('rect',{x:x0,y:Y(v),width:X(t)-x0,height:y0-Y(v),fill:'none',stroke:colors.ink,'stroke-width':1.5}));
      svg.append(make('line',{x1:x0,y1:y0,x2:425,y2:y0,stroke:colors.ink}),make('line',{x1:x0,y1:y0,x2:x0,y2:45,stroke:colors.ink}));
      svg.append(make('circle',{cx:X(t),cy:Y(v),r:5,fill:colors.purple,stroke:'white','stroke-width':2}));
      svg.append(make('text',{x:65,y:25,fill:colors.ink,'font-size':14,'font-weight':'600'},'v = u²/4'),make('text',{x:426,y:288,'text-anchor':'end',fill:colors.ink,'font-size':14},'u'),make('text',{x:46,y:43,fill:colors.ink,'font-size':14},'v'));
      const uv=t**3/4,udv=t**3/6,vdu=t**3/12;
      read.innerHTML=`<span class="parts-product"><b>Rectangle · u(x)v(x)</b> ${fmt(uv)}</span><span class="parts-coral"><b>Upper region · ∫u dv</b> ${fmt(udv)}</span><span class="parts-green"><b>Lower region · ∫v du</b> ${fmt(vdu)}</span>`;
    },8000);
  }
})();
