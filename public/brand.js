'use strict';
(function(){
 function brandPlayer(video){
  if(video.closest('[data-plasma-player]'))return;
  let frame=video.parentElement;
  if(!frame.classList.contains('x-media-frame')){frame=document.createElement('div');video.before(frame);frame.append(video);}
  frame.classList.add('plasma-video-frame');frame.dataset.plasmaPlayer='';
  if(video.id==='iptv-video'){
   const bar=document.createElement('div');bar.className='plasma-controls';bar.setAttribute('role','group');bar.setAttribute('aria-label','Video controls');
   const button=(label,icon)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',label);b.title=label;b.innerHTML=icon;bar.append(b);return b;};
   const play=button('Play','<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>');
   const mute=button('Mute','<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4zm12-1a6 6 0 010 8m2-11a10 10 0 010 14" fill="none" stroke="currentColor" stroke-width="2"/></svg>');
   const volume=document.createElement('input');volume.type='range';volume.min='0';volume.max='1';volume.step='0.05';volume.value=String(video.volume);volume.setAttribute('aria-label','Volume');bar.append(volume);
   const seek=document.createElement('input');seek.type='range';seek.min='0';seek.max='100';seek.value='0';seek.hidden=true;seek.className='plasma-seek';seek.setAttribute('aria-label','Seek');bar.append(seek);
   const status=document.createElement('span');status.className='plasma-live-indicator';status.textContent='LIVE';bar.append(status);
   const syncTime=()=>{const finite=Number.isFinite(video.duration)&&video.duration>0;seek.hidden=!finite;status.hidden=finite;if(finite)seek.value=String(video.currentTime/video.duration*100);};
   video.addEventListener('durationchange',syncTime);video.addEventListener('timeupdate',syncTime);seek.oninput=()=>{if(Number.isFinite(video.duration))video.currentTime=Number(seek.value)*video.duration/100;};
   const full=button('Full screen','<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5m6 0h5v5M4 15v5h5m6 0h5v-5" fill="none" stroke="currentColor" stroke-width="2"/></svg>');
   const togglePlayback=()=>{if(video.paused)video.play().catch(()=>{});else video.pause();};
   play.onclick=togglePlayback;
   const feedback=document.createElement('span');feedback.className='plasma-tap-feedback';feedback.setAttribute('aria-hidden','true');frame.append(feedback);
   let feedbackTimer;
   video.addEventListener('click',()=>{const wasPaused=video.paused;togglePlayback();feedback.innerHTML=wasPaused?'<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>':'<svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zm6 0h4v14h-4z" fill="currentColor"/></svg>';feedback.classList.add('visible');clearTimeout(feedbackTimer);feedbackTimer=setTimeout(()=>feedback.classList.remove('visible'),2000);});
   video.addEventListener('play',()=>{play.setAttribute('aria-label','Pause');play.title='Pause';play.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zm6 0h4v14h-4z" fill="currentColor"/></svg>';});
   video.addEventListener('pause',()=>{play.setAttribute('aria-label','Play');play.title='Play';play.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';});
   mute.onclick=()=>{video.muted=!video.muted;};volume.oninput=()=>{video.volume=Number(volume.value);video.muted=video.volume===0;};
   video.addEventListener('volumechange',()=>{mute.setAttribute('aria-label',video.muted?'Unmute':'Mute');mute.title=video.muted?'Unmute':'Mute';volume.value=String(video.muted?0:video.volume);});
   full.onclick=()=>document.querySelector('#fullscreen-playback')?.click();
   frame.append(bar);video.controls=false;
  }
  const mark=document.createElement('span');mark.className='plasma-watermark';mark.setAttribute('aria-hidden','true');
  const image=document.createElement('img');image.src='/assets/plasmax-mark.svg';image.alt='';mark.append(image);frame.append(mark);
 }
 function scan(node){if(node.nodeType!==1)return;if(node.matches('video'))brandPlayer(node);node.querySelectorAll('video').forEach(brandPlayer);}
 scan(document.body);
 new MutationObserver(records=>{for(const r of records)for(const node of r.addedNodes)scan(node);}).observe(document.body,{childList:true,subtree:true});
 const config=document.getElementById('plasma-config');if(!config)return;
 let data;try{data=JSON.parse(config.textContent);}catch{return;}
 for(const [key,label,base] of [['xProfile','Follow on X','x.com'],['twitchURL','Watch on Twitch','twitch.tv']]){
  if(!data[key])continue;try{const url=new URL(data[key]);if(url.protocol!=='https:'||!(url.hostname===base||url.hostname==='www.'+base||(key==='xProfile'&&['twitter.com','www.twitter.com'].includes(url.hostname))))continue;
   const nav=document.querySelector('.plasma-platforms');if(!nav)continue;const a=document.createElement('a');a.href=url.href;a.textContent=label;a.target='_blank';a.rel='noopener noreferrer';a.className='plasma-profile-link';nav.append(a);
  }catch{/* Missing/invalid configured account links stay absent. */}
 }
 // Keep navigation focused on the requested destinations and open social profiles directly.
 function updateNavigation(){
  document.querySelectorAll('nav a, [role="navigation"] a, .menu-item a').forEach(a=>{
   const href=a.getAttribute('href') || '';
   if(['/blog/','/guest-posts/','/contact-us/','/newsletter/'].includes(href) || (href==='/iptv-player/' && /^iptv players?$/i.test(a.textContent.trim()))) { const item=a.closest('li'); if(item) item.remove(); else a.remove(); return; }
   if(href==='/x/' || href==='/twitch/') { a.href=href==='/x/' ? data.xProfile : data.twitchURL; a.target='_blank'; a.rel='noopener noreferrer'; }
  });
 }
 updateNavigation();
 new MutationObserver(updateNavigation).observe(document.body,{childList:true,subtree:true});
 // Keep platform navigation on the player and all of its existing pages.
 const mainNav=document.querySelector('nav');
 if(mainNav&&!document.getElementById('plasma-platform-nav')){
  const bar=document.createElement('nav');bar.id='plasma-platform-nav';bar.setAttribute('aria-label','PlasmaX services');
  bar.style.cssText='display:flex;justify-content:center;gap:1.5rem;flex-wrap:wrap;padding:12px;background:#211929;color:white';
  for(const [href,label] of [['/','Home'],['/iptv','IPTV'],['/exchange','Exchange']]){const a=document.createElement('a');a.href=href;a.textContent=label;a.style.cssText='color:white;font-weight:600;text-decoration:none';bar.append(a);}
  document.body.prepend(bar);
 }
 const ads=data.advertising;
 if(ads?.enabled&&ads.provider==='hilltop'&&!document.querySelector('script[src="/hilltop.js"]')){
  const script=document.createElement('script');script.src='/hilltop.js';script.async=true;document.head.append(script);
 }
 // Ads are limited to the sandboxed Hilltop renderer on the unified site.
})();
