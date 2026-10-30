/**
 * topics/divergence.js - Divergence of a Vector (∇·A)
 * Demonstrates ∇·A and Gauss's Divergence Theorem ∮ A·dS = ∫ (∇·A) dv
 * across Cartesian, Cylindrical, and Spherical coordinate systems,
 * with animated particle tracers and dynamic Gaussian flux surfaces.
 */

import * as THREE from 'three';
import {
  COORD_SYSTEMS,
  toCartesian,
  fromCartesian,
  curvilinearVectorToCartesian,
  computeDivergence,
  getMetricFactors
} from '../math.js';

let arrowsGroup = null;
let particlesGroup = null;
let gaussianGroup = null;
let probeGroup = null;

let gaussianMesh = null;
let particlePositions = null;
let particleGeometry = null;
let particlesMesh = null;
let particleData = []; // { x, y, z, vx, vy, vz, life, maxLife }

const NUM_PARTICLES = 250;

/**
 * Evaluates vector field A at point u in curvilinear basis [A1, A2, A3]
 */
function evalVectorField(u, coordSystem, isSolenoidal) {
  if (isSolenoidal) {
    // Solenoidal Mode (∇·A = 0)
    switch (coordSystem) {
      case COORD_SYSTEMS.CARTESIAN:
        // A = -y ax + x ay + 0 az => ∇·A = 0
        return [-u[1], u[0], 0];

      case COORD_SYSTEMS.CYLINDRICAL: {
        // G = 2 * e^(-2z) * (rho a_rho + a_z) => ∇·G = (1/rho)*d/drho(2 rho^2 e^(-2z)) + d/dz(2 e^(-2z)) = 4 e^(-2z) - 4 e^(-2z) = 0
        const rho = Math.max(0.1, u[0]);
        const z = Math.max(-2, Math.min(2, u[2]));
        const expTerm = Math.exp(-z);
        return [rho * expTerm, 0, expTerm];
      }

      case COORD_SYSTEMS.SPHERICAL: {
        // A = (2 / r²) a_r => (1/r²)*d/dr(r² * 2/r²) = (1/r²)*d/dr(2) = 0 (for r > 0)
        const r = Math.max(0.3, u[0]);
        return [2.0 / (r * r), 0, 0];
      }

      default:
        return [0, 0, 0];
    }
  } else {
    // Source / Sink Mode (∇·A ≠ 0)
    switch (coordSystem) {
      case COORD_SYSTEMS.CARTESIAN:
        // A = 0.5 (x ax + y ay + z az) => ∇·A = 1.5
        return [0.5 * u[0], 0.5 * u[1], 0.5 * u[2]];

      case COORD_SYSTEMS.CYLINDRICAL: {
        // A = rho a_rho + 0.5 z a_z => (1/rho) d/drho(rho²) + 0.5 = 2 + 0.5 = 2.5
        const rho = Math.max(0.1, u[0]);
        return [rho, 0, 0.5 * u[2]];
      }

      case COORD_SYSTEMS.SPHERICAL: {
        // A = 0.8 r a_r => (1/r²) d/dr(0.8 r³) = 2.4
        const r = Math.max(0.2, u[0]);
        return [0.8 * r, 0, 0];
      }

      default:
        return [0, 0, 0];
    }
  }
}

/**
 * Calculates analytical divergence value for current active field
 */
function evalAnalyticalDivergence(u, coordSystem, isSolenoidal) {
  if (isSolenoidal) return 0.0;
  switch (coordSystem) {
    case COORD_SYSTEMS.CARTESIAN: return 1.5;
    case COORD_SYSTEMS.CYLINDRICAL: return 2.5;
    case COORD_SYSTEMS.SPHERICAL: return 2.4;
    default: return 0.0;
  }
}

/**
 * Uniform Topic Module Contract: init()
 */
