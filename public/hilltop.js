'use strict';
(function(){
 const tag=document.getElementById('plasma-config');let ads;try{ads=JSON.parse(tag.textContent).advertising;}catch{return;}
 if(!ads?.enabled||ads.provider!=='hilltop')return;
 function valid(value){try{const u=new URL(value);return u.protocol==='https:'&&u.hostname==='admired-raise.com'?u.href:null;}catch{return null;}}
 const banner=valid(ads.bannerScript),pop=valid(ads.popunderURL),direct=valid(ads.directURL);
 const path=location.pathname.replace(/\/+$/,'')||'/';
 const style=document.createElement('link');style.rel='stylesheet';style.href='/ads.css';document.head.append(style);
 // The supplied Hilltop tag is a 300x250 unit and only initializes once per
 // window. Give additional placements their own document so each can render.
 function isolatedBanner(source=banner){
  const frame=document.createElement('iframe');
  frame.className='watch-ad-frame';frame.title='Advertisement';frame.loading='lazy';
  frame.setAttribute('sandbox','allow-scripts allow-popups allow-popups-to-escape-sandbox');
  const safe=source.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
  frame.srcdoc='<!doctype html><html><head><meta name="referrer" content="no-referrer-when-downgrade"><style>html,body{margin:0;width:300px;height:250px;overflow:hidden;background:#100d15}</style></head><body><script async src="'+safe+'"><\/script></body></html>';
  return frame;
 }
 function adPlacement(className){
  const slot=document.createElement('aside');slot.className='watch-ad '+className;slot.setAttribute('aria-label','Advertisement');
  const label=document.createElement('span');label.textContent='Advertisement';slot.append(label,isolatedBanner());return slot;
 }
 if((path==='/'||(path==='/iptv-player'||path==='/iptv'))&&banner){
  const player=document.querySelector('#watch-player'),pane=player?.querySelector('.video-pane');
  if(player&&pane){
   const top=adPlacement('watch-ad-top');
   const stage=document.createElement('div');stage.className='watch-stage';pane.before(stage);
   stage.append(adPlacement('watch-ad-left'),pane,adPlacement('watch-ad-right'));
   player.after(adPlacement('sitewide-ad'));
   const phone=window.matchMedia('(max-width: 700px)');
   const placeTop=()=>{if(phone.matches)player.querySelector('.channel-sidebar').append(top);else player.before(top);};
   placeTop();if(phone.addEventListener)phone.addEventListener('change',placeTop);else phone.addListener?.(placeTop);
  }
 }
 if(banner){
   const dialog=document.createElement('dialog');dialog.className='watch-ad-break';dialog.setAttribute('aria-label','Advertisement break');
   const content=document.createElement('div');content.className='watch-ad-break-content';
   const title=document.createElement('p');title.textContent='Advertisement';
   const close=document.createElement('button');close.type='button';close.className='watch-ad-close';close.textContent='Close ad';close.setAttribute('aria-label','Close advertisement');
   const ad=document.createElement('div');ad.className='watch-ad-break-unit';content.append(close,title,ad);dialog.append(content);document.body.append(dialog);
   let timer,pending=false;
   const key='plasmax-next-ad-break';
   const getDue=()=>{try{return Number(sessionStorage.getItem(key))||0;}catch{return 0;}};
   const setDue=due=>{try{sessionStorage.setItem(key,String(due));}catch{}};
   const schedule=(fresh=false)=>{clearTimeout(timer);let due=fresh?0:getDue();if(!due){due=Date.now()+(10+Math.random()*25)*60*1000;setDue(due);}timer=setTimeout(showBreak,Math.max(0,due-Date.now()));};
   let resumeAfterBreak=false;
   function showBreak(){if(document.hidden){pending=true;return;}pending=false;const video=document.querySelector('#iptv-video');resumeAfterBreak=!!video&&!video.paused;if(resumeAfterBreak)video.pause();ad.replaceChildren(isolatedBanner());if(!dialog.open)dialog.showModal();}
   close.addEventListener('click',()=>dialog.close());
   dialog.addEventListener('close',()=>{ad.replaceChildren();if(resumeAfterBreak){const video=document.querySelector('#iptv-video');video?.play().catch(()=>{});}resumeAfterBreak=false;schedule(true);});
   document.addEventListener('visibilitychange',()=>{if(!document.hidden&&pending&&!dialog.open)showBreak();});
   schedule();
 }
 if(banner&&!['/','/iptv','/iptv-player','/x','/twitch'].includes(path)){
  const content=document.querySelector('.ct-inner-content, main, article')||document.querySelector('header');
  if(content){
   const paragraphs=[...content.querySelectorAll('p')].filter(p=>p.textContent.trim().length>80);
   const first=paragraphs[0],middle=paragraphs.length>3?paragraphs[Math.floor(paragraphs.length/2)]:null;
   if(first)first.after(adPlacement('sitewide-ad'));else content.after(adPlacement('sitewide-ad'));
   if(middle)middle.after(adPlacement('sitewide-ad'));
  }
 }
 if(banner||direct){
  const target=(path==='/'||(path==='/iptv-player'||path==='/iptv'))?document.querySelector('.channel-sidebar'):['/x','/twitch'].includes(path)?document.querySelector('.social-actions'):null;
  if(target){const slot=document.createElement('aside');slot.className='hilltop-banner';slot.setAttribute('aria-label','Advertisement');slot.innerHTML='<p>Advertisement</p>';if(direct){const a=document.createElement('a');a.href=direct;a.textContent='Visit sponsor';a.target='_blank';a.rel='sponsored noopener noreferrer';slot.append(a);}if(path==='/'||(path==='/iptv-player'||path==='/iptv'))target.append(slot);else target.after(slot);
   const start=()=>{slot.append(isolatedBanner());};
   if(!banner)return;
   if('IntersectionObserver' in window){const io=new IntersectionObserver(entries=>{if(entries.some(x=>x.isIntersecting)){io.disconnect();start();}},{rootMargin:'200px'});io.observe(slot);}else start();
  }
 }
 // Additional supplied Hilltop tag, loaded once per page.
 const extra=isolatedBanner('https://admired-raise.com/bHX.VTsodrGWlk0/Y/WXce/Je/m/9sunZ/U/lHk/PbTuc-1wOHTeEM1hNFDGUxtnNrzdUm5ZMZTRUZ0QOhQT');
 extra.title='Advertisement'; extra.style.cssText='width:300px;height:250px;border:0;display:block;max-width:100%;margin:1rem auto';
 document.body.append(extra);
 if(banner){
  const floating=adPlacement('floating-ad');
  const close=document.createElement('button');close.type='button';close.textContent='Close ad';close.setAttribute('aria-label','Close floating advertisement');
  close.addEventListener('click',()=>floating.remove());floating.prepend(close);document.body.append(floating);
 }
 if(pop){
  const key='plasmax-hilltop-popunder-last',interval=Math.max(24,Number(ads.popunderIntervalHours)||24)*3600000;let tried=false;
  document.addEventListener('click',event=>{
   if(tried||!event.isTrusted||event.defaultPrevented||event.target.closest('a,button,input,select,textarea,summary,video,[role="button"],.plasma-video-frame,.hilltop-banner'))return;
   let last=0;try{last=Number(localStorage.getItem(key))||0;}catch{}
   if(Date.now()-last<interval){tried=true;return;}
   tried=true;try{localStorage.setItem(key,String(Date.now()));}catch{}
   window.open(pop,'_blank','noopener,noreferrer');
  },{passive:true});
 }
})();




