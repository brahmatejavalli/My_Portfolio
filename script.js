// Avatar upload & persist
(function(){
  const AVATAR_KEY = 'portfolio_avatar_v1';
  const defaultAvatar = 'https://api.dicebear.com/6.x/identicon/svg?seed=ValluTeja&scale=90';

  function applyAvatar(src) {
    document.querySelectorAll('.avatar').forEach(img => {
      img.src = src || defaultAvatar;
    });
  }

  try {
    const stored = localStorage.getItem(AVATAR_KEY);
    if (stored) applyAvatar(stored);
    else applyAvatar(defaultAvatar);
  } catch (e) {
    console.warn('Avatar load failed', e);
    applyAvatar(defaultAvatar);
  }

  const changeBtn = document.getElementById('changeAvatarBtn');
  const resetBtn = document.getElementById('resetAvatarBtn');
  const fileInput = document.getElementById('avatarInput');

  if (changeBtn && fileInput) {
    changeBtn.addEventListener('click', () => fileInput.click());
  }

  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      if (!f.type.startsWith('image/')) { alert('Please select an image file'); return; }
      if (f.size > 2.5 * 1024 * 1024) {
        if(!confirm('File is larger than 2.5MB and may fail to save in browser storage. Continue?')) return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const dataUrl = reader.result;
          localStorage.setItem(AVATAR_KEY, dataUrl);
          applyAvatar(dataUrl);
          alert('Profile picture updated (saved in this browser).');
        } catch (err) {
          console.error('Saving avatar failed', err);
          alert('Could not save image to localStorage (maybe size). Try a smaller image.');
        }
      };
      reader.onerror = () => {
        alert('Failed to read file.');
      };
      reader.readAsDataURL(f);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (!confirm('Reset profile picture to default?')) return;
      localStorage.removeItem(AVATAR_KEY);
      applyAvatar(defaultAvatar);
      alert('Reset complete.');
    });
  }
})();

// Theme toggle + persist
(function(){
  function setTheme(t){
    if(t==='dark') document.documentElement.setAttribute('data-theme','dark');
    else document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', t);
  }
  const stored = localStorage.getItem('theme');
  if(stored) setTheme(stored);
  document.querySelectorAll('[id^=themeToggle]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      setTheme(cur === 'dark' ? 'light' : 'dark');
    });
  });
})();

