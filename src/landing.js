/**
 * landing.js - Interactive 3D Hero Background & Feature Animations for emf.vis Landing Page
 */

import * as THREE from 'three';

class HeroVisualization {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.scene = new THREE.Scene();
    
    // Camera
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.camera.position.set(4.5, 3.8, 4.0);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    // Scene Content
    this.initScene();

    // Interaction / Mouse Parallax
    this.mouseX = 0;
    this.mouseY = 0;
    this.targetRotationX = 0;
    this.targetRotationY = 0;

    window.addEventListener('mousemove', (e) => {
      this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('resize', () => this.onResize());

    this.clock = new THREE.Clock();
    this.animate();
  }

  initScene() {
    // Ambient & Directional Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.5);
    dirLight1.position.set(5, 10, 7);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xec4899, 1.0);
    dirLight2.position.set(-5, -5, -5);
    this.scene.add(dirLight2);

    this.fieldGroup = new THREE.Group();
    this.scene.add(this.fieldGroup);

    // Coordinate Ring Cage (Spherical / Cylindrical / Cartesian hybrid visual)
    const sphereGeo = new THREE.SphereGeometry(1.8, 16, 12);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.18
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    this.fieldGroup.add(sphereMesh);

    // Inner Torus (Vorticity ring)
    const torusGeo = new THREE.TorusGeometry(1.2, 0.04, 16, 64);
    const torusMat = new THREE.MeshStandardMaterial({
      color: 0x60a5fa,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.6,
      roughness: 0.3
    });
    this.torusMesh = new THREE.Mesh(torusGeo, torusMat);
    this.torusMesh.rotation.x = Math.PI / 2;
    this.fieldGroup.add(this.torusMesh);

    // Coordinate Planes
    const planeGeo = new THREE.PlaneGeometry(3.2, 3.2);
    const planeMat = new THREE.MeshBasicMaterial({
      color: 0x2563eb,
      transparent: true,
      opacity: 0.07,
      side: THREE.DoubleSide
    });
    const planeMesh = new THREE.Mesh(planeGeo, planeMat);
    planeMesh.rotation.x = Math.PI / 2;
    this.fieldGroup.add(planeMesh);

    // Vector Streamline Field Arrows (Instanced or multiple arrows)
    const arrowCount = 48;
    this.arrows = [];
    const dir = new THREE.Vector3();
    const origin = new THREE.Vector3();

    for (let i = 0; i < arrowCount; i++) {
      const u = (Math.random() - 0.5) * 3.2;
      const v = (Math.random() - 0.5) * 3.2;
      const w = (Math.random() - 0.5) * 2.0;

      origin.set(u, v, w);
      // Curl-like circulating vector direction
      dir.set(-v, u, 0.3 * Math.sin(u * v)).normalize();

      const length = 0.45;
      const color = (u * u + v * v > 2.0) ? 0x38bdf8 : 0xec4899;
      const arrow = new THREE.ArrowHelper(dir, origin, length, color, 0.12, 0.06);
      arrow.userData = { origPos: origin.clone(), u, v, w };
      this.fieldGroup.add(arrow);
      this.arrows.push(arrow);
    }

    // Dynamic Central Glow Point (Source/Sink probe)
    const probeGeo = new THREE.SphereGeometry(0.12, 32, 32);
    const probeMat = new THREE.MeshStandardMaterial({
      color: 0x4ade80,
      emissive: 0x22c55e,
      emissiveIntensity: 0.8
    });
    this.probeMesh = new THREE.Mesh(probeGeo, probeMat);
    this.fieldGroup.add(this.probeMesh);
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
    const elapsedTime = this.clock.getElapsedTime();

    // Subtle automatic rotation
    this.fieldGroup.rotation.z = elapsedTime * 0.2;
    this.fieldGroup.rotation.y = elapsedTime * 0.12;

    // Mouse parallax
    this.targetRotationX = this.mouseY * 0.4;
    this.targetRotationY = this.mouseX * 0.4;
    this.fieldGroup.rotation.x += (this.targetRotationX - this.fieldGroup.rotation.x) * 0.05;

    // Torus pulse
    if (this.torusMesh) {
      const scale = 1.0 + 0.08 * Math.sin(elapsedTime * 2.5);
      this.torusMesh.scale.set(scale, scale, scale);
    }

    // Probe point floating
    if (this.probeMesh) {
      this.probeMesh.position.z = 0.25 * Math.sin(elapsedTime * 2.0);
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  new HeroVisualization('hero-canvas-wrapper');

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
