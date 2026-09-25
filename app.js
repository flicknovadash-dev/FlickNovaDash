'use strict';

const root = document.documentElement;
const body = document.body;
const journey = document.querySelector('.journey');
const scene = document.querySelector('.scene');
const hero = document.querySelector('.hero-copy');
const logo = document.querySelector('.hero-logo');
const coordinate = document.querySelector('.hero-coordinate');
const portal = document.querySelector('.portal-title');
const story = document.querySelector('.story-copy');
const gameplay = document.querySelector('.gameplay-stage');
const cue = document.querySelector('.scroll-cue');
const chapterNav = document.querySelector('.chapter-nav');
const chapters = [...document.querySelectorAll('.chapter')];
const navLinks = [...chapterNav.querySelectorAll('a')];
const video = document.querySelector('#story-video');
const motionButton = document.querySelector('.motion-toggle');
const mediaMotion = matchMedia('(prefers-reduced-motion: reduce)');
const smallScreen = matchMedia('(max-width: 700px)');
const shortScreen = matchMedia('(max-height: 600px)');
const chapterPositions = [.35, .59, .83];
let reduced = mediaMotion.matches || shortScreen.matches;
let progress = 0;
let activeChapter = -1;
let dirty = true;
let inView = true;
let videoLoaded = false;
let targetTime = 0;
let lastFrame = 0;
let pointer = [0, 0];
let orbit = null;
let journeyTop = 0;
let journeyDistance = 1;

const clamp = (n, low = 0, high = 1) => Math.min(high, Math.max(low, n));
const range = (n, a, b) => clamp((n - a) / (b - a));
const smooth = (n, a, b) => { const p = range(n, a, b); return p * p * (3 - 2 * p); };

function show(element, opacity) {
  element.style.opacity = opacity.toFixed(3);
  const hidden = opacity < .025;
  element.style.visibility = hidden ? 'hidden' : 'visible';
  element.inert = hidden;
}

function loadVideo(element) {
  const source = element.querySelector('source');
  if (source.dataset.src) {
    source.src = source.dataset.src;
    delete source.dataset.src;
    element.preload = 'auto';
    element.load();
  }
}

// One seek at a time keeps fast scrolling from flooding the media decoder.
function seekVideo() {
  if (video.readyState >= 2 && !video.seeking && Math.abs(video.currentTime - targetTime) > .065) {
    video.currentTime = targetTime;
  }
}
video.addEventListener('loadeddata', seekVideo);
video.addEventListener('seeked', seekVideo);

function measure() {
  journeyTop = journey.getBoundingClientRect().top + scrollY;
  journeyDistance = Math.max(1, journey.offsetHeight - scene.offsetHeight);
  if (orbit) orbit.resize();
  dirty = true;
}

