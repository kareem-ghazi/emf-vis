/**
 * topics/laplacian.js - Topic 5: The Laplacian Operator (∇²Φ)
 * Visualizes ∇²Φ = ∇·(∇Φ) across Cartesian, Cylindrical, and Spherical coordinate systems
 * using a 3D InstancedMesh lattice color-mapped by divergence/curvature,
 * featuring Harmonic (Laplace's Eq ∇²Φ = 0) vs Non-Harmonic (Poisson's Eq ∇²Φ ≠ 0) modes.
 */

import * as THREE from 'three';
import {
  COORD_SYSTEMS,
  toCartesian,
  fromCartesian,
  LAPLACIAN_FIELDS,
  computeLaplacian
} from '../math.js';

let latticeGroup = null;
let probeGroup = null;
let instancedMesh = null;
let probeSphere = null;
let probeHalo = null;

const LATTICE_COUNT_PER_AXIS = 7;
const TOTAL_INSTANCES = LATTICE_COUNT_PER_AXIS * LATTICE_COUNT_PER_AXIS * LATTICE_COUNT_PER_AXIS;

// Reusable Three.js objects to avoid GC pressure
const dummy = new THREE.Object3D();
const tempColor = new THREE.Color();

/**
 * Uniform Topic Module Contract: init()
 */
export function init(group, coordSystem, params) {
  latticeGroup = new THREE.Group();
  probeGroup = new THREE.Group();

  group.add(latticeGroup);
  group.add(probeGroup);

  // InstancedMesh for the 3D Lattice
  const sphereGeo = new THREE.SphereGeometry(0.1, 16, 12);
  const sphereMat = new THREE.MeshStandardMaterial({
    roughness: 0.3,
    metalness: 0.1,
    transparent: true,
    opacity: 0.75
  });
  instancedMesh = new THREE.InstancedMesh(sphereGeo, sphereMat, TOTAL_INSTANCES);
  instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  latticeGroup.add(instancedMesh);

  // Probe sphere at P
  const pGeo = new THREE.SphereGeometry(0.18, 24, 24);
  const pMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.8,
    roughness: 0.2
  });
  probeSphere = new THREE.Mesh(pGeo, pMat);

  // Pulsing halo ring around probe
  const ringGeo = new THREE.RingGeometry(0.25, 0.35, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6
  });
  probeHalo = new THREE.Mesh(ringGeo, ringMat);
  probeHalo.rotateX(Math.PI / 2);

  probeGroup.add(probeSphere);
  probeGroup.add(probeHalo);

  buildLattice(coordSystem, params);
  updateProbe(coordSystem, params);
}

/**
 * Maps a Laplacian value to a color:
 * - Blue for ∇²Φ < 0 (Concave / Negative Curvature)
 * - White/Translucent for ∇²Φ ≈ 0 (Harmonic / Zero Net Curvature)
 * - Red for ∇²Φ > 0 (Convex / Positive Curvature)
 */
function getLaplacianColor(val, maxRange = 2.0) {
  const norm = Math.max(-1, Math.min(1, val / maxRange));
  if (Math.abs(norm) < 0.05) {
    // Zero curvature (Harmonic) -> subtle pale silver/white
    return tempColor.setRGB(0.85, 0.9, 0.95);
  } else if (norm > 0) {
    // Positive -> interpolate from white to vibrant orange/red
    return tempColor.setRGB(1.0, 1.0 - 0.7 * norm, 1.0 - 0.85 * norm);
  } else {
    // Negative -> interpolate from white to vibrant deep blue/cyan
    const absNorm = Math.abs(norm);
    return tempColor.setRGB(1.0 - 0.8 * absNorm, 1.0 - 0.5 * absNorm, 1.0);
  }
}

/**
 * Evaluates active Laplacian field at point u
 */
function evalField(u, coordSystem, isNonHarmonic) {
  const category = isNonHarmonic ? LAPLACIAN_FIELDS.NON_HARMONIC : LAPLACIAN_FIELDS.HARMONIC;
  const fieldDef = category[coordSystem];
  if (!fieldDef) return { scalar: 0, laplacian: 0, fieldName: '' };

  const scalar = fieldDef.evalScalar(u);
  const laplacian = fieldDef.evalLaplacian(u);
  return {
    scalar,
    laplacian,
    fieldName: fieldDef.name
  };
}

/**
 * Builds and color-maps the 3D lattice of sample spheres
 */
function buildLattice(coordSystem, params) {
  const isNonHarmonic = params.modeSecondary;
  const span = 2.6;
  const step = (span * 2) / (LATTICE_COUNT_PER_AXIS - 1);

  let idx = 0;
  for (let i = 0; i < LATTICE_COUNT_PER_AXIS; i++) {
    const x = -span + i * step;
    for (let j = 0; j < LATTICE_COUNT_PER_AXIS; j++) {
      const y = -span + j * step;
      for (let k = 0; k < LATTICE_COUNT_PER_AXIS; k++) {
        const z = -span + k * step;

        const u = fromCartesian({ x, y, z }, coordSystem);
        const { laplacian } = evalField(u, coordSystem, isNonHarmonic);

        // Adjust scale based on Laplacian magnitude (harmonic spheres are smaller)
        const absVal = Math.abs(laplacian);
        const scale = isNonHarmonic ? 0.08 + Math.min(0.12, absVal * 0.04) : 0.07;

        dummy.position.set(x, y, z);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();

        instancedMesh.setMatrixAt(idx, dummy.matrix);

        const col = getLaplacianColor(laplacian, isNonHarmonic ? 3.0 : 1.0);
        instancedMesh.setColorAt(idx, col);

        idx++;
      }
    }
  }

  instancedMesh.instanceMatrix.needsUpdate = true;
  if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;
}