export function init(group, coordSystem, params) {
  arrowsGroup = new THREE.Group();
  particlesGroup = new THREE.Group();
  gaussianGroup = new THREE.Group();
  probeGroup = new THREE.Group();

  group.add(arrowsGroup);
  group.add(particlesGroup);
  group.add(gaussianGroup);
  group.add(probeGroup);

  // Probe marker
  const pGeo = new THREE.SphereGeometry(0.08, 20, 20);
  const pMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.9,
    roughness: 0.2
  });
  const probeMarker = new THREE.Mesh(pGeo, pMat);
  probeGroup.add(probeMarker);

  buildFieldGrid(coordSystem, params);
  initParticles();
  buildGaussianSurface(coordSystem, params);
  updateGaussianSurface(coordSystem, params);
}

/**
 * Builds 3D vector arrow grid
 */
function buildFieldGrid(coordSystem, params) {
  while (arrowsGroup.children.length > 0) {
    const child = arrowsGroup.children.pop();
    if (child.dispose) child.dispose();
  }

  const isSolenoidal = params.modeSecondary;
  const span = 2.8;
  const step = 1.4;

  for (let x = -span; x <= span; x += step) {
    for (let y = -span; y <= span; y += step) {
      for (let z = -span; z <= span; z += step) {
        if (Math.abs(x) < 0.2 && Math.abs(y) < 0.2 && Math.abs(z) < 0.2) continue;

        const u = fromCartesian({ x, y, z }, coordSystem);
        const A = evalVectorField(u, coordSystem, isSolenoidal);
        const worldA = curvilinearVectorToCartesian(A, u, coordSystem);
        const mag = Math.sqrt(worldA.x ** 2 + worldA.y ** 2 + worldA.z ** 2);
        if (mag < 0.05) continue;

        const dir = new THREE.Vector3(worldA.x, worldA.y, worldA.z).normalize();
        const len = Math.min(0.85, Math.max(0.2, mag * 0.35));

        // Color based on solenoidal vs source
        const color = isSolenoidal ? 0x10b981 : 0x06b6d4;

        const arrow = new THREE.ArrowHelper(
          dir,
          new THREE.Vector3(x, y, z),
          len,
          color,
          len * 0.35,
          len * 0.18
        );
        arrow.line.material.transparent = true;
        arrow.line.material.opacity = 0.6;
        arrowsGroup.add(arrow);
      }
    }
  }
}

/**
 * Initializes animated particle tracers
 */
function initParticles() {
  particlePositions = new Float32Array(NUM_PARTICLES * 3);
  particleData = [];

  for (let i = 0; i < NUM_PARTICLES; i++) {
    const r = 0.3 + Math.random() * 2.8;
    const theta = Math.random() * Math.PI;
    const phi = Math.random() * 2 * Math.PI;

    const x = r * Math.sin(theta) * Math.cos(phi);
    const y = r * Math.sin(theta) * Math.sin(phi);
    const z = r * Math.cos(theta);

    particlePositions[i * 3] = x;
    particlePositions[i * 3 + 1] = y;
    particlePositions[i * 3 + 2] = z;

    particleData.push({
      x, y, z,
      life: Math.random() * 60,
      maxLife: 60 + Math.random() * 60
    });
  }

  particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

  const particleMaterial = new THREE.PointsMaterial({
    color: 0x38bdf8,
    size: 0.08,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending
  });

  particlesMesh = new THREE.Points(particleGeometry, particleMaterial);
  particlesGroup.add(particlesMesh);
}

/**
 * Updates particle positions along the vector field
 */
