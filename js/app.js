/* ============ state ============ */
var state = { lang: "en" };
var I18N = window.I18N;
var LANG_LABELS = { en: "English", ar: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629", tr: "T\u00fcrk\u00e7e" };

function t(key) {
  var parts = key.split(".");
  var v = I18N[state.lang];
  for (var i = 0; i < parts.length; i++) v = v[parts[i]];
  return v;
}

function resolvedTheme() {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function applyThemeUI() {
  var dark = resolvedTheme() === "dark";
  var btn = document.getElementById("theme-toggle");
  document.getElementById("icon-sun").classList.toggle("hidden", !dark);
  document.getElementById("icon-moon").classList.toggle("hidden", dark);
  document.getElementById("icon-theme-placeholder").classList.add("hidden");
  btn.setAttribute("aria-label", t(dark ? "common.toLight" : "common.toDark"));
}

/* ============ language ============ */
function applyLang(lang) {
  state.lang = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  localStorage.setItem("lang", lang);
  try {
    var u = new URL(location.href);
    if (u.searchParams.get("lang") !== lang) { u.searchParams.set("lang", lang); history.replaceState(null, "", u); }
  } catch (e) {}
  document.querySelectorAll("[data-i18n]").forEach(function (el) {
    var v = t(el.getAttribute("data-i18n"));
    if (v != null) el.textContent = v;
  });
  document.title = t("meta.title");
  var d = document.querySelector('meta[name="description"]');
  if (d) d.setAttribute("content", t("meta.description"));
  roles = t("hero.roles");
  roleIndex = 0;
  document.getElementById("role-text").textContent = roles[0];
  var cur = document.getElementById("lang-current");
  if (cur) cur.textContent = LANG_LABELS[lang] || lang.toUpperCase();
  document.querySelectorAll(".lang-option").forEach(function (b) {
    var on = b.getAttribute("data-lang") === lang;
    b.classList.toggle("active", on);
    b.setAttribute("aria-selected", on ? "true" : "false");
  });
  var picker = document.getElementById("lang-picker");
  if (picker) picker.classList.remove("open");
  var trig = document.getElementById("lang-trigger");
  if (trig) trig.setAttribute("aria-expanded", "false");
  applyThemeUI();
}

/* ============ theme ============ */
function setTheme(next) {
  var d = document.documentElement;
  d.classList.remove("light", "dark");
  if (next === "system") {
    var m = window.matchMedia("(prefers-color-scheme: dark)");
    d.classList.add(m.matches ? "dark" : "light");
    d.style.colorScheme = m.matches ? "dark" : "light";
  } else {
    d.classList.add(next);
    d.style.colorScheme = next;
  }
  localStorage.setItem("theme", next);
  applyThemeUI();
}

/* ============ roles rotator ============ */
var roles = [], roleIndex = 0;
function startRoles() {
  var el = document.getElementById("role-text");
  if (!el) return;
  roles = t("hero.roles") || [];
  roleIndex = 0;
  el.textContent = roles[0];
  setInterval(function () {
    if (!roles.length) return;
    el.classList.add("role-out");
    setTimeout(function () {
      roleIndex = (roleIndex + 1) % roles.length;
      el.textContent = roles[roleIndex];
      el.classList.remove("role-out");
      el.classList.add("role-in");
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { el.classList.remove("role-in"); });
      });
    }, 320);
  }, 2600);
}

/* ============ reveal on scroll ============ */
function startReveals() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll(".rev, .mask-line").forEach(function (el) { el.classList.add("in"); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add("in");
        var el = en.target;
        var counter = el.querySelector("[data-count]");
        if (counter) runCounter(counter);
        io.unobserve(el);
      }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  document.querySelectorAll(".rev").forEach(function (el) { io.observe(el); });
  var ioMask = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add("in"); ioMask.unobserve(en.target); }
    });
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0.3 });
  document.querySelectorAll(".mask-line").forEach(function (el) { ioMask.observe(el); });
}

