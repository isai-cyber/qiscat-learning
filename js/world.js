// Mundo 3D: isla flotante estilo Swift Playgrounds construida con Three.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SchrodiCat, textSprite } from './cat.js';

export const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]]; // este, sur, oeste, norte
export const WALKABLE = new Set(['.', 'S', 'F', 'B', 'Q', 'A', 'D']);

const rand = (seed) => { const x = Math.sin(seed * 12.9898) * 43758.5453; return x - Math.floor(x); };

export class World {
  constructor(container) {
    this.container = container;
    this.tweens = [];
    this.clock = new THREE.Clock();
    this.speed = 1;

    const r = this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    r.setPixelRatio(Math.min(devicePixelRatio, 2));
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    container.appendChild(r.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = skyTexture();
    this.scene.fog = new THREE.Fog(0xcfe8fb, 22, 55);

    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
    this.controls = new OrbitControls(this.camera, r.domElement);
    Object.assign(this.controls, {
      enableDamping: true, dampingFactor: 0.08, enablePan: false,
      minDistance: 6, maxDistance: 26, minPolarAngle: 0.35, maxPolarAngle: 1.35,
    });

    this.scene.add(new THREE.HemisphereLight(0xdff2ff, 0x8a6a4a, 1.25));
    const sun = this.sun = new THREE.DirectionalLight(0xfff1d6, 2.2);
    sun.position.set(8, 14, 9);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 50 });
    sun.shadow.bias = -0.0005;
    sun.shadow.radius = 4;
    this.scene.add(sun, sun.target);

    this.waterTex = waterTexture();
    this.fallTex = waterfallTexture();
    this.glowTex = glowTexture();

    this.addScenery();
    this.levelGroup = new THREE.Group();
    this.scene.add(this.levelGroup);

