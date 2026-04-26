'use strict';
/* ============================================================
   THOU ART WHAT — app.js
   WebGL Shader Background · GSAP Cinematic Entrance
   Custom Cursor · Magnetic Buttons · 3D Tilt · Burst FX
   Full Game Logic with 20 Shakespearean Insults
   ============================================================ */


/* ════════════════════════════════════════════════════════════
   1. WEBGL SHADER BACKGROUND
   ════════════════════════════════════════════════════════════ */
(function WebGLScene() {
  const canvas = document.getElementById('gl');
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true });
  if (!gl) return;

  function resize() {
    canvas.width  = window.innerWidth  * Math.min(window.devicePixelRatio, 2);
    canvas.height = window.innerHeight * Math.min(window.devicePixelRatio, 2);
    canvas.style.width  = window.innerWidth  + 'px';
    canvas.style.height = window.innerHeight + 'px';
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener('resize', resize);

  /* ── Shaders ── */
  const VS = `
    attribute vec2 a_pos;
    void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
  `;

  const FS = `
    precision mediump float;
    uniform float u_time;
    uniform vec2  u_res;
    uniform vec2  u_mouse;

    // Hash & noise
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i), hash(i + vec2(1,0)), u.x),
        mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x),
        u.y
      );
    }
    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 6; i++) {
        v += a * noise(p);
        p  = p * 2.1 + vec2(1.7, 9.2);
        a *= 0.5;
      }
      return v;
    }

    // Stars
    float star(vec2 uv, float size) {
      vec2 id = floor(uv / size);
      vec2 st = fract(uv / size) - 0.5;
      float h = hash(id);
      if (h < 0.96) return 0.0;
      float d = length(st);
      float b = 1.0 - smoothstep(0.0, 0.06 + h * 0.04, d);
      float twinkle = 0.6 + 0.4 * sin(u_time * (2.0 + h * 4.0) + h * 6.28);
      return b * twinkle * (h - 0.96) * 25.0;
    }

    void main() {
      vec2 uv  = gl_FragCoord.xy / u_res;
      vec2 suv = uv * 2.0 - 1.0;
      suv.x   *= u_res.x / u_res.y;

      // Mouse influence
      vec2 mouse = u_mouse * 2.0 - 1.0;
      mouse.x   *= u_res.x / u_res.y;
      float mDist = length(suv - mouse);
      float mWave = 0.04 * exp(-mDist * 2.5) * sin(mDist * 8.0 - u_time * 3.0);

      // Base nebula layers
      vec2 p1 = uv * 3.0 + vec2(u_time * 0.04, u_time * 0.02);
      vec2 p2 = uv * 2.0 - vec2(u_time * 0.03, u_time * 0.015);
      float n1 = fbm(p1 + mWave);
      float n2 = fbm(p2 + 0.5);
      float n3 = fbm(uv * 5.0 + vec2(u_time * 0.02));

      // Gold nebula colour
      vec3 goldA  = vec3(0.20, 0.13, 0.03);
      vec3 goldB  = vec3(0.45, 0.32, 0.07);
      vec3 purpleA = vec3(0.08, 0.04, 0.15);
      vec3 purpleB = vec3(0.15, 0.06, 0.28);
      vec3 darkRed = vec3(0.14, 0.04, 0.04);

      vec3 nebula = mix(goldA, goldB, n1 * n2) * 0.6;
      nebula     += mix(purpleA, purpleB, n3) * 0.4;
      nebula     += darkRed * (1.0 - length(suv) * 0.4) * 0.3;

      // Vignette
      float vig = 1.0 - smoothstep(0.3, 1.4, length(suv * vec2(0.7, 1.0)));
      nebula    *= vig;

      // Stars
      float s  = star(uv * vec2(u_res.x / u_res.y, 1.0) * 80.0, 1.0);
      s       += star(uv * vec2(u_res.x / u_res.y, 1.0) * 40.0, 1.0) * 0.5;
      s       += star(uv * vec2(u_res.x / u_res.y, 1.0) * 120.0, 1.0) * 0.3;

      // Gold star colour
      vec3 starCol = mix(vec3(0.9, 0.75, 0.35), vec3(1.0, 0.95, 0.7), s * 0.5);
      vec3 col     = nebula + starCol * s;

      // Mouse ripple glow
      vec3 mouseGlow = vec3(0.5, 0.38, 0.1) * (0.06 * exp(-mDist * 3.0));
      col += mouseGlow;

      col = pow(col, vec3(0.85));
      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER,   VS));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER,
    new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uTime  = gl.getUniformLocation(prog, 'u_time');
  const uRes   = gl.getUniformLocation(prog, 'u_res');
  const uMouse = gl.getUniformLocation(prog, 'u_mouse');

  let mx = 0.5, my = 0.5, tmx = 0.5, tmy = 0.5;
  document.addEventListener('mousemove', e => {
    tmx = e.clientX / window.innerWidth;
    tmy = 1.0 - e.clientY / window.innerHeight;
  });

  let t0 = performance.now();
  function frame() {
    requestAnimationFrame(frame);
    const t = (performance.now() - t0) * 0.001;
    mx += (tmx - mx) * 0.06;
    my += (tmy - my) * 0.06;
    gl.uniform1f(uTime,  t);
    gl.uniform2f(uRes,   canvas.width, canvas.height);
    gl.uniform2f(uMouse, mx, my);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  frame();
})();


/* ════════════════════════════════════════════════════════════
   2. THREE.JS PARTICLE LAYER (on top of WebGL bg)
   ════════════════════════════════════════════════════════════ */
(function ThreeLayer() {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.style.cssText =
    'position:fixed;inset:0;z-index:1;pointer-events:none;';
  document.body.appendChild(renderer.domElement);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 5;

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Soft round texture
  function circleTex(col) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0,   col || 'rgba(255,220,100,1)');
    g.addColorStop(0.5, col || 'rgba(255,200,80,.5)');
    g.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  // Primary dust particles
  const N = 3500;
  const pos = new Float32Array(N * 3);
  const vel = new Float32Array(N * 3);
  const cols = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pos[i*3]   = (Math.random() - 0.5) * 28;
    pos[i*3+1] = (Math.random() - 0.5) * 18;
    pos[i*3+2] = (Math.random() - 0.5) * 12;
    vel[i*3]   = (Math.random() - 0.5) * 0.0018;
    vel[i*3+1] = (Math.random() - 0.5) * 0.0018;
    vel[i*3+2] = (Math.random() - 0.5) * 0.0008;
    const t = Math.random();
    cols[i*3]   = 0.6 + t * 0.4;
    cols[i*3+1] = 0.42 + t * 0.32;
    cols[i*3+2] = 0.04 + t * 0.12;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  dustGeo.setAttribute('color',    new THREE.BufferAttribute(cols, 3));
  const dustMat = new THREE.PointsMaterial({
    size: 0.055, vertexColors: true, transparent: true,
    opacity: 0.7, map: circleTex(), alphaTest: 0.01,
    depthWrite: false, sizeAttenuation: true,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  // Bright accent stars
  const SN = 100;
  const spos = new Float32Array(SN * 3);
  for (let i = 0; i < SN; i++) {
    spos[i*3]   = (Math.random() - 0.5) * 24;
    spos[i*3+1] = (Math.random() - 0.5) * 16;
    spos[i*3+2] = (Math.random() - 0.5) * 10;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(spos, 3));
  const starMat = new THREE.PointsMaterial({
    size: 0.1, color: 0xe8c96a, transparent: true, opacity: 0.9,
    map: circleTex(), alphaTest: 0.01, depthWrite: false, sizeAttenuation: true,
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // Wireframe geometry objects
  function wfMesh(geo, opacity, x, y, z) {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      color: 0xc9a84c, wireframe: true, transparent: true, opacity,
    }));
    m.position.set(x, y, z);
    scene.add(m);
    return m;
  }
  const ico   = wfMesh(new THREE.IcosahedronGeometry(1.2, 0),  0.07,  4.5,  1.5, -5);
  const oct   = wfMesh(new THREE.OctahedronGeometry(0.8, 0),   0.09, -4,    2,  -4);
  const tor1  = wfMesh(new THREE.TorusGeometry(1.8, 0.01, 6, 80), 0.05, -3.5, -2, -6);
  const tor2  = wfMesh(new THREE.TorusGeometry(2.6, 0.008, 6, 80), 0.035, 1, 0, -9);
  const cube  = wfMesh(new THREE.BoxGeometry(1, 1, 1),          0.06,  3.5, -2, -4);
  tor2.rotation.x = Math.PI / 3;

  let tmx2 = 0, tmy2 = 0, cmx = 0, cmy = 0;
  document.addEventListener('mousemove', e => {
    tmx2 = (e.clientX / window.innerWidth  - 0.5) * 2;
    tmy2 = -(e.clientY / window.innerHeight - 0.5) * 2;
  });

  const clock = new THREE.Clock();
  function tick() {
    requestAnimationFrame(tick);
    const t = clock.getElapsedTime();
    cmx += (tmx2 - cmx) * 0.035;
    cmy += (tmy2 - cmy) * 0.035;

    // Drift dust
    const pa = dustGeo.attributes.position.array;
    for (let i = 0; i < N; i++) {
      pa[i*3]   += vel[i*3];
      pa[i*3+1] += vel[i*3+1];
      pa[i*3+2] += vel[i*3+2];
      if (pa[i*3]   >  14) pa[i*3]   = -14;
      if (pa[i*3]   < -14) pa[i*3]   =  14;
      if (pa[i*3+1] >   9) pa[i*3+1] = -9;
      if (pa[i*3+1] <  -9) pa[i*3+1] =  9;
    }
    dustGeo.attributes.position.needsUpdate = true;

    dust.rotation.y = t * 0.01;
    dust.rotation.x = Math.sin(t * 0.007) * 0.04;
    stars.rotation.y = -t * 0.006;
    starMat.opacity = 0.7 + Math.sin(t * 1.2) * 0.2;

    camera.position.x += (cmx * 0.7 - camera.position.x) * 0.04;
    camera.position.y += (cmy * 0.4 - camera.position.y) * 0.04;
    camera.lookAt(scene.position);

    ico.rotation.x  = t * 0.22;
    ico.rotation.y  = t * 0.35;
    oct.rotation.x  = t * 0.28;
    oct.rotation.z  = t * 0.18;
    tor1.rotation.x = t * 0.12;
    tor1.rotation.y = t * 0.07;
    tor2.rotation.z = t * 0.05;
    cube.rotation.x = t * 0.2;
    cube.rotation.y = t * 0.3;

    renderer.render(scene, camera);
  }
  tick();
})();


/* ════════════════════════════════════════════════════════════
   3. PRELOADER
   ════════════════════════════════════════════════════════════ */
(function Preloader() {
  const fill = document.getElementById('ldFill');
  const num  = document.getElementById('ldNum');
  const ldr  = document.getElementById('loader');
  let p = 0;

  const iv = setInterval(() => {
    p += Math.random() * 7 + 2;
    if (p > 100) p = 100;
    fill.style.width = p + '%';
    num.textContent  = String(Math.floor(p)).padStart(3, '0');
    if (p >= 100) {
      clearInterval(iv);
      setTimeout(() => exitLoader(ldr), 400);
    }
  }, 55);
})();

function exitLoader(ldr) {
  gsap.to(ldr, {
    opacity: 0, duration: 1, ease: 'power2.inOut',
    onComplete() { ldr.style.display = 'none'; },
  });
  gsap.to('.page', { opacity: 1, duration: 0 });
  runHeroAnim();
  initScrollReveal();
}


/* ════════════════════════════════════════════════════════════
   4. HERO ANIMATION
   ════════════════════════════════════════════════════════════ */
function runHeroAnim() {
  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

  // Nav
  tl.from('.nav', { y: -30, opacity: 0, duration: 0.8 }, 0.3);

  // Overline
  tl.to('.hp-overline', { y: 0, opacity: 1, duration: 0.7 }, 0.5);

  // Title lines
  ['.hp-line:nth-child(1) span',
   '.hp-line:nth-child(2) span',
   '.hp-line:nth-child(3) span'].forEach((sel, i) => {
    tl.to(sel, { y: 0, opacity: 1, duration: 0.9 }, 0.65 + i * 0.15);
  });

  // Body + CTA
  tl.to('.hp-body', { y: 0, opacity: 1, duration: 0.7 }, 1.15);
  tl.to('.hp-cta-row', { y: 0, opacity: 1, duration: 0.6 }, 1.35);

  // Mask scene
  tl.from('#maskScene', {
    opacity: 0, scale: 0.85, rotateY: -20,
    duration: 1.2, ease: 'power3.out',
  }, 0.6);

  // Ticker
  tl.from('.ticker-wrap', { opacity: 0, duration: 0.5 }, 1.8);
}


/* ════════════════════════════════════════════════════════════
   5. SCROLL REVEAL
   ════════════════════════════════════════════════════════════ */
function initScrollReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        const delay = parseFloat(e.target.dataset.delay || 0);
        setTimeout(() => e.target.classList.add('visible'), delay * 1000);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach((el, i) => {
    el.dataset.delay = i * 0.1;
    obs.observe(el);
  });
}


/* ════════════════════════════════════════════════════════════
   6. NAV SCROLL BEHAVIOUR
   ════════════════════════════════════════════════════════════ */
window.addEventListener('scroll', () => {
  document.querySelector('.nav').classList.toggle('scrolled', scrollY > 60);
});

document.querySelectorAll('.nav-link').forEach(el => {
  el.addEventListener('click', () => {
    const t = document.getElementById(el.dataset.target);
    if (t) t.scrollIntoView({ behavior: 'smooth' });
  });
});

document.getElementById('ctaPlay').addEventListener('click', () => {
  document.getElementById('gameSec').scrollIntoView({ behavior: 'smooth' });
});


/* ════════════════════════════════════════════════════════════
   7. CUSTOM CURSOR
   ════════════════════════════════════════════════════════════ */
(function Cursor() {
  const cur     = document.getElementById('cur');
  const outer   = document.getElementById('curOuter');
  const curTxt  = document.getElementById('curText');
  let cx = -100, cy = -100, rx = -100, ry = -100;

  document.addEventListener('mousemove', e => {
    cx = e.clientX; cy = e.clientY;
    cur.style.left = cx + 'px';
    cur.style.top  = cy + 'px';
    curTxt.style.left = cx + 'px';
    curTxt.style.top  = cy + 'px';
  });

  (function animCur() {
    requestAnimationFrame(animCur);
    rx += (cx - rx) * 0.11;
    ry += (cy - ry) * 0.11;
    outer.style.left = rx + 'px';
    outer.style.top  = ry + 'px';
  })();

  // Hover state
  document.querySelectorAll('button, .nav-link, .hist-card, .sl-skip').forEach(el => {
    el.addEventListener('mouseenter', () => {
      document.body.classList.add('cur-hover');
      curTxt.textContent = el.dataset.curLabel || '';
    });
    el.addEventListener('mouseleave', () => {
      document.body.classList.remove('cur-hover');
    });
  });
})();


/* ════════════════════════════════════════════════════════════
   8. MAGNETIC BUTTONS
   ════════════════════════════════════════════════════════════ */
document.querySelectorAll('.mag').forEach(el => {
  el.addEventListener('mousemove', e => {
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left - r.width  / 2;
    const y = e.clientY - r.top  - r.height / 2;
    gsap.to(el, { x: x * 0.38, y: y * 0.38, duration: 0.35, ease: 'power2.out' });
  });
  el.addEventListener('mouseleave', () => {
    gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1,.4)' });
  });
});


/* ════════════════════════════════════════════════════════════
   9. 3D CARD TILT
   ════════════════════════════════════════════════════════════ */
(function CardTilt() {
  const wrap = document.getElementById('stageWrap');
  const left = document.getElementById('stageLeft');
  const right = document.getElementById('stageRight');

  function tilt(el, e) {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width  - 0.5;
    const y = (e.clientY - r.top)  / r.height - 0.5;
    gsap.to(el, {
      rotateY: x * 12, rotateX: -y * 8, scale: 1.012,
      duration: 0.4, ease: 'power2.out',
      transformPerspective: 1000,
    });
  }
  function resetTilt(el) {
    gsap.to(el, {
      rotateY: 0, rotateX: 0, scale: 1,
      duration: 0.8, ease: 'elastic.out(1,.4)',
    });
  }

  [left, right].forEach(el => {
    el.addEventListener('mousemove', e => tilt(el, e));
    el.addEventListener('mouseleave', () => resetTilt(el));
  });
})();


/* ════════════════════════════════════════════════════════════
   10. BURST PARTICLE EFFECT
   ════════════════════════════════════════════════════════════ */
function burst(x, y, col) {
  const pool = document.getElementById('burstPool');
  for (let i = 0; i < 22; i++) {
    const p = document.createElement('div');
    p.className = 'bp';
    const sz  = Math.random() * 7 + 2;
    const ang = (Math.PI * 2 / 22) * i + Math.random() * 0.6;
    const d   = Math.random() * 100 + 50;
    p.style.cssText = `
      left:${x}px;top:${y}px;
      width:${sz}px;height:${sz}px;
      background:${col};
      --bpEnd:translate(${Math.cos(ang)*d}px,${Math.sin(ang)*d}px) scale(0);
      animation-duration:${0.5 + Math.random() * 0.4}s;
      animation-delay:${Math.random() * 0.08}s;
    `;
    pool.appendChild(p);
    setTimeout(() => p.remove(), 1200);
  }
}
function cardBurst(col) {
  const r = document.getElementById('stageLeft').getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, col);
}


/* ════════════════════════════════════════════════════════════
   11. WORD DATABASE — 20 Shakespearean Insults
   ════════════════════════════════════════════════════════════ */
const WORDS = [
  {
    word:    "Thou lumpish hedge-born clotpole!",
    hint:    "Think of someone dull and heavy-witted, born in the lowest possible place — like literally beneath a hedge, as a common vagrant.",
    meaning: "A stupid, low-born blockhead. 'Lumpish' means dull and heavy-witted, 'hedge-born' means born in poverty at the bottom of society, and 'clotpole' means a complete and utter fool.",
    example: "Thou lumpish hedge-born clotpole! Thou couldst not find thine own nose with both hands, a lantern, and a map!"
  },
  {
    word:    "Thou artless clay-brained gudgeon!",
    hint:    "A gudgeon is the smallest, easiest fish to catch — it practically jumps onto the hook. 'Clay-brained' says your brain is made of heavy, slow clay.",
    meaning: "A brainless, easily-fooled simpleton. Someone with no skill, no sense, and no caution — easily tricked by absolutely anyone, like a fish helplessly caught.",
    example: "Thou artless clay-brained gudgeon! Thou believest every single word spoken unto thee without a single moment's reflection!"
  },
  {
    word:    "Thou pribbling milk-livered maggot-pie!",
    hint:    "'Milk-livered' = cowardly (your liver is pale as milk with fear). A maggot-pie is a chattering, worthless magpie bird. 'Pribbling' = making irritating, pointless noise.",
    meaning: "A babbling, spineless chatterbox. Someone who never stops making noise while being completely cowardly, worthless, and feather-brained.",
    example: "Away with thee, thou pribbling milk-livered maggot-pie! Thy endless chatter carries no more weight than feathers in a gale!"
  },
  {
    word:    "Thou beslubbering folly-fallen miscreant!",
    hint:    "'Beslubbering' is exactly what it sounds like — wet, slobbery, disgusting. 'Folly-fallen' means someone who has completely tumbled headfirst into foolishness.",
    meaning: "A slobbering villain who has utterly lost their wits. Messy, foolish, and morally bankrupt beyond all possibility of redemption.",
    example: "Get thee gone at once, thou beslubbering folly-fallen miscreant! Thou art a living disgrace to thine own shadow!"
  },
  {
    word:    "Thou churlish fly-bitten dewberry!",
    hint:    "A dewberry is a tiny, sour little wild fruit — barely worth picking. 'Fly-bitten' means even flies have nibbled on you. 'Churlish' = rude like a common peasant.",
    meaning: "A rude, insignificant nobody so small and worthless that even flies bother to bite them. Thoroughly low-class, sour, and beneath contempt.",
    example: "Silence, thou churlish fly-bitten dewberry! Thou art too small and too sour to even warrant proper contempt from this court!"
  },
  {
    word:    "Thou gleeking fat-kidneyed puttock!",
    hint:    "'Gleek' = make rude faces and crude jokes. 'Fat-kidneyed' was Elizabethan slang for greedy and sluggish. A puttock = a low, scavenging vulture-like bird.",
    meaning: "A greedy, crude scavenger who mocks others while taking everything for himself. Low, gluttonous, offensive, and utterly without honour.",
    example: "Thou gleeking fat-kidneyed puttock! Thou wouldst steal the very last crumbs from a starving beggar's trembling bowl!"
  },
  {
    word:    "Thou mewling swag-bellied strumpet!",
    hint:    "'Mewling' = crying weakly and pathetically, like a newborn kitten. 'Swag-bellied' = having a large, heavy gut that swings as you walk.",
    meaning: "A whimpering, pot-bellied disgrace. Someone who cries and whines constantly while carrying themselves with absolutely zero dignity or self-respect.",
    example: "Cease thy mewling at once, thou swag-bellied strumpet! Thou hast shed more tears this single hour than all of October's rain!"
  },
  {
    word:    "Thou rank reeling-ripe moldwarp!",
    hint:    "A moldwarp is an old English word for a mole — a blind creature that burrows underground and never sees the light. 'Reeling-ripe' = so drunk you're staggering and about to fall over.",
    meaning: "A stinking, stumbling drunk as utterly blind as a mole underground. Intoxicated beyond reason, offensive to all senses, and completely clueless about reality.",
    example: "Stand upright, thou rank reeling-ripe moldwarp! Thou canst not walk one straight path to save thine own miserable life!"
  },
  {
    word:    "Thou yeasty tickle-brained harpy!",
    hint:    "A harpy is a mythological creature — half woman, half vulture — who shrieks and steals. 'Tickle-brained' = your mind is so unstable it can be upset by the lightest touch.",
    meaning: "A frothy, unstable, screeching pest whose mind flips at the slightest thing. Someone who torments everyone around them with their unpredictable, unhinged behaviour.",
    example: "Fly hence, thou yeasty tickle-brained harpy! Thy ceaseless shrieking hath driven every last soul from this establishment!"
  },
  {
    word:    "Thou spongy ill-breeding pigeon-egg!",
    hint:    "A pigeon egg is tiny and nearly worthless — the most insignificant egg imaginable. 'Spongy' = absorbs everything, gives nothing back. Born without manners or values.",
    meaning: "A soft, useless, ill-mannered nobody. So small and without value, raised without any principles whatsoever, contributing absolutely nothing to anyone or anything.",
    example: "Thou spongy ill-breeding pigeon-egg! Thou art not worth the shell that had the misfortune to hatch thee into this world!"
  },
  {
    word:    "Thou froward fen-sucked barnacle!",
    hint:    "'Froward' = stubbornly contrary — always going against everyone, always disagreeing. 'Fen-sucked' = drawn up from a swamp like mist. A barnacle clings to things uselessly.",
    meaning: "A stubborn, swamp-born, clingy pest who contributes nothing. Difficult, slimy, completely and magnificently pointless — an obstacle to all who encounter them.",
    example: "Unhand me this instant, thou froward fen-sucked barnacle! Thou clingst to others for thou hast no life, no purpose, of thine own!"
  },
  {
    word:    "Thou puking plume-plucked ratsbane!",
    hint:    "Ratsbane = rat poison — something purely and completely toxic. 'Plume-plucked' = stripped of every last feather of dignity, like a bird caught and plucked bare.",
    meaning: "A nauseating, dignity-stripped piece of poison. Utterly repulsive, completely stripped of all honour and grace, toxic and offensive to every person nearby.",
    example: "Remove thyself at once, thou puking plume-plucked ratsbane! Thou poisonest the very air that surrounds thee for twenty paces!"
  },
  {
    word:    "Thou qualling onion-eyed flap-mouth!",
    hint:    "'Qualling' = making others quail (cower) with your blustering loud noise. 'Onion-eyed' = your eyes are always watering as if from cutting onions. 'Flap-mouth' = never shuts up.",
    meaning: "A blustering, teary-eyed loudmouth. Makes enormous threats while crying, never stops talking for a single moment, and never once backs up any of their hollow words.",
    example: "Silence thyself, thou qualling onion-eyed flap-mouth! Thy words are as empty as thy courage and as wet as thine ever-weeping eyes!"
  },
  {
    word:    "Thou wayward weather-bitten mumble-news!",
    hint:    "'Mumble-news' spreads gossip in low, murmuring whispers so no one can quite hear clearly. 'Weather-bitten' = ancient, battered, and utterly worn down by the elements of life.",
    meaning: "A worn-out gossip who mutters twisted rumours under their breath. Ragged, unreliable, perpetually whispering half-truths, and thoroughly untrustworthy in all matters.",
    example: "Trust not that wayward weather-bitten mumble-news! Every single word from their lips is a dangerous rumour wearing the costume of innocent fact!"
  },
  {
    word:    "Thou infectious doghearted canker-blossom!",
    hint:    "A canker-blossom = a flower that looks beautiful on the outside but is completely rotten within. 'Doghearted' = having the loyalty of a stray dog — which is to say, absolutely none.",
    meaning: "A deceptively attractive villain who is utterly rotten to the core. Pleasant and charming on the outside, diseased with cruelty, betrayal, and corruption within.",
    example: "Away with thee, thou infectious doghearted canker-blossom! Thy pleasant face and gentle manner doth hide nothing but rot and the blackest treachery!"
  },
  {
    word:    "Thou bootless beef-witted flirt-gill!",
    hint:    "'Bootless' = achieving absolutely nothing — utterly useless, like trying to boot something that won't move. 'Beef-witted' = having the raw intellectual capacity of a slab of uncooked beef. A 'flirt-gill' = a flirtatious, frivolous fool.",
    meaning: "A useless, thick-headed, flirtatious fool. No intelligence, no purpose, no dignity — a truly complete and spectacular waste of human existence.",
    example: "What canst thou possibly offer the world, thou bootless beef-witted flirt-gill? Nothing whatsoever beyond empty, vacant smiles and a howling void where a mind should be!"
  },
  {
    word:    "Thou mangled toad-spotted apple-john!",
    hint:    "An apple-john = a very old, shrivelled apple that has been kept long, long past its best. 'Toad-spotted' = marked with spots like a toad, which in Elizabethan times was a sure mark of villainy.",
    meaning: "A disfigured, corrupt old wretch who has far outlasted their usefulness. Ancient, villainous, and thoroughly spotted with a long, distinguished lifetime of wickedness.",
    example: "Look upon thee, thou mangled toad-spotted apple-john! Both time itself and virtue have completely and permanently abandoned thee!"
  },
  {
    word:    "Thou vain tottering whey-face!",
    hint:    "'Whey-face' = someone whose face is as pale, colourless, and watery as the liquid left over after milk curdles. 'Tottering' = barely able to stand upright without falling.",
    meaning: "A conceited, trembling coward with a ghostly pale face. Absolutely full of vanity and self-importance, yet simultaneously shaking with cowardly terror — all pride, zero courage.",
    example: "Thou vain tottering whey-face! Thou art so consumed by fright that every last drop of colour hath permanently abandoned thy wretched, quivering cheeks!"
  },
  {
    word:    "Thou lout-tongued clack-dish varlet!",
    hint:    "A 'clack-dish' = a wooden bowl that beggars used to clap together noisily to beg for food and charity on street corners. 'Lout-tongued' = speaks crudely and rudely like a common ruffian.",
    meaning: "A crude, begging scoundrel with a foul, unmannered mouth. Low-class, dishonest, perpetually begging and demanding things from others while being offensive and unpleasant at all times.",
    example: "Begone from this place, thou lout-tongued clack-dish varlet! Take thy endless, irritating begging and thy sour, vile tongue elsewhere this very instant!"
  },
  {
    word:    "Thou gorbellied dizzy-eyed hugger-mugger!",
    hint:    "A 'hugger-mugger' = someone who acts in confusing, chaotic, disorderly secrecy, always muttering and scheming. 'Gorbellied' = possessing an impressive, prominent round pot-belly.",
    meaning: "A fat, confused, and secretive schemer. Stumbles around in round, disorganised confusion pursuing poorly-formed plots, with too many clumsy secrets and absolutely no clear purpose.",
    example: "We see through all thy schemes, thou gorbellied dizzy-eyed hugger-mugger! Thy plotting is every bit as obvious as thy boundless confusion and thy enormous belly!"
  },
];


/* ════════════════════════════════════════════════════════════
   12. GAME STATE & STORAGE
   ════════════════════════════════════════════════════════════ */
const HK = 'taw_history';
const SK = 'taw_score';
let current  = null;
let wordCount = 0;

function loadScore() { try { return JSON.parse(localStorage.getItem(SK)) || { c:0, t:0, s:0 }; } catch { return { c:0, t:0, s:0 }; } }
function saveScore(o) { localStorage.setItem(SK, JSON.stringify(o)); }
function loadHist()  { try { return JSON.parse(localStorage.getItem(HK)) || []; } catch { return []; } }
function addHist(word, meaning, result) {
  const h = loadHist();
  h.unshift({ word, meaning, result, ts: Date.now() });
  if (h.length > 60) h.pop();
  localStorage.setItem(HK, JSON.stringify(h));
  renderHist();
}
function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ── Score render ── */
function renderScore() {
  const o = loadScore();
  const nc = document.getElementById('scoreCorrect');
  const nt = document.getElementById('scoreTotal');
  const ns = document.getElementById('scoreStreak');
  const np = document.getElementById('sbPct');

  [nc, nt, ns].forEach(el => { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); });
  nc.textContent = o.c;
  nt.textContent = o.t;
  ns.textContent = o.s;
  np.textContent = o.t > 0 ? Math.round((o.c / o.t) * 100) + '%' : '—';
}

/* ── History render ── */
function renderHist() {
  const h = loadHist();
  const list = document.getElementById('historyList');
  document.getElementById('histCount').textContent =
    h.length + ' word' + (h.length !== 1 ? 's' : '') + ' encountered';

  if (!h.length) {
    list.innerHTML = '<div class="hg-empty">No words yet — begin thy lesson in Act II above.</div>';
    return;
  }
  list.innerHTML = h.map((it, i) => {
    const icon = it.result === 'c' ? '✅' : it.result === 'w' ? '❌' : '⏭';
    const cls  = it.result === 'c' ? 'c'  : it.result === 'w' ? 'w'  : 's';
    return `
      <div class="hist-card" style="animation-delay:${i * 0.04}s" onclick="reuseWord(${i})">
        <div class="hc-top">
          <div class="hc-icon ${cls}">${icon}</div>
          <div class="hc-word">${esc(it.word)}</div>
        </div>
        <div class="hc-meaning">${esc(it.meaning)}</div>
      </div>
    `;
  }).join('');
}

window.reuseWord = function(i) {
  const h = loadHist();
  if (!h[i]) return;
  document.getElementById('gameSec').scrollIntoView({ behavior: 'smooth' });
};


/* ════════════════════════════════════════════════════════════
   13. GAME LOGIC
   ════════════════════════════════════════════════════════════ */
const wordEl    = document.getElementById('currentWord');
const hintArea  = document.getElementById('hintArea');
const hintText  = document.getElementById('hintText');
const ansArea   = document.getElementById('answerArea');
const ansText   = document.getElementById('answerText');
const exText    = document.getElementById('exampleText');
const srEmpty   = document.getElementById('srEmpty');
const hintBtn   = document.getElementById('hintBtn');
const revealBtn = document.getElementById('revealBtn');
const newBtn    = document.getElementById('newWordBtn');
const skipBtn   = document.getElementById('skipBtn');
const knewRow   = document.getElementById('knewItRow');
const mainBtns  = document.getElementById('mainBtns');
const yesBtn    = document.getElementById('yesBtn');
const noBtn     = document.getElementById('noBtn');
const stageLeft = document.getElementById('stageLeft');
const wordNum   = document.getElementById('wordNum');

function pickWord() {
  const seen = loadHist().map(h => h.word);
  const pool = WORDS.filter(w => !seen.includes(w.word));
  const arr  = pool.length ? pool : WORDS;
  return arr[Math.floor(Math.random() * arr.length)];
}

function newWord() {
  current = pickWord();
  wordCount++;

  // Animate word out then in
  gsap.to(wordEl, { opacity: 0, y: -10, duration: 0.2, onComplete() {
    wordEl.innerHTML = '';
    wordEl.classList.remove('wIn');
    const span = document.createElement('span');
    span.textContent = current.word;
    wordEl.appendChild(span);
    void wordEl.offsetWidth;
    wordEl.classList.add('wIn');
    gsap.to(wordEl, { opacity: 1, y: 0, duration: 0 });
  }});

  wordNum.textContent = wordCount;

  // Reset UI
  hintArea.classList.add('hidden');
  ansArea.classList.add('hidden');
  knewRow.classList.add('hidden');
  mainBtns.classList.remove('hidden');
  srEmpty.style.display = '';
  stageLeft.classList.remove('revealed');
  hintBtn.disabled   = false;
  revealBtn.disabled = false;
  skipBtn.style.display = '';
  newBtn.textContent = '🎲 New Word';
}

function showHint() {
  if (!current) return;
  hintText.textContent = current.hint;
  hintArea.classList.remove('hidden');
  srEmpty.style.display = 'none';
  hintBtn.disabled = true;
}

function revealAnswer() {
  if (!current) return;
  ansText.textContent = current.meaning;
  exText.textContent  = current.example;
  hintArea.classList.add('hidden');
  ansArea.classList.remove('hidden');
  srEmpty.style.display = 'none';
  stageLeft.classList.add('revealed');
  revealBtn.disabled = true;
  hintBtn.disabled   = true;
  mainBtns.classList.add('hidden');
  knewRow.classList.remove('hidden');
  skipBtn.style.display = 'none';
}

function skipWord() {
  if (!current) return;
  addHist(current.word, current.meaning, 's');
  newWord();
}

function markResult(knew) {
  const o = loadScore();
  o.t++;
  if (knew) { o.c++; o.s++; cardBurst('#4adf8a'); }
  else       { o.s = 0;     cardBurst('#e74c3c'); }
  saveScore(o);
  renderScore();
  addHist(current.word, current.meaning, knew ? 'c' : 'w');
  knewRow.classList.add('hidden');
  mainBtns.classList.remove('hidden');
  revealBtn.disabled = true;
  hintBtn.disabled   = true;
  newBtn.textContent = '🎲 Next Word';
  // Animate score section
  gsap.from('#scoreRow', { scale: 1.02, duration: 0.4, ease: 'power2.out' });
}

function clearAll() {
  if (!confirm('Dost thou truly wish to erase all history and scores?')) return;
  localStorage.removeItem(HK);
  localStorage.removeItem(SK);
  wordCount = 0;
  current   = null;
  renderHist();
  renderScore();
  // Reset display
  wordEl.innerHTML = '<span class="wt-placeholder">Press "New Word" to begin thy lesson</span>';
  wordNum.textContent = '—';
  hintArea.classList.add('hidden');
  ansArea.classList.add('hidden');
  knewRow.classList.add('hidden');
  mainBtns.classList.remove('hidden');
  stageLeft.classList.remove('revealed');
  srEmpty.style.display = '';
  hintBtn.disabled   = true;
  revealBtn.disabled = true;
  newBtn.textContent = '🎲 New Word';
}


/* ════════════════════════════════════════════════════════════
   14. EVENT BINDINGS + INIT
   ════════════════════════════════════════════════════════════ */
newBtn.addEventListener('click',    newWord);
hintBtn.addEventListener('click',   showHint);
revealBtn.addEventListener('click', revealAnswer);
skipBtn.addEventListener('click',   skipWord);
yesBtn.addEventListener('click',    () => markResult(true));
noBtn.addEventListener('click',     () => markResult(false));
document.getElementById('clearBtn').addEventListener('click', clearAll);

// Initial state
hintBtn.disabled   = true;
revealBtn.disabled = true;
renderScore();
renderHist();

// Apply magnetic to any new buttons
document.querySelectorAll('.mag').forEach(el => {
  if (el._magBound) return;
  el._magBound = true;
  el.addEventListener('mousemove', e => {
    const r = el.getBoundingClientRect();
    gsap.to(el, {
      x: (e.clientX - r.left - r.width/2) * 0.38,
      y: (e.clientY - r.top  - r.height/2) * 0.38,
      duration: .35, ease: 'power2.out'
    });
  });
  el.addEventListener('mouseleave', () => {
    gsap.to(el, { x:0, y:0, duration:.6, ease:'elastic.out(1,.4)' });
  });
});