// Projects: Add from files feature
(function(){
  const projectsKey = 'portfolio_projects_v1';
  const projectsListEl = document.getElementById('projectsList');
  const form = document.getElementById('addProjectForm');
  if(!form || !projectsListEl) return; // not on this page

  const titleInput = document.getElementById('projTitle');
  const descInput = document.getElementById('projDesc');
  const screenshotInput = document.getElementById('screenshotInput');
  const filesInput = document.getElementById('filesInput');

  const createZipBtn = document.getElementById('createZipBtn');
  const saveProjBtn = document.getElementById('saveProjBtn');
  const clearProjBtn = document.getElementById('clearProjBtn');

  function loadProjects(){
    const raw = localStorage.getItem(projectsKey);
    if(!raw) return [];
    try{ return JSON.parse(raw); }catch(e){ console.warn('Invalid projects data', e); return []; }
  }
  function saveProjects(arr){ localStorage.setItem(projectsKey, JSON.stringify(arr)); }

  function renderProjects(){
    const arr = loadProjects();
    if(arr.length === 0){
      projectsListEl.innerHTML = '<p class="muted">No projects added yet. Use the form below to add one from your files.</p>';
      return;
    }
    projectsListEl.innerHTML = '';
    arr.forEach((p, idx)=>{
      const card = document.createElement('article');
      card.className = 'proj';
      card.innerHTML = `
        <div style="display:flex; gap:12px; align-items:flex-start;">
          ${p.screenshot ? `<img src="${p.screenshot}" alt="${p.title} screenshot" style="width:120px;height:80px;object-fit:cover;border-radius:6px;"/>` : ''}
          <div>
            <h3 style="margin:0 0 6px;">${p.title}</h3>
            <p style="margin:0 0 6px;">${p.description}</p>
            <div style="display:flex; gap:8px; margin-top:8px;">
              ${p.zipName ? `<a class="btn ghost" href="${p.zipUrl || '#'}" download="${p.zipName}">Download ZIP</a><span class="filename">${p.zipName}</span>` : ''}
              <button class="btn" data-idx="${idx}" data-action="remove">Remove</button>
            </div>
          </div>
        </div>
      `;
      projectsListEl.appendChild(card);
    });

    projectsListEl.querySelectorAll('button[data-action="remove"]').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        const idx = Number(btn.getAttribute('data-idx'));
        const arr = loadProjects();
        arr.splice(idx,1);
        saveProjects(arr);
        renderProjects();
      });
    });
  }

  function fileToDataURL(file){
    return new Promise((res, rej)=>{
      const r = new FileReader();
      r.onload = ()=>res(r.result);
      r.onerror = ()=>rej(new Error('File read error'));
      r.readAsDataURL(file);
    });
  }

  async function createZipAndLink(filesList, zipName = 'project.zip'){
    if(!filesList || filesList.length === 0) throw new Error('No files selected');
    const zip = new JSZip();
    for(const f of filesList){ const path = f.webkitRelativePath || f.name; zip.file(path, f); }
    const content = await zip.generateAsync({type:'blob'});
    const url = URL.createObjectURL(content);
    return { url, name: zipName, blob: content };
  }

  createZipBtn.addEventListener('click', async ()=>{
    try{
      if(!filesInput.files || filesInput.files.length === 0){ alert('Select project files first (use the files input).'); return; }
      const title = titleInput.value.trim() || 'project';
      const zipName = `${title.replace(/\s+/g,'_').toLowerCase()}.zip`;
      createZipBtn.disabled = true;
      createZipBtn.textContent = 'Zipping...';
      const {url, name} = await createZipAndLink(filesInput.files, zipName);
      const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      createZipBtn.disabled = false; createZipBtn.textContent = 'Create ZIP & Download';
    }catch(err){ console.error(err); alert('Failed to create ZIP: ' + err.message); createZipBtn.disabled = false; createZipBtn.textContent = 'Create ZIP & Download'; }
  });

  saveProjBtn.addEventListener('click', async ()=>{
    const title = titleInput.value.trim(); const desc = descInput.value.trim(); if(!title || !desc){ alert('Title and description are required'); return; }
    let screenshotDataUrl = '';
    if(screenshotInput.files && screenshotInput.files[0]){ try{ screenshotDataUrl = await fileToDataURL(screenshotInput.files[0]); }catch(e){ console.warn('screenshot read failed', e); } }
    let zipName = ''; let zipUrl = '';
    if(filesInput.files && filesInput.files.length > 0){ try{ zipName = `${title.replace(/\s+/g,'_').toLowerCase()}.zip`; const {url, name} = await createZipAndLink(filesInput.files, zipName); zipUrl = url; }catch(e){ console.warn('zip creation failed', e); } }
    const arr = loadProjects();
    arr.unshift({ title, description: desc, screenshot: screenshotDataUrl, zipUrl, zipName, createdAt: Date.now() });
    saveProjects(arr); renderProjects();
    titleInput.value=''; descInput.value=''; screenshotInput.value=''; alert('Project saved locally. Download the ZIP if you uploaded files (use "Create ZIP & Download"). To publish, push files to GitHub separately.');
  });

  clearProjBtn.addEventListener('click', ()=>{ if(!confirm('Clear all saved project entries from this browser?')) return; localStorage.removeItem(projectsKey); renderProjects(); });

  renderProjects();
})();