function updateParticles(coordSystem, isSolenoidal, dt = 0.016) {
  if (!particlePositions) return;

  for (let i = 0; i < NUM_PARTICLES; i++) {
    const p = particleData[i];
    p.life++;

    if (p.life > p.maxLife || Math.abs(p.x) > 3.5 || Math.abs(p.y) > 3.5 || Math.abs(p.z) > 3.5) {
      // Respawn near center or domain edge
      const r = isSolenoidal ? 0.8 + Math.random() * 2.0 : 0.2 + Math.random() * 0.6;
      const th = Math.random() * Math.PI;
      const ph = Math.random() * 2 * Math.PI;
      p.x = r * Math.sin(th) * Math.cos(ph);
      p.y = r * Math.sin(th) * Math.sin(ph);
      p.z = r * Math.cos(th);
      p.life = 0;
    } else {
      const u = fromCartesian({ x: p.x, y: p.y, z: p.z }, coordSystem);
      const A = evalVectorField(u, coordSystem, isSolenoidal);
      const worldA = curvilinearVectorToCartesian(A, u, coordSystem);

      // Euler integration
      const speed = isSolenoidal ? 1.4 : 1.1;
      p.x += worldA.x * dt * speed;
      p.y += worldA.y * dt * speed;
      p.z += worldA.z * dt * speed;
    }

    particlePositions[i * 3] = p.x;
    particlePositions[i * 3 + 1] = p.y;
    particlePositions[i * 3 + 2] = p.z;
  }

  particleGeometry.attributes.position.needsUpdate = true;
}

/**
 * Builds the closed Gaussian surface matched to active coordinate geometry
 */
function buildGaussianSurface(coordSystem, params) {
  while (gaussianGroup.children.length > 0) {
    const child = gaussianGroup.children.pop();
    if (child.geometry) child.geometry.dispose();
    if (child.material) child.material.dispose();
  }

  const mat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    transparent: true,
    opacity: 0.45,
    roughness: 0.3,
    metalness: 0.1,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  switch (coordSystem) {
    case COORD_SYSTEMS.CARTESIAN: {
      // Gaussian Box
      const geo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
      gaussianMesh = new THREE.Mesh(geo, mat);
      break;
    }
    case COORD_SYSTEMS.CYLINDRICAL: {
      // Gaussian Cylinder
      const geo = new THREE.CylinderGeometry(0.45, 0.45, 0.8, 24);
      gaussianMesh = new THREE.Mesh(geo, mat);
      break;
    }
    case COORD_SYSTEMS.SPHERICAL: {
      // Gaussian Sphere
      const geo = new THREE.SphereGeometry(0.5, 24, 20);
      gaussianMesh = new THREE.Mesh(geo, mat);
      break;
    }
  }

  const wireGeo = new THREE.WireframeGeometry(gaussianMesh.geometry);
  const wire = new THREE.LineSegments(wireGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 }));
  gaussianMesh.add(wire);

  gaussianGroup.add(gaussianMesh);
}

/**
 * Updates Gaussian surface position and flux color
 */
function updateGaussianSurface(coordSystem, params) {
  const u = params.u;
  const isSolenoidal = params.modeSecondary;
  const pCart = toCartesian(u, coordSystem);

  if (gaussianMesh) {
    gaussianMesh.position.set(pCart.x, pCart.y, pCart.z);

    const div = evalAnalyticalDivergence(u, coordSystem, isSolenoidal);

    // Color code flux:
    // Red for positive outward flux (∇·A > 0)
    // Blue for negative inward flux (∇·A < 0)
    // Green for zero net flux (∇·A = 0, solenoidal)
    if (Math.abs(div) < 0.05) {
      gaussianMesh.material.color.setHex(0x10b981); // Emerald Green
    } else if (div > 0) {
      gaussianMesh.material.color.setHex(0xef4444); // Red
    } else {
      gaussianMesh.material.color.setHex(0x3b82f6); // Blue
    }
  }

  // Update probe marker
  if (probeGroup.children[0]) {
    probeGroup.children[0].position.set(pCart.x, pCart.y, pCart.z);
  }
}

/**
 * Uniform Topic Module Contract: update()
 */
export function update(time, coordSystem, params) {
  arrowsGroup.visible = params.showVectors;
  gaussianGroup.visible = params.showSurfaces;

  updateParticles(coordSystem, params.modeSecondary);
  updateGaussianSurface(coordSystem, params);
}

/**
 * Uniform Topic Module Contract: getFormulaData()
 */
