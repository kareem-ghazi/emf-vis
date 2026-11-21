/**
 * landing.js - Interactive 3D Gradient Visualization & KaTeX Auto-Renderer for emf.vis Landing Page
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class HeroGradientVisualization {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.scene = new THREE.Scene();

    // Standard physics Z-up orientation
    THREE.Object3D.DEFAULT_UP.set(0, 0, 1);

    // Camera framed on the 3D potential hill
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.camera.up.set(0, 0, 1);
    this.camera.position.set(5.2, -5.2, 4.0);
    this.camera.lookAt(0, 0, 1.0);

    // WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.domElement.style.touchAction = 'none';
    this.container.appendChild(this.renderer.domElement);

    // Orbit Controls - only interact when cursor is inside the visualization canvas
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enableZoom = true;
    this.controls.enableRotate = true;
    this.controls.enablePan = false; // Keep focus on center hill
    this.controls.autoRotate = true; // Smooth gentle auto-rotation when idle
    this.controls.autoRotateSpeed = 1.0;
    this.controls.target.set(0, 0, 1.0);
    this.controls.maxPolarAngle = Math.PI / 2 - 0.06; // Keep above ground plane
    this.controls.minDistance = 3.2;
    this.controls.maxDistance = 12.0;

    // Group for all gradient visualization objects
    this.gradientGroup = new THREE.Group();
    this.scene.add(this.gradientGroup);

    // Build 3D Gradient Scene
    this.initScene();

    window.addEventListener('resize', () => this.onResize());

    this.clock = new THREE.Clock();
    this.animate();
  }

  // Gaussian scalar potential V(x, y) = V0 * exp(-(x^2 + y^2) / spread)
  evalScalar(x, y) {
    const r2 = x * x + y * y;
    const v0 = 2.8;
    const spread = 2.6;
    return v0 * Math.exp(-r2 / spread);
  }

  // Gradient vector (dV/dx, dV/dy)
  evalGrad(x, y) {
    const v = this.evalScalar(x, y);
    const spread = 2.6;
    const gx = (-2 * x / spread) * v;
    const gy = (-2 * y / spread) * v;
    return { gx, gy, mag: Math.sqrt(gx * gx + gy * gy) };
  }

  // Cache circular glow texture for pulse particles
  getGlowTexture() {
    if (this.glowTexture) return this.glowTexture;
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.35, 'rgba(254, 240, 138, 0.85)');
    grad.addColorStop(0.7, 'rgba(234, 179, 8, 0.25)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    this.glowTexture = new THREE.CanvasTexture(canvas);
    return this.glowTexture;
  }

  initScene() {
    // Balanced lighting to prevent any specular wash-out / clipping
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.85);
    keyLight.position.set(8, -8, 12);
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.45);
    fillLight.position.set(-8, 8, 4);
    this.scene.add(fillLight);

    // Subtle Ground Grid in X-Y plane
    const grid = new THREE.GridHelper(5.6, 14, 0x334155, 0x1e293b);
    grid.rotation.x = Math.PI / 2;
    grid.position.z = -0.01;
    this.gradientGroup.add(grid);

    // 1. Topographical 3D Gaussian Hill Mesh
    const size = 5.4;
    const segs = 64;
    const geo = new THREE.PlaneGeometry(size, size, segs, segs);
    const pos = geo.attributes.position;
    const colors = [];
    const col = new THREE.Color();
    const peakZ = 2.8;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const zVal = this.evalScalar(x, y);
      pos.setZ(i, zVal);

      // Colormap: Deep navy base -> Electric cyan -> Neon violet -> Radiant golden amber peak
      const t = Math.min(1, Math.max(0, zVal / peakZ));
      col.setHSL(0.56 * (1.0 - t), 0.88, 0.38 + 0.26 * t);
      colors.push(col.r, col.g, col.b);
    }

    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    // High roughness prevents harsh white specular blow-outs on the hill flanks
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.04,
      side: THREE.DoubleSide
    });
    this.hillMesh = new THREE.Mesh(geo, mat);
    this.gradientGroup.add(this.hillMesh);

    // Wireframe topographical lines overlay
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
      depthWrite: false
    });
    this.gradientGroup.add(new THREE.Mesh(geo, wireMat));

    // 2. Equipotential Contour Rings V = const
    this.buildContourRings();

    // 3. Steepest Ascent Streamlines with Flowing Pulse Particles
    this.buildAscentStreamlines();
  }

  buildContourRings() {
    const ringLevels = [0.45, 1.0, 1.6, 2.15, 2.6];
    const v0 = 2.8;
    const spread = 2.6;
    const ringMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.8,
      depthWrite: false
    });

    ringLevels.forEach((level) => {
      const radius = Math.sqrt(-spread * Math.log(level / v0));
      const points = [];
      const numPts = 64;
      for (let i = 0; i <= numPts; i++) {
        const theta = (i / numPts) * Math.PI * 2;
        points.push(new THREE.Vector3(
          radius * Math.cos(theta),
          radius * Math.sin(theta),
          level + 0.025
        ));
      }
      const ringGeo = new THREE.BufferGeometry().setFromPoints(points);
      this.gradientGroup.add(new THREE.Line(ringGeo, ringMat));
    });
  }

  buildAscentStreamlines() {
    const numPaths = 12;
    this.streamlines = [];
    const pathMat = new THREE.LineBasicMaterial({
      color: 0xfacc15,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });

    for (let i = 0; i < numPaths; i++) {
      const theta = (i / numPaths) * Math.PI * 2;
      const pts = [];
      const steps = 30;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const r = 2.4 * (1.0 - t); // Start at base, climb toward summit
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        const z = this.evalScalar(x, y) + 0.03;
        pts.push(new THREE.Vector3(x, y, z));
      }
      this.streamlines.push(pts);
      const pathGeo = new THREE.BufferGeometry().setFromPoints(pts);
      this.gradientGroup.add(new THREE.Line(pathGeo, pathMat));
    }

    // Ascent Flow Particles - sized in world units with radial glow map
    const particleCount = this.streamlines.length * 2;
    this.particles = [];
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        pathIdx: i % this.streamlines.length,
        progress: (i / particleCount)
      });
      particlePositions[i * 3] = 0;
      particlePositions[i * 3 + 1] = 0;
      particlePositions[i * 3 + 2] = 0;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      map: this.getGlowTexture(),
      size: 0.22, // Realistic particle size (22cm in world units)
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particleSystem = new THREE.Points(particleGeo, particleMat);
    this.gradientGroup.add(this.particleSystem);
  }

  onResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const dt = this.clock.getDelta();

    // OrbitControls update (handles gentle auto-rotation when idle and drag/zoom interaction when focused)
    if (this.controls) {
      this.controls.update();
    }

    // Update ascending pulse particles climbing the potential hill
    if (this.particleSystem && this.streamlines && this.streamlines.length > 0) {
      const posAttr = this.particleSystem.geometry.attributes.position;
      const positions = posAttr.array;

      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        p.progress += dt * 0.25;
        if (p.progress >= 1.0) {
          p.progress = 0.0;
        }

        const path = this.streamlines[p.pathIdx];
        const floatIdx = p.progress * (path.length - 1);
        const low = Math.floor(floatIdx);
        const high = Math.min(low + 1, path.length - 1);
        const frac = floatIdx - low;

        const pt1 = path[low];
        const pt2 = path[high];

        positions[i * 3] = pt1.x + (pt2.x - pt1.x) * frac;
        positions[i * 3 + 1] = pt1.y + (pt2.y - pt1.y) * frac;
        positions[i * 3 + 2] = pt1.z + (pt2.z - pt1.z) * frac;
      }

      posAttr.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

/**
 * KaTeX Math Renderer for Landing Page
 * Ensures KaTeX auto-render executes smoothly whether loaded synchronously or asynchronously via CDN.
 */
function initLatexRendering() {
  const tryRender = () => {
    if (typeof window !== 'undefined' && window.renderMathInElement) {
      window.renderMathInElement(document.body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ],
        throwOnError: false,
        ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
      });
      return true;
    }
    return false;
  };

  if (!tryRender()) {
    const timer = setInterval(() => {
      if (tryRender()) {
        clearInterval(timer);
      }
    }, 40);

    window.addEventListener('load', () => {
      if (tryRender()) {
        clearInterval(timer);
      }
    });

    setTimeout(() => clearInterval(timer), 4000);
  }
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  new HeroGradientVisualization('hero-canvas-wrapper');
  initLatexRendering();

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href').substring(1);
      const target = document.getElementById(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Mobile navigation menu toggle
  const mobileNavToggle = document.getElementById('landing-nav-toggle');
  const mobileNavMenu = document.getElementById('landing-nav-links');
  if (mobileNavToggle && mobileNavMenu) {
    mobileNavToggle.addEventListener('click', () => {
      mobileNavMenu.classList.toggle('active');
    });
  }
});
