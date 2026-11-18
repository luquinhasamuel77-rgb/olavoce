const $=id=>document.getElementById(id);
const openEnvelope=$("openEnvelope"),intro=$("intro"),letterSection=$("letterSection"),envelopeHint=$("envelopeHint"),
  music=$("backgroundMusic"),musicToggle=$("musicToggle"),musicIcon=$("musicIcon"),musicBars=$("musicBars"),vinyl=$("vinyl"),
  glow=$("glow"),progress=$("progress"),cv=$("fx"),ctx=cv.getContext("2d");
let envelopeOpened=false,mode="dust",parts=[],W,H;
const still=matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- MÚSICA ----------
Navegadores (Chrome/Safari) bloqueiam som automático ao abrir a página.
Por isso: tentamos tocar na hora; se bloquear, a música começa no PRIMEIRO
toque/clique/tecla em qualquer lugar (o envelope também conta). */
function fadeIn(){music.volume=0;let v=0;const t=setInterval(()=>{v=Math.min(v+.04,.85);music.volume=v;if(v>=.85)clearInterval(t)},120)}
async function startMusic(){
  if(!music.paused)return true;
  try{music.volume=0;await music.play();fadeIn();return true}catch(e){return false}
}
function updateMusicControl(){
  const p=!music.paused;
  musicIcon.textContent=p?"Ⅱ":"▶";
  const l=p?"Pausar música":"Continuar música";
  musicToggle.setAttribute("aria-label",l);musicToggle.title=l;
  musicBars.classList.toggle("paused",!p);vinyl.classList.toggle("paused",!p);
}
const gestures=["pointerdown","pointerup","touchend","click","keydown"];
function onGesture(){startMusic().then(ok=>{if(ok)gestures.forEach(g=>removeEventListener(g,onGesture,true))})}
gestures.forEach(g=>addEventListener(g,onGesture,{capture:true}));
startMusic().then(ok=>{if(ok)gestures.forEach(g=>removeEventListener(g,onGesture,true));updateMusicControl()});
musicToggle.addEventListener("click",e=>{e.stopPropagation();music.paused?music.play().catch(()=>{}):music.pause()},true);
["play","pause","ended"].forEach(ev=>music.addEventListener(ev,updateMusicControl));
document.addEventListener("visibilitychange",()=>{if(document.hidden&&!music.paused){music.pause();music._auto=1}else if(music._auto){music._auto=0;music.play().catch(()=>{})}});

/* ---------- PARTÍCULAS ---------- */
function resize(){W=cv.width=innerWidth*devicePixelRatio;H=cv.height=innerHeight*devicePixelRatio}
addEventListener("resize",resize);resize();
const dpr=()=>devicePixelRatio;
function mk(kind,x,y){
  if(kind==="dust")return{k:"d",x:Math.random()*W,y:y??Math.random()*H,r:(Math.random()*1.6+.4)*dpr(),vy:-(Math.random()*.25+.08)*dpr(),vx:(Math.random()-.5)*.15*dpr(),a:Math.random()*.5+.15,p:Math.random()*6};
  if(kind==="petal")return{k:"p",x:Math.random()*W,y:-20*dpr(),r:(Math.random()*5+4)*dpr(),vy:(Math.random()*.6+.35)*dpr(),vx:(Math.random()-.5)*.5*dpr(),a:Math.random()*.4+.35,rot:Math.random()*6,vr:(Math.random()-.5)*.03,p:Math.random()*6,c:Math.random()<.5?"214,150,140":"232,196,170"};
  const an=Math.random()*6.28,s=(Math.random()*4+1.5)*dpr();
  return{k:"b",x,y,r:(Math.random()*2.2+1)*dpr(),vx:Math.cos(an)*s,vy:Math.sin(an)*s-1.5*dpr(),a:1}
}
for(let i=0;i<55;i++)parts.push(mk("dust"));
function burst(x,y){for(let i=0;i<70;i++)parts.push(mk("b",x,y))}
function frame(t){
  ctx.clearRect(0,0,W,H);
  if(mode==="petal"&&Math.random()<.05&&parts.filter(p=>p.k==="p").length<22)parts.push(mk("petal"));
  parts=parts.filter(p=>{
    p.x+=p.vx;p.y+=p.vy;
    if(p.k==="d"){p.x+=Math.sin(t/1500+p.p)*.2;if(p.y<-10)p.y=H+10;ctx.fillStyle=`rgba(224,190,140,${p.a*(.6+.4*Math.sin(t/700+p.p))})`;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.3);ctx.fill();return true}
    if(p.k==="b"){p.vy+=.06*dpr();p.vx*=.985;p.a-=.012;ctx.fillStyle=`rgba(240,205,150,${Math.max(p.a,0)})`;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.3);ctx.fill();return p.a>0}
    p.x+=Math.sin(t/900+p.p)*.6*dpr();p.rot+=p.vr;
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle=`rgba(${p.c},${p.a})`;
    ctx.beginPath();ctx.ellipse(0,0,p.r,p.r*.55,0,0,6.3);ctx.fill();ctx.restore();
    return p.y<H+30;
  });
  requestAnimationFrame(frame);
}
if(!still)requestAnimationFrame(frame);

/* luz que acompanha o mouse */
addEventListener("pointermove",e=>{glow.style.setProperty("--mx",e.clientX+"px");glow.style.setProperty("--my",e.clientY+"px")});

/* ---------- ENVELOPE ---------- */
function openLetter(e){
  if(envelopeOpened)return;envelopeOpened=true;
  startMusic();
  const r=openEnvelope.getBoundingClientRect();
  if(!still)burst((r.left+r.width/2)*dpr(),(r.top+r.height/2)*dpr());
  intro.classList.add("is-opening");openEnvelope.classList.add("opening");
  openEnvelope.setAttribute("aria-label","Envelope aberto");envelopeHint.textContent="ABRINDO...";
  setTimeout(()=>{
    intro.hidden=true;letterSection.hidden=false;mode="petal";
    window.scrollTo({top:0,behavior:"auto"});
    setupReveal();
  },1450);
}
openEnvelope.addEventListener("click",openLetter);

/* ---------- LEITURA ---------- */
function setupReveal(){
  const els=[...document.querySelectorAll(".letter-text p"),document.querySelector(".paper-ending")];
  els.forEach(el=>el.classList.add("reveal"));
  const io=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting){en.target.classList.add("in");io.unobserve(en.target)}}),{threshold:.25});
  els.forEach(el=>io.observe(el));
}
addEventListener("scroll",()=>{
  const m=document.documentElement.scrollHeight-innerHeight;
  progress.style.width=(m>0?scrollY/m*100:0)+"%";
},{passive:true});
updateMusicControl();
