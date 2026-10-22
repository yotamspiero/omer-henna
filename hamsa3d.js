/* Gold 3D hamsa — Three.js r128 (global THREE).
   Usage: OmerHamsa.mount(element)  → renders a rotating gold hamsa into the element. */
(function () {
  "use strict";

  /* ---------- outline (SVG-style coords: x 0..200, y grows downward, centre x = 100) ---------- */
  // right half, from top of middle finger clockwise to bottom centre. Each seg = cubic [c1, c2, end] or line [end].
  var RIGHT = [
    [[110, 6], [116, 13], [116, 26]],        // middle finger top
    [[116, 34]],                             // notch
    [[116, 27], [122, 22], [132, 22]],       // ring finger top
    [[142, 22], [148, 28], [148, 38]],
    [[148, 106]],                            // finger outer edge
    [[162, 109], [180, 103], [190, 102]],    // thumb out to tip
    [[200, 101], [196, 114], [184, 122]],    // rounded tip
    [[170, 131], [163, 138], [161, 150]],    // thumb curls back
    [[158, 192], [142, 233], [100, 233]]     // palm to bottom
  ];
  var START = [100, 6];

  function m(p) { return [200 - p[0], p[1]]; }

  function outlinePath(Ctor, tx) {
    var P = new Ctor();
    var s = tx(START); P.moveTo(s[0], s[1]);
    var pts = [START];
    RIGHT.forEach(function (seg) {
      if (seg.length === 3) { var a = tx(seg[0]), b = tx(seg[1]), c = tx(seg[2]); P.bezierCurveTo(a[0], a[1], b[0], b[1], c[0], c[1]); }
      else { var e = tx(seg[0]); P.lineTo(e[0], e[1]); }
      pts.push(seg[seg.length - 1]);
    });
    for (var i = RIGHT.length - 1; i >= 0; i--) {
      var seg2 = RIGHT[i], prev = pts[i];
      if (seg2.length === 3) {
        var a2 = tx(m(seg2[1])), b2 = tx(m(seg2[0])), c2 = tx(m(prev));
        P.bezierCurveTo(a2[0], a2[1], b2[0], b2[1], c2[0], c2[1]);
      } else { var e2 = tx(m(prev)); P.lineTo(e2[0], e2[1]); }
    }
    return P;
  }

  var CY = 122; // vertical centre
  function T(p) { return [p[0] - 100, CY - p[1]]; }

  function mount(host, opts) {
    if (!window.THREE) return false;
    var THREE = window.THREE;
    var canvas = document.createElement("canvas");
    var gl;
    try { gl = canvas.getContext("webgl", { alpha: true, antialias: true, preserveDrawingBuffer: !!window.__pdb }) || canvas.getContext("experimental-webgl"); } catch (e) { gl = null; }
    if (!gl) return false;

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, context: gl, alpha: true, antialias: true, preserveDrawingBuffer: !!window.__pdb });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(0x000000, 0);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(28, 200 / 240, 1, 2000);
    camera.position.set(0, 0, 560);

    /* ----- warm studio environment for metal reflections ----- */
    var envCanvas = document.createElement("canvas");
    envCanvas.width = 512; envCanvas.height = 256;
    var c = envCanvas.getContext("2d");
    var g = c.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, "#fff6e6"); g.addColorStop(0.3, "#d9bf98"); g.addColorStop(0.5, "#6e5136"); g.addColorStop(1, "#1e140c");
    c.fillStyle = g; c.fillRect(0, 0, 512, 256);
    c.fillStyle = "rgba(255,255,255,.95)";
    c.fillRect(40, 40, 70, 90); c.fillRect(300, 30, 120, 50); c.fillRect(200, 110, 40, 30);
    c.fillStyle = "rgba(255,240,215,.7)"; c.fillRect(440, 70, 50, 100);
    var envTex = new THREE.CanvasTexture(envCanvas);
    envTex.mapping = THREE.EquirectangularReflectionMapping;
    envTex.encoding = THREE.sRGBEncoding;
    var pmrem = new THREE.PMREMGenerator(renderer);
    var envMap = pmrem.fromEquirectangular(envTex).texture;
    envTex.dispose(); pmrem.dispose();

    var gold = new THREE.MeshStandardMaterial({ color: 0xc8995a, metalness: 1, roughness: 0.34, envMap: envMap, envMapIntensity: 1.1 });

    scene.add(new THREE.AmbientLight(0xfff3e0, 0.35));
    var key = new THREE.DirectionalLight(0xfff1dc, 1.2); key.position.set(-160, 220, 320); scene.add(key);
    var rim = new THREE.DirectionalLight(0xffe0b0, 0.7); rim.position.set(260, -60, -120); scene.add(rim);

    /* ----- body ----- */
    var DEPTH = 13, BEV = 2.6;
    var bodyGeo = new THREE.ExtrudeGeometry(outlinePath(THREE.Shape, T), {
      depth: DEPTH, bevelEnabled: true, bevelThickness: BEV, bevelSize: BEV, bevelSegments: 4, curveSegments: 24
    });
    bodyGeo.translate(0, 0, -DEPTH / 2);
    var hamsa = new THREE.Group();
    hamsa.add(new THREE.Mesh(bodyGeo, gold));
    var FACE = DEPTH / 2 + BEV; // z of front face

    /* ----- relief ornaments (built once, placed on both faces) ----- */
    var orn = new THREE.Group();
    var R = 1.9; // tube radius
    function v(p) { var t = T(p); return new THREE.Vector3(t[0], t[1], 0); }
    function tube(points, closed, r) {
      var curve = new THREE.CatmullRomCurve3(points, !!closed, "centripetal");
      var segs = Math.min(closed ? 260 : 120, Math.max(16, Math.round(curve.getLength() / 2.2)));
      var geo = new THREE.TubeGeometry(curve, segs, r || R, 7, !!closed);
      orn.add(new THREE.Mesh(geo, gold));
    }
    function pathPts(builder, n) {
      var P = new THREE.Path(); builder(P);
      return P.getSpacedPoints(n || 80).map(function (p) { return new THREE.Vector3(p.x, p.y, 0); });
    }
    function T2(x, y) { return T([x, y]); }
    function dot(x, y, r) {
      var s = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), gold);
      var t = T([x, y]); s.position.set(t[0], t[1], 0); s.scale.z = 0.7; orn.add(s);
    }

    // inner rim line: inward offset of the outline
    (function () {
      var pts = outlinePath(THREE.Path, T).getSpacedPoints(300);
      pts.pop();
      var n = pts.length, area = 0, i;
      for (i = 0; i < n; i++) { var a = pts[i], b = pts[(i + 1) % n]; area += a.x * b.y - b.x * a.y; }
      var sign = area > 0 ? 1 : -1, d = 7.5, out = [];
      for (i = 0; i < n; i++) {
        var p0 = pts[(i - 3 + n) % n], p1 = pts[(i + 3) % n];
        var tx = p1.x - p0.x, ty = p1.y - p0.y, L = Math.hypot(tx, ty) || 1;
        out.push(new THREE.Vector3(pts[i].x + (-ty / L) * d * sign, pts[i].y + (tx / L) * d * sign, 0));
      }
      // drop points that collapsed into notches (closer than d to original outline)
      var clean = out.filter(function (q) {
        for (var k = 0; k < n; k += 2) if (Math.hypot(q.x - pts[k].x, q.y - pts[k].y) < d * 0.8) return false;
        return true;
      }).filter(function (q, k, arr) { return k === 0 || q.distanceTo(arr[k - 1]) > 0.8; });
      tube(clean, true, 1.9);
    })();

    // finger arches (U shapes) with dot columns
    function fingerU(cx, half, topY, bottomY) {
      tube(pathPts(function (P) {
        var a = T2(cx - half, bottomY), b = T2(cx - half, topY + half), c = T2(cx + half, topY + half), e = T2(cx + half, bottomY);
        P.moveTo(a[0], a[1]); P.lineTo(b[0], b[1]);
        P.absarc(T2(cx, topY + half)[0], T2(cx, topY + half)[1], half, Math.PI, 0, true);
        P.lineTo(e[0], e[1]);
        void c;
      }, 90));
    }
    fingerU(100, 9.5, 20, 92);
    fingerU(132, 8, 35, 92);
    fingerU(68, 8, 35, 92);
    function dotCol(cx, y0, y1, count) {
      for (var k = 0; k < count; k++) {
        var t = count === 1 ? 1 : k / (count - 1);
        dot(cx, y0 + (y1 - y0) * t, 2.6 + 1.6 * t);
      }
    }
    dotCol(100, 33, 86, 7);
    dotCol(132, 47, 86, 5);
    dotCol(68, 47, 86, 5);

    // eye
    var EY = 118;
    tube(pathPts(function (P) {
      var l = T2(68, EY), r = T2(132, EY);
      P.moveTo(l[0], l[1]);
      P.quadraticCurveTo(T2(100, EY - 30)[0], T2(100, EY - 30)[1], r[0], r[1]);
      P.quadraticCurveTo(T2(100, EY + 30)[0], T2(100, EY + 30)[1], l[0], l[1]);
    }, 120), true, 2.1);
    tube(pathPts(function (P) {
      var l = T2(62, EY + 6), r = T2(138, EY + 6);
      P.moveTo(l[0], l[1]); P.quadraticCurveTo(T2(100, EY + 44)[0], T2(100, EY + 44)[1], r[0], r[1]);
    }, 80));
    (function () {
      var iris = new THREE.Mesh(new THREE.CylinderGeometry(10.5, 11.5, 3.2, 48), gold);
      iris.rotation.x = Math.PI / 2; var t = T2(100, EY + 1); iris.position.set(t[0], t[1], 0.6); orn.add(iris);
      var pupil = new THREE.Mesh(new THREE.TorusGeometry(4, 1.1, 10, 32), gold);
      pupil.position.set(t[0] + 2.5, t[1] + 2.5, 2.6); orn.add(pupil);
    })();

    // spirals
    function spiral(cx, cy, dir, turns, r0, r1) {
      var pts = [], N = 70;
      for (var k = 0; k <= N; k++) {
        var tt = k / N, ang = dir * tt * turns * Math.PI * 2, r = r0 + (r1 - r0) * tt;
        var t = T2(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
        pts.push(new THREE.Vector3(t[0], t[1], 0));
      }
      tube(pts, false, 1.7);
    }
    spiral(52, 114, -1, 1.2, 1.5, 6.5);
    spiral(148, 114, 1, 1.2, 1.5, 6.5);
    spiral(48, 156, -1, 1.2, 1.5, 6.5);
    spiral(152, 156, 1, 1.2, 1.5, 6.5);

    // paisley drops with crowns of dots
    function drop(cx, top, bottom, w) {
      tube(pathPts(function (P) {
        var a = T2(cx, top);
        P.moveTo(a[0], a[1]);
        P.bezierCurveTo(T2(cx + w * 0.4, top + 10)[0], T2(cx + w * 0.4, top + 10)[1], T2(cx + w, bottom - 14)[0], T2(cx + w, bottom - 14)[1], T2(cx + w * 0.6, bottom - 3)[0], T2(cx + w * 0.6, bottom - 3)[1]);
        P.quadraticCurveTo(T2(cx, bottom + 4)[0], T2(cx, bottom + 4)[1], T2(cx - w * 0.6, bottom - 3)[0], T2(cx - w * 0.6, bottom - 3)[1]);
        P.bezierCurveTo(T2(cx - w, bottom - 14)[0], T2(cx - w, bottom - 14)[1], T2(cx - w * 0.4, top + 10)[0], T2(cx - w * 0.4, top + 10)[1], a[0], a[1]);
      }, 110), true);
    }
    [80, 120].forEach(function (cx) {
      drop(cx, 148, 184, 15);
      drop(cx, 162, 180, 7.5);
      dot(cx, 175, 2.4);
      for (var k = -2; k <= 2; k++) if (k !== 0) dot(cx + k * 8.5, 148 + Math.abs(k) * 8 - 2, 1.6);
    });

    // star
    (function () {
      var s = new THREE.Shape(), t = T2(100, 156);
      for (var k = 0; k < 10; k++) {
        var ang = Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 2.4 : 6;
        var x = t[0] + Math.cos(ang) * r, y = t[1] + Math.sin(ang) * r;
        if (k === 0) s.moveTo(x, y); else s.lineTo(x, y);
      }
      var geo = new THREE.ExtrudeGeometry(s, { depth: 1.6, bevelEnabled: true, bevelThickness: 0.6, bevelSize: 0.5, bevelSegments: 2 });
      orn.add(new THREE.Mesh(geo, gold));
    })();

    // bands
    function hline(y, x0, x1) { tube([new THREE.Vector3(T2(x0, y)[0], T2(x0, y)[1], 0), new THREE.Vector3(T2(x1, y)[0], T2(x1, y)[1], 0)], false); }
    hline(190, 50, 150);
    for (var k = 0; k < 11; k++) dot(60 + k * 8, 200, 2.8);
    hline(210, 60, 140);
    tube(pathPts(function (P) {
      var a = T2(78, 218); P.moveTo(a[0], a[1]);
      P.quadraticCurveTo(T2(100, 222)[0], T2(100, 222)[1], T2(122, 218)[0], T2(122, 218)[1]);
    }, 40));

    orn.position.z = FACE;
    hamsa.add(orn);
    var back = orn.clone(); back.rotation.y = Math.PI; back.position.z = -FACE;
    hamsa.add(back);

    var pivot = new THREE.Group();
    pivot.add(hamsa);
    pivot.rotation.x = -0.08;
    scene.add(pivot);

    /* ----- controlled mode: the page drives pose and render loop (stage version) ----- */
    if (opts && opts.controlled) {
      host.appendChild(canvas);
      canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
      camera.fov = 30; camera.position.set(0, 0, 900);
      var api = {
        THREE: THREE, renderer: renderer, scene: scene, camera: camera, hamsa: hamsa, pivot: pivot, gold: gold,
        size: function () {
          var w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
          renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
        },
        /* world units visible at z=0 */
        view: function () { var H = 2 * camera.position.z * Math.tan(camera.fov * Math.PI / 360); return { h: H, w: H * camera.aspect }; },
        render: function () { renderer.render(scene, camera); }
      };
      api.size();
      host.classList.add("is-3d");
      return api;
    }

    /* ----- size + loop ----- */
    host.appendChild(canvas);
    canvas.style.cssText = "position:absolute;inset:-12%;width:124%;height:124%;display:block";
    function size() {
      var w = host.clientWidth * 1.24, h = host.clientHeight * 1.24;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    size();
    window.addEventListener("resize", size);

    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var visible = true, t0 = performance.now(), raf = 0;
    function frame(now) {
      raf = 0;
      var t = (now - t0) / 1000;
      if (reduce) { hamsa.rotation.y = -0.45; }
      else {
        hamsa.rotation.y = t * 0.55;
        pivot.position.y = Math.sin(t * 1.1) * 3;
      }
      renderer.render(scene, camera);
      if (visible && !reduce && !document.hidden) raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf && visible) raf = requestAnimationFrame(frame); }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) { size(); kick(); } }).observe(host);
    }
    document.addEventListener("visibilitychange", kick);
    host._hamsaKick = function () { size(); kick(); };
    kick();
    host.classList.add("is-3d");
    return true;
  }

  window.OmerHamsa = { mount: mount };
})();
