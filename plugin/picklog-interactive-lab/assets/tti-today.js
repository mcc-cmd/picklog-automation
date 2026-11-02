/* 오늘의 띠 운세 [picklog_today_tti] — 계산은 tti-core.js(게임과 같은 식) */
(function(){
var TPL='<h2>오늘의 띠 운세</h2><div class="sub" id="ttiDate"></div><div class="grid" id="ttiGrid"></div><div class="card" id="ttiCard"></div><div class="note">재미로 보는 운세예요. 매일 자정에 새로 바뀌어요.</div>';
function run(){

var root=document.querySelector('.pil-today'); if(!root)return; root.innerHTML=TPL;
  var now=new Date(), sel=(location.hash||'').replace('#','');
if(TTI_KEYS.indexOf(sel)<0){try{sel=localStorage.getItem('ttiPick')||'';}catch(e){}}
if(TTI_KEYS.indexOf(sel)<0)sel='rat';
document.getElementById('ttiDate').textContent=(now.getMonth()+1)+'월 '+now.getDate()+'일 · 띠를 눌러 오늘 운세를 확인하세요';
function star(n){var s='';for(var i=0;i<5;i++)s+=i<n?'★':'☆';return s;}
function render(){
  var g=document.getElementById('ttiGrid'); g.innerHTML='';
  TTI_KEYS.forEach(function(k){var f=ttiFortune(k,now), b=document.createElement('button'); b.className='t'; b.type='button'; b.setAttribute('aria-pressed',k===sel?'true':'false');
    b.innerHTML='<span class="e">'+f.emoji+'</span><span class="n">'+f.name+'</span><span class="g '+f.grade+'">'+f.grade+'</span>';
    b.onclick=function(){sel=k; try{localStorage.setItem('ttiPick',k);}catch(e){} render(); document.getElementById('ttiCard').scrollIntoView({behavior:'smooth',block:'start'});};
    g.appendChild(b);});
  var f=ttiFortune(sel,now), L={money:'금전운',love:'연애운',health:'건강운',work:'일·학업'};
  var rows=''; for(var c in L)rows+='<div class="row"><b>'+L[c]+'</b><span class="stars">'+star(f.stars[c])+'</span><span>'+f.tips[c]+'</span></div>';
  document.getElementById('ttiCard').innerHTML='<div class="head"><span class="e">'+f.emoji+'</span><div><h3>'+f.name+'띠 오늘의 운세</h3><span class="badge '+f.grade+'">'+f.grade+'</span></div></div>'+
    '<p class="msg">'+f.msg+'</p>'+rows+
    '<div class="lucky"><div><small>행운의 숫자</small><strong>'+f.num+'</strong></div><div><small>행운의 색</small><strong>'+f.color+'</strong></div><div><small>좋은 방향</small><strong>'+f.dir+'</strong></div></div>'+
    '<div class="code"><small>띠 군단 러너 게임 보상 코드</small><strong>'+f.code+'</strong><p>게임 첫 화면 코드 칸에 넣으면 <b>오늘 하루 스킬 +1회 · 시작 군단 +20</b></p><button class="copy" type="button" id="ttiCopy">코드 복사</button><a class="play" href="/game/">🎮 띠 군단 러너에서 코드 쓰기 →</a></div>';
  document.getElementById('ttiCopy').onclick=function(){var b=this; try{navigator.clipboard.writeText(f.code).then(function(){b.textContent='복사했어요';},function(){b.textContent=f.code;});}catch(e){b.textContent=f.code;}};
}
render();
window.addEventListener('hashchange',function(){var h=location.hash.replace('#',''); if(TTI_KEYS.indexOf(h)>=0){sel=h; render();}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run); else run();
})();
