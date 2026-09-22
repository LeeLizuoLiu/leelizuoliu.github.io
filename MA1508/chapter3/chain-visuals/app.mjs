import {defaults,parameterKeys,network,gradientStep,fmt} from './math.mjs';
const $=id=>document.getElementById(id);
const labels={x:'Input x',target:'Target t',w1:'Input weight w₁',w2:'Input weight w₂',b1:'Hidden bias b₁',b2:'Hidden bias b₂',v1:'Output weight v₁',v2:'Output weight v₂',c:'Output bias c'};
const symbols={w1:'w₁',w2:'w₂',b1:'b₁',b2:'b₂',v1:'v₁',v2:'v₂',c:'c'};
let p={...defaults},stage=['forward','output','hidden','input'].includes(location.hash.slice(1))?location.hash.slice(1):'forward',previous=null;
const number=n=>`(${fmt(n)})`;
const formula=s=>`<div class="formula">${s}</div>`;
const captions={forward:'Follow the arrows from x to L. Each neuron forms a weighted sum, then applies tanh.',output:'Start at L and move backwards. The error ŷ − t multiplies each local derivative at the output.',hidden:'Continue backwards through tanh. Multiply by 1 − aᵢ², then by x for an input weight or by 1 for a bias.',input:'Both hidden neurons depend on x. Add the two path contributions to obtain ∂L/∂x.'};
$('controls').innerHTML=Object.keys(labels).map(k=>`<div class="control"><label for="control-${k}">${labels[k]}</label><output for="control-${k}" id="value-${k}"></output><input id="control-${k}" type="range" min="${k==='x'||k==='target'?-2:-6}" max="${k==='x'||k==='target'?2:6}" step="any" value="${p[k]}"></div>`).join('');
function clearTraining(){previous=null;$('undo').disabled=true;$('training-result').textContent='Parameters changed. Take a gradient step to compare the new loss before and after.';}
for(const k of Object.keys(labels)){
  const input=$(`control-${k}`);
  input.addEventListener('input',()=>{p[k]=Number(input.value);clearTraining();render();});
  input.addEventListener('keydown',event=>{
    const increments={ArrowRight:.05,ArrowUp:.05,ArrowLeft:-.05,ArrowDown:-.05,PageUp:.5,PageDown:-.5};
    if(event.key in increments||event.key==='Home'||event.key==='End'){
      event.preventDefault();p[k]=event.key==='Home'?Number(input.min):event.key==='End'?Number(input.max):Math.max(Number(input.min),Math.min(Number(input.max),Number((p[k]+increments[event.key]).toFixed(8))));clearTraining();render();
    }
  });
}
function graph(r){
  const teal='#4a7a6b',purple='#6b4fa0',orange='#8a5a12';
  const text=(x,y,s,cls='')=>`<text x="${x}" y="${y}" text-anchor="middle" class="${cls}">${s}</text>`;
  const edge=(x1,y1,x2,y2,color,reverse,active=true)=>`<path d="M ${reverse?x2:x1} ${reverse?y2:y1} L ${reverse?x1:x2} ${reverse?y1:y2}" fill="none" stroke="${color}" stroke-width="${active?3:2}" opacity="${active?1:.3}" marker-end="url(#arrow-${color.slice(1)})"/>`;
  const box=(x,y,w,h,color)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="#fffefb" stroke="${color}" stroke-width="2"/>`;
  const backward=stage!=='forward',hidden=stage==='hidden'||stage==='input';
  $('network').innerHTML=`<title>${captions[stage]}</title><desc>Input ${fmt(p.x)}. Neuron 1 activation ${fmt(r.a1)}; neuron 2 activation ${fmt(r.a2)}. Prediction ${fmt(r.prediction)}; loss ${fmt(r.loss)}. Input loss gradient ${fmt(r.inputGradient)}.</desc><defs>${[teal,purple,orange].map(c=>`<marker id="arrow-${c.slice(1)}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${c}"/></marker>`).join('')}</defs>
  ${edge(117,205,265,122,teal,hidden,!backward||hidden)}${edge(117,230,265,312,purple,hidden,!backward||hidden)}
  ${edge(435,122,590,205,teal,backward)}${edge(435,312,590,232,purple,backward)}${edge(722,218,790,218,orange,backward)}
  ${text(178,51,'w₁ = '+fmt(p.w1),'small')}${text(178,332,'w₂ = '+fmt(p.w2),'small')}
  ${text(514,53,'v₁ = '+fmt(p.v1),'small')}${text(514,331,'v₂ = '+fmt(p.v2),'small')}
  ${box(20,179,95,77,'#6c6a64')}${text(67,209,'Input x')}${text(67,239,fmt(p.x),'value')}
  ${[1,2].map(i=>{const y=i===1?49:249,c=i===1?teal:purple;return `${box(265,y,170,135,c)}${text(350,y+27,'Neuron '+i)}${text(350,y+58,'z'+(i===1?'₁':'₂')+' = '+fmt(r['z'+i]))}${text(350,y+83,'a = tanh(z)','small')}${text(350,y+114,fmt(r['a'+i]),'value')}${text(350,y+155,'b'+(i===1?'₁':'₂')+' = '+fmt(p['b'+i]),'small')}`;}).join('')}
  ${box(590,164,132,108,'#6c6a64')}${text(656,192,'Linear output')}${text(656,229,'ŷ = '+fmt(r.prediction),'value')}${text(656,255,'c = '+fmt(p.c),'small')}
  ${box(790,164,95,108,orange)}${text(837,192,'Loss L')}${text(837,229,fmt(r.loss),'value')}${text(837,255,'t = '+fmt(p.target),'small')}
  ${backward?text(752,154,'∂L/∂ŷ','small')+text(754,299,fmt(r.error),'small'):''}
  ${hidden?text(178,76,stage==='input'?'δ₁w₁':'∂L/∂z₁','small')+text(179,100,fmt(stage==='input'?r.path1:r.delta1),'small')+text(178,357,stage==='input'?'δ₂w₂':'∂L/∂z₂','small')+text(178,381,fmt(stage==='input'?r.path2:r.delta2),'small'):''}
  ${backward?text(510,78,'∂L/∂a₁','small')+text(510,102,fmt(r.error*p.v1),'small')+text(510,356,'∂L/∂a₂','small')+text(510,380,fmt(r.error*p.v2),'small'):''}
  ${stage==='input'?text(111,403,'Add both paths:','small')+text(112,424,'∂L/∂x = '+fmt(r.inputGradient)):''}`;
}
function calculation(r){
  const rows=[];
  if(stage==='forward'){
    $('calculation-title').textContent='1 · Forward pass: substitute, then evaluate';
    for(const i of [1,2]){const s=i===1?'₁':'₂';rows.push(formula(`z${s} = w${s}x + b${s} = ${number(p['w'+i])} × ${number(p.x)} + ${number(p['b'+i])} = ${fmt(r['z'+i])}<br>a${s} = tanh(${fmt(r['z'+i])}) = ${fmt(r['a'+i])}`));}
    rows.push(formula(`ŷ = ${number(p.v1)} × ${number(r.a1)} + ${number(p.v2)} × ${number(r.a2)} + ${number(p.c)} = ${fmt(r.prediction)}<br>L = ½[${number(r.prediction)} − ${number(p.target)}]² = ${fmt(r.loss)}`));
    rows.push('<p>Save these values. The backward pass evaluates derivatives at this same point; it does not change the parameters.</p>');
  }else if(stage==='output'){
    $('calculation-title').textContent='2 · Differentiate the loss, then the linear output';
    rows.push(formula(`∂L/∂ŷ = ½ × 2(ŷ − t) = ${number(r.prediction)} − ${number(p.target)} = ${fmt(r.error)}`));
    for(const i of [1,2]){const s=i===1?'₁':'₂';rows.push(formula(`∂L/∂v${s} = (∂L/∂ŷ)(∂ŷ/∂v${s}) = (ŷ − t)a${s}<br>= ${number(r.error)} × ${number(r['a'+i])} = ${fmt(r.gradients['v'+i])}<br>∂L/∂a${s} = (ŷ − t)v${s} = ${number(r.error)} × ${number(p['v'+i])} = ${fmt(r.error*p['v'+i])}`));}
    rows.push(formula(`∂L/∂c = (ŷ − t) × 1 = ${fmt(r.gradients.c)}`));
    rows.push('<p>In the sum ŷ = v₁a₁ + v₂a₂ + c, the local derivative with respect to vᵢ is aᵢ, while the local derivative with respect to aᵢ is vᵢ. Choose the factor for the quantity being differentiated.</p>');
  }else if(stage==='hidden'){
    $('calculation-title').textContent='3 · Pass through tanh and the hidden weighted sum';
    rows.push('<p>Give the reused signal a short name: δᵢ = ∂L/∂zᵢ. Since aᵢ = tanh(zᵢ), its local derivative is 1 − aᵢ².</p>');
    for(const i of [1,2]){const s=i===1?'₁':'₂';rows.push(formula(`δ${s} = (ŷ − t)v${s}(1 − a${s}²)<br>= ${number(r.error)} × ${number(p['v'+i])} × [1 − ${number(r['a'+i])}²] = ${fmt(r['delta'+i])}<br>∂L/∂w${s} = δ${s}x = ${number(r['delta'+i])} × ${number(p.x)} = ${fmt(r.gradients['w'+i])}<br>∂L/∂b${s} = δ${s} × 1 = ${fmt(r.gradients['b'+i])}`));}
    rows.push('<p>The final factors come from zᵢ = wᵢx + bᵢ: ∂zᵢ/∂wᵢ = x and ∂zᵢ/∂bᵢ = 1. Backpropagation saves work by reusing δᵢ.</p>');
  }else{
    $('calculation-title').textContent='4 · The input affects two paths: add their contributions';
    rows.push('<p>Changing x changes both z₁ and z₂. Apply the chain rule to each dependence, then use the sum rule. Here δᵢ = ∂L/∂zᵢ = (ŷ − t)vᵢ(1 − aᵢ²).</p>');
    rows.push(formula(`Path 1: δ₁w₁ = ${number(r.delta1)} × ${number(p.w1)} = ${fmt(r.path1)}<br>Path 2: δ₂w₂ = ${number(r.delta2)} × ${number(p.w2)} = ${fmt(r.path2)}<br>∂L/∂x = δ₁w₁ + δ₂w₂ = ${number(r.path1)} + ${number(r.path2)} = ${fmt(r.inputGradient)}`));
    rows.push('<p>Multiplication combines consecutive changes along one path. Addition combines different paths that depend on the same variable. These contributions may reinforce or cancel each other.</p><p>This is the loss gradient with respect to x. The prediction derivative is ∂ŷ/∂x = v₁(1 − a₁²)w₁ + v₂(1 − a₂²)w₂; multiplying it by ŷ − t gives ∂L/∂x.</p>');
  }
  $('calculation-body').innerHTML=rows.join('');
}
function path(r){
  const i=Number($('neuron').value),s=i===1?'₁':'₂';
  const factors=[['∂L/∂ŷ',r.error,'Differentiate ½(ŷ − t)²'],[`∂ŷ/∂a${s}`,p['v'+i],`The output coefficient v${s}`],[`∂a${s}/∂z${s}`,r['d'+i],`The tanh slope 1 − a${s}²`],[`∂z${s}/∂w${s}`,p.x,'The input x']];
  $('factors').innerHTML=factors.map(([label,value,why])=>`<div class="factor">${label}<strong>${fmt(value)}</strong><span>${why}</span></div>`).join('');
  $('weight-chain').innerHTML=`∂L/∂w${s} = (∂L/∂ŷ)(∂ŷ/∂a${s})(∂a${s}/∂z${s})(∂z${s}/∂w${s})<br>= ${factors.map(([,v])=>number(v)).join(' × ')} = <b>${fmt(r.gradients['w'+i])}</b>`;
  $('path-explanation').textContent=`These four factors multiply; none is optional. For b${s}, replace the last factor x by 1. For the contribution to the input gradient, replace it by w${s} = ${fmt(p['w'+i])}.`;
}
function gradients(r){
  const derivations={w1:'(ŷ − t)v₁(1 − a₁²)x',b1:'(ŷ − t)v₁(1 − a₁²)',w2:'(ŷ − t)v₂(1 − a₂²)x',b2:'(ŷ − t)v₂(1 − a₂²)',v1:'(ŷ − t)a₁',v2:'(ŷ − t)a₂',c:'ŷ − t'};
  $('gradient-table').innerHTML=parameterKeys.map(k=>`<tr><td>${symbols[k]}</td><td>${derivations[k]}</td><td data-gradient="${k}">${fmt(r.gradients[k])}</td></tr>`).join('');
  const scale=245/Math.max(.001,...Object.values(r.gradients).map(Math.abs));
  $('gradient-bars').innerHTML='<title>Loss gradients: negative left of zero, positive right of zero</title><line x1="365" y1="27" x2="365" y2="308" stroke="#8e8b82"/><text x="190" y="22">Negative</text><text x="475" y="22">Positive</text><text x="361" y="22">0</text>'+parameterKeys.map((k,j)=>{const value=r.gradients[k],width=Math.abs(value)*scale,y=40+j*39;return `<text x="25" y="${y+20}">${symbols[k]}</text><rect x="${value<0?365-width:365}" y="${y}" width="${width}" height="27" rx="4" fill="${k.endsWith('1')?'#4a7a6b':k.endsWith('2')?'#6b4fa0':'#8a5a12'}"/><text x="650" y="${y+20}">${fmt(value)}</text>`;}).join('');
}
function render(){
  const r=network(p);
  for(const k of Object.keys(labels)){$(`control-${k}`).value=p[k];$(`value-${k}`).textContent=fmt(p[k]);$(`control-${k}`).setAttribute('aria-valuetext',fmt(p[k]));}
  for(const k of ['prediction','error','loss'])$(k).textContent=fmt(r[k]);
  document.querySelectorAll('[data-stage]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.stage===stage)));
  $('stage-caption').textContent=captions[stage];graph(r);calculation(r);path(r);gradients(r);
}
document.querySelectorAll('[data-stage]').forEach(b=>b.addEventListener('click',()=>{stage=b.dataset.stage;history.replaceState(null,'','#'+stage);render();}));
$('neuron').addEventListener('change',()=>path(network(p)));
$('train').addEventListener('click',()=>{
  const rate=Number($('rate').value),before=network(p),next=gradientStep(p,rate);
  if(parameterKeys.some(k=>Math.abs(next[k])>6)){$('training-result').textContent='This step would move a parameter outside the demonstration range [−6, 6]. Choose a smaller learning rate or move the parameters closer to zero.';return;}
  previous={...p};p=next;render();$('undo').disabled=false;
  const after=network(p),change=after.loss-before.loss;
  $('training-result').textContent=`Loss: ${fmt(before.loss)} → ${fmt(after.loss)} (${Math.abs(change)<1e-12?'unchanged at this precision':change<0?'decreased':'increased — try a smaller learning rate'}). For example, w₁_new = ${number(previous.w1)} − ${rate} × ${number(before.gradients.w1)} = ${fmt(p.w1)}. The table now shows gradients at the updated parameters.`;
});
$('undo').addEventListener('click',()=>{if(previous){p=previous;previous=null;render();$('undo').disabled=true;$('training-result').textContent='Undid the last step. The previous parameters and loss are restored.';}});
$('reset').addEventListener('click',()=>{p={...defaults};stage='forward';previous=null;$('neuron').value='1';$('rate').value='0.05';$('undo').disabled=true;history.replaceState(null,'','#forward');render();$('training-result').textContent='Network reset. Try η = 0.05 and compare the loss before and after.';});
render();
