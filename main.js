/**
 * main.js - Main Application Controller
 * Three.js Scene, Camera, OrbitControls, Module Management, Render Loop, & KaTeX HUD Sync.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { UIController } from './ui.js';

// Import All 7 Topics
import * as CoordsTopic from './topics/coords.js';
import * as GradientTopic from './topics/gradient.js';
import * as DivergenceTopic from './topics/divergence.js';
import * as CurlTopic from './topics/curl.js';
import * as LaplacianTopic from './topics/laplacian.js';
import * as EFieldTopic from './topics/efield.js';
import * as EnergyTopic from './topics/energy.js';

// Topic Registry
const TOPICS = {
  coords: CoordsTopic,
  gradient: GradientTopic,
  divergence: DivergenceTopic,
  curl: CurlTopic,
  laplacian: LaplacianTopic,
  efield: EFieldTopic,
  energy: EnergyTopic
};

class AppController {
  constructor() {
    this.container = document.getElementById('canvas-wrapper');
    this.clock = new THREE.Clock();

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x07090e);

    this.camera = new THREE.PerspectiveCamera(
      45,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      100
    );
    this.camera.position.set(6, 5, 8);

    // WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    // Orbit Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 35;
    this.controls.minDistance = 1;

    // Helpers & Lighting
    this.initEnvironment();

    // Active Topic Container
    this.topicGroup = new THREE.Group();
    this.scene.add(this.topicGroup);

    // UI Controller
    this.ui = new UIController((newState) => this.onUIStateChange(newState));

    // Connect Reset Camera Button
    const resetCamBtn = document.getElementById('reset-camera-btn');
    if (resetCamBtn) {
      resetCamBtn.addEventListener('click', () => this.resetCamera());
    }

    // Active Topic State
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
    keyLight.position.set(10, 15, 10);
    this.scene.add(keyLight);

    // Fill Directional Light
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
    fillLight.position.set(-10, -5, -10);
    this.scene.add(fillLight);

    // Coordinate Grid Helper
    this.gridHelper = new THREE.GridHelper(10, 20, 0x334155, 0x1e293b);
    this.gridHelper.position.y = -0.01;
    this.scene.add(this.gridHelper);

    // World Axes Helper (Red = X, Green = Y, Blue = Z)
    this.axesHelper = new THREE.AxesHelper(5);
    this.scene.add(this.axesHelper);
  }

  resetCamera() {
    this.camera.position.set(6, 5, 8);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
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

    // Clear previous topic group
    this.disposeGroup(this.topicGroup);

    this.currentTopicId = topicId;
    this.currentTopicModule = topicModule;

    // Initialize new topic module
    this.currentTopicModule.init(this.topicGroup, this.ui.state.coordSystem, {
      ...this.ui.state,
      group: this.topicGroup
    });

    // Update HUD
    const formulaData = this.currentTopicModule.getFormulaData(this.ui.state.coordSystem, this.ui.state);
    this.ui.updateHUD(formulaData);
  }

  onUIStateChange(state) {
    // Check if topic module changed
    if (state.topic !== this.currentTopicId) {
      this.loadTopic(state.topic);
      return;
    }

    // Toggle grid/axes visibility
    this.gridHelper.visible = state.showGrid;
    this.axesHelper.visible = state.showGrid;

    // Update topic with new parameters
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
  new AppController();
});
