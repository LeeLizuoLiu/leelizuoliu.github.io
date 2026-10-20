(function () {
  'use strict';
  const M=RiemannMath, $=id=>document.getElementById(id), plot=$('plot');
  const presets={
    square:{expr:'x^2',F:x=>x**3/3,method:'From F(x) = x³/3'},
    signed:{expr:'x-0.5',F:x=>x*x/2-x/2,method:'From F(x) = x²/2 − x/2'},
    wave:{expr:'sin(2*pi*x)',F:x=>-Math.cos(2*Math.PI*x)/(2*Math.PI),method:'From F(x) = −cos(2πx)/(2π)'},
    decay:{expr:'exp(-x)',F:x=>-Math.exp(-x),method:'From F(x) = −exp(−x)'},
    gaussian:{expr:'exp(-x^2)'},
    arrivals:{expr:'6*x',F:x=>3*x*x,method:'From F(x) = 3x²'}
  };
  const state={a:0,b:1,n:8,shape:'equal',mode:0.5,selected:0,f:null,cuts:[],tau:[],reference:0,exact:true,curve:[]};
  let drag=null,frame=0,geometry;
  const fmt=(x,d=6)=>Math.abs(x)<1e-13?'0':Math.abs(x)>=1e7||Math.abs(x)<1e-5?x.toExponential(3):Number(x.toFixed(d)).toString();
  const signed=x=>(x>=0?'+':'−')+fmt(Math.abs(x));
  function setError(message){$('error').textContent=message;$('error').hidden=!message;resizeParent();}
  function modeFractions(n){return Array.from({length:n},()=>state.mode==='shuffle'?Math.random():state.mode);}
  function rebuild(){state.cuts=M.partition(state.a,state.b,state.n,state.shape);state.tau=modeFractions(state.n);state.selected=Math.min(state.selected,state.n-1);schedule();}
  function apply(){
    try{
      const a=Number($('a').value),b=Number($('b').value);
      if(!$('a').value.trim()||!$('b').value.trim())throw Error('Enter both interval endpoints.');
      const f=M.compile($('expression').value);f.validate(a,b);
      const preset=Object.entries(presets).find(([,p])=>p.expr.replace(/\s/g,'')===f.source.replace(/\s/g,''));
      const reference=preset?.[1].F?preset[1].F(b)-preset[1].F(a):M.simpson(f.evaluate,a,b,8192);
      if(!Number.isFinite(reference))throw Error('Choose a smaller interval or function scale.');
      const oldInterval=state.a===a&&state.b===b;
      Object.assign(state,{a,b,f,reference,exact:!!preset?.[1].F});
      state.curve=Array.from({length:801},(_,i)=>{const x=a+(b-a)*i/800;return {x,y:f.evaluate(x)};});
      $('reference-label').textContent=state.exact?'INTEGRAL · I':'NUMERICAL REFERENCE · Î';
      $('error-label').textContent=state.exact?'SIGNED ERROR · Sₚ − I':'DIFFERENCE · Sₚ − Î';
      if(state.exact)$('reference-method').textContent=preset[1].method;
      else{
        const coarse=M.simpson(f.evaluate,a,b,4096),change=Math.abs(reference-coarse);
        $('reference-method').textContent='Simpson, 8192 strips; refinement change '+fmt(change)+'. Estimate only.';
      }
      document.querySelectorAll('[data-preset]').forEach(b=>b.classList.toggle('active',b.dataset.preset===preset?.[0]));
      setError('');if(!oldInterval||!state.cuts.length)rebuild();else schedule();
    }catch(e){setError(e.message);}
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;render();});}
  function line(x1,y1,x2,y2,cls='grid'){return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}"/>`;}
  function render(){
    if(!state.f)return;
    const result=M.sum(state.cuts,state.tau,state.f.evaluate), {terms}=result;
    const w=plot.clientWidth,h=plot.clientHeight,l=49,r=w-22,t=28,b=h-88;
    let min=Math.min(0,...state.curve.map(p=>p.y),...terms.map(p=>p.y)),max=Math.max(0,...state.curve.map(p=>p.y),...terms.map(p=>p.y));
    const scale=Math.max(Math.abs(min),Math.abs(max),1e-8);min/=scale;max/=scale;
    let span=max-min;if(span<1e-8){min=-0.5;max=0.5;span=1;}min-=span*0.1;max+=span*0.13;
    const X=x=>l+(x-state.a)/(state.b-state.a)*(r-l),Y=y=>b-(y/scale-min)/(max-min)*(b-t),zero=Y(0),rail=h-32;
    geometry={l,r,X,Y};plot.setAttribute('viewBox',`0 0 ${w} ${h}`);
    const path=state.curve.map((p,i)=>(i?'L':'M')+X(p.x).toFixed(2)+' '+Y(p.y).toFixed(2)).join(' ');
    const area=path+` L${r} ${zero} L${l} ${zero} Z`;
    let svg=`<title id="plot-title">Interactive Riemann rectangles</title><desc id="plot-desc">${state.n} intervals. The current signed sum is ${fmt(result.total)}. Use the controls to edit every cut and sample point.</desc><defs><clipPath id="above"><rect x="${l}" y="${t}" width="${r-l}" height="${Math.max(0,zero-t)}"/></clipPath><clipPath id="below"><rect x="${l}" y="${zero}" width="${r-l}" height="${Math.max(0,b-zero)}"/></clipPath></defs>`;
    for(let i=0;i<=4;i++){
      const yn=min+(max-min)*i/4,yy=Y(yn*scale);svg+=line(l,yy,r,yy)+`<text x="${l-7}" y="${yy+4}" text-anchor="end">${fmt(yn*scale,3)}</text>`;
      const x=state.a+(state.b-state.a)*i/4,xx=X(x);svg+=line(xx,t,xx,b)+`<text x="${xx}" y="${b+18}" text-anchor="middle">${fmt(x,3)}</text>`;
    }
    svg+=`<path d="${area}" fill="#d8e6dc" opacity=".6" clip-path="url(#above)"/><path d="${area}" fill="#f1d5c5" opacity=".6" clip-path="url(#below)"/>`;
    terms.forEach((p,i)=>{const color=p.y>=0?'#216b64':'#b95b42',fill=p.y>=0?'#b8d7cd':'#edbeab',selected=i===state.selected;
      svg+=`<rect data-kind="rect" data-i="${i}" x="${X(p.left)}" y="${Math.min(Y(p.y),zero)}" width="${Math.max(0,X(p.right)-X(p.left))}" height="${Math.max(.6,Math.abs(Y(p.y)-zero))}" fill="${fill}" fill-opacity="${selected ? 0.8 : 0.5}" stroke="${color}" stroke-opacity="${selected?1:.6}" class="${selected?'selected-rect':''}"/>`;
      if(selected)svg+=line(X(p.x),Y(p.y),X(p.x),zero,'axis');
    });
    svg+=line(l,zero,r,zero,'axis')+`<path d="${path}" stroke="#52405e" stroke-width="2.6" fill="none"/><text x="${l}" y="15">f(x)</text><text x="${r+6}" y="${zero+4}">x</text>`;
    terms.forEach((p,i)=>{const color=p.y>=0?'#216b64':'#b95b42';svg+=`<g data-kind="sample" data-i="${i}"><circle cx="${X(p.x)}" cy="${Y(p.y)}" r="12" fill="transparent"/><circle cx="${X(p.x)}" cy="${Y(p.y)}" r="${i===state.selected?5.5:3.5}" fill="${color}" stroke="#fffefa" stroke-width="1.5"/></g>`;});
    svg+=line(l,rail,r,rail,'axis')+`<text x="${l}" y="${rail-13}" font-size="10">PARTITION · drag diamonds</text>`;
    state.cuts.forEach((x,i)=>{const cx=X(x);if(i===0||i===state.n)svg+=`<circle cx="${cx}" cy="${rail}" r="3" fill="#7e8d82"/>`;else svg+=`<g data-kind="cut" data-i="${i}"><rect x="${cx-10}" y="${rail-12}" width="20" height="25" fill="transparent"/><path d="M${cx} ${rail-5} l5 5 -5 5 -5 -5 Z" fill="${i===state.selected+1?'#216b64':'#fffefa'}" stroke="#5c7568" stroke-width="1.5"/></g>`;});
    plot.innerHTML=svg;
    $('sum').textContent=fmt(result.total);$('reference').textContent=fmt(state.reference);$('difference').textContent=signed(result.total-state.reference);
    $('signed-parts').textContent=fmt(result.pos)+' positive '+signed(result.neg)+' negative';
    $('mesh-value').textContent=fmt(result.mesh);$('mesh-bar').style.width=(100*result.mesh/(state.b-state.a))+'%';
    $('partition-tag').textContent=state.n+' interval'+(state.n===1?'':'s')+' · '+(state.shape==='equal'?'equal widths':'unequal widths');
    $('count').value=state.n;$('count-output').value=state.n;$('shape').value=state.shape;$('refine').disabled=state.n*2>80;
    const allSame=state.tau.every(v=>Math.abs(v-state.tau[0])<1e-9);
    $('tau-output').value=allSame?Math.round(state.tau[0]*100)+'%':'mixed';
    if(allSame)$('all-tau').value=state.tau[0];
    document.querySelectorAll('[data-mode]').forEach(btn=>btn.classList.toggle('active',allSame&&btn.dataset.mode!=='shuffle'&&Number(btn.dataset.mode)===state.tau[0]));
    const selected=$('selected');if(selected.options.length!==state.n){selected.replaceChildren(...terms.map((p,i)=>{const opt=document.createElement('option');opt.value=i;opt.textContent=i+1;return opt;}));}selected.value=state.selected;
    const p=terms[state.selected];$('one-tau').value=state.tau[state.selected];
    $('selected-term').textContent=fmt(p.width,4)+' × '+fmt(p.y,4)+' = '+fmt(p.term,6);
    $('selected-bounds').textContent='['+fmt(p.left,4)+', '+fmt(p.right,4)+'] · x* = '+fmt(p.x,4);
    const last=state.selected===state.n-1;$('cut-value').value=Number(p.right.toPrecision(10));$('cut-value').disabled=last;
    $('cut-hint').textContent=last?'Endpoint b is fixed.':'Keep this cut between its neighbours.';
    $('terms').innerHTML=terms.map((p,i)=>`<tr class="${i===state.selected?'selected':''}"><td>${i+1}</td><td>[${fmt(p.left,4)}, ${fmt(p.right,4)}]</td><td>${fmt(p.width,5)}</td><td>${fmt(p.x,5)}</td><td>${fmt(p.y,5)}</td><td>${fmt(p.term,6)}</td></tr>`).join('');
    resizeParent();
  }
  function resizeParent(){if(parent!==window)requestAnimationFrame(()=>parent.postMessage({type:'ma1508-riemann-height',height:Math.ceil(document.querySelector('.studio').getBoundingClientRect().height)},'*'));}
  $('function-form').addEventListener('submit',e=>{e.preventDefault();apply();});
  document.querySelectorAll('[data-preset]').forEach(btn=>btn.addEventListener('click',()=>{$('expression').value=presets[btn.dataset.preset].expr;apply();}));
  $('count').addEventListener('input',e=>{state.n=Number(e.target.value);if(state.shape==='custom')state.shape='equal';rebuild();});
  $('shape').addEventListener('change',e=>{state.shape=e.target.value;rebuild();});
  $('refine').addEventListener('click',()=>{if(state.n*2>80)return;Object.assign(state,M.refine(state.cuts,state.tau));state.n*=2;state.selected*=2;schedule();});
  document.querySelectorAll('[data-mode]').forEach(btn=>btn.addEventListener('click',()=>{state.mode=btn.dataset.mode==='shuffle'?'shuffle':Number(btn.dataset.mode);state.tau=modeFractions(state.n);schedule();}));
  $('all-tau').addEventListener('input',e=>{state.mode=Number(e.target.value);state.tau=modeFractions(state.n);schedule();});
  $('selected').addEventListener('change',e=>{state.selected=Number(e.target.value);schedule();});
  $('one-tau').addEventListener('input',e=>{state.tau[state.selected]=Number(e.target.value);schedule();});
  $('cut-value').addEventListener('change',e=>{const x=Number(e.target.value);if(e.target.value.trim()&&Number.isFinite(x)){M.moveCut(state.cuts,state.selected+1,x);state.shape='custom';}schedule();});
  $('reset').addEventListener('click',()=>{Object.assign(state,{n:8,shape:'equal',mode:.5,selected:0,cuts:[]});$('expression').value='x^2';$('a').value=0;$('b').value=1;apply();});
  plot.addEventListener('pointerdown',e=>{const target=e.target.closest('[data-kind]');if(!target)return;e.preventDefault();const i=Number(target.dataset.i),kind=target.dataset.kind;state.selected=kind==='cut'?i-1:i;if(kind==='rect'){schedule();return;}drag={i,kind,id:e.pointerId};plot.setPointerCapture(e.pointerId);plot.classList.add('dragging');schedule();});
  plot.addEventListener('pointermove',e=>{if(!drag)return;e.preventDefault();const rect=plot.getBoundingClientRect(),px=e.clientX-rect.left,x=state.a+(px-geometry.l)/(geometry.r-geometry.l)*(state.b-state.a);
    if(drag.kind==='cut'){M.moveCut(state.cuts,drag.i,x);state.shape='custom';}else{const i=drag.i;state.tau[i]=Math.max(0,Math.min(1,(x-state.cuts[i])/(state.cuts[i+1]-state.cuts[i])));}schedule();});
  function endDrag(){drag=null;plot.classList.remove('dragging');}
  plot.addEventListener('pointerup',endDrag);plot.addEventListener('pointercancel',endDrag);plot.addEventListener('lostpointercapture',endDrag);
  new ResizeObserver(schedule).observe(plot);new ResizeObserver(resizeParent).observe(document.querySelector('.studio'));
  document.querySelector('details').addEventListener('toggle',resizeParent);
  apply();
})();