    this.resize();
    new ResizeObserver(() => this.resize()).observe(container);
    r.setAnimationLoop(() => this.frame());
    // Si la pestaña está oculta no hay frames: seguimos avanzando las animaciones sin dibujar
    let last = performance.now();
    setInterval(() => {
      const now = performance.now();
      if (document.hidden) this.stepTweens(Math.min((now - last) / 1000, 1));
      last = now;
    }, 50);
  }

  resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.size) this.fitCamera();
  }

  // Encuadra toda la isla según el tamaño de la pantalla
  fitCamera() {
    const { W, H } = this.size;
    const vf = THREE.MathUtils.degToRad(this.camera.fov) / 2;
    const hf = Math.atan(Math.tan(vf) * this.camera.aspect);
    const span = Math.hypot(W, H) * 0.5;
    const dist = Math.max((span + 1.2) / Math.tan(hf), (H * 0.5 + 3) / Math.tan(vf), 7.5);
    const dir = new THREE.Vector3(0.42, 0.62, 0.66).normalize();
    this.controls.target.set(0, -0.5, 0.2);
    this.camera.position.copy(dir.multiplyScalar(dist)).add(this.controls.target);
    this.controls.maxDistance = Math.max(26, dist * 1.6);
  }

  // ---------- animación ----------
  tween(ms, fn, ease = easeInOut) {
    return new Promise(res => this.tweens.push({ t: 0, ms: ms / this.speed, fn, ease, res }));
  }
  wait(ms) { return this.tween(ms, () => {}); }

  stepTweens(dt) {
    this.tweens = this.tweens.filter(tw => {
      tw.t += dt * 1000;
      const k = Math.min(tw.t / tw.ms, 1);
      tw.fn(tw.ease(k), k);
      if (k >= 1) { tw.res(); return false; }
      return true;
    });
  }

  frame() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;
    this.stepTweens(dt);

    this.waterTex.offset.x = t * 0.08;
    this.fallTex.offset.y = t * 0.9;
    this.bgIslands.forEach((g, i) => { g.position.y = g.userData.y + Math.sin(t * 0.4 + i) * 0.3; });
    this.clouds.forEach(c => { c.position.x += dt * c.userData.v; if (c.position.x > 40) c.position.x = -40; });

    const L = this.L;
    if (L) {
      L.fish.forEach(f => { if (!f.userData.taken) { f.rotation.y = t * 1.5; f.position.y = 0.55 + Math.sin(t * 2 + f.userData.c) * 0.08; } });
      L.qwalls.forEach(q => { q.userData.panel.material.opacity = 0.5 + Math.sin(t * 3) * 0.15; q.userData.tex.offset.y = -t * 0.3; });
      this.cat?.update(t, dt);
      this.twin?.update(t, dt);
      if (this.link) this.updateLink(t);
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  // ---------- escenario de fondo ----------
  addScenery() {
    this.bgIslands = [];
    const spots = [[-16, 1, -18, 1.3], [17, 3, -20, 1.6], [-22, -3, 4, 1], [21, -2, 2, 1.2], [3, 5, -28, 1.8], [-8, -6, 14, 0.9]];
    spots.forEach(([x, y, z, s], i) => {
      const g = new THREE.Group();
      const grass = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.4, 6), new THREE.MeshLambertMaterial({ color: 0x9fc7a8 }));
      const rock = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3, 6), new THREE.MeshLambertMaterial({ color: 0x9fb2c9 }));
      rock.rotation.x = Math.PI; rock.position.y = -1.7;
      const house = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), new THREE.MeshLambertMaterial({ color: 0xb6c6e2 }));
      house.position.set(0.3, 0.6, 0);
      g.add(grass, rock); if (i % 2) g.add(house);
      g.position.set(x, y, z); g.scale.setScalar(s);
      g.userData.y = y;
      this.scene.add(g);
      this.bgIslands.push(g);
    });
    this.clouds = [];
    const cMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
    for (let i = 0; i < 7; i++) {
      const c = new THREE.Group();
      for (let k = 0; k < 4; k++) {
        const s = new THREE.Mesh(new THREE.SphereGeometry(0.8 + rand(i * 7 + k) * 0.6, 12, 10), cMat);
        s.position.set(k * 0.9, rand(i + k) * 0.4, rand(k * 3 + i) * 0.6);
        c.add(s);
      }
      c.position.set(-40 + i * 13, 6 + rand(i) * 6, -10 - rand(i * 2) * 20);
      c.userData.v = 0.3 + rand(i * 5) * 0.4;
      this.scene.add(c);
      this.clouds.push(c);
    }
  }

  // ---------- construir nivel ----------
  build(level) {
    this.levelGroup.clear();
    this.link = null;
    const map = level.map;
    const H = map.length, W = Math.max(...map.map(r => r.length));
    const at = (c, r) => (map[r] && map[r][c]) || ' ';
    this.at = at;
    const ox = (W - 1) / 2, oz = (H - 1) / 2;
    this.toWorld = (c, r) => new THREE.Vector3(c - ox, 0, r - oz);

    const L = this.L = { fish: [], fishAt: {}, doors: {}, qwalls: [], qwallAt: {}, box: null, boxPos: null, start: null, twinPos: null };
    const G = this.levelGroup;

    const grassMat = new THREE.MeshStandardMaterial({ color: 0x7cc75b, roughness: 0.9 });
    const grassDark = new THREE.MeshStandardMaterial({ color: 0x5fae45, roughness: 0.9 });
    const dirtMat = new THREE.MeshStandardMaterial({ color: 0xe0904f, roughness: 1 });
    const dirtBand = new THREE.MeshStandardMaterial({ color: 0xc06f37, roughness: 1 });
    const plankMat = new THREE.MeshStandardMaterial({ color: 0xf0d9a8, roughness: 0.8 });
    const plankMat2 = new THREE.MeshStandardMaterial({ color: 0xe3c58c, roughness: 0.8 });
    const waterMat = new THREE.MeshStandardMaterial({ color: 0x4fb3ff, map: this.waterTex, roughness: 0.2, transparent: true, opacity: 0.92 });
    const fallMat = new THREE.MeshBasicMaterial({ map: this.fallTex, transparent: true, side: THREE.DoubleSide, depthWrite: false });

    const add = (geo, mat, x, y, z, shadow = true) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.castShadow = shadow; m.receiveShadow = true;
      G.add(m);
      return m;
    };

    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
      const ch = at(c, r);
      if (ch === ' ') continue;
      const p = this.toWorld(c, r);
      const seed = c * 31 + r * 17 + level.id.length;
      const depth = 1.2 + rand(seed) * 1.6 + (ch === 'T' ? 0 : 0.6);

      // columna de tierra con capas
      add(new THREE.BoxGeometry(1, depth, 1), dirtMat, p.x, -0.25 - depth / 2, p.z, false);
      add(new THREE.BoxGeometry(1.01, 0.12, 1.01), dirtBand, p.x, -0.55, p.z, false);
      if (depth > 1.8) add(new THREE.BoxGeometry(1.01, 0.1, 1.01), dirtBand, p.x, -1.3, p.z, false);

      if (ch === 'w') {
        add(new THREE.BoxGeometry(1, 0.15, 1), grassDark, p.x, -0.325, p.z);
        const water = add(new THREE.BoxGeometry(1, 0.2, 1), waterMat, p.x, -0.15, p.z, false);
        water.receiveShadow = false;
        DIRS.forEach(([dx, dz]) => {
          if (at(c + dx, r + dz) !== ' ') return;
          const fall = new THREE.Mesh(new THREE.PlaneGeometry(0.9, depth + 0.4), fallMat);
          fall.position.set(p.x + dx * 0.53, -0.05 - (depth + 0.4) / 2, p.z + dz * 0.53);
          fall.rotation.y = Math.atan2(dx, dz);
          G.add(fall);
          const mist = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTex, color: 0xffffff, transparent: true, opacity: 0.6, depthWrite: false }));
          mist.position.set(p.x + dx * 0.6, -depth - 0.2, p.z + dz * 0.6);
          mist.scale.setScalar(1.4);
          G.add(mist);
        });
        continue;
      }

      // tapa de pasto
      add(new THREE.BoxGeometry(1, 0.25, 1), (c + r) % 2 ? grassMat : grassDark, p.x, -0.125, p.z);

      if (WALKABLE.has(ch)) {
        // camino de tablas
        for (let k = -1; k <= 1; k++) {
          const along = (WALKABLE.has(at(c - 1, r)) || WALKABLE.has(at(c + 1, r)));
          const g = along ? new THREE.BoxGeometry(0.3, 0.08, 0.9) : new THREE.BoxGeometry(0.9, 0.08, 0.3);
          add(g, k === 0 ? plankMat2 : plankMat, p.x + (along ? k * 0.31 : 0), 0.04, p.z + (along ? 0 : k * 0.31));
        }
      } else if (ch === '#') {
        this.decorate(G, p, seed);
      }

      if (ch === 'S') L.start = { c, r };
      if (ch === 'F') this.addFish(G, p, c, r);
      if (ch === 'B') this.addBox(G, p, c, r);
      if (ch === 'Q') this.addQWall(G, p, c, r);
      if (ch === 'A' || ch === 'D') this.addDoor(G, p, c, r, ch);
      if (ch === 'T') L.twinPos = { c, r };
    }

    // gatos
    this.cat = new SchrodiCat();
    G.add(this.cat.group);
    this.twin = null;
    if (L.twinPos) {
      this.twin = new SchrodiCat({ body: 0xb9b2e6, stripe: 0x8a80c9, eye: 0x13c4a3 });
      const tp = this.toWorld(L.twinPos.c, L.twinPos.r);
      this.twin.group.position.copy(tp).setY(0.0);
      this.twin.rig.rotation.y = Math.PI;
      G.add(this.twin.group);
      this.addBox(G, tp, -1, -1, true);
      const name = textSprite('Qubita', { size: 40, color: '#5a4fb0', bg: 'rgba(255,255,255,.9)', scale: 0.32 });
      name.position.copy(tp).setY(1.5);
      G.add(name);
    }

    // cámara
    this.size = { W, H };
    this.fitCamera();
    this.sun.target.position.set(0, 0, 0);
  }

  decorate(G, p, seed) {
    const k = rand(seed * 3.1);
    if (k < 0.35) {
      // arbusto
      const m = new THREE.MeshStandardMaterial({ color: 0x3f9b3a, roughness: 0.9 });
      [[0, 0.25, 0, 0.28], [0.18, 0.2, 0.1, 0.2], [-0.15, 0.18, -0.08, 0.18]].forEach(([x, y, z, r]) => {
        const b = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), m);
        b.position.set(p.x + x, y, p.z + z); b.castShadow = true; G.add(b);
      });
    } else if (k < 0.55) {
      // roca
      const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28), new THREE.MeshStandardMaterial({ color: 0xa9aeb8, roughness: 1, flatShading: true }));
      r.position.set(p.x, 0.15, p.z); r.scale.y = 0.7; r.rotation.y = seed; r.castShadow = true; G.add(r);
    } else if (k < 0.72) {
      // árbol
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.5), new THREE.MeshStandardMaterial({ color: 0x8b5a2b }));
      trunk.position.set(p.x, 0.25, p.z); trunk.castShadow = true; G.add(trunk);
      const top = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.8, 7), new THREE.MeshStandardMaterial({ color: 0x2f8f4e, flatShading: true }));
      top.position.set(p.x, 0.85, p.z); top.castShadow = true; G.add(top);
    } else {
      // flores
      const cols = [0xff6b9a, 0xffd23f, 0xffffff, 0xb388ff];
      for (let i = 0; i < 4; i++) {
        const f = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), new THREE.MeshStandardMaterial({ color: cols[(seed + i) % 4] }));
        f.position.set(p.x + (rand(seed + i) - 0.5) * 0.7, 0.06, p.z + (rand(seed * 2 + i) - 0.5) * 0.7);
        G.add(f);
      }
    }
  }

  addFish(G, p, c, r) {
    const f = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0xff7f50, emissive: 0xff5a1f, emissiveIntensity: 0.35, roughness: 0.3, metalness: 0.2 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), mat);
    body.scale.set(1.3, 0.75, 0.45);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.2, 4), mat);
    tail.rotation.z = Math.PI / 2; tail.position.x = -0.32;
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), new THREE.MeshBasicMaterial({ color: 0x222222 }));
    eye.position.set(0.15, 0.04, 0.08);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTex, color: 0xffb36b, transparent: true, opacity: 0.7, depthWrite: false }));
    glow.scale.setScalar(1.1);
    [body, tail].forEach(m => m.castShadow = true);
    f.add(body, tail, eye, glow);
    f.position.set(p.x, 0.55, p.z);
    f.userData = { c: c + r, key: `${c},${r}`, taken: false };
    G.add(f);
    this.L.fish.push(f);
    this.L.fishAt[`${c},${r}`] = f;
  }

  addBox(G, p, c, r, isTwin = false) {
    const mat = new THREE.MeshStandardMaterial({ color: 0xc8955a, roughness: 0.95 });
    const tape = new THREE.MeshStandardMaterial({ color: 0xe8c48a });
    const g = new THREE.Group();
    const s = 0.84, h = 0.5, t = 0.04;
    [[0, h / 2, s / 2, s, h, t], [0, h / 2, -s / 2, s, h, t], [s / 2, h / 2, 0, t, h, s], [-s / 2, h / 2, 0, t, h, s]].forEach(([x, y, z, w, hh, d]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), mat);
      m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m);
    });
    // solapas abiertas (con bisagra)
    const flaps = [];
    [[0, s / 2, 0], [0, -s / 2, Math.PI], [s / 2, 0, Math.PI / 2], [-s / 2, 0, -Math.PI / 2]].forEach(([x, z, ry]) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, h, z);
      pivot.rotation.y = ry;
      const flap = new THREE.Mesh(new THREE.BoxGeometry(s, 0.03, s / 2), mat);
      flap.position.z = s / 4;
      flap.castShadow = true;
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.035, s / 2), tape);
      strip.position.z = s / 4;
      pivot.add(flap, strip);
      pivot.rotation.x = -1.1; // abierta hacia afuera
      g.add(pivot);
      flaps.push(pivot);
    });
    const label = textSprite('📦 ψ', { size: 44, scale: 0.28 });
    label.position.set(0, 1.25, 0);
    if (!isTwin) g.add(label);
    g.position.set(p.x, 0.05, p.z);
    g.userData.flaps = flaps;
    G.add(g);
    if (isTwin) this.L.twinBox = g; else { this.L.box = g; this.L.boxPos = { c, r }; }
  }

  axisAlong(c, r) {
    // true si el camino corre de este a oeste en esta casilla
    return WALKABLE.has(this.at(c - 1, r)) || WALKABLE.has(this.at(c + 1, r));
  }

  addQWall(G, p, c, r) {
    const tex = qwallTexture();
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.3), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    const g = new THREE.Group();
    panel.position.y = 0.7;
    g.add(panel);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x5b3fa8, roughness: 0.4 });
    const orbMat = new THREE.MeshBasicMaterial({ color: 0xe0c3ff });
    [-0.5, 0.5].forEach(x => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.4, 0.14), postMat);
      post.position.set(x, 0.7, 0); post.castShadow = true;
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), orbMat);
      orb.position.set(x, 1.48, 0);
      g.add(post, orb);
    });
    const sign = textSprite('⚛️', { size: 56, scale: 0.35 });
    sign.position.y = 1.75;
    g.add(sign);
    g.position.set(p.x, 0, p.z);
    g.rotation.y = this.axisAlong(c, r) ? Math.PI / 2 : 0;
    g.userData = { panel, tex };
    G.add(g);
    this.L.qwalls.push(g);
    this.L.qwallAt[`${c},${r}`] = g;
  }

  addDoor(G, p, c, r, ch) {
    const sunDoor = ch === 'A';
    const g = new THREE.Group();
    const postMat = new THREE.MeshStandardMaterial({ color: 0xb8b2a6, roughness: 0.9, flatShading: true });
    [-0.48, 0.48].forEach(x => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.3, 0.2), postMat);
      post.position.set(x, 0.65, 0); post.castShadow = true; g.add(post);
    });
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.16, 0.24), postMat);
    lintel.position.y = 1.36; lintel.castShadow = true; g.add(lintel);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.82, 1.2, 0.08),
      new THREE.MeshStandardMaterial({ color: sunDoor ? 0xffc93c : 0x3d4fa8, roughness: 0.5, emissive: sunDoor ? 0x6b4a00 : 0x0b1340, emissiveIntensity: 0.4 }));
    panel.position.y = 0.62; panel.castShadow = true;
    g.add(panel);
    const icon = textSprite(sunDoor ? '☀️😺' : '🌙😴', { size: 56, scale: 0.34, bg: 'rgba(255,255,255,.85)' });
    icon.position.y = 1.72;
    g.add(icon);
    g.position.set(p.x, 0, p.z);
    g.rotation.y = this.axisAlong(c, r) ? Math.PI / 2 : 0;
    g.userData = { panel, open: false, need: sunDoor ? 1 : 0 };
    G.add(g);
    this.L.doors[`${c},${r}`] = g;
  }

  // ---------- acciones visuales ----------
  placeCat(c, r, dir) {
    const p = this.toWorld(c, r);
    this.cat.group.position.set(p.x, 0.04, p.z);
    this.cat.group.rotation.set(0, 0, 0);
    this.cat.group.visible = true;
    this.cat.rig.rotation.y = dirAngle(dir);
  }

  async moveCat(from, to, { bump = false, fall = false } = {}) {
    const a = this.toWorld(from.c, from.r), b = this.toWorld(to.c, to.r);
    const g = this.cat.group;
    this.cat.walking = true;
    if (bump) {
      await this.tween(220, k => g.position.lerpVectors(a, b, k * 0.35).setY(0.04));
      await this.tween(260, k => g.position.lerpVectors(a, b, (1 - k) * 0.35).setY(0.04));
      this.cat.walking = false;
      return;
    }
    await this.tween(450, k => g.position.lerpVectors(a, b, k).setY(0.04 + Math.sin(k * Math.PI) * 0.06));
    if (fall) {
      await this.tween(900, k => { g.position.y = 0.04 - k * k * 8; g.rotation.x = k * 2; }, linear);
      g.visible = false;
    }
    this.cat.walking = false;
  }

  async turnCat(fromDir, toDir) {
    const a = dirAngle(fromDir);
    let b = dirAngle(toDir);
    while (b - a > Math.PI) b -= Math.PI * 2;
    while (b - a < -Math.PI) b += Math.PI * 2;
    await this.tween(300, k => { this.cat.rig.rotation.y = a + (b - a) * k; });
  }

  async collectFish(f) {
    f.userData.taken = true;
    const y0 = f.position.y;
    await this.tween(450, k => {
      f.position.y = y0 + k * 1.2;
      f.scale.setScalar(1 + k * 0.6 - k * k * 1.6);
      f.rotation.y += 0.4;
    });
    f.visible = false;
  }

  async setDoor(key, open) {
    const d = this.L.doors[key];
    if (!d || d.userData.open === open) return;
    d.userData.open = open;
    const p = d.userData.panel;
    const y0 = p.position.y, y1 = open ? -0.62 : 0.62;
    await this.tween(380, k => { p.position.y = y0 + (y1 - y0) * k; });
  }

  async rippleQWall(key) {
    const q = this.L.qwallAt[key];
    if (!q) return;
    await this.tween(500, k => { q.userData.panel.scale.set(1 + Math.sin(k * Math.PI) * 0.15, 1 + Math.sin(k * Math.PI * 2) * 0.05, 1); });
  }

  async gateFx(color = 0xb388ff) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.04, 8, 40), new THREE.MeshBasicMaterial({ color, transparent: true }));
    ring.rotation.x = Math.PI / 2;
    ring.position.copy(this.cat.group.position).setY(0.15);
    this.levelGroup.add(ring);
    await this.tween(500, k => { ring.scale.setScalar(1 + k * 1.5); ring.position.y = 0.15 + k * 0.8; ring.material.opacity = 1 - k; });
    this.levelGroup.remove(ring);
  }

  async closeBoxAndOpen(box) {
    if (!box) return;
    const flaps = box.userData.flaps;
    await this.tween(350, k => flaps.forEach((f, i) => { f.rotation.x = -1.1 - k * (2.0 - i * 0.02); }));
    // la caja tiembla
    await this.tween(500, (k, raw) => { box.rotation.z = Math.sin(raw * 30) * 0.08 * (1 - raw); }, linear);
    await this.tween(300, k => flaps.forEach((f, i) => { f.rotation.x = -(3.1 - i * 0.02) + k * (2.0 - i * 0.02); }));
  }

  hideCatsInBoxes(hidden) {
    // durante la medición el gato queda dentro de la caja cerrada
    this.cat.rig.visible = !hidden;
    if (this.twin) this.twin.rig.visible = !hidden;
  }

  async flash(pos) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTex, color: 0xfff6c2, transparent: true, depthWrite: false }));
    s.position.copy(pos).setY(0.8);
    this.levelGroup.add(s);
    await this.tween(450, k => { s.scale.setScalar(0.5 + k * 3.5); s.material.opacity = 1 - k; });
    this.levelGroup.remove(s);
  }

  popLabel(text, pos, color = '#3b2a7a') {
    const s = textSprite(text, { size: 44, color, bg: 'rgba(255,255,255,.95)', scale: 0.38 });
    s.position.copy(pos).setY(1.4);
    this.levelGroup.add(s);
    this.tween(1800, k => { s.position.y = 1.4 + k * 0.6; s.material.opacity = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3; }, linear)
      .then(() => this.levelGroup.remove(s));
  }

  // hilo de entrelazamiento entre los dos gatos
  setLink(on) {
    if (!this.twin) return;
    if (on && !this.link) {
      const g = new THREE.Group();
      const mat = new THREE.MeshBasicMaterial({ color: 0xff7ad9, transparent: true, opacity: 0.9 });
      for (let i = 0; i < 18; i++) g.add(new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), mat));
      this.levelGroup.add(g);
      this.link = g;
    } else if (!on && this.link) {
      this.levelGroup.remove(this.link);
      this.link = null;
    }
  }
  updateLink(t) {
    const a = this.cat.group.position.clone().setY(0.7);
    const b = this.twin.group.position.clone().setY(0.7);
    const mid = a.clone().add(b).multiplyScalar(0.5).setY(2.2);
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const n = this.link.children.length;
    this.link.children.forEach((s, i) => {
      const u = ((i / n) + t * 0.25) % 1;
      s.position.copy(curve.getPoint(u));
      s.scale.setScalar(0.7 + Math.sin(u * Math.PI) * 0.6);
    });
  }
}

