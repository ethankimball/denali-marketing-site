import * as THREE from './assets/vendor/three.module.js';

const canvas = document.querySelector('[data-process-tree-3d]');
const section = document.querySelector('.process-panel');

if (canvas && section) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.28;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(27, 1, .1, 100);
  camera.position.set(0, .1, 24);
  camera.lookAt(0, .1, 0);

  const tree = new THREE.Group();
  tree.rotation.y = -.45;
  tree.scale.set(1, 1, 1);
  scene.add(tree);

  const rng = (() => {
    let seed = 1847;
    return () => {
      seed |= 0;
      seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  })();

  const barkCanvas = document.createElement('canvas');
  barkCanvas.width = 256;
  barkCanvas.height = 512;
  const barkContext = barkCanvas.getContext('2d');
  barkContext.fillStyle = '#21150f';
  barkContext.fillRect(0, 0, barkCanvas.width, barkCanvas.height);
  for (let i = 0; i < 360; i += 1) {
    const x = rng() * barkCanvas.width;
    const y = rng() * barkCanvas.height;
    const length = 18 + rng() * 92;
    barkContext.beginPath();
    barkContext.moveTo(x, y);
    barkContext.bezierCurveTo(x + (rng() - .5) * 9, y + length * .28, x + (rng() - .5) * 13, y + length * .72, x + (rng() - .5) * 8, y + length);
    barkContext.strokeStyle = rng() > .48 ? `rgba(116,79,55,${.14 + rng() * .24})` : `rgba(4,2,2,${.28 + rng() * .42})`;
    barkContext.lineWidth = .7 + rng() * 3.2;
    barkContext.stroke();
  }
  const barkTexture = new THREE.CanvasTexture(barkCanvas);
  barkTexture.colorSpace = THREE.SRGBColorSpace;
  barkTexture.wrapS = THREE.RepeatWrapping;
  barkTexture.wrapT = THREE.RepeatWrapping;
  barkTexture.repeat.set(3.5, 7);
  barkTexture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const bark = new THREE.MeshStandardMaterial({ color: 0x594235, map: barkTexture, bumpMap: barkTexture, bumpScale: .18, roughness: 1, metalness: 0 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.28, .68, 10.7, 16, 24), bark);
  trunk.position.y = -.25;
  tree.add(trunk);

  const branchGeometry = new THREE.CylinderGeometry(.22, .62, 1, 7, 1);
  const branchMaterial = new THREE.MeshStandardMaterial({ color: 0x38271f, map: barkTexture, bumpMap: barkTexture, bumpScale: .08, roughness: 1 });
  const branchCount = 242;
  const branches = new THREE.InstancedMesh(branchGeometry, branchMaterial, branchCount);
  const branchData = [];
  const dummy = new THREE.Object3D();
  const up = new THREE.Vector3(0, 1, 0);
  const start = new THREE.Vector3();
  const end = new THREE.Vector3();
  const direction = new THREE.Vector3();

  for (let i = 0; i < branchCount; i += 1) {
    const tierIndex = Math.floor(i / 11);
    const branchIndex = i % 11;
    const t = tierIndex / 21;
    const y = -4.65 + t * 9.45 + (rng() - .5) * .3;
    const crown = Math.max(.22, Math.pow(1 - t, .74) * 4.25);
    const angle = branchIndex * (Math.PI * 2 / 11) + tierIndex * .41 + (rng() - .5) * .28;
    const naturalGap = rng() < .09 ? .46 + rng() * .22 : 1;
    const length = crown * (.67 + rng() * .32) * naturalGap;
    const rise = -.3 + t * 1.12 + rng() * .16;
    start.set(Math.cos(angle) * .15, y, Math.sin(angle) * .15);
    end.set(Math.cos(angle) * length, y + rise, Math.sin(angle) * length);
    direction.subVectors(end, start);
    const branchLength = direction.length();
    dummy.position.copy(start).add(end).multiplyScalar(.5);
    dummy.quaternion.setFromUnitVectors(up, direction.normalize());
    const thickness = .085 * (1 - t * .68) + .018;
    dummy.scale.set(thickness, branchLength, thickness);
    dummy.updateMatrix();
    branches.setMatrixAt(i, dummy.matrix);
    branchData.push({ start: start.clone(), end: end.clone(), angle, t, density: .7 + rng() * .28 });
  }
  branches.instanceMatrix.needsUpdate = true;
  tree.add(branches);

  const foliageGeometry = new THREE.ConeGeometry(.046, .48, 5, 1);
  const foliageMaterial = new THREE.MeshStandardMaterial({ roughness: .92, metalness: 0, vertexColors: true });
  const foliageCount = branchData.length * 74 + 700;
  const foliage = new THREE.InstancedMesh(foliageGeometry, foliageMaterial, foliageCount);
  const palette = [0x124b31, 0x185a3b, 0x1e6846, 0x287653, 0x0f432c, 0x327e59];

  let foliageIndex = 0;
  const point = new THREE.Vector3();
  const side = new THREE.Vector3();
  const branchDirection = new THREE.Vector3();
  const crossAxis = new THREE.Vector3();
  const needleDirection = new THREE.Vector3();
  for (const branch of branchData) {
    branchDirection.subVectors(branch.end, branch.start).normalize();
    side.crossVectors(branchDirection, up).normalize();
    crossAxis.crossVectors(branchDirection, side).normalize();
    for (let step = 0; step < 74; step += 1) {
      const along = .075 + rng() * .91;
      point.lerpVectors(branch.start, branch.end, along);
      const innerOpenness = .58 + Math.min(1, along / .34) * .42;
      const keepNeedle = rng() <= branch.density * innerOpenness;
      const around = rng() * Math.PI * 2 + Math.sin(along * 13 + branch.angle * 2.1) * .28;
      needleDirection.copy(side).multiplyScalar(Math.cos(around));
      needleDirection.addScaledVector(crossAxis, Math.sin(around));
      needleDirection.addScaledVector(branchDirection, .04 + rng() * .42);
      needleDirection.y += -.12 + branch.t * .23 + (rng() - .5) * .2;
      needleDirection.normalize();
      dummy.position.copy(point).addScaledVector(needleDirection, .08 + rng() * .06);
      dummy.quaternion.setFromUnitVectors(up, needleDirection);
      const needleScale = keepNeedle ? (.62 + rng() * .72) * (1 - branch.t * .18) : 0;
      dummy.scale.set(needleScale, needleScale, needleScale);
      dummy.updateMatrix();
      foliage.setMatrixAt(foliageIndex, dummy.matrix);
      const color = new THREE.Color(palette[Math.floor(rng() * palette.length)]);
      color.offsetHSL((rng() - .5) * .018, (rng() - .5) * .08, (rng() - .5) * .055);
      foliage.setColorAt(foliageIndex, color);
      foliageIndex += 1;
    }
  }

  for (; foliageIndex < foliageCount; foliageIndex += 1) {
    const t = rng();
    const y = 4.15 + t * 1.45;
    const angle = rng() * Math.PI * 2;
    const radius = (1 - t) * (.48 + rng() * .38);
    dummy.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    needleDirection.set(Math.cos(angle) * .72, .35 + rng() * .65, Math.sin(angle) * .72).normalize();
    dummy.quaternion.setFromUnitVectors(up, needleDirection);
    const size = .72 + rng() * .5;
    dummy.scale.set(size, size, size);
    dummy.updateMatrix();
    foliage.setMatrixAt(foliageIndex, dummy.matrix);
    foliage.setColorAt(foliageIndex, new THREE.Color(palette[Math.floor(rng() * palette.length)]));
  }
  foliage.instanceMatrix.needsUpdate = true;
  foliage.instanceColor.needsUpdate = true;
  tree.add(foliage);

  scene.add(new THREE.HemisphereLight(0xcfe1d6, 0x071a14, 1.45));
  const key = new THREE.DirectionalLight(0xe9dfbd, 3.4);
  key.position.set(-5, 8, 9);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x9de0c1, 3);
  rim.position.set(6, 2, -7);
  scene.add(rim);
  const fill = new THREE.PointLight(0x2c8a5d, 18, 24);
  fill.position.set(0, -1, 7);
  scene.add(fill);

  let targetYaw = -.45;
  let currentYaw = targetYaw;
  let inView = false;
  let frame = 0;

  const updateTarget = () => {
    if (reduceMotion) {
      targetYaw = -.45;
      return;
    }
    const rect = section.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / (rect.height + window.innerHeight)));
    targetYaw = -.45 + progress * Math.PI * 2.25;
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.7);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  };

  const render = () => {
    frame = 0;
    currentYaw += (targetYaw - currentYaw) * .075;
    tree.rotation.y = currentYaw;
    renderer.render(scene, camera);
    if (inView && Math.abs(targetYaw - currentYaw) > .0005) frame = requestAnimationFrame(render);
  };

  const requestRender = () => {
    updateTarget();
    if (!frame && inView) frame = requestAnimationFrame(render);
  };

  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView) requestRender();
    else if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }, { rootMargin: '120px' }).observe(section);

  window.addEventListener('scroll', requestRender, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  resize();
  updateTarget();
}