/* ============ counters ============ */
function runCounter(el) {
  var target = parseInt(el.getAttribute("data-count"), 10) || 0;
  var suffix = el.getAttribute("data-suffix") || "";
  var span = el.querySelector("span");
  if (!span) return;
  var start = null, dur = 1800;
  function step(ts) {
    if (!start) start = ts;
    var p = Math.min(1, (ts - start) / dur);
    var eased = 1 - Math.pow(1 - p, 3);
    span.textContent = Math.floor(eased * target).toLocaleString();
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ============ progress bar ============ */
function startProgress() {
  var bar = document.getElementById("progress");
  if (!bar) return;
  var current = 0, running = false;
  function frame() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var target = max > 0 ? window.scrollY / max : 0;
    current += (target - current) * 0.16;
    bar.style.transform = "scaleX(" + current + ")";
    if (Math.abs(target - current) > 0.0005) requestAnimationFrame(frame);
    else running = false;
  }
  function kick() {
    if (!running) { running = true; requestAnimationFrame(frame); }
  }
  window.addEventListener("scroll", kick, { passive: true });
  kick();
}

/* ============ magnetic buttons ============ */
function startMagnetic() {
  document.querySelectorAll(".magnetic").forEach(function (el) {
    var strength = parseFloat(el.getAttribute("data-strength") || "0.3");
    el.addEventListener("mousemove", function (e) {
      var r = el.getBoundingClientRect();
      var x = (e.clientX - (r.left + r.width / 2)) * strength;
      var y = (e.clientY - (r.top + r.height / 2)) * strength;
      el.style.transition = "transform .12s ease-out";
      el.style.transform = "translate3d(" + x + "px," + y + "px,0)";
    });
    el.addEventListener("mouseleave", function () {
      el.style.transition = "transform .55s cubic-bezier(.16,1,.3,1)";
      el.style.transform = "translate3d(0,0,0)";
    });
  });
}

/* ============ nav active section ============ */
function startNavActive() {
  var links = document.querySelectorAll(".nav-link");
  if (!links.length) return;
  var map = {};
  links.forEach(function (l) { map[l.getAttribute("href").slice(1)] = l; });
  var io = new IntersectionObserver(function (entries) {
    var vis = entries.filter(function (e) { return e.isIntersecting; });
    if (!vis.length) return;
    var best = vis.reduce(function (a, b) { return (b.intersectionRatio > a.intersectionRatio ? b : a); });
    var id = best.target.id;
    links.forEach(function (l) {
      var ul = l.querySelector(".nav-ul");
      var active = l.getAttribute("href") === "#" + id;
      if (ul) ul.classList.toggle("scale-x-100", active);
      l.classList.toggle("text-paper", active);
      l.classList.toggle("text-paper/75", !active);
    });
  }, { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 1] });
  ["work", "services", "partners", "capabilities"].forEach(function (id) {
    var sec = document.getElementById(id);
    if (sec) io.observe(sec);
  });
}

/* ============ copy buttons ============ */
function startCopy() {
  document.querySelectorAll(".copy-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var value = btn.getAttribute("data-copy");
      var label = btn.querySelector(".copy-label");
      var done = function () {
        btn.classList.add("copied");
        if (label) label.textContent = t("common.copied");
        setTimeout(function () {
          btn.classList.remove("copied");
          if (label) label.textContent = t("common.copy");
        }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(done, done);
      } else {
        var ta = document.createElement("textarea");
        ta.value = value; document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); } catch (e) {}
        document.body.removeChild(ta); done();
      }
    });
  });
}

/* ============ spotlight ============ */
function startSpotlight() {
  var hero = document.getElementById("top");
  if (!hero) return;
  var div = document.createElement("div");
  div.className = "spotlight";
  div.setAttribute("aria-hidden", "true");
  div.style.display = "none";
  hero.appendChild(div);
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var touch = window.matchMedia("(hover: none)").matches;
  if (reduced) { div.style.display = "none"; return; }
  if (touch) {
    div.style.display = "";
    var rand = function (min, max) { return min + Math.random() * (max - min); };
    div.classList.add("sweep");
    div.style.setProperty("--sweep-from-x", rand(-60, 100) + "vw");
    div.style.setProperty("--sweep-from-y", rand(-20, 60) + "vh");
    div.style.setProperty("--sweep-to-x", rand(-60, 100) + "vw");
    div.style.setProperty("--sweep-to-y", rand(-20, 60) + "vh");
    return;
  }
  var tx = 0, ty = 0, cx = 0, cy = 0, op = 0, running = false, moved = false;
  var ease = 0.14;
  hero.addEventListener("mousemove", function (e) {
    div.style.display = "";
    var r = hero.getBoundingClientRect();
    var x = e.clientX - r.left, y = e.clientY - r.top;
    if (x >= 0 && x <= r.width && y >= 0 && y <= r.height) {
      tx = x; ty = y; op = 1;
      if (!moved) { cx = x; cy = y; moved = true; }
      if (!running) { running = true; requestAnimationFrame(loop); }
    } else op = 0;
  });
  function loop() {
    cx += (tx - cx) * ease; cy += (ty - cy) * ease;
    var o = parseFloat(div.style.opacity || "0");
    o += (op - o) * 0.1;
    div.style.transform = "translate3d(" + (cx - 280) + "px," + (cy - 280) + "px,0)";
    div.style.opacity = o.toFixed(3);
    if (o > 0.005 || op > 0) requestAnimationFrame(loop); else running = false;
  }
}