function update() {
  document.querySelector('.nav').classList.toggle('scrolled', scrollY > 35);
  if (reduced) return;
  progress = clamp((scrollY - journeyTop) / journeyDistance);
  scene.style.setProperty('--scene-progress', progress);
  const depart = smooth(progress, .035, .18);
  const arrive = smooth(progress, .235, .33);
  const mobile = smallScreen.matches;
  document.querySelector('#orbit-canvas').style.opacity = 1 - smooth(progress, .27, .35);
  const fallback = document.querySelector('.orbit-fallback');
  fallback.style.opacity = 1 - smooth(progress, .22, .32);
  fallback.style.transform = `translate(-50%,-50%) scale(${1 + depart * 2.5})`;
  show(hero, 1 - depart);
  hero.style.transform = mobile ? `translateY(${-depart * 50}px)` : `translateY(calc(-48% - ${depart * 70}px))`;
  show(logo, 1 - smooth(progress, .09, .22));
  logo.style.transform = `translate(-50%,-50%) scale(${1 + depart * .55}) rotate(${depart * -12}deg)`;
  show(coordinate, 1 - depart);
  show(portal, smooth(progress, .13, .19) * (1 - smooth(progress, .22, .29)));
  portal.style.transform = `scale(${.94 + range(progress, .13, .3) * .14})`;
  show(story, arrive);
  story.style.transform = mobile ? `translateY(${(1 - arrive) * 35}px)` : `translateY(calc(-45% + ${(1 - arrive) * 45}px))`;
  show(gameplay, arrive);
  gameplay.style.transform = mobile ? `translateX(-50%) scale(${.8 + arrive * .2})` : `translate(-50%,-46%) perspective(1000px) rotateY(${(1 - arrive) * -30}deg) scale(${.77 + arrive * .23})`;
  show(cue, 1 - smooth(progress, .12, .22));
  show(chapterNav, arrive);
  document.querySelector('.scene-index').textContent = progress < .27 ? '01 — 04' : `0${Math.min(4, Math.floor(range(progress, .28, 1) * 3) + 2)} — 04`;

  const step = progress < .51 ? 0 : progress < .75 ? 1 : 2;
  if (step !== activeChapter) {
    activeChapter = step;
    chapters.forEach((chapter, index) => {
      chapter.classList.toggle('active', index === step);
      chapter.setAttribute('aria-hidden', String(index !== step));
      navLinks[index].setAttribute('aria-current', String(index === step));
    });
  }
  // A brief dissolve at the chapter boundary gives each line its own beat.
  const boundary = step === 0 ? 0 : step === 1 ? .51 : .75;
  const textReveal = step === 0 ? 1 : .55 + .45 * smooth(progress, boundary, boundary + .035);
  chapters[step].style.opacity = textReveal;
  if (progress > .1 && !videoLoaded) {
    videoLoaded = true;
    loadVideo(video);
  }
  targetTime = range(progress, .28, .98) * (Number.isFinite(video.duration) ? Math.max(0, video.duration - .12) : 17.8);
  seekVideo();
}

function applyMotion(value, preservePlace = false) {
  const oldProgress = progress;
  const oldChapter = Math.max(0, activeChapter);
  const wasInStory = scrollY < journeyTop + journey.offsetHeight;
  reduced = value;
  root.style.scrollBehavior = reduced ? 'auto' : 'smooth';
  body.classList.toggle('compact-layout', shortScreen.matches);
  body.classList.toggle('enhanced', !reduced);
  body.classList.toggle('motion-off', reduced);
  motionButton.setAttribute('aria-pressed', String(reduced));
  motionButton.setAttribute('aria-label', reduced ? 'Enable cinematic motion' : 'Reduce motion');
  motionButton.querySelector('.motion-label').textContent = reduced ? 'Motion off' : 'Motion on';
  [hero, logo, coordinate, story, gameplay, chapterNav, document.querySelector('.orbit-fallback')].forEach(element => { element.style.opacity = ''; element.style.visibility = ''; element.style.transform = ''; element.inert = false; });
  chapters.forEach(chapter => { chapter.removeAttribute('aria-hidden'); chapter.style.opacity = ''; });
  activeChapter = -1;
  if (reduced) {
    video.pause();
    if (video.readyState >= 2) { targetTime = .5; video.currentTime = .5; }
  }
  measure();
  if (preservePlace && wasInStory) {
    const destination = reduced ? (oldProgress > .23 ? story.offsetTop - 105 : 0) : journeyTop + (oldProgress > .23 ? chapterPositions[oldChapter] * journeyDistance : 0);
    window.scrollTo({ top: destination, behavior: 'instant' });
  }
  update();
}
motionButton.addEventListener('click', () => applyMotion(!reduced, true));
mediaMotion.addEventListener('change', event => applyMotion(event.matches || shortScreen.matches, true));
shortScreen.addEventListener('change', event => applyMotion(event.matches || mediaMotion.matches, true));

