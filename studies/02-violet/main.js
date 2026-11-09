/* Study 02 — motion layer: the framed site scrolls inside .win with Lenis; ScrollTrigger drives sticky scenes;
   canvases draw the dotted sphere (hero) and the drifting moiré waves. Without JS or with reduced motion the
   page shows a static, complete layout (scenes collapse to normal blocks). */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gsap = window.gsap, ST = window.ScrollTrigger;
  var scroller = document.getElementById('scroller');
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var DPR = Math.min(2, window.devicePixelRatio || 1);
  function show() { root.classList.remove('js-intro'); }

  /* ------------------------------------------------------------ frame toggle (works without GSAP) */
  var toggle = $('.frame-toggle');
  try { if (localStorage.getItem('s02:noframe') === '1') root.classList.add('no-frame'); } catch (e) {}
  function syncToggle() {
    var off = root.classList.contains('no-frame');
    toggle.setAttribute('aria-pressed', String(off));
    toggle.querySelector('span').textContent = off ? 'Framed view' : 'Full view';
    toggle.title = off ? 'Show the page in its neon frame' : 'Show the page without the frame';
  }
  syncToggle();
  toggle.addEventListener('click', function () {
    root.classList.toggle('no-frame');
    try { localStorage.setItem('s02:noframe', root.classList.contains('no-frame') ? '1' : '0'); } catch (e) {}
    syncToggle();
    setTimeout(function () { resizeCanvases(); if (ST) ST.refresh(); }, 950);
  });

  /* ------------------------------------------------------------ neon backdrop (WebGL)
     Measured from the video: two violet, two blue and two dark lobes (a 2-fold conic light) turn clockwise around the
     window, brightest right behind it, softer out to a disc edge at ~0.55 window widths and dim beyond. Here the field
     also bends like liquid, a 3-lobed light turns the other way, scrolling speeds the spin up and the light leans toward
     the pointer. Without WebGL the CSS glows stay; with reduced motion one still frame is drawn. */
  var neonEnergy = 0, neonSpin = .9;
  (function neon() {
    var host = $('.neon'), win = $('.win');
    if (!host || !win) return;
    var c = document.createElement('canvas');
    c.className = 'neon__gl';
    var gl = null;
    try { gl = c.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false, preserveDrawingBuffer: false, powerPreference: 'low-power' }); } catch (e) {}
    if (!gl) return;
    var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    var FS = [
      'precision highp float;',
      'uniform vec2 uC;uniform float uW;uniform float uA;uniform float uT;uniform float uE;uniform vec2 uM;uniform vec4 uR;',
      'const vec3 VIO=vec3(.36,.19,.64);const vec3 HOT=vec3(.56,.36,.96);const vec3 BLU=vec3(.08,.03,.56);const vec3 DRK=vec3(.03,.022,.06);',
      'float h(vec2 p){return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5453);}',
      'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}',
      'float box(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}',
      'void main(){',
      ' vec2 q=gl_FragCoord.xy-uC;',
      ' vec2 p=q/uW-uM*.014;',
      ' float r=length(p),a=atan(p.y,p.x);',
      ' float w=.55*sin(r*9.-uT*.8)+.7*(n(p*3.2+vec2(uT*.07,-uT*.05))-.5);',
      ' float ph=2.*(a+uA)+w*.5;',
      ' float wv=pow(.5+.5*cos(ph),2.2),wd=pow(.5+.5*cos(ph-2.094),2.),wb=pow(.5+.5*cos(ph+2.094),2.);',
      ' vec3 col=(VIO*wv+BLU*wb+DRK*wd)/(wv+wb+wd+1e-4);',
      ' float ph2=3.*(a-uA*.62)+1.3*sin(uT*.23)+w*.4;',
      ' float w2=pow(.5+.5*cos(ph2),3.);',
      ' col=mix(col,HOT,w2*wv*.38+w2*.08);',
      ' float fall=mix(.5,1.,smoothstep(.62,.3,r));',
      ' float disc=mix(.76,1.,smoothstep(.556,.546,r));',
      ' float I=fall*disc*(1.+.07*sin(uT*.9)+uE*.4);',
      ' vec3 o=mix(DRK,col,clamp(I,0.,1.5));',
      ' o+=col*.22*exp(-pow((r-.55)/.004,2.));',
      ' o*=mix(.2,1.,smoothstep(1.,.5,r));',
      ' float d=box(q,uR.xy,uR.z);',
      ' o+=mix(HOT,col,.5)*.10*exp(-max(d,0.)/(uR.w*14.))*(.6+.8*wv);',
      ' o+=(h(gl_FragCoord.xy+fract(uT))-.5)/128.;',
      ' gl_FragColor=vec4(o,1.);',
      '}'
    ].join('\n');
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; }
    var vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return;
    var pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
    gl.useProgram(pr);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var U = {}; ['uC', 'uW', 'uA', 'uT', 'uE', 'uM', 'uR'].forEach(function (k) { U[k] = gl.getUniformLocation(pr, k); });
    host.insertBefore(c, host.firstChild);
    host.classList.add('neon--gl');
    var K = .5, geo = null; // the field is soft: half resolution is plenty
    function measure() {
      var w = Math.max(1, Math.round(innerWidth * K)), h = Math.max(1, Math.round(innerHeight * K));
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; gl.viewport(0, 0, w, h); }
      var r = win.getBoundingClientRect();
      var rad = parseFloat(getComputedStyle(win).borderTopLeftRadius) || 0;
      geo = { cx: (r.left + r.width / 2) * K, cy: h - (r.top + r.height / 2) * K, w: Math.max(r.width, 320) * K, hw: r.width / 2 * K, hh: r.height / 2 * K, rad: rad * K };
    }
    var mx = 0, my = 0, tx = 0, ty = 0;
    window.addEventListener('pointermove', function (e) { if (e.clientX === 0 && e.clientY === 0) return; tx = e.clientX / innerWidth * 2 - 1; ty = 1 - e.clientY / innerHeight * 2; }, { passive: true });
    function draw(t) {
      if (!geo) measure();
      gl.uniform2f(U.uC, geo.cx, geo.cy); gl.uniform1f(U.uW, geo.w);
      gl.uniform1f(U.uA, neonSpin); gl.uniform1f(U.uT, t); gl.uniform1f(U.uE, neonEnergy);
      gl.uniform2f(U.uM, mx, my); gl.uniform4f(U.uR, geo.hw, geo.hh, geo.rad, K);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    window.addEventListener('resize', function () { geo = null; if (reduce) draw(0); });
    // the window's inset animates when the frame toggles: follow it for a second
    toggle.addEventListener('click', function () { var until = performance.now() + 1100; (function f() { geo = null; if (reduce) draw(0); if (performance.now() < until) requestAnimationFrame(f); })(); });
    if (reduce) { draw(0); return; }
    var last = performance.now(), T = 0;
    (function loop(now) {
      requestAnimationFrame(loop);
      var dt = Math.min(.05, Math.max(0, (now - last) / 1000)); last = now;
      if (root.classList.contains('no-frame')) return; // the window covers the whole screen
      T += dt;
      neonEnergy *= Math.pow(.06, dt);                  // scroll energy fades in ~1 s
      neonSpin += dt * (.3 + 1.6 * neonEnergy);         // clockwise in screen space (y is up in GL)
      mx += (tx - mx) * Math.min(1, dt * 2.2); my += (ty - my) * Math.min(1, dt * 2.2);
      draw(T);
    })(last);
  })();
  // scroll speed feeds the backdrop (works with or without Lenis)
  (function () {
    var y0 = scroller.scrollTop, t0 = performance.now();
    scroller.addEventListener('scroll', function () {
      var now = performance.now(), y = scroller.scrollTop, v = Math.abs(y - y0) / Math.max(8, now - t0);
      y0 = y; t0 = now;
      neonEnergy = Math.min(1, Math.max(neonEnergy, v * .35));
    }, { passive: true });
  })();

  /* ------------------------------------------------------------ canvases */
  var canvases = [];
  function fit(c) {
    var r = c.getBoundingClientRect();
    var w = Math.max(1, Math.round(r.width * DPR)), h = Math.max(1, Math.round(r.height * DPR));
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  }
  function resizeCanvases() { canvases.forEach(function (o) { fit(o.c); o.draw(o.t || 0); }); }

  // hero cushion: a rounded box (superellipsoid) covered in a dot mesh, seen from slightly above and lit from the top,
  // like the reference's grille cushion. Sampled as a cube-sphere grid (no seams); it sways a little and follows the
  // pointer. Design units: the canvas is 700 x 560 design px (k = canvas px per design px).
  var cushionPose = { yaw: 0, tilt: 0 };
  function sphere(c) {
    var g = c.getContext('2d');
    var A = 276, B = 170, C = 322, MH = 2.7, MV = 2.05, STEP = 8.4;
    var P = [], Nn = [];
    [0, 1, 2].forEach(function (ax) {
      [-1, 1].forEach(function (sg) {
        var dims = [A, B, C], uA = ax === 0 ? 1 : 0, vA = ax === 2 ? 1 : 2;
        var nu = Math.max(8, Math.round(2 * dims[uA] / STEP)), nv = Math.max(8, Math.round(2 * dims[vA] / STEP));
        for (var i = 0; i < nu; i++) for (var j = 0; j < nv; j++) {
          var q = [0, 0, 0];
          q[ax] = sg; q[uA] = Math.tan(((i + .5) / nu * 2 - 1) * Math.PI / 4); q[vA] = Math.tan(((j + .5) / nv * 2 - 1) * Math.PI / 4);
          var ax_ = Math.abs(q[0]), ay = Math.abs(q[1]), az = Math.abs(q[2]);
          var F = Math.pow(Math.pow(ax_, MH) + Math.pow(ay, MH), MV / MH) + Math.pow(az, MV), s = Math.pow(F, -1 / MV);
          var x = q[0] * s, y = q[1] * s, z = q[2] * s;
          var h = Math.pow(Math.abs(x), MH) + Math.pow(Math.abs(y), MH) + 1e-12, m = Math.pow(h, MV / MH - 1);
          var nx = m * Math.sign(x) * Math.pow(Math.abs(x), MH - 1) / A, ny = m * Math.sign(y) * Math.pow(Math.abs(y), MH - 1) / B, nz = Math.sign(z) * Math.pow(Math.abs(z), MV - 1) / C;
          var nl = Math.hypot(nx, ny, nz) || 1;
          P.push(x * A, y * B, z * C); Nn.push(nx / nl, ny / nl, nz / nl);
        }
      });
    });
    var n = P.length / 3, LV = 14, buckets = [];
    for (var l = 0; l < LV; l++) buckets.push([]);
    var L = [-.62, -.6, .5], ll = Math.hypot(L[0], L[1], L[2]); L = [L[0] / ll, L[1] / ll, L[2] / ll];
    var Hh = [L[0], L[1], L[2] + 1], hl = Math.hypot(Hh[0], Hh[1], Hh[2]); Hh = [Hh[0] / hl, Hh[1] / hl, Hh[2] / hl];
    var hull = [];
    return function (t) {
      var W = c.width, Hc = c.height, k = W / 700;
      g.clearRect(0, 0, W, Hc);
      var yaw = (-8 + 4.5 * Math.sin(t * .00022) + cushionPose.yaw) * Math.PI / 180;
      var tilt = (15 + 2 * Math.sin(t * .00017 + 1) + cushionPose.tilt) * Math.PI / 180, roll = -6 * Math.PI / 180;
      var cyw = Math.cos(yaw), syw = Math.sin(yaw), ct = Math.cos(tilt), st = Math.sin(tilt), cr = Math.cos(roll), sr = Math.sin(roll);
      var ox = 334 * k, oy = 268 * k, d = 2.1 * k;
      for (l = 0; l < LV; l++) buckets[l].length = 0;
      hull.length = 0;
      for (var i = 0; i < n; i++) {
        var j3 = i * 3;
        var nx = Nn[j3], ny = Nn[j3 + 1], nz = Nn[j3 + 2];
        var nx1 = nx * cyw - ny * syw, ny1 = nx * syw + ny * cyw;
        var NY = ny1 * ct - nz * st, NZ = ny1 * st + nz * ct, NX = nx1;
        if (NZ <= 0) continue;
        var tx = NX * cr - NY * sr, ty = NX * sr + NY * cr; NX = tx; NY = ty;
        var x = P[j3], y = P[j3 + 1], z = P[j3 + 2];
        var x1 = x * cyw - y * syw, y1 = x * syw + y * cyw;
        var Y = y1 * ct - z * st, X = x1;
        var sx = ox + (X * cr - Y * sr) * k, sy = oy + (X * sr + Y * cr) * k;
        var dif = Math.max(0, NX * L[0] + NY * L[1] + NZ * L[2]);
        var sp = Math.pow(Math.max(0, NX * Hh[0] + NY * Hh[1] + NZ * Hh[2]), 16);
        var b = (.02 + 1.3 * Math.pow(dif, 1.8) + 2.6 * sp + 1.1 * Math.pow(Math.max(0, NX), 2) * (1 - NZ) * (NY > -.2 ? 1 : .4)) * (.45 + .55 * NZ);
        var lv = Math.min(LV - 1, Math.floor(b / 1.6 * LV));
        buckets[lv].push(sx, sy);
        if (NZ < .35) hull.push(sx, sy);
      }
      // body: the convex outline of the rim, lit from the top
      if (hull.length > 6) {
        var pts = [];
        for (i = 0; i < hull.length; i += 2) pts.push([hull[i], hull[i + 1]]);
        pts.sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
        var cross = function (o, a, b) { return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); };
        var lo = [], up = [];
        pts.forEach(function (p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); });
        for (i = pts.length - 1; i >= 0; i--) { var p = pts[i]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
        var poly = lo.slice(0, -1).concat(up.slice(0, -1));
        g.beginPath(); poly.forEach(function (p, q) { q ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }); g.closePath();
        var bg = g.createLinearGradient(0, oy - 230 * k, 0, oy + 230 * k);
        bg.addColorStop(0, '#4A38A6'); bg.addColorStop(.3, '#33247F'); bg.addColorStop(.62, '#1F165A'); bg.addColorStop(1, '#130D3C');
        g.fillStyle = bg; g.fill();
        g.save(); g.clip();
        var hi = g.createRadialGradient(ox - 110 * k, oy - 165 * k, 0, ox - 90 * k, oy - 130 * k, 240 * k);
        hi.addColorStop(0, 'rgba(222,210,255,.6)'); hi.addColorStop(.45, 'rgba(180,160,255,.2)'); hi.addColorStop(1, 'rgba(180,160,255,0)');
        g.fillStyle = hi; g.fillRect(0, 0, W, Hc);
        g.restore();
      }
      for (l = 0; l < LV; l++) {
        var a = buckets[l]; if (!a.length) continue;
        var bb = (l + .5) / LV * 1.6; bb = bb * bb / 1.6;
        g.fillStyle = 'rgb(' + Math.min(255, Math.round(50 + 150 * bb)) + ',' + Math.min(255, Math.round(38 + 132 * bb)) + ',' + Math.min(255, Math.round(118 + 140 * bb)) + ')';
        g.beginPath();
        for (i = 0; i < a.length; i += 2) g.rect(a[i] - d / 2, a[i + 1] - d / 2, d, d);
        g.fill();
      }
    };
  }
  // warped neon stripes; opt.dir 'v' = stripes run vertically, 'd' = diagonal; opt.mask = soft shape
  function moire(c, opt) {
    var g = c.getContext('2d');
    return function (t) {
      var W = c.width, H = c.height; g.clearRect(0, 0, W, H);
      var ph = t * .00035 * (opt.speed || 1), gap = (opt.gap || 15) * DPR * (W / (opt.base || 600) / DPR);
      g.save();
      var grad = g.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, opt.c1 || '#3A2BFF'); grad.addColorStop(1, opt.c2 || '#9B4BFF');
      g.strokeStyle = grad; g.lineWidth = gap * (opt.lw || .46); g.lineCap = 'round';
      var n = Math.ceil((opt.dir === 'd' ? W + H : W) / gap) + 4;
      for (var i = -2; i < n; i++) {
        g.beginPath();
        for (var s = 0; s <= 60; s++) {
          var u = s / 60, x, y;
          if (opt.dir === 'd') {
            var base = i * gap - H;
            x = base + u * (W + H); y = u * H * 1.1 - H * .05;
            var w = (Math.sin(u * 4.2 + ph + i * .33) * gap * 1.9 + Math.sin(u * 9.5 - ph * 1.3 + i * .12) * gap * 1.05 + Math.sin(i * .21 + ph * .5 + u * 1.7) * gap * 1.4) * (opt.amp || 1);
            x += w; y -= w * .4;
          } else {
            y = u * H; x = i * gap + Math.sin(u * 4.6 + ph + i * .2) * gap * 2.4 + Math.sin(u * 9.5 - ph * .8 + i * .07) * gap;
          }
          s ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.stroke();
      }
      g.globalCompositeOperation = 'destination-in';
      opt.mask(g, W, H);
      g.restore();
    };
  }
  // warped neon stripes on the GPU: stripes are level lines of a field pushed around by two drifting bumps and a
  // travelling wave; where they crowd together they fold darker, the bump centres glow. o: see the three uses below.
  function stripesGL(c, o) {
    var gl = null;
    try { gl = c.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false }); } catch (e) {}
    if (!gl) return null;
    var FS = [
      'precision highp float;',
      'uniform vec2 uR;uniform float uT;uniform float uK;uniform vec3 uC1;uniform vec3 uC2;uniform vec4 uS;uniform vec4 uB1;uniform vec4 uB2;uniform vec4 uM1;uniform vec4 uM2;uniform vec2 uL;',
      'float field(vec2 q){',
      ' vec2 dir=vec2(cos(uS.w),sin(uS.w)),nor=vec2(-dir.y,dir.x);',
      ' float s=dot(q,dir),n=dot(q,nor);',
      ' vec2 b1=uB1.xy*uR/uK+uB1.z*.25*vec2(sin(uT*.31),cos(uT*.27));',
      ' vec2 b2=uB2.xy*uR/uK+uB2.z*.25*vec2(cos(uT*.23),sin(uT*.35));',
      ' vec2 d1=q-b1,d2=q-b2;',
      ' float g1=exp(-dot(d1,d1)/(uB1.z*uB1.z)),g2=exp(-dot(d2,d2)/(uB2.z*uB2.z));',
      ' return s+uB1.w*g1*(1.+.25*sin(uT*.5))+uB2.w*g2+uS.z*sin(n/95.+uT*.6)+uS.z*.5*sin(n/41.-uT*.45+s/120.);',
      '}',
      'float lobe(vec2 uv,vec4 m){vec2 d=(uv-m.xy)*vec2(uR.x/uR.y,1.);return smoothstep(m.z,m.z*m.w,length(d));}',
      'void main(){',
      ' vec2 px=vec2(gl_FragCoord.x,uR.y-gl_FragCoord.y);',
      ' vec2 q=px/uK,uv=px/uR;',
      ' float f=field(q),fx=field(q+vec2(1.,0.)),fy=field(q+vec2(0.,1.));',
      ' float gr=length(vec2(fx-f,fy-f));',
      ' float ph=abs(fract(f/uS.x)-.5)*2.;',
      ' float aa=max(.02,1.4*gr/(uS.x*uK));',
      ' float line=smoothstep(1.-uS.y-aa,1.-uS.y+aa,ph);',
      ' float fold=1./(1.+uL.y*max(gr-1.,0.)*max(gr-1.,0.));',
      ' vec2 b1=uB1.xy*uR/uK;float g=exp(-dot(q-b1,q-b1)/(uB1.z*uB1.z*1.6));',
      ' vec3 col=mix(uC1,uC2,clamp(uv.x*.55+uv.y*.35+g*.3,0.,1.));',
      ' float m=max(lobe(uv,uM1),lobe(uv,uM2));',
      ' float a=m*(line*(.55+.45*fold)+uL.x*g*.35);',
      ' gl_FragColor=vec4(col*a,a);',
      '}'
    ].join('\n');
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; }
    var vs = sh(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'), fs = sh(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return null;
    var pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var U = {}; ['uR', 'uT', 'uK', 'uC1', 'uC2', 'uS', 'uB1', 'uB2', 'uM1', 'uM2', 'uL'].forEach(function (k) { U[k] = gl.getUniformLocation(pr, k); });
    function rgb(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
    var c1 = rgb(o.c1), c2 = rgb(o.c2);
    return function (t) {
      var W = c.width, H = c.height;
      gl.viewport(0, 0, W, H);
      gl.uniform2f(U.uR, W, H); gl.uniform1f(U.uT, t / 1000 * (o.speed || 1)); gl.uniform1f(U.uK, W / o.w);
      gl.uniform3fv(U.uC1, c1); gl.uniform3fv(U.uC2, c2);
      gl.uniform4f(U.uS, o.gap, o.duty, o.amp, o.ang * Math.PI / 180);
      gl.uniform4fv(U.uB1, o.b1); gl.uniform4fv(U.uB2, o.b2);
      gl.uniform4fv(U.uM1, o.m1); gl.uniform4fv(U.uM2, o.m2 || o.m1);
      gl.uniform2f(U.uL, o.glow || 0, o.fold || 0);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
  }
  function blobMask(parts) {
    // union of soft lobes, painted on an offscreen canvas and applied as one destination-in mask
    var m = document.createElement('canvas');
    return function (g, W, H) {
      if (m.width !== W || m.height !== H) { m.width = W; m.height = H; }
      var mg = m.getContext('2d');
      mg.clearRect(0, 0, W, H);
      mg.globalCompositeOperation = 'lighter';
      parts.forEach(function (p) {
        var r = p[2] * Math.min(W, H);
        var gr = mg.createRadialGradient(p[0] * W, p[1] * H, r * (p[3] || .2), p[0] * W, p[1] * H, r);
        gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(.6, 'rgba(0,0,0,.8)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        mg.fillStyle = gr; mg.fillRect(0, 0, W, H);
      });
      g.drawImage(m, 0, 0);
    };
  }
  var hs = $('.hero__sphere');
  if (hs) canvases.push({ c: hs, draw: sphere(hs) });
  var tr = $('.moire--tr'), bl = $('.moire--bl'), mb = $('.moire--blob');
  // manifesto corners (reference): thick violet stripes bent hard around a bump, folding dark where they crowd
  if (tr) canvases.push({ c: tr, draw: stripesGL(tr, { w: 440, c1: '#2E24F4', c2: '#8E3DFF', gap: 15, duty: .5, amp: 26, ang: 0, b1: [.72, .3, 150, 120], b2: [.25, .05, 120, -70], m1: [1, 0, 1.08, .45], glow: .5, fold: 1.4, speed: 1 })
    || moire(tr, { dir: 'v', gap: 15, base: 520, speed: 1, mask: blobMask([[1, 0, 1.1, .05]]) }) });
  if (bl) canvases.push({ c: bl, draw: stripesGL(bl, { w: 420, c1: '#3324F0', c2: '#7A34FF', gap: 15, duty: .48, amp: 22, ang: -12, b1: [.62, .92, 110, 130], b2: [.15, .55, 140, -60], m1: [0, 1, 1.02, .42], glow: .9, fold: 1.6, speed: -.8 })
    || moire(bl, { dir: 'v', gap: 15, base: 470, speed: -.8, c1: '#5A2BFF', c2: '#2A22E8', mask: blobMask([[0, 1, 1.1, .05]]) }) });
  // behind the wordmark: a fine, dim fingerprint of lines on a soft violet orb
  if (mb) canvases.push({ c: mb, draw: stripesGL(mb, { w: 1000, c1: '#2A1FB8', c2: '#7334E0', gap: 10, duty: .34, amp: 30, ang: 32, b1: [.42, .45, 230, 120], b2: [.62, .62, 200, -90], m1: [.38, .42, .36, .1], m2: [.56, .6, .36, .1], glow: .35, fold: 2.8, speed: .6 })
    || moire(mb, { dir: 'd', gap: 22, lw: .36, base: 1000, speed: .9, amp: 2.3, c1: '#2E22F0', c2: '#9C46FF', mask: blobMask([[.26, .33, .27, .15], [.6, .63, .37, .15]]) }) });
  canvases.forEach(function (o) { fit(o.c); o.draw(0); o.on = false; });
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { canvases.forEach(function (o) { if (o.c === e.target) o.on = e.isIntersecting; }); }); }, { root: scroller, rootMargin: '120px' });
    canvases.forEach(function (o) { io.observe(o.c); });
    (function loop(t) { canvases.forEach(function (o) { if (o.on) { o.t = t; o.draw(t); } }); requestAnimationFrame(loop); })(0);
  }
  window.addEventListener('resize', function () { resizeCanvases(); });

  /* ------------------------------------------------------------ pill glyphs: rotating 3D wireframes (reference):
     a torus, two interlocked rings and a gyroscope globe; the far side of each wire is drawn dimmer. */
  (function glyphs3d() {
    var svgs = $$('.glyph');
    if (svgs.length < 3) return;
    function ring(n, f) { var a = []; for (var i = 0; i <= n; i++) a.push(f(i / n * Math.PI * 2)); return a; }
    var models = [
      // torus: 10 small circles around a 20-unit ring + the inner and outer equators
      (function () { var L = []; for (var k = 0; k < 10; k++) { var u = k / 10 * Math.PI * 2; L.push(ring(28, function (v) { var r = 21 + 9 * Math.cos(v); return [r * Math.cos(u), r * Math.sin(u), 9 * Math.sin(v)]; })); } L.push(ring(48, function (u) { return [30 * Math.cos(u), 30 * Math.sin(u), 0]; })); L.push(ring(48, function (u) { return [12 * Math.cos(u), 12 * Math.sin(u), 0]; })); return L; })(),
      // two interlocked rings
      [ring(48, function (u) { return [-8 + 22 * Math.cos(u), 22 * Math.sin(u), 0]; }), ring(48, function (u) { return [8 + 22 * Math.cos(u), 0, 22 * Math.sin(u)]; })],
      // gyroscope globe: three meridians, the equator and a small inner ring
      (function () { var L = []; [0, 60, 120].forEach(function (d) { var a = d * Math.PI / 180; L.push(ring(48, function (u) { return [27 * Math.cos(u) * Math.cos(a), 27 * Math.sin(u), 27 * Math.cos(u) * Math.sin(a)]; })); }); L.push(ring(48, function (u) { return [27 * Math.cos(u), 0, 27 * Math.sin(u)]; })); L.push(ring(32, function (u) { return [11 * Math.cos(u), 11 * Math.sin(u), 0]; })); return L; })()
    ];
    var spin = [[.0011, .0007, .15], [.0012, .0, .35], [.0006, .0013, .45]];
    var paths = svgs.slice(0, 3).map(function (svg) {
      svg.innerHTML = '<g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path class="g-back" opacity=".28"/><path class="g-front"/></g>';
      return [svg.querySelector('.g-back'), svg.querySelector('.g-front')];
    });
    function draw(t) {
      models.forEach(function (lines, gi) {
        var ay = t * spin[gi][0], ax = t * spin[gi][1] + spin[gi][2], cy = Math.cos(ay), sy = Math.sin(ay), cx = Math.cos(ax), sx = Math.sin(ax);
        var back = '', front = '';
        lines.forEach(function (pts) {
          var prev = null;
          pts.forEach(function (p) {
            var x = p[0] * cy + p[2] * sy, z = -p[0] * sy + p[2] * cy, y = p[1] * cx - z * sx; z = p[1] * sx + z * cx;
            var q = [x.toFixed(1), y.toFixed(1), z];
            if (prev) { var seg = 'M' + prev[0] + ' ' + prev[1] + 'L' + q[0] + ' ' + q[1]; if (prev[2] + q[2] < 0) back += seg; else front += seg; }
            prev = q;
          });
        });
        paths[gi][0].setAttribute('d', back); paths[gi][1].setAttribute('d', front);
      });
    }
    draw(1800);
    if (reduce || !('IntersectionObserver' in window)) return;
    var on = false;
    new IntersectionObserver(function (es) { on = es[0].isIntersecting; }, { root: scroller }).observe($('.manifesto'));
    (function loop(t) { if (on) draw(t); requestAnimationFrame(loop); })(0);
  })();

  if (reduce || !gsap || !ST) { show(); return; }

  /* ------------------------------------------------------------ smooth scroll inside the window */
  root.classList.add('js-motion');
  gsap.registerPlugin(ST);
  ST.defaults({ scroller: scroller, invalidateOnRefresh: true }); // function values (paragraph height, window size) are measured again after fonts load or a resize
  var lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ wrapper: scroller, content: scroller.firstElementChild, lerp: .09, smoothWheel: true });
    lenis.on('scroll', ST.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  scroller.setAttribute('tabindex', '-1');
  try { scroller.focus({ preventScroll: true }); } catch (e) {}
  var win = $('.win'), flipping = false;
  function flipTo(y) {
    flipping = true;
    gsap.timeline({ onComplete: function () { flipping = false; gsap.set(win, { clearProps: 'transform,transformPerspective' }); } })
      .to(win, { rotationX: -84, scale: .9, transformPerspective: 1600, transformOrigin: '50% 50%', duration: .55, ease: 'power2.in' })
      .add(function () { if (lenis) lenis.scrollTo(y, { immediate: true, force: true }); else scroller.scrollTop = y; ST.update(); })
      .fromTo(win, { rotationX: 84, scale: .9 }, { rotationX: 0, scale: 1, duration: .9, ease: 'power3.out', immediateRender: false });
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href'), t = id === '#top' ? 0 : $(id);
      if (t === null) return;
      e.preventDefault();
      if (id === '#top' && scroller.scrollTop > scroller.clientHeight * 4) { if (!flipping) flipTo(0); return; }
      if (lenis) lenis.scrollTo(t, { duration: 1.4 }); else scroller.scrollTo({ top: t ? t.offsetTop : 0, behavior: 'smooth' });
    });
  });

  /* ------------------------------------------------------------ helpers */
  function chars(el) {
    var span = el.querySelector('span') || el;
    var txt = span.textContent;
    span.textContent = '';
    var out = [];
    txt.split('').forEach(function (ch) {
      if (ch === ' ') { span.appendChild(document.createTextNode(' ')); return; }
      var s = document.createElement('span'); s.className = 'ch'; s.textContent = ch; span.appendChild(s); out.push(s);
    });
    return out;
  }
  function words(el) {
    var parts = el.textContent.split(/(\s+)/);
    el.textContent = '';
    var out = [];
    parts.forEach(function (p) {
      if (!p) return;
      if (/^\s+$/.test(p)) { el.appendChild(document.createTextNode(p)); return; }
      var s = document.createElement('span'); s.className = 'w'; s.textContent = p; el.appendChild(s); out.push(s);
    });
    return out;
  }
  function fromMiddle(list) { var m = (list.length - 1) / 2; return function (i) { return Math.abs(i - m) / m; }; }
  var U = function () { return scroller.clientWidth / (window.innerWidth <= 760 ? 760 : 1440); };

  /* ------------------------------------------------------------ hero: intro, then dissolve on scroll */
  show();
  var heroChars = chars($('.hero__word'));
  var intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  intro.from('.nav', { y: -24, opacity: 0, duration: 1 }, .1)
    .from(heroChars, { yPercent: 60, opacity: 0, filter: 'blur(14px)', duration: 1.3, stagger: { each: .045, from: 'center' } }, .15)
    .from('.hero__sub', { y: 14, opacity: 0, duration: 1 }, .6)
    .from('.hero__sphere', { scale: .8, opacity: 0, duration: 1.8 }, .2)
    .from('.hero__ph', { y: 220, opacity: 0, rotation: 8, duration: 1.6 }, .35)
    .from('.wait', { x: 40, opacity: 0, duration: 1.1 }, .8);
  var heroOut = gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .4 } });
  // scroll tweens on elements the intro also animates start from explicit values (never from the intro's from-state)
  // the wordmark stays sharp and drifts a little slower than the page; the phone runs ahead (reference parallax)
  heroOut.fromTo('.hero__word', { y: 0 }, { y: function () { return 150 * U(); }, ease: 'none', duration: 1, immediateRender: false }, 0)
    .fromTo('.hero__sub', { y: 0 }, { y: function () { return 120 * U(); }, ease: 'none', duration: 1, immediateRender: false }, 0)
    .fromTo('.hero__ph', { yPercent: 0 }, { yPercent: -36, ease: 'none', duration: 1, immediateRender: false }, 0)
    .fromTo('.wait', { y: 0 }, { y: -90, ease: 'none', duration: 1, immediateRender: false }, 0)
    .fromTo('.hero__sphere', { yPercent: 0, scale: 1, opacity: 1 }, { yPercent: -18, scale: .92, opacity: .4, ease: 'none', duration: 1, immediateRender: false }, 0);
  var nav = $('.nav');
  ST.create({ trigger: '.hero', start: 'top top', end: 'bottom 12%', onToggle: function (s) { nav.classList.toggle('is-light', s.isActive); } });
  nav.classList.add('is-light');
  ST.create({ start: 0, end: 'max', onUpdate: function (s) { nav.style.setProperty('--p', s.progress.toFixed(4)); } });
  // the nav slides away when the footer arrives (reference) and comes back on the way up; GSAP owns its transform
  ST.create({ trigger: '.foot', start: 'top 55%', end: '+=100000', onToggle: function (s) {
    nav.classList.toggle('is-away', s.isActive);
    gsap.to(nav, { y: s.isActive ? -130 * U() : 0, opacity: s.isActive ? 0 : 1, duration: s.isActive ? .5 : .7, ease: 'power3.out', overwrite: 'auto' });
  } });

  /* ------------------------------------------------------------ seed: seven circles gather into the seed of life
     (reference): they scroll in spread out in a hexagon, close in once the stage is pinned until each outer circle
     passes through the centre, then the flower turns slowly and scrolls away with the page. */
  var seedSvg = $('.seed__svg'), seedC = $$('circle', seedSvg), seedR = { r: 270 };
  function seedSet() {
    seedC.forEach(function (c, i) {
      if (!i) { c.setAttribute('cx', 0); c.setAttribute('cy', 0); return; }
      var a = (90 + (i - 1) * 60) * Math.PI / 180;
      c.setAttribute('cx', (Math.cos(a) * seedR.r).toFixed(2)); c.setAttribute('cy', (-Math.sin(a) * seedR.r).toFixed(2));
    });
  }
  seedSet();
  gsap.timeline({ scrollTrigger: { trigger: '.seed', start: 'top bottom', end: 'bottom bottom', scrub: .5 } })
    .fromTo(seedR, { r: 300 }, { r: 236, ease: 'none', duration: .48, onUpdate: seedSet }, 0)
    .to(seedR, { r: 42, ease: 'power2.inOut', duration: .26, onUpdate: seedSet }, .48)
    .fromTo(seedSvg, { rotation: 0 }, { rotation: 40, ease: 'none', duration: .28, immediateRender: false }, .72)
    .set({}, {}, 1);

  /* ------------------------------------------------------------ manifesto */
  var mfLines = $$('.mf__line'), pills = $$('.mf__pill'), glyphs = $$('.glyph');
  var paraWords = words($('.mf__para'));
  var lastLine = $('.mf__line--3');
  gsap.set(pills, { width: 0, marginLeft: function () { return 12 * U(); }, marginRight: function () { return 12 * U(); }, opacity: 0 });
  // the lines rise into place while the section scrolls in (no empty screen between scenes)
  gsap.fromTo(mfLines, { y: function () { return 110 * U(); } }, { y: 0, ease: 'none', stagger: .08, scrollTrigger: { trigger: '.manifesto', start: 'top bottom', end: 'top top', scrub: .5 } });
  gsap.fromTo('.moire--tr, .moire--bl', { opacity: 0 }, { opacity: 1, ease: 'none', scrollTrigger: { trigger: '.manifesto', start: 'top 70%', end: 'top 10%', scrub: .5 } });
  var mf = gsap.timeline({ scrollTrigger: { trigger: '.manifesto', start: 'top top', end: 'bottom bottom', scrub: .6 } });
  mf
    .to(pills, { width: function () { return window.innerWidth <= 760 ? 80 : 162 * U(); }, marginLeft: function () { return window.innerWidth <= 760 ? 17 : 34 * U(); }, marginRight: function () { return window.innerWidth <= 760 ? 15 : 30 * U(); }, opacity: 1, ease: 'power2.inOut', stagger: .03, duration: .16 }, .14)
    .from(glyphs, { scale: .3, opacity: 0, stagger: .03, duration: .12 }, .22)
    .to('.mf__line--1, .mf__line--2, .mf__line--3 > .mf__w:first-child', { opacity: 0, y: function () { return -30 * U(); }, duration: .08 }, .5)
    .to('.moire--tr, .moire--bl', { opacity: 0, duration: .1 }, .5)
    .to(lastLine, {
      // the pill and Reality end at the reference spot; narrow windows keep them inside and below the paragraph
      x: function () { return Math.min(398 * U(), scroller.clientWidth - 20 - (lastLine.offsetLeft + lastLine.offsetWidth)); },
      y: function () { var p = $('.mf__para'); return Math.max(56 * U(), p.offsetTop + p.offsetHeight + 24 * U() - lastLine.offsetTop); },
      ease: 'power2.inOut', duration: .14 }, .52)
    .to('.mf__para', { opacity: 1, duration: .04 }, .56)
    .set({}, {}, 1);
  ST.create({ trigger: '.manifesto', start: 'top top', end: 'bottom bottom', onUpdate: function (s) {
    var p = gsap.utils.clamp(0, 1, (s.progress - .6) / .44), n = Math.round(p * paraWords.length);
    paraWords.forEach(function (w, i) { w.classList.toggle('on', i < n); });
  } });

  /* ------------------------------------------------------------ upgrade your reality + drifting cards */
  var upA = chars($('.up__a')), upB = chars($('.up__b'));
  var cards = $$('.dc');
  var up = gsap.timeline({ scrollTrigger: { trigger: '.upgrade', start: 'top top', end: 'bottom bottom', scrub: .5 } });
  var upIn = { trigger: '.upgrade', start: 'top 92%', end: 'top 8%', scrub: .5 };
  gsap.from(upA, { yPercent: 80, opacity: 0, filter: 'blur(10px)', stagger: .04, ease: 'power3.out', scrollTrigger: upIn });
  gsap.from(upB, { yPercent: 60, opacity: 0, filter: 'blur(10px)', stagger: .05, ease: 'power3.out', scrollTrigger: { trigger: '.upgrade', start: 'top 70%', end: 'top 0%', scrub: .5 } });
  cards.forEach(function (c) {
    var s = parseFloat(getComputedStyle(c).getPropertyValue('--s')) || 1;
    up.fromTo(c, { y: function () { return scroller.clientHeight * 1.1 * s; } }, { y: function () { return -scroller.clientHeight * .78 * s; }, ease: 'none', duration: 1 }, 0);
  });
  up.set({}, {}, 1);
  // the headline leaves with the stage and fades so the next section starts clean
  gsap.to('.up', { opacity: 0, ease: 'none', scrollTrigger: { trigger: '.upgrade', start: 'bottom bottom', end: function () { return '+=' + scroller.clientHeight * .55; }, scrub: .3 } });

  /* ------------------------------------------------------------ features */
  gsap.from('.ft', { y: 50, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: '.feats', start: 'top 70%', once: true } });
  gsap.from('.il__lines path', { strokeDasharray: 400, strokeDashoffset: 400, duration: 2, ease: 'power2.out', scrollTrigger: { trigger: '.feats', start: 'top 55%', once: true } });

  /* ------------------------------------------------------------ stacked cards */
  var counters = $$('[data-count]').map(function (el) { var r = el.dataset.count.split(':'); return { el: el, a: +r[0], b: +r[1] }; });
  var st = gsap.timeline({ scrollTrigger: { trigger: '.stack', start: 'top bottom', end: 'bottom bottom', scrub: .5 } });
  st.fromTo('.sc--a', { scale: .82, y: function () { return 120 * U(); }, borderRadius: function () { return 60 * U(); } }, { scale: 1, y: 0, borderRadius: function () { return 30 * U(); }, ease: 'power2.out', duration: .3 }, 0)
    .fromTo('.phone--card', { y: function () { return 160 * U(); } }, { y: 0, ease: 'power2.out', duration: .32 }, .02)
    .fromTo('.sc--b', { y: function () { return scroller.clientHeight; } }, { y: 0, ease: 'power2.inOut', duration: .3 }, .55)
    .fromTo('.sc--a', { scale: 1, yPercent: 0, filter: 'brightness(1)' }, { scale: .9, yPercent: -9, filter: 'brightness(.5)', ease: 'power2.inOut', duration: .3, immediateRender: false }, .55)
    .fromTo('.dash', { x: function () { return 90 * U(); } }, { x: 0, ease: 'power2.out', duration: .3 }, .6)
    .set({}, {}, 1);
  ST.create({ trigger: '.stack', start: 'top top', end: 'bottom bottom', onUpdate: function (s) {
    var p = gsap.utils.clamp(0, 1, (s.progress - .45) / .55);
    counters.forEach(function (c) { c.el.textContent = Math.round(c.a + (c.b - c.a) * p); });
  } });

  /* ------------------------------------------------------------ wordmark */
  var markChars = chars($('.mark__word'));
  var mk = gsap.timeline({ scrollTrigger: { trigger: '.mark', start: 'top bottom', end: 'bottom top', scrub: .5 } });
  mk.from(markChars, { x: function () { return -60 * U(); }, opacity: 0, filter: 'blur(18px)', stagger: .02, duration: .2, ease: 'power2.out' }, .1)
    .from('.mark__tag', { y: 20, opacity: 0, duration: .12 }, .26)
    .from('.moire--blob', { scale: .7, opacity: 0, duration: .3 }, .05)
    .to(markChars, { y: function () { return -40 * U(); }, opacity: 0, filter: 'blur(16px)', stagger: { each: .015, from: 'center' }, duration: .18, ease: 'power2.in' }, .74)
    .to('.mark__tag', { opacity: 0, duration: .1 }, .74)
    .set({}, {}, 1);

  /* ------------------------------------------------------------ dream card and footer */
  var dr = gsap.timeline({ scrollTrigger: { trigger: '.dream', start: 'top bottom', end: 'top top', scrub: .5 } });
  dr.fromTo('.dream__card', { scaleX: .86, scaleY: .94, opacity: .4 }, { scaleX: 1, scaleY: 1, opacity: 1, ease: 'power2.out', duration: 1 }, 0)
    .fromTo('.dream__ph', { y: function () { return 260 * U(); }, rotation: 10 }, { y: 0, rotation: 0, ease: 'power2.out', duration: 1 }, 0)
    .from('.dream__copy > *', { y: 40, opacity: 0, stagger: .1, duration: .6 }, .3)
    .set({}, {}, 1);
  var footChars = chars($('.foot__word'));
  gsap.from(footChars, { yPercent: 70, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .035, scrollTrigger: { trigger: '.foot', start: 'top 40%', once: true } });
  gsap.from('.foot__top > *, .foot__social li', { y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: .06, scrollTrigger: { trigger: '.foot', start: 'top 70%', once: true } });

  /* ------------------------------------------------------------ hero phone follows the pointer a little */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var hp = $('.hero__ph');
    gsap.set(hp, { transformPerspective: 1400 });
    var rx = gsap.quickTo(hp, 'rotationX', { duration: 1, ease: 'power3' }), ry = gsap.quickTo(hp, 'rotationY', { duration: 1, ease: 'power3' });
    $('.hero').addEventListener('pointermove', function (e) {
      if (e.clientX === 0 && e.clientY === 0) return;
      var r = this.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - .5) * 10);
      rx(((e.clientY - r.top) / r.height - .5) * -8);
    });
    $('.hero').addEventListener('pointerleave', function () { rx(0); ry(0); });
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
  window.addEventListener('resize', function () { ST.refresh(); });
})();