/**
 * Updates probe marker at P
 */
function updateProbe(coordSystem, params) {
  const u = params.u;
  const isNonHarmonic = params.modeSecondary;
  const pCart = toCartesian(u, coordSystem);

  probeSphere.position.set(pCart.x, pCart.y, pCart.z);
  probeHalo.position.set(pCart.x, pCart.y, pCart.z);

  const { laplacian } = evalField(u, coordSystem, isNonHarmonic);
  const col = getLaplacianColor(laplacian, isNonHarmonic ? 3.0 : 1.0);

  probeSphere.material.color.copy(col);
  probeSphere.material.emissive.copy(col).multiplyScalar(0.6);
  probeHalo.material.color.copy(col);
}

/**
 * Uniform Topic Module Contract: update()
 */
export function update(time, coordSystem, params) {
  latticeGroup.visible = params.showSurfaces;

  // Gentle breathing animation for probe halo
  if (probeHalo) {
    const s = 1.0 + 0.15 * Math.sin(time * 3);
    probeHalo.scale.set(s, s, s);
  }

  // Update lattice if mode toggled
  buildLattice(coordSystem, params);
  updateProbe(coordSystem, params);
}

/**
 * Uniform Topic Module Contract: getFormulaData()
 */
export function getFormulaData(coordSystem, params) {
  const u = params.u;
  const isNonHarmonic = params.modeSecondary;
  const { scalar, laplacian, fieldName } = evalField(u, coordSystem, isNonHarmonic);

  let formulaLatex = '';
  let detailLatex = '';

  switch (coordSystem) {
    case COORD_SYSTEMS.CARTESIAN: {
      formulaLatex = `\\nabla^2 \\Phi = \\frac{\\partial^2 \\Phi}{\\partial x^2} + \\frac{\\partial^2 \\Phi}{\\partial y^2} + \\frac{\\partial^2 \\Phi}{\\partial z^2}`;
      break;
    }
    case COORD_SYSTEMS.CYLINDRICAL: {
      formulaLatex = `\\nabla^2 \\Phi = \\frac{1}{\\rho}\\frac{\\partial}{\\partial \\rho}\\left(\\rho \\frac{\\partial \\Phi}{\\partial \\rho}\\right) + \\frac{1}{\\rho^2}\\frac{\\partial^2 \\Phi}{\\partial \\phi^2} + \\frac{\\partial^2 \\Phi}{\\partial z^2}`;
      break;
    }
    case COORD_SYSTEMS.SPHERICAL: {
      formulaLatex = `\\nabla^2 \\Phi = \\frac{1}{r^2}\\frac{\\partial}{\\partial r}\\left(r^2 \\frac{\\partial \\Phi}{\\partial r}\\right) + \\frac{1}{r^2 \\sin\\theta}\\frac{\\partial}{\\partial \\theta}\\left(\\sin\\theta \\frac{\\partial \\Phi}{\\partial \\theta}\\right) + \\frac{1}{r^2 \\sin^2\\theta}\\frac{\\partial^2 \\Phi}{\\partial \\phi^2}`;
      break;
    }
  }

  if (!isNonHarmonic) {
    // Harmonic Mode
    detailLatex = `\\begin{aligned}
\\text{Field: } & ${fieldName} \\\\
\\nabla^2 \\Phi &= 0 \\quad \\text{(Laplace's Equation)} \\\\
\\rho_v &= -\\epsilon_0 \\nabla^2 \\Phi = 0 \\quad \\text{(Charge-Free Region)}
\\end{aligned}`;
  } else {
    // Non-Harmonic Mode
    detailLatex = `\\begin{aligned}
\\text{Field: } & ${fieldName} \\\\
\\nabla^2 \\Phi &= ${laplacian.toFixed(3)} \\neq 0 \\quad \\text{(Poisson's Equation)} \\\\
\\rho_v &= -\\epsilon_0 \\nabla^2 \\Phi \\quad \\text{(Volume Charge Source)}
\\end{aligned}`;
  }

  const readout = [
    { label: 'Field Mode', value: isNonHarmonic ? "Poisson (∇²Φ ≠ 0)" : "Laplace (∇²Φ = 0, Harmonic)" },
    { label: 'Scalar Potential Φ(P)', value: `${scalar.toFixed(3)} V` },
    {
      label: 'Laplacian ∇²Φ at P',
      value: `${laplacian.toFixed(4)} m⁻²`,
      fullWidth: true
    },
    {
      label: 'Local Curvature Status',
      value: Math.abs(laplacian) < 0.001
        ? 'Harmonic (Mean Value Property holds)'
        : (laplacian > 0 ? 'Convex / Gradient Divergence Source (Well)' : 'Concave / Gradient Divergence Sink (Peak)'),
      fullWidth: true
    }
  ];

  return {
    topicTag: 'Laplacian',
    topicTitle: 'The Laplacian Operator (∇²Φ)',
    modeBtnText: isNonHarmonic ? 'Toggle: Harmonic Mode (∇²Φ = 0)' : 'Toggle: Non-Harmonic Mode (∇²Φ ≠ 0)',
    modeDesc: isNonHarmonic
      ? "Non-Harmonic field (Poisson's Eq). Red: ∇²Φ > 0, Blue: ∇²Φ < 0."
      : "Harmonic field (Laplace's Eq ∇²Φ = 0 everywhere). Notice uniform pale lattice.",
    formulaLatex,
    detailTitle: 'Laplacian & Electrostatic Poisson Formulation',
    detailLatex,
    readout
  };
}