function goToChapter(index, behavior = 'smooth') {
  if (reduced) {
    navLinks.forEach((link, n) => link.setAttribute('aria-current', String(n === index)));
    chapters[index].scrollIntoView({ behavior: 'instant', block: 'start' });
  }
  else window.scrollTo({ top: journeyTop + chapterPositions[index] * journeyDistance, behavior });
}
document.querySelectorAll('[data-chapter]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  const index = Number(link.dataset.chapter);
  history.replaceState(null, '', `#${chapters[index].id}`);
  goToChapter(index);
}));
function routeHash() {
  const index = chapters.findIndex(chapter => `#${chapter.id}` === location.hash);
  if (index >= 0) goToChapter(index, 'instant');
}
addEventListener('hashchange', routeHash);
addEventListener('scroll', () => { dirty = true; }, { passive: true });
addEventListener('resize', measure);
addEventListener('pageshow', () => { measure(); routeHash(); });
document.addEventListener('visibilitychange', () => { dirty = true; });
scene.addEventListener('pointermove', event => {
  if (event.pointerType === 'mouse') pointer = [(event.clientX / innerWidth - .5) * .15, (event.clientY / innerHeight - .5) * .12];
}, { passive: true });
scene.addEventListener('pointerleave', () => { pointer = [0, 0]; });
new IntersectionObserver(entries => { inView = entries[0].isIntersecting; dirty = true; }).observe(journey);

