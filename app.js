const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
const video=$('#heroVideo'), hero=$('.hero'), loader=$('.loader'), loaderBar=$('.loader-line i');
const HERO_TIMELINE_SECONDS=38;
let duration=0,target=0,current=0,heroProgress=0,lastSeek=0;
const clamp=(n,min=0,max=1)=>Math.max(min,Math.min(max,n));
function updateHero(){
  const range=Math.max(1,hero.offsetHeight-innerHeight);
  heroProgress=clamp((scrollY-hero.offsetTop)/range);
  if(duration)target=heroProgress*Math.min(HERO_TIMELINE_SECONDS,duration-(1/24));
  document.body.classList.toggle('hero-active',heroProgress<.995);
}
const ready=()=>{
  if(!Number.isFinite(video.duration)||video.duration<=0)return;
  duration=video.duration; updateHero(); current=target;
  try{video.currentTime=current}catch(e){}
  loaderBar.style.width='100%'; setTimeout(()=>loader.classList.add('done'),220);
};
video.addEventListener('loadedmetadata',ready,{once:true}); video.addEventListener('loadeddata',ready,{once:true});
video.addEventListener('error',()=>{loader.querySelector('span').textContent='VISUAL SEQUENCE UNAVAILABLE';loaderBar.style.width='100%'});
addEventListener('scroll',updateHero,{passive:true}); addEventListener('resize',updateHero,{passive:true}); addEventListener('pageshow',updateHero); updateHero();
function scrub(now){
  if(duration&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
    const limitedDelta=clamp(target-current,-2.5,2.5);
    current+=limitedDelta*.08;
    // Let the browser finish decoding a requested frame before issuing another
    // seek. Replacing an in-flight seek every RAF can permanently hold frame 0.
    if(!video.seeking&&now-lastSeek>34&&Math.abs(video.currentTime-current)>.018){
      try{video.currentTime=clamp(current,0,duration-(1/24));lastSeek=now}catch(e){}
    }
  }
  requestAnimationFrame(scrub)
}scrub();
const nav=$('.nav'), navLinks=$$('.nav nav a');
addEventListener('scroll',()=>nav.classList.toggle('scrolled',scrollY>50),{passive:true});
const sectionObserver=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){navLinks.forEach(a=>a.classList.toggle('active',a.hash===`#${e.target.id}`))}}),{rootMargin:'-40% 0px -50%'}); $$('section[id]').forEach(s=>sectionObserver.observe(s));
const revealObserver=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')}),{threshold:.12}); $$('.reveal').forEach(x=>revealObserver.observe(x));
const ambientObserver=new IntersectionObserver(es=>es.forEach(e=>{const v=$('video',e.target); if(!v||e.target.classList.contains('panel'))return; e.isIntersecting?v.play().catch(()=>{}):v.pause()}),{threshold:.25}); $$('.engine-visual,.statement').forEach(x=>ambientObserver.observe(x));
$$('.panel').forEach(panel=>{const v=$('video',panel); const activate=()=>{$$('.panel video').forEach(o=>{if(o!==v)o.pause()});v.play().catch(()=>{});panel.classList.add('active')}; const deactivate=()=>{v.pause();panel.classList.remove('active')}; panel.addEventListener('mouseenter',activate);panel.addEventListener('mouseleave',deactivate);panel.addEventListener('focus',activate);panel.addEventListener('blur',deactivate);panel.addEventListener('click',()=>panel.classList.contains('active')?deactivate():activate())});
const menu=$('.menu');menu.addEventListener('click',()=>{nav.classList.toggle('open');menu.setAttribute('aria-expanded',nav.classList.contains('open'))});
let mx=innerWidth/2,my=innerHeight/2,dx=mx,dy=my,rx=mx,ry=my;addEventListener('pointermove',e=>{mx=e.clientX;my=e.clientY});function cursor(){dx+=(mx-dx)*.42;dy+=(my-dy)*.42;rx+=(mx-rx)*.16;ry+=(my-ry)*.16;$('.cursor-dot').style.transform=`translate3d(${dx}px,${dy}px,0)`;$('.cursor-ring').style.transform=`translate3d(${rx}px,${ry}px,0)`;requestAnimationFrame(cursor)}cursor();
$$('[data-cursor]').forEach(el=>{const mode=el.dataset.cursor;el.addEventListener('mouseenter',()=>document.body.classList.add(`cursor-${mode}`));el.addEventListener('mouseleave',()=>document.body.classList.remove(`cursor-${mode}`))});
