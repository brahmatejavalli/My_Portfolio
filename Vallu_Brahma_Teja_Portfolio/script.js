// Theme toggle
(function(){
  function setTheme(t){ if(t==='dark') document.documentElement.setAttribute('data-theme','dark'); else document.documentElement.removeAttribute('data-theme'); localStorage.setItem('theme',t); }
  const s=localStorage.getItem('theme'); if(s) setTheme(s);
  document.querySelectorAll('#themeToggle').forEach(b=> b.addEventListener('click',()=>{ const cur=document.documentElement.getAttribute('data-theme')==='dark'?'dark':'light'; setTheme(cur==='dark'?'light':'dark'); }));
})();
// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',e=>{
    const id=a.getAttribute('href').slice(1); const el=document.getElementById(id);
    if(el){ e.preventDefault(); el.scrollIntoView({behavior:'smooth',block:'start'}); }
  });
});
