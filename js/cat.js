// Modelo del gato de Schrödinger.
// Derivado del gato de bloques de CatCode (src/game/catModel.js, MIT © Craig Dsouza),
// con dos “versiones” superpuestas: 😺 despierto y 😴 dormido (con gorrito de dormir).
import * as THREE from 'three';

export function textSprite(text, { size = 64, color = '#fff', bg = null, scale = 0.6, font = 'Fredoka, sans-serif', weight = 700, pad = 18 } = {}) {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  ctx.font = `${weight} ${size}px ${font}`;
  const w = Math.ceil(ctx.measureText(text).width) + pad * 2;
  const h = size + pad * 2;
  c.width = w; c.height = h;
  ctx.font = `${weight} ${size}px ${font}`;
  if (bg) {
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.roundRect(2, 2, w - 4, h - 4, h / 2.4); ctx.fill();
  }
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(text, w / 2, h / 2 + size * 0.04);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const s = new THREE.Sprite(mat);
  s.scale.set(scale * (w / h), scale, 1);
  return s;
}

function buildCatMesh({ body, stripe, eye, sleeping }) {
  const Cat = new THREE.Group();
  const mats = [];
  const M = (color, opts = {}) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness: 0.55, transparent: true, ...opts });
    mats.push(m);
    return m;
  };
  const bodyMat = M(body);
  const stripeMat = M(stripe);
  const whiteMat = M(0xfff7ec);
  const pinkMat = M(0xff8fab);
  const darkMat = M(0x2b2233);
  const eyeMat = M(eye, { emissive: eye, emissiveIntensity: 0.5 });

  const box = (w, h, d, mat, x, y, z, parent = Cat) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    parent.add(m);
    return m;
  };

  // Cuerpo + rayas + pecho
  box(0.6, 0.6, 1.2, bodyMat, 0, 0.6, 0);
  [-0.3, 0, 0.3].forEach(z => box(0.62, 0.08, 0.12, stripeMat, 0, 0.88, z));
  box(0.44, 0.4, 0.04, whiteMat, 0, 0.55, 0.61);

  // Cabeza
  const head = new THREE.Group();
  head.position.set(0, 1.0, 0.7);
  Cat.add(head);
  box(0.56, 0.48, 0.5, bodyMat, 0, 0, 0, head);
  box(0.3, 0.16, 0.08, whiteMat, 0, -0.12, 0.27, head);   // hocico
  box(0.08, 0.06, 0.04, pinkMat, 0, -0.06, 0.32, head);    // nariz

  const earGeo = new THREE.ConeGeometry(0.11, 0.26, 4);
  [-1, 1].forEach(s => {
    const ear = new THREE.Mesh(earGeo, bodyMat);
    ear.position.set(0.18 * s, 0.33, 0);
    ear.rotation.set(0, 0.2 * s, -0.3 * s);
    if (sleeping) ear.rotation.z = -0.7 * s;
    head.add(ear);
  });

  if (sleeping) {
    // ojos cerrados (rayitas) + gorrito de dormir
    [-1, 1].forEach(s => box(0.13, 0.025, 0.02, darkMat, 0.13 * s, 0.04, 0.26, head));
    const capMat = M(0x5b7cfa);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 12), capMat);
    cap.position.set(0.05, 0.42, -0.02);
    cap.rotation.z = -0.5;
    head.add(cap);
    const pom = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), whiteMat);
    pom.position.set(0.25, 0.6, -0.02);
    head.add(pom);
    head.rotation.x = 0.28;
  } else {
    // ojos grandes con brillo
    [-1, 1].forEach(s => {
      box(0.13, 0.13, 0.02, whiteMat, 0.13 * s, 0.05, 0.26, head);
      box(0.07, 0.1, 0.02, eyeMat, 0.13 * s, 0.04, 0.272, head);
    });
  }

  // Cola segmentada (igual que CatCode)
  const tailRoot = new THREE.Group();
  tailRoot.position.set(0, 0.8, -0.6);
  Cat.add(tailRoot);
  const tail = [];
  for (let i = 0; i < 5; i++) {
    const pivot = new THREE.Group();
    pivot.position.set(0, 0, i === 0 ? 0 : -0.2);
    (i === 0 ? tailRoot : tail[i - 1]).add(pivot);
    const seg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.25), i === 4 ? stripeMat : bodyMat);
    seg.position.z = -0.12;
    pivot.add(seg);
    pivot.rotation.x = -0.25;
    tail.push(pivot);
  }

  // Patas
  const legs = [];
  [[-0.2, 0.6, 0.4], [0.2, 0.6, 0.4], [-0.2, 0.6, -0.4], [0.2, 0.6, -0.4]].forEach(p => {
    const pivot = new THREE.Group();
    pivot.position.set(...p);
    box(0.15, 0.6, 0.15, bodyMat, 0, -0.3, 0, pivot);
    Cat.add(pivot);
    legs.push(pivot);
  });

  if (sleeping) {
    const z = textSprite('Zzz', { color: '#5b7cfa', size: 48, scale: 0.35 });
    z.position.set(0.4, 1.7, 0.5);
    Cat.add(z);
    Cat.userData.zzz = z;
    mats.push(z.material);
  }

  Cat.userData = { ...Cat.userData, head, tail, legs, mats };
  return Cat;
}