export function getFormulaData(coordSystem, params) {
  const u = params.u;
  const isSolenoidal = params.modeSecondary;
  const divVal = evalAnalyticalDivergence(u, coordSystem, isSolenoidal);
  const A = evalVectorField(u, coordSystem, isSolenoidal);
  const worldA = curvilinearVectorToCartesian(A, u, coordSystem);

  let formulaLatex = '';
  let detailLatex = '';

  switch (coordSystem) {
    case COORD_SYSTEMS.CARTESIAN: {
      formulaLatex = `\\nabla \\cdot \\vec{A} = \\frac{\\partial A_x}{\\partial x} + \\frac{\\partial A_y}{\\partial y} + \\frac{\\partial A_z}{\\partial z}`;
      break;
    }
    case COORD_SYSTEMS.CYLINDRICAL: {
      formulaLatex = `\\nabla \\cdot \\vec{A} = \\frac{1}{\\rho}\\frac{\\partial(\\rho A_\\rho)}{\\partial \\rho} + \\frac{1}{\\rho}\\frac{\\partial A_\\phi}{\\partial \\phi} + \\frac{\\partial A_z}{\\partial z}`;
      break;
    }
    case COORD_SYSTEMS.SPHERICAL: {
      formulaLatex = `\\nabla \\cdot \\vec{A} = \\frac{1}{r^2}\\frac{\\partial(r^2 A_r)}{\\partial r} + \\frac{1}{r \\sin\\theta}\\frac{\\partial(\\sin\\theta A_\\theta)}{\\partial \\theta} + \\frac{1}{r \\sin\\theta}\\frac{\\partial A_\\phi}{\\partial \\phi}`;
      break;
    }
  }

  detailLatex = `\\begin{aligned}
\\oint_S \\vec{A} \\cdot d\\vec{S} &= \\int_V (\\nabla \\cdot \\vec{A})\\,dv \\quad \\text{(Gauss's Divergence Theorem)} \\\\
\\nabla \\cdot \\vec{A} &= ${divVal.toFixed(2)} \\quad \\left[\\text{Net Flux: } ${divVal > 0 ? '\\text{Outward (+)}' : (divVal < 0 ? '\\text{Inward (-)}' : '\\text{Zero (Solenoidal)}')}\\right]
\\end{aligned}`;

  const deltaV = 0.512; // volume of probe Gaussian surface ~ 0.8^3
  const approxFlux = divVal * deltaV;

  const readout = [
    { label: 'Field Type', value: isSolenoidal ? 'Solenoidal (∇·A = 0)' : 'Source/Sink (∇·A ≠ 0)' },
    { label: 'Divergence ∇·A at P', value: `${divVal.toFixed(3)} s⁻¹` },
    {
      label: 'Local Vector A(P)',
      value: `(${A[0].toFixed(2)}, ${A[1].toFixed(2)}, ${A[2].toFixed(2)})`,
      fullWidth: true
    },
    {
      label: 'Gaussian Net Outward Flux ∮ A·dS',
      value: `${approxFlux.toFixed(3)} flux units (ΔV ≈ ${deltaV} m³)`,
      fullWidth: true
    },
    {
      label: 'Gaussian Surface Status',
      value: Math.abs(divVal) < 0.05
        ? 'Green: Solenoidal (Zero Net Outflow)'
        : (divVal > 0 ? 'Red: Net Positive Outflow (Source)' : 'Blue: Net Negative Inflow (Sink)'),
      fullWidth: true
    }
  ];

  return {
    topicTag: 'Divergence',
    topicTitle: 'Divergence of a Vector (∇·A)',
    modeBtnText: isSolenoidal ? 'Mode: Solenoidal (∇·A = 0)' : 'Mode: Source / Sink (∇·A ≠ 0)',
    modeDesc: isSolenoidal
      ? 'Source-free field. Gaussian surface is Green with zero net outward flux.'
      : 'Source/sink field. Tracers flow outward; Gaussian surface is Red (divergence source).',
    formulaLatex,
    detailTitle: "Gauss's Divergence Theorem Evaluation",
    detailLatex,
    readout
  };
}