export function dirAngle(d) { const [dx, dz] = DIRS[d]; return Math.atan2(dx, dz); }
const easeInOut = k => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
const linear = k => k;

// ---------- texturas generadas ----------
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function skyTexture() {
  return canvasTex(4, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#7cc4f2'); g.addColorStop(0.6, '#bfe3fb'); g.addColorStop(1, '#eaf7ff');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });
}
function waterTexture() {
  const t = canvasTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#3aa6f5'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) { ctx.beginPath(); const y = i * 22 + 8; ctx.moveTo(0, y); ctx.bezierCurveTo(40, y - 8, 80, y + 8, 128, y); ctx.stroke(); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function waterfallTexture() {
  const t = canvasTex(64, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(80,180,255,1)'); g.addColorStop(0.85, 'rgba(120,200,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    for (let i = 0; i < 40; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 10 + Math.random() * 30);
  });
  t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping;
  return t;
}
function glowTexture() {
  return canvasTex(128, 128, (ctx, w) => {
    const g = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, w);
  });
}
function qwallTexture() {
  const t = canvasTex(128, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#a35bff'); g.addColorStop(0.5, '#6a3cff'); g.addColorStop(1, '#ff6fd8');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,.8)';
    for (let i = 0; i < 50; i++) { ctx.beginPath(); ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 2.5 + 0.5, 0, 7); ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2;
    for (let y = 0; y < h; y += 16) { ctx.beginPath(); ctx.moveTo(0, y); ctx.quadraticCurveTo(w / 2, y + 8, w, y); ctx.stroke(); }
  });
  t.wrapT = THREE.RepeatWrapping;
  return t;
}
