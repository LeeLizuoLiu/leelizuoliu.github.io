(function () {
  const frame=document.getElementById('riemann-frame');
  if(!frame)return;
  window.addEventListener('message',event=>{
    if(event.source!==frame.contentWindow||event.data?.type!=='ma1508-riemann-height')return;
    const height=event.data.height;
    if(typeof height==='number'&&Number.isFinite(height)&&height>=400&&height<=4000)frame.style.height=Math.ceil(height)+'px';
  });
})();
