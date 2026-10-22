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
global.fetch=async (url,options)=>{requests.push({url:String(url),options});return new Response(JSON.stringify(responseError?{error:'Provider unavailable'}:{text:fixture,url:'https://example.com/list.m3u'}),{status:responseError?502:200,headers:{'content-type':'application/json'}});};
class FakeHls {static Events={MANIFEST_PARSED:'manifest',ERROR:'error'};static ErrorTypes={MEDIA_ERROR:'mediaError'};static isSupported=()=>true;constructor(){this.handlers={};instances.push(this);}on(e,f){this.handlers[e]=f;}loadSource(url){this.url=url;}attachMedia(){queueMicrotask(()=>this.handlers.manifest?.());}destroy(){this.destroyed=true;}recoverMediaError(){this.recovered=true;}}
const cache=new Map();
function load(relative){const filename=path.resolve(relative);if(cache.has(filename))return cache.get(filename).exports;const m=new Module(filename,module);m.filename=filename;m.paths=module.paths;cache.set(filename,m);m.require=id=>{if(id.endsWith('.module.css'))return {__esModule:true,default:new Proxy({},{get:(_,key)=>String(key)})};if(id==='hls.js')return {__esModule:true,default:FakeHls};if(id.startsWith('@/'))return load('src/'+id.slice(2)+(id==='@/lib/utils'||id==='@/lib/tv-playlist'?'.ts':'.tsx'));return require(id);};m._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,filename);return m.exports;}
const {parseTVPlaylist}=load('src/lib/tv-playlist.ts');
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
  await act(async()=>{intersect([{isIntersecting:true}]);await tick();});assert.equal(requests[0].url,'/api/tv-channels');assert.equal(channelButtons().length,100);
  await input(document.querySelector('#tv-search'),'Station 229');assert.equal(channelButtons().length,1);assert.match(channelButtons()[0].textContent,/229/);
  await click(document.querySelector('button[aria-label^="Add to"]'));assert(localStorage.getItem('sparkexchange-tv-favorites-v1').includes('/229.m3u8'));
  await input(document.querySelector('#tv-search'),'');await click(document.querySelector('input[type=checkbox]'));assert.equal(channelButtons().length,1);
  await click(channelButtons()[0]);assert.equal(instances.at(-1).url,'https://video.example/229.m3u8');
  await act(async()=>{instances.at(-1).handlers.error(null,{fatal:true,type:'networkError'});await tick();});assert.match(instances.at(-1).url,/^\/api\/stream\?/);
  const relay=instances.at(-1);await click([...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Stop'));assert(relay.destroyed);assert.match(document.body.textContent,/Playback stopped/);
  await click(document.querySelector('input[type=checkbox]'));await click([...document.querySelectorAll('button')].find(b=>/Load more/.test(b.textContent)));assert.equal(channelButtons().length,200);
  await act(async()=>{const select=document.querySelector('#tv-category');select.value='Sports';select.dispatchEvent(new w.Event('change',{bubbles:true}));});assert.equal(channelButtons().length,100);assert(!channelButtons().some(b=>/Station 1$/.test(b.textContent)));
  let expanded=false;document.querySelector('video').requestFullscreen=async()=>{expanded=true;};await click([...document.querySelectorAll('button')].find(b=>/Full screen/.test(b.textContent)));assert(expanded);
 } finally {await act(async()=>root.unmount());}
});

test('catalog errors have a working retry and do not remove the native player',async()=>{responseError=true;const root=createRoot(document.getElementById('root'));try{await act(async()=>root.render(React.createElement(LiveTVSection)));await act(async()=>{intersect([{isIntersecting:true}]);await tick();});assert.match(document.body.textContent,/Provider unavailable/);responseError=false;await click([...document.querySelectorAll('button')].find(b=>/Retry loading/.test(b.textContent)));assert.equal(channelButtons().length,100);assert(document.querySelector('video'));}finally{responseError=false;await act(async()=>root.unmount());}});

test('relay forwards only media query and Range, streaming HLS without Sparkexchange credentials',async()=>{const {GET}=load('src/app/api/stream/route.ts');const saved=global.fetch;let received;global.fetch=async(url,options)=>{received={url:String(url),options};return new Response('#EXTM3U\n/api/stream?url=next',{headers:{'content-type':'application/vnd.apple.mpegurl'}});};try{const response=await GET(new Request('https://spark.example/api/stream?url=https%3A%2F%2Fvideo.example%2Flive.m3u8&ignored=value',{headers:{cookie:'admin=private',authorization:'Bearer private',range:'bytes=0-99'}}));assert.equal(response.status,200);assert.match(await response.text(),/\/api\/stream/);assert.equal(received.options.headers.get('range'),'bytes=0-99');assert(!received.options.headers.has('cookie'));assert(!received.options.headers.has('authorization'));assert(!received.url.includes('ignored'));assert.equal(new URL(received.url).origin,'https://free-iptv-player-sigma.vercel.app');const missing=await GET(new Request('https://spark.example/api/stream'));assert.equal(missing.status,400);}finally{global.fetch=saved;}});

test('large directory bypasses Next data-cache limits while retaining public CDN caching',async()=>{const {GET}=load('src/app/api/tv-channels/route.ts');const saved=global.fetch;let received;global.fetch=async(url,options)=>{received={url:String(url),options};return Response.json({text:'#EXTM3U\n',url:'https://iptv-org.github.io/iptv/index.category.m3u'});};try{const response=await GET();assert.equal(response.status,200);assert.equal(received.options.cache,'no-store');assert(!received.options.next);assert.match(response.headers.get('cache-control'),/s-maxage=300/);assert.equal(new URL(received.url).origin,'https://free-iptv-player-sigma.vercel.app');}finally{global.fetch=saved;}});
