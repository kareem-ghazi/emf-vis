/**
 * main.js - Main Application Controller
 * Three.js Scene, Camera, OrbitControls, Tool Switcher, Render Loop, & KaTeX HUD Sync.
 * Configured with standard physics Z-up orientation so horizontal plane is X-Y and vertical is Z.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { UIController } from './ui.js';

// Import The 4 Visualizer Topics
import * as CoordsTopic from './topics/coords.js';
import * as GradientTopic from './topics/gradient.js';
import * as DivergenceTopic from './topics/divergence.js';
import * as CurlTopic from './topics/curl.js';

// Topic Registry (4 Topics)
const TOPICS = {
  coords: CoordsTopic,
  gradient: GradientTopic,
  divergence: DivergenceTopic,
  curl: CurlTopic
};

class AppController {
  constructor() {
    this.container = document.getElementById('canvas-wrapper');
    this.clock = new THREE.Clock();

    // Set standard Physics Z-Up orientation
    THREE.Object3D.DEFAULT_UP.set(0, 0, 1);

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x07090e);

    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.camera.up.set(0, 0, 1);
    this.camera.position.set(5.8, 5.8, 4.5);
    this.camera.lookAt(0.75, 0.75, 0.75);

    // WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    // Orbit Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 40;
    this.controls.minDistance = 1;
    this.controls.target.set(0.75, 0.75, 0.75);

    // Helpers & Lighting
    this.initEnvironment();

    // Active Tool Group
    this.topicGroup = new THREE.Group();
    this.scene.add(this.topicGroup);

    // UI Controller
    this.ui = new UIController((newState) => this.onUIStateChange(newState));

    // Connect Reset Camera Button
    const resetCamBtn = document.getElementById('reset-camera-btn');
    if (resetCamBtn) {
      resetCamBtn.addEventListener('click', () => this.resetCamera());
    }

    // Active Tool State
    this.currentTopicId = null;
    this.currentTopicModule = null;

    // Window Resize Handling
    window.addEventListener('resize', () => this.onWindowResize());

    // Initial Load
    this.loadTopic(this.ui.state.topic);
    this.animate();
  }

  initEnvironment() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambientLight);

    // Key Directional Light
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(10, -10, 15);
    this.scene.add(keyLight);

    // Fill Directional Light
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
    fillLight.position.set(-10, 10, -5);
    this.scene.add(fillLight);

    // Horizontal Ground Grid Helper in X-Y plane (Z = 0)
    this.gridHelper = new THREE.GridHelper(10, 20, 0x334155, 0x1e293b);
    this.gridHelper.rotation.x = Math.PI / 2; // Lie in horizontal X-Y plane
    this.gridHelper.position.z = -0.01;
    this.scene.add(this.gridHelper);

    // World Axes Helper (Red = X, Green = Y, Blue = Z [vertical up])
    this.axesHelper = new THREE.AxesHelper(4.5);
    this.scene.add(this.axesHelper);
  }

  /**
   * Calculates the required camera Z distance for 2D planar topics (Divergence & Curl)
   * to guarantee all points, vortices, indicator rings, and streamlines fit inside
   * the visible viewport on any screen aspect ratio (mobile portrait, tablet, or desktop).
   */
  get2DCameraDistance() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    const aspect = width / (height || 1);

    // Required half-extents in world units to view all 4 points/vortices with arrows & comfortable padding:
    // Divergence points: x = ±1.8 (plus rings/arrows r ≈ 0.9 => 2.7)
    // Curl vortices: x = ±2.2 (plus rings/arrows r ≈ 0.85 => 3.05, streamlines out to 3.4)
    const requiredHalfWidth = 3.6;
    const requiredHalfHeight = 2.8;
    const tanFovHalf = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));

    const distForWidth = requiredHalfWidth / (tanFovHalf * aspect);
    const distForHeight = requiredHalfHeight / tanFovHalf;

    // Default distance is 7.8 on desktop (aspect >= 1.4), scaling up proportionally on narrow mobile portrait
    return Math.max(7.8, distForWidth, distForHeight);
  }

  resetCamera(topicId = this.currentTopicId) {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    const aspect = width / (height || 1);
    const portraitScale = aspect < 1.0 ? Math.min(2.0, 0.95 / aspect) : 1.0;

    if (topicId === 'divergence' || topicId === 'curl') {
      this.camera.up.set(0, 1, 0);
      const zDist = this.get2DCameraDistance();
      this.camera.position.set(0, 0, zDist);
      this.controls.target.set(0, 0, 0);
      // Divergence & Curl: 2D top-down view - disable rotate, allow pan & zoom
      this.controls.enableRotate = false;
      this.controls.enablePan = true;
      this.controls.enableZoom = true;
      this.controls.screenSpacePanning = true;
      this.controls.maxDistance = 60;
      this.controls.minDistance = 1;
      this.controls.mouseButtons = {
        LEFT: THREE.MOUSE.PAN,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
      };
      this.controls.touches = {
        ONE: THREE.TOUCH.PAN,
        TWO: THREE.TOUCH.DOLLY_PAN
      };
    } else if (topicId === 'coords') {
      this.camera.up.set(0, 0, 1);
      this.camera.position.set(5.8 * portraitScale, 5.8 * portraitScale, 4.5 * portraitScale);
      this.controls.target.set(0.75, 0.75, 0.75);
      this.controls.enableRotate = true;
      this.controls.enablePan = true;
      this.controls.enableZoom = true;
      this.controls.screenSpacePanning = true;
      this.controls.maxDistance = 60;
      this.controls.minDistance = 1;
      this.controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
      };
      this.controls.touches = {
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN
      };
    } else {
      // gradient
      this.camera.up.set(0, 0, 1);
      this.camera.position.set(6.0 * portraitScale, 6.0 * portraitScale, 5.0 * portraitScale);
      this.controls.target.set(0, 0, 0.5);
      this.controls.enableRotate = true;
      this.controls.enablePan = true;
      this.controls.enableZoom = true;
      this.controls.screenSpacePanning = true;
      this.controls.maxDistance = 60;
      this.controls.minDistance = 1;
      this.controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
      };
      this.controls.touches = {
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN
      };
    }
    this.controls.update();
  }

  onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);

    // In 2D topics (Divergence & Curl), update camera Z distance dynamically on resize / orientation change
    if (this.currentTopicId === 'divergence' || this.currentTopicId === 'curl') {
      const zDist = this.get2DCameraDistance();
      this.camera.position.z = zDist;
      this.controls.update();
    }
  }

  /**
   * Deeply disposes geometries, materials, and textures inside a group
   */
  disposeGroup(group) {
    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);

      if (obj.isGroup) {
        this.disposeGroup(obj);
      } else {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      }
    }
  }

  loadTopic(topicId) {
    const topicModule = TOPICS[topicId];
    if (!topicModule) {
      console.error(`Module not found: ${topicId}`);
      return;
    }

    // Clear previous tool group
    this.disposeGroup(this.topicGroup);

    this.currentTopicId = topicId;
    this.currentTopicModule = topicModule;

    // Reset camera appropriately for topic
    this.resetCamera(topicId);

    // Update grid/axes helpers based on topic
    const is3D = topicId === 'coords' || topicId === 'gradient';
    this.gridHelper.visible = this.ui.state.showGrid && is3D;
    this.axesHelper.visible = this.ui.state.showGrid && is3D;

    // Initialize new tool module
    this.currentTopicModule.init(this.topicGroup, this.ui.state.coordSystem, {
      ...this.ui.state,
      group: this.topicGroup
    });

    // Update HUD
    const formulaData = this.currentTopicModule.getFormulaData(this.ui.state.coordSystem, this.ui.state);
    this.ui.updateHUD(formulaData);
  }

  onUIStateChange(state) {
    // Check if tool module changed
    if (state.topic !== this.currentTopicId) {
      this.loadTopic(state.topic);
      return;
    }

    // Toggle grid/axes visibility (only for 3D topics)
    const is3D = this.currentTopicId === 'coords' || this.currentTopicId === 'gradient';
    this.gridHelper.visible = state.showGrid && is3D;
    this.axesHelper.visible = state.showGrid && is3D;

    // Update tool with new parameters
    if (this.currentTopicModule) {
      this.currentTopicModule.update(this.clock.getElapsedTime(), state.coordSystem, {
        ...state,
        group: this.topicGroup
      });

      const formulaData = this.currentTopicModule.getFormulaData(state.coordSystem, state);
      this.ui.updateHUD(formulaData);
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const time = this.clock.getElapsedTime();
    this.controls.update();

    if (this.currentTopicModule) {
      this.currentTopicModule.update(time, this.ui.state.coordSystem, {
        ...this.ui.state,
        group: this.topicGroup
      });
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Bootstrap application on DOM load
window.addEventListener('DOMContentLoaded', () => {
  if (
    (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.isElectron) ||
    /electron/i.test(navigator.userAgent)
  ) {
    document.body.classList.add('is-electron');
  }
  new AppController();
});
