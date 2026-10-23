const {test}=require('node:test'), assert=require('node:assert/strict'), fs=require('node:fs'), path=require('node:path'), Module=require('node:module'), ts=require('typescript');
const {JSDOM}=require('jsdom');
const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:'https://spark.example/'}),w=dom.window;
global.window=w;global.document=w.document;global.HTMLElement=w.HTMLElement;global.Event=w.Event;global.IS_REACT_ACT_ENVIRONMENT=true;
Object.defineProperty(global,'navigator',{value:w.navigator,configurable:true});global.localStorage=w.localStorage;
w.matchMedia=()=>({matches:true});w.HTMLElement.prototype.scrollIntoView=function(){};
w.HTMLMediaElement.prototype.pause=function(){};w.HTMLMediaElement.prototype.load=function(){};w.HTMLMediaElement.prototype.play=function(){return Promise.resolve();};w.HTMLMediaElement.prototype.canPlayType=()=>'';
const React=require('react'),{createRoot}=require('react-dom/client'),{act}=React;
let intersect,requests=[],instances=[],responseError=false;
w.IntersectionObserver=class {constructor(callback){intersect=callback;}observe(){}disconnect(){}};global.IntersectionObserver=w.IntersectionObserver;
const fixture='#EXTM3U\n'+Array.from({length:230},(_,i)=>`#EXTINF:-1 tvg-id="station${i}" group-title="${i%2?'News':'Sports'}",Station ${i}\nhttps://video.example/${i}.m3u8`).join('\n');
global.fetch=async (url,options)=>{
 requests.push({url:String(url),options});
 if(responseError)return Response.json({error:'Provider unavailable'},{status:502});
 if(String(url).startsWith('https://free-iptv-player'))return Response.json({text:fixture,url:'https://example.com/list.m3u'});
 const params=new URL(url,'https://spark.example').searchParams;
 const favorites=options?.method==='POST'?new Set(JSON.parse(options.body)):null;
 const rows=parsedFixture.filter(c=>(!params.get('q')||c.name.toLowerCase().includes(params.get('q')))&&(!params.get('category')||c.group===params.get('category'))&&(!favorites||favorites.has(c.url)));
 const page=Math.min(Number(params.get('page')||0),Math.max(0,Math.ceil(rows.length/100)-1));
 return Response.json({channels:rows.slice(page*100,(page+1)*100),categories:['News','Sports'],total:230,count:rows.length,page,pageSize:100});
};
class FakeHls {static Events={MANIFEST_PARSED:'manifest',ERROR:'error'};static ErrorTypes={MEDIA_ERROR:'mediaError'};static isSupported=()=>true;constructor(config){this.config=config;this.handlers={};instances.push(this);}on(e,f){this.handlers[e]=f;}loadSource(url){this.url=url;}attachMedia(){queueMicrotask(()=>this.handlers.manifest?.());}destroy(){this.destroyed=true;}recoverMediaError(){this.recovered=true;}}
const cache=new Map();
function load(relative){const filename=path.resolve(relative);if(cache.has(filename))return cache.get(filename).exports;const m=new Module(filename,module);m.filename=filename;m.paths=module.paths;cache.set(filename,m);m.require=id=>{if(id.startsWith('.')&&fs.existsSync(path.resolve(path.dirname(filename),id)+'.ts'))return load(path.resolve(path.dirname(filename),id)+'.ts');if(id.endsWith('.module.css'))return {__esModule:true,default:new Proxy({},{get:(_,key)=>String(key)})};if(id==='hls.js')return {__esModule:true,default:FakeHls};if(id.startsWith('@/'))return load('src/'+id.slice(2)+(fs.existsSync('src/'+id.slice(2)+'.ts')?'.ts':'.tsx'));return require(id);};m._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,filename);return m.exports;}
const {parseTVPlaylist}=load('src/lib/tv-playlist.ts');
const parsedFixture=parseTVPlaylist(fixture,'https://example.com/list.m3u');
const {LiveTVSection}=load('src/components/live-tv-section.tsx');
const tick=()=>new Promise(r=>setImmediate(r));
async function click(element){assert(element);await act(async()=>{element.click();await tick();});}
async function input(element,value){await act(async()=>{Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype,'value').set.call(element,value);element.dispatchEvent(new w.Event('input',{bubbles:true}));await tick();});}
function channelButtons(){return [...document.querySelectorAll('button[aria-pressed]')].filter(b=>!b.getAttribute('aria-label'));}

