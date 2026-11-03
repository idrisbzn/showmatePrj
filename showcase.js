import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const ACCENT = 0x39ff14;
const HOVER = 1.08;
const TEXT_MAX_WIDTH = 4.2;
const TEXT_GAP = 0.065;
const LETTER_STEP = 0.22;
const LETTER_DUR = 0.9;
const LETTER_RISE = 0.28;
const LETTER_DRIFT = 0.14;
const PIECE_SPIN = 0.35;

const stage = document.getElementById('showstage');
const canvas = document.getElementById('finaleCanvas');

if (stage && canvas) {
  try {
    init();
  } catch (err) {
    fail();
  }
}

function fail() {
  stage.classList.remove('is-loading');
  stage.classList.add('is-failed');
}

function init() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    if (!renderer.capabilities.isWebGL2) throw new Error('WebGL2 required');
  } catch (err) {
    fail();
    return;
  }

  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.5;
  pmrem.dispose();

  const camTarget = new THREE.Vector3(0, 1.55, 0);
  camera.lookAt(camTarget);

  scene.add(new THREE.HemisphereLight(0x4b6b3a, 0x050604, 0.65));

  const keyLight = new THREE.DirectionalLight(0xeafff0, 2.7);
  keyLight.position.set(4.5, 7.5, 5.5);
  scene.add(keyLight);

  const rim = new THREE.PointLight(ACCENT, 55, 18, 2);
  rim.position.set(-3.4, 4.2, -4.6);
  scene.add(rim);

  const fill = new THREE.PointLight(ACCENT, 18, 14, 2);
  fill.position.set(3.2, 2.2, 3.6);
  scene.add(fill);

  const textKey = new THREE.SpotLight(0xfff4e0, 110, 12, 0.75, 0.5, 1.8);
  textKey.position.set(0, 3.2, 5.2);
  textKey.target.position.set(0, 0.3, 0.18);
  scene.add(textKey);
  scene.add(textKey.target);

  const textShine = new THREE.SpotLight(ACCENT, 70, 12, 0.85, 0.6, 2);
  textShine.position.set(0, 0.9, 3.9);
  textShine.target.position.set(0, 0.35, 0.18);
  scene.add(textShine);
  scene.add(textShine.target);

  const pieceTop = new THREE.SpotLight(0xf3ffea, 90, 14, 0.6, 0.55, 1.8);
  pieceTop.position.set(-2.6, 5.4, 2.6);
  pieceTop.target.position.set(0, 2.1, 0);
  scene.add(pieceTop);
  scene.add(pieceTop.target);

  const underHalo = new THREE.PointLight(ACCENT, 14, 7, 2);
  underHalo.position.set(0, 1.3, 2.1);
  scene.add(underHalo);

  const sideKicker = new THREE.PointLight(0xcfffd2, 11, 12, 2);
  sideKicker.position.set(-3.8, 1.9, 1.4);
  scene.add(sideKicker);

  const core = new THREE.Group();
  scene.add(core);

  const pieceGroup = new THREE.Group();
  core.add(pieceGroup);

  const dotTexture = makeDotTexture();

  const PARTICLE_COUNT = 2400;
  const cloudTheta = new Float32Array(PARTICLE_COUNT);
  const cloudSpeed = new Float32Array(PARTICLE_COUNT);
  const cloudHoriz = new Float32Array(PARTICLE_COUNT);
  const cloudY = new Float32Array(PARTICLE_COUNT);
  const cloudPositions = new Float32Array(PARTICLE_COUNT * 3);
  for (let j = 0; j < PARTICLE_COUNT; j++) {
    const u = Math.random() * 2 - 1;
    const lat = Math.sqrt(Math.max(0, 1 - u * u));
    const r = 0.9 + Math.pow(Math.random(), 0.7) * 1.9;
    cloudTheta[j] = Math.random() * Math.PI * 2;
    cloudSpeed[j] = (0.08 + Math.random() * 0.32) * (Math.random() < 0.5 ? -1 : 1);
    cloudHoriz[j] = r * lat;
    cloudY[j] = 1.1 + u * r * 1.25;
    cloudPositions[j * 3] = Math.cos(cloudTheta[j]) * cloudHoriz[j];
    cloudPositions[j * 3 + 1] = cloudY[j];
    cloudPositions[j * 3 + 2] = Math.sin(cloudTheta[j]) * cloudHoriz[j];
  }
  const cloudGeo = new THREE.BufferGeometry();
  cloudGeo.setAttribute('position', new THREE.BufferAttribute(cloudPositions, 3));
  const particleCloud = new THREE.Points(
    cloudGeo,
    new THREE.PointsMaterial({
      color: 0xd9ffb0,
      size: 0.05,
      map: dotTexture,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    })
  );
  core.add(particleCloud);

  const ambientDust = dustCloud(180, 1.25, 2.15, 0.35, dotTexture);
  scene.add(ambientDust);

  let letterAnims = [];
  let letterLoop = 1;

  const gltfLoader = new GLTFLoader();
  const fontLoader = new FontLoader();

  const jobs = [];

  const pieceTexture = new THREE.TextureLoader().load('models/chesspiecetexture.jpg');
  pieceTexture.colorSpace = THREE.SRGBColorSpace;
  pieceTexture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  jobs.push(
    gltfLoader
      .loadAsync('models/CHESSPIECE.glb')
      .then(gltf => {
        const piece = gltf.scene;
        piece.rotation.y = -Math.PI * 0.22;
        piece.scale.setScalar(0.8);
        piece.traverse(o => {
          if (!o.isMesh) return;
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          for (const mat of mats) {
            mat.map = pieceTexture;
            mat.color.set(0xffffff);
            mat.metalness = 0.55;
            mat.roughness = 0.42;
            mat.needsUpdate = true;
          }
        });
        const box = new THREE.Box3().setFromObject(piece);
        piece.position.y -= box.min.y;
        piece.position.x -= (box.min.x + box.max.x) / 2;
        piece.position.z -= (box.min.z + box.max.z) / 2;
        pieceGroup.add(piece);
      })
  );

  jobs.push(
    fontLoader
      .loadAsync('fonts/helvetiker_bold.typeface.json')
      .then(font => {
        const mat = new THREE.MeshStandardMaterial({
          color: 0x2b3427,
          metalness: 0.55,
          roughness: 0.42,
          emissive: 0x000000,
          envMapIntensity: 1.7
        });
        const textParams = {
          font,
          size: 0.46,
          depth: 0.16,
          curveSegments: 12,
          bevelEnabled: false
        };
        const gap = TEXT_GAP;
        const parts = [];
        let total = 0;
        for (const ch of 'SHELLMATES') {
          const geo = new TextGeometry(ch, textParams);
          geo.computeBoundingBox();
          const bb = geo.boundingBox;
          const w = bb.max.x - bb.min.x;
          total += w + gap;
          parts.push({ geo, bb, w });
        }
        total -= gap;
        const group = new THREE.Group();
        if (total > TEXT_MAX_WIDTH) group.scale.setScalar(TEXT_MAX_WIDTH / total);
        let cursor = -total / 2;
        for (const part of parts) {
          part.geo.translate(-(part.bb.min.x + part.bb.max.x) / 2, -part.bb.min.y, 0);
          const mesh = new THREE.Mesh(part.geo, mat);
          mesh.position.x = cursor + part.w / 2;
          cursor += part.w + gap;
          group.add(mesh);
        }
        letterAnims = group.children.map(mesh => ({ mesh, baseX: mesh.position.x, baseY: mesh.position.y }));
        letterLoop = (letterAnims.length - 1) * LETTER_STEP + LETTER_DUR;
        group.position.set(0, 0.02, 0.18);
        scene.add(group);
      })
  );

  function distFor(aspect) {
    return aspect < 0.95 ? 9.2 : THREE.MathUtils.clamp(7.0 + (1.85 - aspect) * 1.4, 6.4, 9.2);
  }

  camera.position.set(1.1, 2.15, distFor(stage.clientWidth / Math.max(1, stage.clientHeight)));
  camera.lookAt(camTarget);

  new ResizeObserver(() => {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    camera.aspect = w / h;
    camera.position.set(1.1, 2.15, distFor(camera.aspect));
    camera.updateProjectionMatrix();
    camera.lookAt(camTarget);
  }).observe(stage);

  let running = false;
  const clock = new THREE.Clock();

  function tick() {
    if (!running) return;
    requestAnimationFrame(tick);
    const t = clock.getElapsedTime();
    if (!reduceMotion) {
      core.position.y = HOVER + Math.sin(t * 0.9) * 0.05;
      pieceGroup.rotation.y = t * PIECE_SPIN;
      const pos = cloudGeo.attributes.position.array;
      for (let j = 0; j < PARTICLE_COUNT; j++) {
        const a = cloudTheta[j] + t * cloudSpeed[j];
        pos[j * 3] = Math.cos(a) * cloudHoriz[j];
        pos[j * 3 + 1] = cloudY[j];
        pos[j * 3 + 2] = Math.sin(a) * cloudHoriz[j];
      }
      cloudGeo.attributes.position.needsUpdate = true;
      ambientDust.rotation.y = t * 0.04;
      if (letterAnims.length) {
        const u = t % letterLoop;
        for (let k = 0; k < letterAnims.length; k++) {
          const a = letterAnims[k];
          const lu = u - k * LETTER_STEP;
          const rise = lu >= 0 && lu <= LETTER_DUR ? Math.sin((lu / LETTER_DUR) * Math.PI) : 0;
          a.mesh.position.x = a.baseX - rise * LETTER_DRIFT;
          a.mesh.position.y = a.baseY + rise * LETTER_RISE;
        }
      }
    }
    renderer.render(scene, camera);
  }

  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !running) {
      running = true;
      clock.getDelta();
      requestAnimationFrame(tick);
    } else if (!entry.isIntersecting) {
      running = false;
    }
  }).observe(stage);

  Promise.all(jobs)
    .then(() => {
      stage.classList.remove('is-loading');
      stage.classList.add('is-ready');
    })
    .catch(err => {
      console.warn('showcase assets failed:', err);
      fail();
    });
}

function makeDotTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.55, 'rgba(255,255,255,0.85)');
  grad.addColorStop(0.8, 'rgba(255,255,255,0.28)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function dustCloud(count, inner, outer, opacity, map) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const dir = new THREE.Vector3(
      Math.random() - 0.5,
      (Math.random() - 0.5) * 0.7,
      Math.random() - 0.5
    );
    const r = inner + Math.random() * (outer - inner);
    positions[i * 3] = dir.x * r;
    positions[i * 3 + 1] = 1.8 + dir.y * r;
    positions[i * 3 + 2] = dir.z * r;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color: 0x6eff44,
      size: 0.035,
      map,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    })
  );
}