/* ============ circuit canvas (ported from the original site) ============ */
function initCircuit(container, canvas) {
let N="242, 236, 224",I=[[1,0,-1],[2,1,0],[4,0,1],[8,-1,0]],_={1:4,4:1,2:8,8:2},E=e=>(1&e)+(e>>1&1)+(e>>2&1)+(e>>3&1),M={blank:8,stub:.5,straight:1.3,corner:.85,tee:.15,cross:.06},T=e=>{let t=E(e);return 0===t?"blank":1===t?"stub":2===t?5===e||10===e?"straight":"corner":3===t?"tee":"cross"},A=Array.from({length:16},(e,t)=>M[T(t)]),C={},S={};for(let e of[1,2,4,8]){let t=0;for(let a=0;a<16;a++)a&e&&(t|=1<<a);C[e]=t,S[e]=65535&~t}let X=e=>1-(1-e)**3,Y=(e,t)=>e+Math.random()*(t-e);
let a=container,r=canvas;let PU=0;window.addEventListener("scroll",function(){PU=performance.now()+300},{passive:true});
return (function () {
let i=r.getContext("2d"),n=window.matchMedia("(prefers-reduced-motion: reduce)").matches,s=0,l=0,o=0,c=0,d=1,p=null,x=null,h=null,m=null,f=null,u=[],g=[],v=[],b=-1,w=0,k=!0,y=(e,t)=>e+t*s,j=(e,t)=>e>=0&&e<s&&t>=0&&t<l,M=e=>o+e%s*40,T=e=>c+40*Math.floor(e/s),z=e=>31-Math.clz32(e),L=(e,t)=>{let a=65535;return 0===t&&(a&=S[1]),t===l-1&&(a&=S[4]),0===e&&(a&=S[8]),e===s-1&&(a&=S[2]),a},V=e=>{for(;e.length;){let t=e.pop(),a=t%s,r=Math.floor(t/s),i=p[t];for(let[t,n,s]of I){let l=a+n,o=r+s;if(!j(l,o))continue;let c=(i&C[t])!=0,d=(i&S[t])!=0;if(c&&d)continue;let x=y(l,o),h=p[x]&(c?C[_[t]]:S[_[t]]);h!==p[x]&&(p[x]=h,e.push(x))}}},R=e=>{let t=0,a=0,r=0;for(let i=0;i<16;i++)e&1<<i&&(t+=A[i],a+=A[i]*Math.log(A[i]),r++);return r<=1?0:Math.log(t)-a/t},F=e=>{let t=0;for(let a=0;a<16;a++)e&1<<a&&(t+=A[a]);let a=Math.random()*t;for(let t=0;t<16;t++)if(e&1<<t&&(a-=A[t])<=0)return t;return 15},W=e=>{let t=-1,a=1/0;for(let e=0;e<s*l;e++){if(x[e]||h[e]>0)continue;let r=e%s,i=Math.floor(e/s),n=0===r||0===i||r===s-1||i===l-1,o=R(p[e])+(n?.55:0)+.001*Math.random();o<a&&(a=o,t=e)}return!(t<0)&&(p[t]=1<<F(p[t]),x[t]=1,V([t]),e?u.push({c:t,tile:z(p[t]),age:0}):q(t,z(p[t])),!0)},P=(e,t,a,r,i,n)=>{if(0===t)return;e.save(),e.translate(a+20,r+20),e.scale(n,n),e.translate(-20,-20),e.lineCap="butt",e.lineWidth=1.5,e.strokeStyle="rgba(".concat(N,", ").concat(.11*i,")");let s=1&t,l=2&t,o=4&t,c=8&t,d=E(t);(e.beginPath(),1===d)?(s?(e.moveTo(20,-1.25),e.lineTo(20,14.8)):l?(e.moveTo(41.25,20),e.lineTo(25.2,20)):o?(e.moveTo(20,41.25),e.lineTo(20,25.2)):(e.moveTo(-1.25,20),e.lineTo(14.8,20)),e.stroke(),e.beginPath(),e.arc(20,20,5.2,0,2*Math.PI),e.strokeStyle="rgba(".concat(N,", ").concat(.15*i,")"),e.stroke()):2===d&&(s&&o||l&&c)?(s?(e.moveTo(20,-1.25),e.lineTo(20,41.25)):(e.moveTo(-1.25,20),e.lineTo(41.25,20)),e.stroke()):2===d?(s&&l?(e.moveTo(20,-1.25),e.lineTo(20,0),e.arc(40,0,20,Math.PI,Math.PI/2,!0),e.lineTo(41.25,20)):l&&o?(e.moveTo(41.25,20),e.lineTo(40,20),e.arc(40,40,20,1.5*Math.PI,Math.PI,!0),e.lineTo(20,41.25)):o&&c?(e.moveTo(20,41.25),e.lineTo(20,40),e.arc(0,40,20,0,1.5*Math.PI,!0),e.lineTo(-1.25,20)):(e.moveTo(-1.25,20),e.lineTo(0,20),e.arc(0,0,20,Math.PI/2,0,!0),e.lineTo(20,-1.25)),e.stroke()):(s&&o&&(e.moveTo(20,-1.25),e.lineTo(20,41.25)),l&&c&&(e.moveTo(-1.25,20),e.lineTo(41.25,20)),3===d&&(s&&o?(e.moveTo(20,20),l?e.lineTo(41.25,20):e.lineTo(-1.25,20)):(e.moveTo(20,20),s?e.lineTo(20,-1.25):e.lineTo(20,41.25))),e.stroke(),e.beginPath(),e.arc(20,20,3.5999999999999996,0,2*Math.PI),e.fillStyle="rgba(".concat("255, 75, 31",", ").concat(.5*i,")"),e.fill()),e.restore()},q=(e,t)=>{P(f,t,M(e),T(e),1,1)},Z=(e,t,a)=>{let r=new Map;for(let i=0;i<l;i++)for(let n=0;n<s;n++){let s=Math.hypot(n-e,i-t);s<=a&&r.set(y(n,i),s)}if(0===r.size)return;for(let[e,t]of(u=u.filter(e=>!r.has(e.c)||(q(e.c,e.tile),!1)),v=v.filter(e=>!r.has(e.c)),r)){let a=Math.round(3*t);x[e]&&g.push({c:e,tile:z(p[e]),age:0,delay:a}),f.clearRect(M(e)-1,T(e)-1,42,42),p[e]=L(e%s,Math.floor(e/s)),x[e]=0,h[e]=a+40+10}let i=[...r.keys()];for(let e of r.keys()){let t=e%s,a=Math.floor(e/s);for(let[,e,r]of I)j(t+e,a+r)&&i.push(y(t+e,a+r))}V(i),b=-1,k=!0},B=()=>{w++;for(let e=0;e<s*l;e++)h[e]>0&&h[e]--;let e=0;for(let t=0;t<s*l;t++)!x[t]&&e++;if(0===e){if(b<0)b=Math.round(Y(360,660));else if(--b<=0){let e=.12>Math.random()?Y(5.5,7):Y(2.5,4.5);Z(Math.floor(Math.random()*s),Math.floor(Math.random()*l),e)}return}w%6==0&&W(!0)&&(k=!0)},O=()=>{for(let e of(i.setTransform(d,0,0,d,0,0),i.clearRect(0,0,r.width/d,r.height/d),i.drawImage(m,0,0,r.width/d,r.height/d),v))e.age++;for(let e of(v=v.filter(e=>e.age<=40),i.lineWidth=1,v)){let t=1-e.age/40;i.strokeStyle="rgba(".concat(N,", ").concat(.045*t,")"),i.strokeRect(M(e.c)+1.5,T(e.c)+1.5,37,37)}for(let e of g)e.age++;for(let e of g=g.filter(e=>e.age<=e.delay+40)){let t=e.age<=e.delay?1:1-(e.age-e.delay)/40;P(i,e.tile,M(e.c),T(e.c),t,1)}let e=[];for(let t of(u=u.filter(t=>(t.age++,!(t.age>=30)||(e.push(t),!1))),e))q(t.c,t.tile),v.push({c:t.c,age:0});for(let e of u){let t=X(e.age/30);P(i,e.tile,M(e.c),T(e.c),t,.6+.4*t)}k=u.length>0||g.length>0||v.length>0},H=()=>{let e=a.clientWidth,t=a.clientHeight;if(e<480||t<420){s=0,i.clearRect(0,0,r.width,r.height);return}d=Math.min(window.devicePixelRatio||1,1),r.width=Math.round(e*d),r.height=Math.round(t*d);let n=t-96-116;if(s=Math.min(Math.floor((.6599999999999999*e-36)/40),44),l=Math.min(Math.floor(n/40),26),s<6||l<5){s=0;return}o=36,c=96+(n-40*l)/2,p=new Uint16Array(s*l),x=new Uint8Array(s*l),h=new Int16Array(s*l);for(let e=0;e<l;e++)for(let t=0;t<s;t++)p[y(t,e)]=L(t,e);for(u=[],g=[],v=[],b=-1,(m=document.createElement("canvas")).width=r.width,m.height=r.height,(f=m.getContext("2d")).setTransform(d,0,0,d,0,0);W(!1););b=Math.round(Y(150,260)),k=!0,O()},D=0,U=!0,G=()=>{D=0,n||!U||document.hidden||0===s||(performance.now()<PU||(B(),k&&(w2=performance.now(),33<w2-e2&&(e2=w2,O()))),D=requestAnimationFrame(G))},J=()=>{D||(D=requestAnimationFrame(G))},K=new IntersectionObserver(e=>{let[t]=e;U=t.isIntersecting,J()});K.observe(a);let Q=()=>J();document.addEventListener("visibilitychange",Q);let $=0,e2=0,w2=0,ee=new ResizeObserver(()=>{clearTimeout($),$=setTimeout(()=>{H(),J()},180)});ee.observe(a);let et=a.parentElement,ea=e=>{if(n||0===s||e.target.closest('a, button, input, textarea, select, [role="button"]'))return;let t=r.getBoundingClientRect(),a=Math.floor((e.clientX-t.left-o)/40),i=Math.floor((e.clientY-t.top-c)/40);a<-1||a>s||i<-1||i>l||(Z(Math.min(Math.max(a,0),s-1),Math.min(Math.max(i,0),l-1),Y(2.8,3.6)),J())};return null==et||et.addEventListener("click",ea),H(),J(),()=>{D&&cancelAnimationFrame(D),clearTimeout($),K.disconnect(),ee.disconnect(),document.removeEventListener("visibilitychange",Q),null==et||et.removeEventListener("click",ea)}
})();
}


