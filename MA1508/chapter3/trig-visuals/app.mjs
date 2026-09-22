import {trigState,sinc,fmt} from './math.mjs';
const $=id=>document.getElementById(id), S={theta:Math.PI/4,h:.6,kind:'sin',stage:'geometry'};
const text=(id,value)=>$(id).textContent=value;
const line=(x1,y1,x2,y2,color,width=2,extra='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" ${extra}/>`;
const label=(x,y,t,extra='')=>`<text x="${x}" y="${y}" ${extra}>${t}</text>`;
const dot=(x,y,color,r=5,fill=color)=>`<circle cx="${x}" cy="${y}" r="${r}" stroke="${color}" fill="${fill}" stroke-width="2"/>`;
function area(d){
 const ox=60,oy=250,r=180,ax=ox+r,py=oy-r*Math.sin(d.alpha),px=ox+r*Math.cos(d.alpha),ty=oy-r*Math.tan(d.alpha);
 const P=`${px},${py}`,A=`${ax},${oy}`,O=`${ox},${oy}`,T=`${ax},${ty}`;
 $('area-diagram').innerHTML=`<title>Nested areas for α = ${fmt(d.alpha)} radians</title><polygon points="${O} ${A} ${T}" fill="#f0e2d8" stroke="#b0603f" stroke-width="2"/><path d="M ${O} L ${A} A ${r} ${r} 0 0 0 ${P} Z" fill="#d9e6d2" stroke="#4a7a6b" stroke-width="2"/><polygon points="${O} ${A} ${P}" fill="#f2e0c4" stroke="#8a5a12" stroke-width="2"/><path d="M ${ax} ${oy} A ${r} ${r} 0 0 0 ${ox} ${oy-r}" fill="none" stroke="#6c6a64" stroke-width="2"/>${line(ox-15,oy,ax+80,oy,'#b0aea5',1)}${line(ox,oy+12,ox,40,'#b0aea5',1)}${line(ax,oy+12,ax,38,'#b0603f',1,'stroke-dasharray="5 5"')}${dot(ox,oy,'#141413')}${dot(ax,oy,'#141413')}${label(ox-20,oy+24,'O')}${label(ox+80,oy+26,'radius 1')}${label(ax+10,30,'x = 1')}${label(ox-30,68,'1')}`;
 if(d.h===0){$('area-diagram').innerHTML+=label(ax-15,oy-15,'A = P = B');}
 else{
  $('area-diagram').innerHTML+=`${dot(px,py,'#8a5a12')}${dot(ax,ty,'#b0603f')}${label(ax+10,oy+24,'A')}${line(px,py,px-25,py-28,'#8a5a12',1)}${label(px-45,py-34,'P')}${line(ax,ty,ax+35,ty-10,'#b0603f',1)}${label(ax+40,ty-7,'B')}${label(ox+44,oy-12,'α')}`;
 }
 text('symmetry',d.h===0?'At h = 0 all three regions have zero area. The strict inequalities apply only for nonzero α; the limiting ratio is still 1.':d.h<0?'The picture uses α = |h|. Reflection gives sin(−α)/(−α) = sin α/α, so the same squeeze proves the left-hand limit.':'The picture uses α = h, with 0 < α < π/2. Compare the coloured regions before shrinking the angle.');
 for(const k of ['inner','sector','outer'])text('area-'+k,fmt(d.areas[k]));
}
function graph(id,x0,x1,y0,y1,xticks,yticks){
 const sx=x=>52+(x-x0)*416/(x1-x0),sy=y=>290-(y-y0)*250/(y1-y0);
 let out='';
 for(const [x,t]of xticks)out+=line(sx(x),40,sx(x),290,'#ebe6df',1)+label(sx(x),315,t,'text-anchor="middle"');
 for(const y of yticks)out+=line(52,sy(y),468,sy(y),'#ebe6df',1)+label(43,sy(y)+5,String(y),'text-anchor="end"');
 out+=line(52,sy(0),468,sy(0),'#b0aea5',1)+line(sx(0),40,sx(0),290,'#b0aea5',1);
 $(id).innerHTML=out;
 return {sx,sy,add:html=>$(id).innerHTML+=html,path:(fn,color,dashed=false)=>{
 let path='';for(let i=0;i<=400;i++){const x=x0+(x1-x0)*i/400,y=fn(x);if(!Number.isFinite(y)){continue;}path+=(i?'L':'M')+sx(x)+','+sy(y);}
 $(id).innerHTML+=`<path d="${path}" fill="none" stroke="${color}" stroke-width="2.5" ${dashed?'stroke-dasharray="6 5"':''}/>`;
 }};
}
function limits(d){
 const g=graph('limit-diagram',-.8,.8,-.5,1.12,[[-.8,'−0.8'],[-.4,'−0.4'],[0,'0'],[.4,'0.4'],[.8,'0.8']],[-.5,0,.5,1]);
 g.path(Math.cos,'#8e8b82',true);g.path(()=>1,'#8e8b82',true);g.path(sinc,'#b0603f');g.path(x=>-Math.sin(x/2)*sinc(x/2),'#8a5a12');
 g.add(label(475,335,'h')+dot(g.sx(0),g.sy(1),'#b0603f',6,'#fffefb')+dot(g.sx(0),g.sy(0),'#8a5a12',6,'#fffefb'));
 if(d.h!==0)g.add(line(g.sx(d.h),40,g.sx(d.h),290,'#b0aea5',1,'stroke-dasharray="4 4"')+dot(g.sx(d.h),g.sy(d.A),'#b0603f')+dot(g.sx(d.h),g.sy(d.B),'#8a5a12'));
 text('limit-a',fmt(d.A));text('limit-b',fmt(d.B));text('bounds',d.h===0?'Both bounding functions equal 1 at h = 0; A(0) remains undefined.':`At this h: cos h = ${fmt(d.lower)} ≤ A(h) = ${fmt(d.A)} ≤ 1 (rounded).`);
}
function slopes(d){
 const sin=d.kind==='sin',f=sin?Math.sin:Math.cos;
 const g=graph('slope-diagram',-1,2*Math.PI+1,-1.8,1.8,[[0,'0'],[Math.PI/2,'π/2'],[Math.PI,'π'],[3*Math.PI/2,'3π/2'],[2*Math.PI,'2π']],[-1,0,1]);
 g.path(f,'#b0603f');
 const tangent=x=>d.value+d.slope*(x-d.theta), lo=Math.max(-1,d.theta-.7),hi=Math.min(2*Math.PI+1,d.theta+.7);
 g.add(line(g.sx(lo),g.sy(tangent(lo)),g.sx(hi),g.sy(tangent(hi)),'#4a7a6b',3,'stroke-dasharray="6 4"'));
 if(d.h!==0){const sec=x=>d.value+d.quotient*(x-d.theta);g.add(line(g.sx(Math.min(lo,d.theta+d.h)),g.sy(sec(Math.min(lo,d.theta+d.h))),g.sx(Math.max(hi,d.theta+d.h)),g.sy(sec(Math.max(hi,d.theta+d.h))),'#8a5a12',2)+dot(g.sx(d.theta+d.h),g.sy(f(d.theta+d.h)),'#8a5a12')+label(g.sx(d.theta+d.h)+9,g.sy(f(d.theta+d.h))-13,'Q'));}
 g.add(dot(g.sx(d.theta),g.sy(d.value),'#b0603f')+label(g.sx(d.theta)-20,g.sy(d.value)+25,d.h===0?'P = Q':'P')+label(475,335,'x'));
 text('decomposition',sin?'Δsin / h = sin θ · B(h) + cos θ · A(h)':'Δcos / h = cos θ · B(h) − sin θ · A(h)');
 text('term-one-label',sin?'sin θ × B(h)':'cos θ × B(h)');text('term-two-label',sin?'cos θ × A(h)':'−sin θ × A(h)');text('term-one',fmt(d.term1));text('term-two',fmt(d.term2));text('term-two-limit','→ '+(sin?'cos θ':'−sin θ')+' = '+fmt(d.slope));text('secant-value',fmt(d.quotient));text('derivative-value',fmt(d.slope));
 text('slope-message',d.h===0?'P and Q coincide. There is no secant slope at h = 0. The dashed line shows the tangent obtained by taking the limit.':`At θ = ${fmt(d.theta)}, the secant slope is ${fmt(d.quotient)}. As h tends to zero, the B(h) term vanishes and the A(h) term tends to ${sin?'cos θ':'−sin θ'} = ${fmt(d.slope)}.`);
 const steps=sin?[
 'Start with [sin(θ + h) − sin θ] / h, where h ≠ 0.',
 'Angle addition: sin(θ + h) = sin θ cos h + cos θ sin h.',
 'Subtract sin θ: the numerator is sin θ(cos h − 1) + cos θ sin h.',
 'Divide each term by h: sin θ · B(h) + cos θ · A(h).',
 'Hold θ fixed and let h → 0: sin θ · 0 + cos θ · 1 = cos θ.'
 ]:[
 'Start with [cos(θ + h) − cos θ] / h, where h ≠ 0.',
 'Angle addition: cos(θ + h) = cos θ cos h − sin θ sin h.',
 'Subtract cos θ: the numerator is cos θ(cos h − 1) − sin θ sin h.',
 'Divide each term by h: cos θ · B(h) − sin θ · A(h).',
 'Hold θ fixed and let h → 0: cos θ · 0 − sin θ · 1 = −sin θ. The minus sign comes from angle addition.'
 ];
 const reasons=[
  'θ is the fixed point where we want the tangent slope. Only h changes. The numerator is the vertical change f(θ + h) − f(θ); the denominator is the horizontal change h. Their ratio is the secant slope.',
  'This identity separates the fixed angle θ from the small increment h. We cannot replace '+(sin?'sin(θ + h) with sin θ + sin h':'cos(θ + h) with cos θ + cos h')+'. Trigonometric functions do not distribute over addition.',
  'Factor out '+(sin?'sin θ':'cos θ')+' from the two matching terms. The factor (cos h − 1) appears because the original value f(θ) is being subtracted. Keep the other term and its sign.',
  'Use (u + v)/h = u/h + v/h for h ≠ 0. We have now produced exactly the two quotients studied in Stage 2. The factors involving θ are constants with respect to h.',
  'The area argument established A(h) → 1; the identity in Stage 2 established B(h) → 0. Apply the sum and constant-multiple laws for limits. We take a limit; substituting h = 0 into the original quotient would still give 0/0.'
 ];
 const titles=['Interpret the difference quotient','Separate θ and h','Group the change','Recognise the two known limits','Take the limit with θ fixed'];
 $('proof-steps').replaceChildren(...steps.map((t,i)=>{const li=document.createElement('li'),heading=document.createElement('h4'),equation=document.createElement('p'),reason=document.createElement('p');heading.textContent=titles[i];equation.className='equation';equation.textContent=t;reason.textContent=reasons[i];li.append(heading,equation,reason);return li;}));
}
function render(){const d=trigState(S.theta,S.h,S.kind);text('h-value',fmt(S.h));text('theta-value',fmt(S.theta));$('increment').value=S.h;$('angle').value=S.theta;$('function').value=S.kind;for(const b of document.querySelectorAll('[data-stage]')){const on=b.dataset.stage===S.stage;b.setAttribute('aria-pressed',String(on));$(b.dataset.stage).hidden=!on;}area(d);limits(d);slopes(d);}
function setStage(stage){if(['geometry','limits','slopes'].includes(stage))S.stage=stage;render();}
for(const b of document.querySelectorAll('[data-stage]'))b.addEventListener('click',()=>{location.hash=b.dataset.stage;setStage(b.dataset.stage);});
for(const b of document.querySelectorAll('[data-h]'))b.addEventListener('click',()=>{S.h=Number(b.dataset.h);render();});
for(const b of document.querySelectorAll('[data-angle]'))b.addEventListener('click',()=>{S.theta=Number(b.dataset.angle);render();});
for(const [id,key,min,max]of [['increment','h',-.8,.8],['angle','theta',0,2*Math.PI]]){
 $(id).addEventListener('input',e=>{S[key]=Number(e.target.value);render();});
 $(id).addEventListener('keydown',e=>{let next;if(['ArrowLeft','ArrowDown'].includes(e.key))next=S[key]-.01;if(['ArrowRight','ArrowUp'].includes(e.key))next=S[key]+.01;if(e.key==='Home')next=min;if(e.key==='End')next=max;if(next!==undefined){e.preventDefault();S[key]=Math.max(min,Math.min(max,next));render();}});
}
$('function').addEventListener('change',e=>{S.kind=e.target.value;render();});$('halve').addEventListener('click',()=>{S.h/=2;render();});$('reverse').addEventListener('click',()=>{S.h=-S.h;render();});$('reset').addEventListener('click',()=>{Object.assign(S,{theta:Math.PI/4,h:.6,kind:'sin',stage:'geometry'});location.hash='geometry';for(const d of document.querySelectorAll('details'))d.open=false;render();});
window.addEventListener('hashchange',()=>setStage(location.hash.slice(1)));setStage(location.hash.slice(1));
