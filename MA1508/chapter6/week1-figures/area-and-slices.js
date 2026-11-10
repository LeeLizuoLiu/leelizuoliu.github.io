(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  function add(parent, tag, attrs, label) {
    var el = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (key) { el.setAttribute(key, attrs[key]); });
    if (label !== undefined) el.textContent = label;
    parent.appendChild(el); return el;
  }
  function clear(group) { while (group.firstChild) group.removeChild(group.firstChild); }
  function txt(group, x, y, value, extra) {
    return add(group, 'text', Object.assign({x:x,y:y,fill:'#3d3d3a','font-size':14,'font-family':'system-ui, sans-serif'}, extra || {}), value);
  }
  function points(p) { return p.map(function (q) { return q.map(function (v) { return v.toFixed(2); }).join(','); }).join(' '); }
  function player(slider, play, reset, draw, initial) {
    var frame = 0, previous = 0, progress = +slider.value;
    function pause() { cancelAnimationFrame(frame); frame = 0; previous = 0; play.textContent = 'Play'; }
    function tick(time) {
      if (!previous) previous = time;
      progress += (time - previous) / 65; previous = time;
      if (progress >= 100) { slider.value = 100; draw(); pause(); return; }
      slider.value = progress; draw(); frame = requestAnimationFrame(tick);
    }
    play.addEventListener('click', function () {
      if (frame) { pause(); return; }
      if (+slider.value >= 100) slider.value = 0;
      progress = +slider.value;
      play.textContent = 'Pause'; frame = requestAnimationFrame(tick);
    });
    reset.addEventListener('click', function () { pause(); slider.value = initial; draw(); });
    slider.addEventListener('input', function () { pause(); draw(); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); });
    window.addEventListener('beforeprint', pause);
  }
  var area = document.getElementById('area-art');
  if (area) {
    var dir = document.getElementById('strip-direction'), number = document.getElementById('strip-count');
    var pos = document.getElementById('strip-position'), read = document.getElementById('strip-readout');
    var sx = function (x) { return 60 + 230*x; }, sy = function (y) { return 260 - 230*y; };
    function drawArea() {
      clear(area);
      var n = +number.value, d = 1/n, idx = Math.min(n-1,Math.floor((+pos.value/100)*n)), vertical = dir.value === 'vertical', sum = 0;
      var shape = [];
      for (var k=0;k<=80;k++) { var x=k/80; shape.push([sx(x),sy(2*x-x*x)]); }
      for (var k2=80;k2>=0;k2--) { var x2=k2/80; shape.push([sx(x2),sy(x2*x2)]); }
      add(area,'polygon',{points:points(shape),fill:'#e9e0f4'});
      for (var i=0;i<n;i++) {
        var m=(i+.5)*d, low=vertical ? m*m : 1-Math.sqrt(1-m), high=vertical ? 2*m-m*m : Math.sqrt(m);
        sum+=(high-low)*d;
        var attrs = vertical ? {x:sx(i*d),y:sy(high),width:230*d,height:230*(high-low)} :
          {x:sx(low),y:sy((i+1)*d),width:230*(high-low),height:230*d};
        add(area,'rect',Object.assign(attrs,{fill:i===idx?'#cc785c':'#9c83bd','fill-opacity':i===idx?'.7':'.12',stroke:i===idx?'#9e4e35':'#b8a5ce','stroke-width':i===idx?2:.5}));
      }
      add(area,'line',{x1:50,y1:260,x2:310,y2:260,stroke:'#514e49','stroke-width':1.5});
      add(area,'line',{x1:60,y1:270,x2:60,y2:18,stroke:'#514e49','stroke-width':1.5});
      var curve=[]; for(var j=0;j<=100;j++){var t=j/100;curve.push([sx(t),sy(t*t)]);}
      add(area,'polyline',{points:points(curve),fill:'none',stroke:'#16736d','stroke-width':3});
      var upper=[]; for(var j2=0;j2<=100;j2++){var u=j2/100;upper.push([sx(u),sy(2*u-u*u)]);}
      add(area,'polyline',{points:points(upper),fill:'none',stroke:'#6b4fa0','stroke-width':3});
      txt(area,306,282,'x'); txt(area,39,24,'y'); txt(area,48,280,'0'); txt(area,281,280,'1');
      txt(area,70,57,'y = 2x − x²',{fill:'#6b4fa0'}); txt(area,206,188,'y = x²',{fill:'#16736d'});
      var mid=(idx+.5)*d;
      txt(area,355,61,vertical?'VERTICAL STRIPS':'HORIZONTAL STRIPS',{'font-size':12,'font-weight':'700','letter-spacing':'1.2',fill:'#a9583e'});
      txt(area,355,97,vertical?'height = upper − lower':'length = right − left',{'font-size':17,'font-weight':'600'});
      txt(area,355,130,vertical?'2x − 2x²':'√y + √(1 − y) − 1',{'font-size':21,fill:'#6b4fa0'});
      txt(area,355,168,'width = '+d.toFixed(3),{'font-size':16});
      txt(area,355,203,'Midpoint rectangles',{'font-size':15});
      txt(area,355,226,'approximate the region.',{'font-size':15});
      read.innerHTML = '<strong>'+n+' strips.</strong> Selected '+(vertical?'x':'y')+' = '+mid.toFixed(3)+'; strip length = '+(vertical?2*mid-2*mid*mid:Math.sqrt(mid)+Math.sqrt(1-mid)-1).toFixed(3)+'; midpoint sum ≈ '+sum.toFixed(4)+'.';
    }
    number.addEventListener('input',drawArea); dir.addEventListener('change',drawArea);
    player(pos,document.getElementById('strip-play'),document.getElementById('strip-reset'),drawArea,50); drawArea();
  }
  var square = document.getElementById('square-art');
  if (square) {
    var count=document.getElementById('square-count'), place=document.getElementById('square-position'), out=document.getElementById('square-readout');
    function project(x,y,z) { return [100+270*x+60*y, 260-45*x+30*y-190*z]; }
    function face(x) { var s=1-x; return [project(x,0,0),project(x,s,0),project(x,s,s),project(x,0,s)]; }
    function polygon(p, attrs) { return add(square,'polygon',Object.assign({points:points(p)},attrs)); }
    function line(a,b,attrs) { return add(square,'line',Object.assign({x1:a[0],y1:a[1],x2:b[0],y2:b[1]},attrs)); }
    function drawSquare() {
      clear(square); var n=+count.value, i=Math.min(n-1,Math.floor((+place.value/100)*n));
      var left=i/n,right=(i+1)/n,mid=(left+right)/2,s=1-mid;
      var f0=face(0), apex=project(1,0,0);
      polygon([f0[0],f0[1],apex],{fill:'#e8dfef',stroke:'#c6b8d6','stroke-width':1});
      polygon([f0[1],f0[2],apex],{fill:'#eee7f4',stroke:'#c6b8d6','stroke-width':1});
      polygon([f0[2],f0[3],apex],{fill:'#f6eff6',stroke:'#c6b8d6','stroke-width':1});
      for(var k=0;k<n;k++) polygon(face(k/n),{fill:'none',stroke:'#b5a4c6','stroke-width':.7,'stroke-opacity':'.75'});
      var fl=face(left),fr=face(right);
      polygon([fl[0],fl[1],fr[1],fr[0]],{fill:'#dba28e','fill-opacity':'.55',stroke:'#b96a51','stroke-width':1});
      polygon([fl[1],fl[2],fr[2],fr[1]],{fill:'#cc785c','fill-opacity':'.5',stroke:'#a9583e','stroke-width':1});
      polygon([fl[2],fl[3],fr[3],fr[2]],{fill:'#e9b5a3','fill-opacity':'.55',stroke:'#a9583e','stroke-width':1});
      polygon(face(mid),{fill:'#cc785c','fill-opacity':'.38',stroke:'#994e37','stroke-width':2});
      line(project(0,0,0),project(1.08,0,0),{stroke:'#494640','stroke-width':1.6});
      txt(square,399,214,'x'); txt(square,88,279,'0'); txt(square,371,237,'1');
      txt(square,462,52,'ONE CROSS-SECTION',{'font-size':12,'font-weight':'700','letter-spacing':'1.1',fill:'#a9583e'});
      var size=155*s;
      add(square,'rect',{x:520,y:242-size,width:size,height:size,fill:'#edd4ca',stroke:'#a9583e','stroke-width':2});
      txt(square,462,275,'side = 1 − x',{'font-size':16});
      txt(square,462,299,'area = (1 − x)²',{'font-size':16});
      out.innerHTML='<strong>'+n+' slices.</strong> Selected midpoint x = '+mid.toFixed(3)+'; square side = '+s.toFixed(3)+'; area = '+(s*s).toFixed(3)+'; thickness Δx = '+(1/n).toFixed(3)+'.';
    }
    count.addEventListener('input',drawSquare);
    player(place,document.getElementById('square-play'),document.getElementById('square-reset'),drawSquare,50); drawSquare();
  }
})();