/* ============ init ============ */
function init() {
  document.documentElement.classList.add("js");
  var lang = document.documentElement.lang || "en";
  if (lang !== "ar" && lang !== "tr") lang = "en";
  applyLang(lang);
  document.getElementById("theme-toggle").addEventListener("click", function () {
    setTheme(resolvedTheme() === "dark" ? "light" : "dark");
  });
  var picker = document.getElementById("lang-picker");
  var trigger = document.getElementById("lang-trigger");
  if (picker && trigger) {
    trigger.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = picker.classList.toggle("open");
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    picker.querySelectorAll(".lang-option").forEach(function (b) {
      b.addEventListener("click", function () { applyLang(b.getAttribute("data-lang")); });
    });
    document.addEventListener("click", function (e) {
      if (!picker.contains(e.target)) {
        picker.classList.remove("open");
        trigger.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        picker.classList.remove("open");
        trigger.setAttribute("aria-expanded", "false");
      }
    });
  }
  document.getElementById("year").textContent = new Date().getFullYear();
  requestAnimationFrame(function () { document.body.classList.add("loaded"); });
  startRoles();
  startReveals();
  startProgress();
  startMagnetic();
  startNavActive();
  startCopy();
  startSpotlight();
  var wrap = document.querySelector(".hero-circuit");
  var canvas = wrap && wrap.querySelector("canvas");
  if (wrap && canvas) {
    var cleanup = initCircuit(wrap, canvas);
    if (cleanup) window.addEventListener("beforeunload", cleanup);
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