test('M3U parsing preserves metadata, relative feeds and shared categories while rejecting unsafe URLs',()=>{const list='#EXTM3U\n#EXTINF:-1 tvg-id="One" group-title="Sports",Name, With Comma\nlive.m3u8\n#EXTINF:-1 group-title="News",Same feed\nlive.m3u8\n#EXTINF:-1,Bad\njavascript:alert(1)';const parsed=parseTVPlaylist(list,'https://example.com/list.m3u');assert.equal(parsed.length,1);assert.equal(parsed[0].url,'https://example.com/live.m3u8');assert.equal(parsed[0].name,'Name, With Comma');assert.equal(parsed[0].group,'Sports;News');});

test('landing TV lazily loads, filters all channels, saves favorites and cleans up native HLS playback',async()=>{
 requests=[];instances=[];const root=createRoot(document.getElementById('root'));
 try {
  await act(async()=>root.render(React.createElement(LiveTVSection)));
  assert.equal(requests.length,0);assert(document.querySelector('video'));assert(!document.querySelector('iframe'));
  await act(async()=>{intersect([{isIntersecting:true}]);await tick();});assert(requests[0].url.startsWith('/api/tv-channels?'));assert.equal(channelButtons().length,100);
  await input(document.querySelector('#tv-search'),'Station 229');assert.equal(channelButtons().length,1);assert.match(channelButtons()[0].textContent,/229/);
  await click(document.querySelector('button[aria-label^="Add to"]'));assert(localStorage.getItem('sparkexchange-tv-favorites-v1').includes('/229.m3u8'));
  await input(document.querySelector('#tv-search'),'');await click(document.querySelector('input[type=checkbox]'));assert.equal(channelButtons().length,1);
  await click(channelButtons()[0]);assert.equal(instances.at(-1).url,'https://video.example/229.m3u8');assert.equal(instances.at(-1).config.maxBufferLength,15);const activeGeneration=instances.length;await input(document.querySelector('#tv-search'),'Station');assert.equal(instances.length,activeGeneration,'Browsing does not restart playback');
  await act(async()=>{instances.at(-1).handlers.error(null,{fatal:true,type:'networkError'});await tick();});assert.match(instances.at(-1).url,/^\/api\/stream\?/);
  const relay=instances.at(-1);await click([...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Stop'));assert(relay.destroyed);assert.match(document.body.textContent,/Playback stopped/);
  await click(document.querySelector('input[type=checkbox]'));await click([...document.querySelectorAll('button')].find(b=>/Next channels/.test(b.textContent)));assert.equal(channelButtons().length,100);assert.match(channelButtons()[0].textContent,/Station 100/);
  await act(async()=>{const select=document.querySelector('#tv-category');select.value='Sports';select.dispatchEvent(new w.Event('change',{bubbles:true}));});assert.equal(channelButtons().length,100);assert(!channelButtons().some(b=>/Station 1$/.test(b.textContent)));
  let expanded=false;document.querySelector('video').requestFullscreen=async()=>{expanded=true;};await click([...document.querySelectorAll('button')].find(b=>/Full screen/.test(b.textContent)));assert(expanded);
 } finally {await act(async()=>root.unmount());}
});

test('catalog errors have a working retry and do not remove the native player',async()=>{responseError=true;const root=createRoot(document.getElementById('root'));try{await act(async()=>root.render(React.createElement(LiveTVSection)));await act(async()=>{intersect([{isIntersecting:true}]);await tick();});assert.match(document.body.textContent,/Provider unavailable/);responseError=false;await click([...document.querySelectorAll('button')].find(b=>/Retry loading/.test(b.textContent)));assert.equal(channelButtons().length,100);assert(document.querySelector('video'));}finally{responseError=false;await act(async()=>root.unmount());}});

test('relay forwards only media query and Range, streaming HLS without Sparkexchange credentials',async()=>{const {GET}=load('src/app/api/stream/route.ts');const saved=global.fetch;let received;global.fetch=async(url,options)=>{received={url:String(url),options};return new Response('#EXTM3U\n/api/stream?url=next',{headers:{'content-type':'application/vnd.apple.mpegurl'}});};try{const response=await GET(new Request('https://spark.example/api/stream?url=https%3A%2F%2Fvideo.example%2Flive.m3u8&ignored=value',{headers:{cookie:'admin=private',authorization:'Bearer private',range:'bytes=0-99'}}));assert.equal(response.status,200);assert.match(await response.text(),/\/api\/stream/);assert.equal(received.options.headers.get('range'),'bytes=0-99');assert(!received.options.headers.has('cookie'));assert(!received.options.headers.has('authorization'));assert(!received.url.includes('ignored'));assert.equal(new URL(received.url).origin,'https://free-iptv-player-sigma.vercel.app');const missing=await GET(new Request('https://spark.example/api/stream'));assert.equal(missing.status,400);}finally{global.fetch=saved;}});

test('server pagination searches the whole catalog, bounds results and keeps favorites private',async()=>{
 const {GET,POST}=load('src/app/api/tv-channels/route.ts');
 const saved=global.fetch;let received,calls=0;
 global.fetch=async(url,options)=>{calls++;received={url:String(url),options};return Response.json({text:fixture,url:'https://iptv-org.github.io/iptv/index.category.m3u'});};
 try {
  let response=await GET(new Request('https://spark.example/api/tv-channels'));let data=await response.json();assert.equal(data.channels.length,100);assert.equal(data.total,230);assert.equal(received.options.cache,'no-store');assert.match(response.headers.get('cache-control'),/s-maxage=300/);
  response=await GET(new Request('https://spark.example/api/tv-channels?q=Station%20229'));data=await response.json();assert.equal(data.count,1);assert.equal(data.channels[0].name,'Station 229');
  response=await GET(new Request('https://spark.example/api/tv-channels?page=2'));data=await response.json();assert.equal(data.channels.length,30);assert.equal(calls,1,'Warm catalog is reused rather than reparsed per search');
  response=await POST(new Request('https://spark.example/api/tv-channels',{method:'POST',body:JSON.stringify([parsedFixture[229].url])}));data=await response.json();assert.equal(data.count,1);assert.equal(data.channels[0].name,'Station 229');assert.equal(response.headers.get('cache-control'),'private, no-store');
  response=await POST(new Request('https://spark.example/api/tv-channels',{method:'POST',body:'invalid'}));assert.equal(response.status,400);
 }finally{global.fetch=saved;}
});

test('idle speed test schedules no animation frames',async()=>{
 let scheduled=0,id=0;const callbacks=new Map();
 global.requestAnimationFrame=callback=>{scheduled++;callbacks.set(++id,callback);return id;};global.cancelAnimationFrame=key=>callbacks.delete(key);
 if(process.env.MEASURE_SPEED_BASELINE==='1'&&fs.existsSync('/tmp/spark-speedtest-before.tsx')){
  const Before=load('/tmp/spark-speedtest-before.tsx').SpeedtestSection;const root=createRoot(document.getElementById('root'));
  await act(async()=>root.render(React.createElement(Before)));
  for(let i=0;i<20;i++){const [key,callback]=callbacks.entries().next().value;callbacks.delete(key);await act(async()=>callback(i*16));}
  console.log('Baseline: '+scheduled+' animation frames scheduled while idle in 20 simulated frames');
  await act(async()=>root.unmount());callbacks.clear();scheduled=0;
 }
 const {SpeedtestSection}=load('src/components/speedtest-section.tsx');const root=createRoot(document.getElementById('root'));
 try{await act(async()=>root.render(React.createElement(SpeedtestSection)));assert.equal(scheduled,0);assert.equal(callbacks.size,0);}finally{await act(async()=>root.unmount());}
});

test('completed speed readout uses the measured download result rather than a stale upload sample',()=>{const {speedDisplayValue}=load('src/components/speedtest-section.tsx');assert.equal(speedDisplayValue(83.1,'complete',25.4),'25.4');assert.equal(speedDisplayValue(83.1,'upload',25.4),'83.1');assert.equal(speedDisplayValue(0,'idle',0),'0');});

test('running gauge pauses offscreen and cancels a test when the tab becomes hidden',async()=>{
 const savedFetch=global.fetch;global.fetch=(_url,options)=>new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true}));
 const callbacks=new Map();let id=0;
 global.requestAnimationFrame=callback=>{callbacks.set(++id,callback);return id;};global.cancelAnimationFrame=key=>callbacks.delete(key);
 Object.defineProperty(document,'hidden',{configurable:true,value:false});
 const {SpeedtestSection}=load('src/components/speedtest-section.tsx');const root=createRoot(document.getElementById('root'));
 try{
  await act(async()=>root.render(React.createElement(SpeedtestSection)));
  await click([...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='GO'));
  await act(async()=>intersect([{isIntersecting:true}]));assert.equal(callbacks.size,1);
  await act(async()=>intersect([{isIntersecting:false}]));assert.equal(callbacks.size,0);
  await act(async()=>intersect([{isIntersecting:true}]));assert.equal(callbacks.size,1);
  Object.defineProperty(document,'hidden',{configurable:true,value:true});
  await act(async()=>{document.dispatchEvent(new w.Event('visibilitychange'));await new Promise(r=>setTimeout(r,260));});
  assert.equal(callbacks.size,0);assert.match(document.body.textContent,/tab was hidden/);assert(![...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Stop Test'));
 }finally{await act(async()=>root.unmount());delete document.hidden;global.fetch=savedFetch;}
});