export class SchrodiCat {
  constructor(colors = {}) {
    const c = { body: 0xf2a65a, stripe: 0xc9742c, eye: 0x7c4dff, ...colors };
    this.group = new THREE.Group();
    this.rig = new THREE.Group();          // se rota/escala aquí
    this.rig.scale.setScalar(0.66);
    this.group.add(this.rig);

    this.awake = buildCatMesh({ ...c, sleeping: false });
    this.sleep = buildCatMesh({ ...c, sleeping: true });
    this.rig.add(this.awake, this.sleep);

    // Destellos de superposición
    this.sparkles = new THREE.Group();
    const sGeo = new THREE.OctahedronGeometry(0.07);
    this.sparkleMat = new THREE.MeshBasicMaterial({ color: 0xc8a2ff, transparent: true, opacity: 0 });
    for (let i = 0; i < 14; i++) {
      const m = new THREE.Mesh(sGeo, this.sparkleMat);
      m.userData.phase = Math.random() * Math.PI * 2;
      m.userData.r = 0.35 + Math.random() * 0.25;
      m.userData.h = 0.1 + Math.random() * 0.8;
      this.sparkles.add(m);
    }
    this.group.add(this.sparkles);

    // Aura morada de superposición
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const ctx = cv.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(200,150,255,.9)'); g.addColorStop(0.5, 'rgba(150,90,255,.35)'); g.addColorStop(1, 'rgba(150,90,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
    this.aura = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false, opacity: 0 }));
    this.aura.position.y = 0.5;
    this.aura.scale.setScalar(1.8);
    this.group.add(this.aura);

    this.walkT = 0;
    this.walking = false;
    this.pAwake = 0;
    this.setProb(0);
  }

  // pAwake = probabilidad de 😺 (0..1)
  setProb(p) {
    this.pAwake = p;
    const sup = p > 0.01 && p < 0.99;
    const set = (cat, o) => {
      cat.visible = o > 0.01;
      cat.userData.mats.forEach(m => { m.opacity = o; m.depthWrite = o > 0.95; });
    };
    if (!sup) {
      set(this.awake, p >= 0.5 ? 1 : 0);
      set(this.sleep, p >= 0.5 ? 0 : 1);
    }
    this.superposed = sup;
  }

  update(t, dt) {
    const p = this.pAwake;
    if (this.superposed) {
      // dos gatos fantasma que titilan y se separan un poquito
      const flick = 0.1 * Math.sin(t * 6);
      const oa = 0.45 + 0.4 * p + flick, os = 0.45 + 0.4 * (1 - p) - flick;
      [[this.awake, oa], [this.sleep, os]].forEach(([cat, o]) => {
        cat.visible = true;
        cat.userData.mats.forEach(m => { m.opacity = o; m.depthWrite = false; });
      });
      this.awake.position.x = 0.18 + Math.sin(t * 2.3) * 0.05;
      this.sleep.position.x = -0.18 - Math.sin(t * 2.3) * 0.05;
      this.sparkleMat.opacity = 0.9;
      this.aura.material.opacity = 0.75 + Math.sin(t * 4) * 0.2;
    } else {
      this.aura.material.opacity *= 0.9;
      this.awake.position.x += (0 - this.awake.position.x) * 0.2;
      this.sleep.position.x += (0 - this.sleep.position.x) * 0.2;
      this.sparkleMat.opacity *= 0.9;
    }
    this.sparkles.children.forEach(s => {
      const a = s.userData.phase + t * 1.6;
      s.position.set(Math.cos(a) * s.userData.r, s.userData.h + Math.sin(t * 3 + a) * 0.05, Math.sin(a) * s.userData.r);
      s.rotation.y = t * 3;
    });

    // patas, cola, respiración
    const sp = this.walking ? 12 : 0;
    this.walkT += dt * sp;
    [this.awake, this.sleep].forEach((cat, i) => {
      const { legs, tail, zzz } = cat.userData;
      legs.forEach((l, k) => { l.rotation.x = this.walking ? Math.sin(this.walkT + (k % 2 ? Math.PI : 0) + (k > 1 ? Math.PI : 0)) * 0.5 : l.rotation.x * 0.8; });
      tail.forEach((seg, k) => { seg.rotation.y = Math.sin(t * (i ? 1.5 : 3) + k * 0.6) * 0.2; });
      cat.position.y = this.walking ? Math.abs(Math.sin(this.walkT)) * 0.08 : Math.sin(t * 2) * 0.02;
      if (zzz) { zzz.position.y = 1.7 + Math.sin(t * 1.5) * 0.12; zzz.material.rotation = Math.sin(t) * 0.15; }
    });
  }
}