const dialog = document.querySelector('.film-dialog');
const film = document.querySelector('#film-video');
let filmOpener;
document.querySelector('[data-open-film]').addEventListener('click', event => {
  filmOpener = event.currentTarget;
  loadVideo(film);
  dialog.showModal();
  body.classList.add('modal-open');
  film.play().catch(() => {});
});
document.querySelector('.film-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog && (event.clientX < dialog.getBoundingClientRect().left || event.clientX > dialog.getBoundingClientRect().right)) dialog.close(); });
dialog.addEventListener('close', () => { film.pause(); body.classList.remove('modal-open'); filmOpener?.focus(); });

// An original, lightweight orbital sculpture. No 3D assets or runtime library.
function createOrbit() {
  const canvas = document.querySelector('#orbit-canvas');
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, depth: false, powerPreference: 'low-power' });
  if (!gl) return null;
  const vertex = `attribute vec2 aPosition; void main(){gl_Position=vec4(aPosition,0.,1.);}`;
  const fragment = `
precision highp float;
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uTime;
uniform float uProgress;
uniform float uMobile;
mat2 rot(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);}
float torus(vec3 p,float r,float w){return length(vec2(length(p.xy)-r,p.z))-w;}
vec2 field(vec3 p){
  float t=uTime*.12;
  vec3 a=p; a.xz=rot(.55+sin(t)*.12+uPointer.x)*a.xz; a.xy=rot(-.4)*a.xy; a.yz=rot(.77+uPointer.y)*a.yz;
  float d=torus(a,1.13,.052);
  vec3 b=p; b.xy=rot(.76)*b.xy; b.yz=rot(-.65+cos(t)*.13)*b.yz; b.xz=rot(-.45)*b.xz;
  float e=torus(b,.92,.037);
  vec3 c=p; c.xy=rot(-.15)*c.xy; c.yz=rot(1.1)*c.yz;
  float f=torus(c,1.4,.008);
  vec2 h=d<e?vec2(d,0.):vec2(e,1.);return f<h.x?vec2(f,2.):h;
}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.54);}
void main(){
  vec2 uv=(gl_FragCoord.xy/uResolution-.5);float aspect=uResolution.x/uResolution.y;
  float travel=smoothstep(.06,.30,uProgress);
  vec2 center=mix(vec2(.20,.02),vec2(0.,0.),travel);
  if(uMobile>.5)center=mix(vec2(.19,-.25),vec2(0.,0.),travel);
  vec2 q=uv-center;q.x*=aspect;
  float camera=mix(uMobile>.5?7.1:4.2*max(1.,1.25/aspect),.7,travel);
  vec3 ro=vec3(0.,0.,camera);vec3 rd=normalize(vec3(q*2.6,-2.2));
  vec3 color=vec3(0.);float alpha=0.;
  float halo=exp(-dot(q,q)*3.5);color+=vec3(.17,.09,.34)*halo*.2;
  float d=0.;vec2 hit=vec2(1.);float glow=0.;
  for(int i=0;i<64;i++){
    vec3 p=ro+rd*d;hit=field(p);glow+=exp(-abs(hit.x)*32.)*.012;
    if(hit.x<.002||d>12.)break;
    d+=hit.x*.82;
  }
  if(d<12.&&hit.x<.006){
    vec3 p=ro+rd*d;vec2 e=vec2(.004,0.);
    vec3 n=normalize(vec3(field(p+e.xyy).x-field(p-e.xyy).x,field(p+e.yxy).x-field(p-e.yxy).x,field(p+e.yyx).x-field(p-e.yyx).x));
    vec3 l=normalize(vec3(-1.,2.,3.));float diff=max(0.,dot(n,l));
    float fres=pow(1.-max(0.,dot(n,-rd)),2.);
    vec3 base=mix(vec3(.35,.12,.75),vec3(.04,.63,.81),smoothstep(-.9,.9,p.x));
    if(hit.y>0.5)base=mix(vec3(.12,.42,.65),vec3(.64,.51,.88),smoothstep(-1.,1.,p.y));
    vec3 reflection=reflect(rd,n);float strip=pow(max(0.,dot(reflection,normalize(vec3(-.5,1.3,1.)))),28.);
    float rim=pow(max(0.,dot(reflection,normalize(vec3(1.,-.3,1.)))),14.);
    color=base*(.25+diff*.6)+vec3(.80,.84,1.)*strip*1.4+vec3(.1,.8,1.)*rim*.65+base*fres*.8;
    alpha=1.;
  }
  color+=vec3(.32,.17,.65)*glow*.35;
  float fade=1.-smoothstep(.25,.35,uProgress);color*=fade;alpha*=fade;
  vec2 grid=uv*vec2(aspect,1.)*100.;vec2 id=floor(grid);vec2 st=fract(grid)-.5;
  float star=step(.994,hash(id))*exp(-length(st)*16.);float twinkle=.4+.25*sin(uTime*.55+hash(id)*30.);
  color+=vec3(.35,.55,.85)*star*twinkle*(1.-smoothstep(.2,.5,uProgress));
  alpha=max(alpha,clamp(length(color)*1.6,0.,.85));
  gl_FragColor=vec4(color,alpha);
}`;
  function shader(type, source) {
    const s = gl.createShader(type);gl.shaderSource(s, source);gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { gl.deleteShader(s); return null; }
    return s;
  }
  const vs = shader(gl.VERTEX_SHADER, vertex), fs = shader(gl.FRAGMENT_SHADER, fragment);
  if (!vs || !fs) return null;
  const program = gl.createProgram();gl.attachShader(program, vs);gl.attachShader(program, fs);gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);
  const buffer = gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER, buffer);gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
  const pos = gl.getAttribLocation(program, 'aPosition');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
  const uniforms = Object.fromEntries(['uResolution','uPointer','uTime','uProgress','uMobile'].map(name => [name, gl.getUniformLocation(program, name)]));
  function resize() {
    const rect = scene.getBoundingClientRect();
    const scale = Math.min(1.25, (smallScreen.matches ? 700 : 1500) / rect.width);
    canvas.width = Math.round(rect.width * scale);canvas.height = Math.round(rect.height * scale);
    gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(uniforms.uResolution,canvas.width,canvas.height);
  }
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); body.classList.remove('webgl-ready'); orbit = null; });
  body.classList.add('webgl-ready');resize();
  return { resize, render(time) { gl.uniform1f(uniforms.uTime,time);gl.uniform1f(uniforms.uProgress,progress);gl.uniform1f(uniforms.uMobile,smallScreen.matches?1:0);gl.uniform2f(uniforms.uPointer,...pointer);gl.drawArrays(gl.TRIANGLES,0,6); } };
}

applyMotion(reduced);
try { orbit = createOrbit(); } catch { /* The CSS orbit remains available without WebGL. */ }
measure();
function frame(now) {
  if (dirty) { update(); dirty = false; }
  // Render at 30fps, only while the sculpture is visible. Scroll and text stay at display cadence.
  if (orbit && !reduced && inView && !document.hidden && !dialog.open && progress < .36 && now - lastFrame > 32) {
    orbit.render(now / 1000);lastFrame = now;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
