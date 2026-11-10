(function () {
  'use strict';
  var art=document.getElementById('chord-art'); if(!art)return;
  var level=document.getElementById('chord-level'), output=document.getElementById('chord-readout');
  var play=document.getElementById('chord-play'),reset=document.getElementById('chord-reset');
  var NS='http://www.w3.org/2000/svg';
  function add(tag,attrs,label){var el=document.createElementNS(NS,tag);Object.keys(attrs||{}).forEach(function(k){el.setAttribute(k,attrs[k]);});if(label!==undefined)el.textContent=label;art.appendChild(el);return el;}
  function text(x,y,s,attrs){add('text',Object.assign({x:x,y:y,fill:'#3d3d3a','font-family':'system-ui, sans-serif','font-size':14},attrs||{}),s);}
  function line(a,b,attrs){add('line',Object.assign({x1:a[0],y1:a[1],x2:b[0],y2:b[1]},attrs));}
  function f(x){return 2/3*Math.pow(x,1.5);}
  function xy(x,y){return [55+260*x,260-260*y];}
  function points(p){return p.map(function(q){return q.map(function(v){return v.toFixed(2);}).join(',');}).join(' ');}
  function draw(){
    while(art.firstChild)art.removeChild(art.firstChild);
    var n=Math.pow(2,+level.value),curve=[],poly=[],sum=0;
    for(var i=0;i<=160;i++){var x=i/160;curve.push(xy(x,f(x)));}
    for(var j=0;j<=n;j++){var t=j/n;poly.push(xy(t,f(t)));if(j){var dx=1/n,dy=f(t)-f(t-dx);sum+=Math.sqrt(dx*dx+dy*dy);}}
    line([45,260],[330,260],{stroke:'#514e49','stroke-width':1.4});line([55,272],[55,43],{stroke:'#514e49','stroke-width':1.4});
    add('polyline',{points:points(curve),fill:'none',stroke:'#80aaa3','stroke-width':4,'stroke-opacity':'.72'});
    add('polyline',{points:points(poly),fill:'none',stroke:'#a9583e','stroke-width':2.5});
    for(var k=0;k<poly.length;k++)add('circle',{cx:poly[k][0],cy:poly[k][1],r:n<=16?3:1.4,fill:'#a9583e'});
    text(330,280,'x');text(37,44,'y');text(45,280,'0');text(310,280,'1');text(80,92,'y = ⅔ x³ᐟ²',{fill:'#16736d','font-size':15});
    var selected=Math.floor(n/2);if(selected===n)selected=n-1;
    var x0=selected/n,x1=(selected+1)/n,deltaX=x1-x0,deltaY=f(x1)-f(x0),ratio=deltaY/deltaX;
    line(xy(x0,f(x0)),xy(x1,f(x1)),{stroke:'#6b4fa0','stroke-width':4});
    text(395,55,'ONE CHORD, MAGNIFIED',{'font-size':12,'font-weight':'700','letter-spacing':'1.2',fill:'#a9583e'});
    var a=[430,235],b=[590,235],c=[590,235-160*ratio];
    line(a,b,{stroke:'#6b4fa0','stroke-width':2});line(b,c,{stroke:'#6b4fa0','stroke-width':2});line(a,c,{stroke:'#a9583e','stroke-width':3});
    text(490,258,'Δx',{fill:'#6b4fa0'});text(600,(235+c[1])/2,'Δy',{fill:'#6b4fa0'});text(462,(235+c[1])/2-15,'ℓᵢ',{fill:'#a9583e'});
    text(395,289,'Same scale in both directions.',{'font-size':13});
    output.innerHTML='<strong>'+n+' chord'+(n===1?'':'s')+'.</strong> Polygon length ≈ '+sum.toFixed(6)+'; limiting arc length ≈ '+(2/3*(2*Math.sqrt(2)-1)).toFixed(6)+'.';
  }
  var frame=0,start=0,last=0;
  function pause(){cancelAnimationFrame(frame);frame=0;start=0;last=0;play.textContent='Play';}
  function tick(time){if(!start){start=time;last=+level.value;}var next=last+Math.floor((time-start)/850);if(next>=6){level.value=6;draw();pause();return;}if(next!==+level.value){level.value=next;draw();}frame=requestAnimationFrame(tick);}
  play.addEventListener('click',function(){if(frame){pause();return;}if(+level.value===6)level.value=0;draw();play.textContent='Pause';frame=requestAnimationFrame(tick);});
  reset.addEventListener('click',function(){pause();level.value=0;draw();});
  level.addEventListener('input',function(){pause();draw();});
  document.addEventListener('visibilitychange',function(){if(document.hidden)pause();});window.addEventListener('beforeprint',pause);
  draw();
})();
