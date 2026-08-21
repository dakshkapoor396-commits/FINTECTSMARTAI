const scene=document.querySelector('#scene');
const reveals=document.querySelectorAll('.reveal');
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if(reduced){reveals.forEach((el)=>el.classList.add('is-visible'));}
else{
  const observer=new IntersectionObserver((entries)=>entries.forEach((entry)=>{if(entry.isIntersecting)entry.target.classList.add('is-visible')}),{threshold:.15});
  reveals.forEach((el)=>observer.observe(el));
  window.addEventListener('mousemove',(event)=>{if(!scene)return;const x=(event.clientX/window.innerWidth-.5)*2;const y=(event.clientY/window.innerHeight-.5)*2;scene.style.setProperty('--mx',x);scene.style.setProperty('--my',y)},{passive:true});
}
document.querySelectorAll('a[href^="#"]').forEach((link)=>link.addEventListener('click',(event)=>{const target=document.querySelector(link.getAttribute('href'));if(target){event.preventDefault();target.scrollIntoView({behavior:reduced?'auto':'smooth'})}}));