/* PREMIUM INTRO SCRIPT (appended) */
(function(){
  const intro = document.getElementById('premium-intro');
  if(!intro) return;

  const canvas = document.getElementById('intro-canvas');
  const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
  const logo = document.getElementById('introLogo');
  const logoFallback = document.getElementById('logoFallback');
  const sub = document.getElementById('introSub');
  const skipBtn = document.getElementById('skipIntro');

  const SHOW_ONCE_KEY = 'portfolio_intro_shown_v1';
  const SHOW_ONCE = true;
  const TYPEWRITER_TEXT = 'Backend • Full-stack • Python • JavaScript';
  const PARTICLE_COUNT = 60;
  const PARTICLE_COLOR = 'rgba(96,165,250,0.9)';

  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced){
    setTimeout(()=>{ try{ intro.style.display='none'; }catch(e){} }, 200);
    return;
  }

  try{
    if(SHOW_ONCE && localStorage.getItem(SHOW_ONCE_KEY)){
      intro.style.display = 'none';
      return;
    }
  }catch(e){}

  function resizeCanvas(){
    if(!canvas || !ctx) return;
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const particles = [];
  function rand(a,b){ return a + Math.random()*(b-a); }
  function initParticles(){
    particles.length = 0;
    for(let i=0;i<PARTICLE_COUNT;i++){
      particles.push({ x: rand(0, window.innerWidth), y: rand(0, window.innerHeight), vx: rand(-0.25,0.25), vy: rand(-0.05,0.05), r: rand(0.6, 2.8), alpha: rand(0.08,0.35) });
    }
  }
  function drawParticles(){
    if(!ctx) return;
    ctx.clearRect(0,0,canvas.width, canvas.height);
    for(const p of particles){
      p.x += p.vx; p.y += p.vy;
      if(p.x < -10) p.x = window.innerWidth + 10;
      if(p.x > window.innerWidth + 10) p.x = -10;
      if(p.y < -10) p.y = window.innerHeight + 10;
      if(p.y > window.innerHeight + 10) p.y = -10;
      ctx.beginPath();
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r*8);
      g.addColorStop(0, PARTICLE_COLOR.replace('0.9','0.95'));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.globalAlpha = p.alpha;
      ctx.arc(p.x, p.y, p.r*6, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  initParticles();

  let rafId;
  function loop(){
    drawParticles();
    rafId = requestAnimationFrame(loop);
  }
  rafId = requestAnimationFrame(loop);

  function prepareLogoFallback(){
    if(logo && logo.complete && logo.naturalWidth>0){
      logo.style.display = '';
      logoFallback.style.display = 'none';
    }else{
      logo && (logo.style.display = 'none');
      logoFallback.style.display = 'flex';
      const brand = (document.querySelector('.brand') && document.querySelector('.brand').textContent) || 'MP';
      logoFallback.textContent = brand.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
    }
  }
  prepareLogoFallback();

  setTimeout(()=> intro.classList.add('premium-ready'), 80);

  function typeWriter(text, el, speed=36){
    let i=0;
    el.textContent = '';
    const t = setInterval(()=> {
      if(i < text.length) el.textContent += text[i++];
      else clearInterval(t);
    }, speed);
  }
  setTimeout(()=> typeWriter(TYPEWRITER_TEXT, sub, 28), 900);

  // No auto-hide: intro stays until user clicks "Go back"
  function hideSoon(fadeDur=700){
    cancelAnimationFrame(rafId);
    intro.classList.add('premium-hide');
    setTimeout(()=> {
      try { intro.style.display = 'none'; } catch(e){}
      try { if(SHOW_ONCE) localStorage.setItem(SHOW_ONCE_KEY, '1'); } catch(e){}
    }, fadeDur+120);
  }

  skipBtn && skipBtn.addEventListener('click', ()=> { hideSoon(260); });
  // remove Escape key behavior so only clicking Go back closes intro

  setTimeout(()=> skipBtn && skipBtn.focus(), 1000);

  (function copyAvatarIfNeeded(){
    const pageAvatar = document.querySelector('.avatar');
    if(pageAvatar && pageAvatar.src){
      if(!logo || (logo && logo.complete && logo.naturalWidth===0)){
        logoFallback.style.background = 'transparent';
        logoFallback.style.display = 'none';
        const img = document.createElement('img');
        img.src = pageAvatar.src;
        img.alt = 'Profile';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '12px';
        document.getElementById('logoWrap').appendChild(img);
        img.style.opacity = 0;
        setTimeout(()=> img.style.transition = 'transform .6s cubic-bezier(.2,.9,.2,1), opacity .6s', 50);
        setTimeout(()=> { img.style.transform='scale(1)'; img.style.opacity = 1; }, 120);
      }
    }
  })();

})();
