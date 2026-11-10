(function () {
  'use strict';
  var NS='http://www.w3.org/2000/svg';
  var flat=document.getElementById('rotation-flat'), solid=document.getElementById('rotation-solid');
  if (!flat || !solid) return;
  var mode=document.getElementById('rotation-mode'), location=document.getElementById('rotation-position');
  var angle=document.getElementById('rotation-angle'), output=document.getElementById('rotation-readout');
  var play=document.getElementById('rotation-play'), reset=document.getElementById('rotation-reset');
  function add(parent,tag,attrs,label){var el=document.createElementNS(NS,tag);Object.keys(attrs||{}).forEach(function(k){el.setAttribute(k,attrs[k]);});if(label!==undefined)el.textContent=label;parent.appendChild(el);return el;}
  function clear(g){while(g.firstChild)g.removeChild(g.firstChild);}
  function pts(a){return a.map(function(p){return p.map(function(v){return v.toFixed(2);}).join(',');}).join(' ');}
  function line(g,a,b,attrs){add(g,'line',Object.assign({x1:a[0],y1:a[1],x2:b[0],y2:b[1]},attrs));}
  function text(g,x,y,s,more){add(g,'text',Object.assign({x:x,y:y,fill:'#3d3d3a','font-family':'system-ui, sans-serif','font-size':14},more||{}),s);}
  function polygon(g,p,attrs){add(g,'polygon',Object.assign({points:pts(p)},attrs));}
  function measure(g,a,b,label,color,offset) {
    line(g,a,b,{stroke:color,'stroke-width':2,'stroke-dasharray':'5 2'});
    text(g,(a[0]+b[0])/2+3,(a[1]+b[1])/2+offset,label,{'font-size':14,'font-weight':'700',fill:color,stroke:'#fffdfa','stroke-width':3,'paint-order':'stroke'});
  }
  function horizontalMeasure(x0,x1,y,label,color) {
    line(flat,[x0,y],[x1,y],{stroke:color,'stroke-width':1.8});
    line(flat,[x0,y-4],[x0,y+4],{stroke:color,'stroke-width':1.2});
    line(flat,[x1,y-4],[x1,y+4],{stroke:color,'stroke-width':1.2});
    text(flat,Math.max(x0+5,(x0+x1)/2),y-4,label,{'font-size':14,'font-weight':'700',fill:color,stroke:'#fffdfa','stroke-width':3,'paint-order':'stroke'});
  }
  var F=function(x,y){return [48+210*x,265-210*y];};
  var P=function(x,y,z){return [170+125*x-67*z,260-195*y+28*x+20*z];};
  var rot=function(r,y,a){return P(r*Math.cos(a),y,r*Math.sin(a));};
  function polyline(g,p,attrs){add(g,'polyline',Object.assign({points:pts(p),fill:'none'},attrs));}
  function arc(r,y,theta,reverse){var p=[],steps=Math.max(1,Math.ceil(theta/(Math.PI/24)));for(var i=0;i<=steps;i++){var a=theta*i/steps;p.push(rot(r,y,reverse?theta-a:a));}return p;}
  function meridian(a,outer){var p=[];for(var i=0;i<=40;i++){var y=i/40,r=outer?Math.sqrt(y):y;p.push(rot(r,y,a));}return p;}
  function draw(){
    clear(flat);clear(solid);
    var v=+location.value/100, washer=mode.value==='washer', theta=(+angle.value)*Math.PI/180, thick=.05;
    var region=[];for(var i=0;i<=70;i++){var x=i/70;region.push(F(x,x));}
    for(var j=70;j>=0;j--){var q=j/70;region.push(F(q,q*q));}
    polygon(flat,region,{fill:'#e9e0f4'});
    if(washer){
      var yl=Math.max(0,v-thick/2), yu=Math.min(1,v+thick/2),xl=v,xr=Math.sqrt(v);
      var fa=F(xl,yu),fb=F(xr,yl);
      add(flat,'rect',{x:fa[0],y:fa[1],width:fb[0]-fa[0],height:fb[1]-fa[1],fill:'#cc785c','fill-opacity':'.7',stroke:'#9a4932','stroke-width':2});
      text(flat,64,26,'horizontal strip: thickness Δy',{'font-size':13,fill:'#a9583e','font-weight':'600'});
    }else{
      var left=v-thick/2,right=v+thick/2, low=v*v, high=v;
      var a=F(left,high),b=F(right,low);
      add(flat,'rect',{x:a[0],y:a[1],width:b[0]-a[0],height:b[1]-a[1],fill:'#cc785c','fill-opacity':'.7',stroke:'#9a4932','stroke-width':2});
      text(flat,64,26,'vertical strip: thickness Δx',{'font-size':13,fill:'#a9583e','font-weight':'600'});
    }
    var c=[];for(var k=0;k<=70;k++){var t=k/70;c.push(F(t,t*t));}
    polyline(flat,c,{stroke:'#16736d','stroke-width':3});line(flat,F(0,0),F(1,1),{stroke:'#6b4fa0','stroke-width':3});
    line(flat,F(-.04,0),F(1.12,0),{stroke:'#4e4a45','stroke-width':1.5});line(flat,F(0,-.04),F(0,1.12),{stroke:'#4e4a45','stroke-width':2.3});
    text(flat,274,283,'x');text(flat,30,26,'y');text(flat,32,283,'0');text(flat,255,283,'1');
    text(flat,153,93,'y = x',{fill:'#6b4fa0','font-size':13});text(flat,183,190,'y = x²',{fill:'#16736d','font-size':13});
    // Dimensions are drawn on the generating plane from the rotation axis.
    if(washer){
      var actual=F(0,v)[1], yR=actual<90?actual+14:actual-14;
      var yr=actual<90?actual+29:(actual>225?actual-29:actual+14);
      horizontalMeasure(F(0,v)[0],F(Math.sqrt(v),v)[0],yR,'R','#6b4fa0');
      horizontalMeasure(F(0,v)[0],F(v,v)[0],yr,'r','#a9583e');
      line(flat,F(Math.sqrt(v),v),[F(Math.sqrt(v),v)[0],yR],{stroke:'#6b4fa0','stroke-width':1,'stroke-dasharray':'2 3'});
      line(flat,F(v,v),[F(v,v)[0],yr],{stroke:'#a9583e','stroke-width':1,'stroke-dasharray':'2 3'});
    }else{
      var base=F(v,v*v), top=F(v,v), yRadius=base[1]>235?base[1]-15:base[1]+15;
      horizontalMeasure(F(0,v*v)[0],base[0],yRadius,'ρ','#6b4fa0');
      line(flat,base,[base[0],yRadius],{stroke:'#6b4fa0','stroke-width':1,'stroke-dasharray':'2 3'});
      var hx=base[0]+12;
      line(flat,[hx,top[1]],[hx,base[1]],{stroke:'#a9583e','stroke-width':2});
      line(flat,[hx-4,top[1]],[hx+4,top[1]],{stroke:'#a9583e','stroke-width':1.2});
      line(flat,[hx-4,base[1]],[hx+4,base[1]],{stroke:'#a9583e','stroke-width':1.2});
      text(flat,hx+5,(top[1]+base[1])/2+5,'h',{'font-size':14,'font-weight':'700',fill:'#a9583e',stroke:'#fffdfa','stroke-width':3,'paint-order':'stroke'});
    }
    // The faint meridians and rings are the SAME bounded region swept about the y-axis.
    var start=[];for(var k1=0;k1<=50;k1++){var x1=k1/50;start.push(P(x1,x1,0));}for(var k2=50;k2>=0;k2--){var x2=k2/50;start.push(P(x2,x2*x2,0));}
    polygon(solid,start,{fill:'#c8b6db','fill-opacity':'.20',stroke:'#aa96bd','stroke-width':1});
    var mcount=Math.max(1,Math.ceil(theta/(Math.PI/4)));
    for(var mi=0;mi<=mcount;mi++){
      var ma=theta*mi/mcount;
      polyline(solid,meridian(ma,true),{stroke:'#b0a2bb','stroke-width':1,'stroke-opacity':'.65'});
      polyline(solid,meridian(ma,false),{stroke:'#b0a2bb','stroke-width':1,'stroke-opacity':'.55'});
    }
    [.25,.5,.75].forEach(function(y){
      polyline(solid,arc(Math.sqrt(y),y,theta,false),{stroke:'#baadbf','stroke-width':1,'stroke-opacity':'.75'});
      polyline(solid,arc(y,y,theta,false),{stroke:'#baadbf','stroke-width':1,'stroke-opacity':'.65'});
    });
    line(solid,P(0,-.05,0),P(0,1.12,0),{stroke:'#514e49','stroke-width':2.2});
    line(solid,P(0,0,0),P(1.15,0,0),{stroke:'#514e49','stroke-width':1.4});
    line(solid,P(0,0,0),P(0,0,1.15),{stroke:'#96908a','stroke-width':1,'stroke-dasharray':'4 3'});
    text(solid,178,25,'y (axis)',{'font-size':13});text(solid,315,302,'x',{'font-size':13});text(solid,78,300,'z',{'font-size':13});
    var steps=Math.max(1,Math.ceil(theta/(Math.PI/30)));
    if(washer){
      var outer=Math.sqrt(v),inner=v,lo=Math.max(0,v-thick/2),hi=Math.min(1,v+thick/2);
      // Flat sectors at the two faces and a curved outer wall form a thin washer.
      if(theta>0){
        polygon(solid,arc(outer,hi,theta,false).concat(arc(inner,hi,theta,true)),{fill:'#cc785c','fill-opacity':'.46',stroke:'#a9583e','stroke-width':1.4});
        for(var s=0;s<steps;s++){
          var t0=theta*s/steps,t1=theta*(s+1)/steps;
          polygon(solid,[rot(outer,lo,t0),rot(outer,lo,t1),rot(outer,hi,t1),rot(outer,hi,t0)],{fill:'#b96249','fill-opacity':'.22',stroke:'none'});
        }
        polyline(solid,arc(outer,lo,theta,false),{stroke:'#a9583e','stroke-width':1});
        polyline(solid,arc(inner,hi,theta,false),{stroke:'#884b69','stroke-width':1.5});
      }
      [0,theta].forEach(function(a){polygon(solid,[rot(inner,lo,a),rot(outer,lo,a),rot(outer,hi,a),rot(inner,hi,a)],{fill:'#cc785c','fill-opacity':'.72',stroke:'#963f2a','stroke-width':1.6});});
      var axisPoint=P(0,v,0), outPoint=rot(outer,v,0), inPoint=rot(inner,v,Math.min(theta,Math.PI/2));
      measure(solid,axisPoint,outPoint,'R','#6b4fa0',-6);
      measure(solid,axisPoint,inPoint,'r','#16736d',14);
      output.innerHTML='<strong>Washer at y = '+v.toFixed(2)+':</strong> outer radius R = √y ≈ '+outer.toFixed(3)+'; inner radius r = y = '+inner.toFixed(2)+'; cross-sectional area π(R² − r²) ≈ '+(Math.PI*(outer*outer-inner*inner)).toFixed(3)+'. Δy is the thin vertical thickness.';
    }else{
      var ri=v-thick/2,ro=v+thick/2,lower=v*v,upper=v;
      // Small curved panels have fixed radius, so the swept shape is a shell, not a disk.
      if(theta>0){
        for(var s2=0;s2<steps;s2++){
          var a0=theta*s2/steps,a1=theta*(s2+1)/steps;
          polygon(solid,[rot(ro,lower,a0),rot(ro,lower,a1),rot(ro,upper,a1),rot(ro,upper,a0)],{fill:'#cc785c','fill-opacity':'.36',stroke:'none'});
          polygon(solid,[rot(ri,upper,a0),rot(ro,upper,a0),rot(ro,upper,a1),rot(ri,upper,a1)],{fill:'#e1a38d','fill-opacity':'.55',stroke:'none'});
        }
        polyline(solid,arc(ro,lower,theta,false),{stroke:'#a9583e','stroke-width':1.8});
        polyline(solid,arc(ro,upper,theta,false),{stroke:'#a9583e','stroke-width':1.8});
        polyline(solid,arc(ri,upper,theta,false),{stroke:'#a9583e','stroke-width':1});
      }
      [0,theta].forEach(function(a){polygon(solid,[rot(ri,lower,a),rot(ro,lower,a),rot(ro,upper,a),rot(ri,upper,a)],{fill:'#cc785c','fill-opacity':'.7',stroke:'#963f2a','stroke-width':1.5});});
      var axisBase=P(0,lower,0), shellBase=rot(v,lower,0), shellTop=rot(v,upper,0);
      if(v<.15){
        line(solid,axisBase,shellBase,{stroke:'#6b4fa0','stroke-width':2});
        line(solid,shellBase,shellTop,{stroke:'#a9583e','stroke-width':2});
        line(solid,[(axisBase[0]+shellBase[0])/2,(axisBase[1]+shellBase[1])/2],[142,225],{stroke:'#6b4fa0','stroke-width':1});
        line(solid,[(shellBase[0]+shellTop[0])/2,(shellBase[1]+shellTop[1])/2],[204,225],{stroke:'#a9583e','stroke-width':1});
        text(solid,132,222,'ρ',{'font-size':14,'font-weight':'700',fill:'#6b4fa0',stroke:'#fffdfa','stroke-width':3,'paint-order':'stroke'});
        text(solid,206,222,'h',{'font-size':14,'font-weight':'700',fill:'#a9583e',stroke:'#fffdfa','stroke-width':3,'paint-order':'stroke'});
      }else{
        measure(solid,axisBase,shellBase,'ρ','#6b4fa0',-5);
        measure(solid,shellBase,shellTop,'h','#a9583e',0);
      }
      output.innerHTML='<strong>Shell at x = '+v.toFixed(2)+':</strong> radius ρ = x = '+v.toFixed(2)+'; height h = x − x² = '+(upper-lower).toFixed(4)+'; circumference 2πρ ≈ '+(2*Math.PI*v).toFixed(3)+'. Δx is the thin radial thickness.';
    }
  }
  var frame=0,previous=0,progress=+angle.value;
  function pause(){cancelAnimationFrame(frame);frame=0;previous=0;play.textContent='Play';}
  function tick(time){if(!previous)previous=time;progress+=(time-previous)*.06;previous=time;if(progress>=360){angle.value=360;draw();pause();return;}angle.value=progress;draw();frame=requestAnimationFrame(tick);}
  play.addEventListener('click',function(){if(frame){pause();return;}if(+angle.value>=360)angle.value=0;progress=+angle.value;play.textContent='Pause';frame=requestAnimationFrame(tick);});
  reset.addEventListener('click',function(){pause();angle.value=0;location.value=50;mode.value='washer';draw();});
  [angle,location].forEach(function(input){input.addEventListener('input',function(){pause();draw();});});
  mode.addEventListener('change',function(){pause();draw();});
  document.addEventListener('visibilitychange',function(){if(document.hidden)pause();});
  var saved;
  window.addEventListener('beforeprint',function(){pause();saved=angle.value;angle.value=360;draw();});
  window.addEventListener('afterprint',function(){if(saved!==undefined){angle.value=saved;draw();saved=undefined;}});
  draw();
})();
