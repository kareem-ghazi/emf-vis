/**
 * topics/energy.js - Energy in Electrostatic Fields (We)
 * Visualizes Electrostatic Energy Density we = 1/2 eps |E|² and Total Stored Energy We = ∫ we dv
 * across Cartesian, Cylindrical, and Spherical coordinate systems,
 * with a 3D volumetric energy cloud, dynamic coordinate integration volumes,
 * and a dielectric permittivity toggle (Free Space eps_r = 1 vs Dielectric eps_r = 4).
 */

import * as THREE from 'three';
import {
  COORD_SYSTEMS,
  toCartesian,
  fromCartesian,
  getMetricFactors
} from '../math.js';

let cloudGroup = null;
let volumeGroup = null;
let probeGroup = null;

let cloudPoints = null;
let cloudGeometry = null;
let volumeMesh = null;
let probeMarker = null;

const NUM_ENERGY_POINTS = 350;
const EPS0 = 8.854e-12; // Farads/meter

/**
 * Electric field magnitude |E| at Cartesian position {x, y, z}
 */
function evalFieldMagnitude(x, y, z, coordSystem) {
  switch (coordSystem) {
    case COORD_SYSTEMS.CARTESIAN: {
      // Parallel plate field between z = -1.5 and 1.5, fringing outside
      if (Math.abs(z) <= 1.5) return 2.0;
      return 2.0 * Math.exp(-Math.abs(z) + 1.5);
    }
    case COORD_SYSTEMS.CYLINDRICAL: {
      // Line charge: E = 2.5 / rho
      const rho = Math.max(0.25, Math.sqrt(x * x + y * y));
      return 2.5 / rho;
    }
    case COORD_SYSTEMS.SPHERICAL: {
      // Point charge: E = 3.5 / r²
      const r = Math.max(0.35, Math.sqrt(x * x + y * y + z * z));
      return 3.5 / (r * r);
    }
    default:
      return 1.0;
  }
}

/**
 * Computes energy density we = 0.5 * eps0 * epsR * |E|²
 */
function evalEnergyDensity(x, y, z, coordSystem, epsR) {
  const E = evalFieldMagnitude(x, y, z, coordSystem);
  // Scale energy density display to intuitive nanojoules/m³ or standardized units
  return 0.5 * EPS0 * epsR * (E ** 2) * 1e9; // in nJ/m³
}

/**
 * Uniform Topic Module Contract: init()
 */
export function init(group, coordSystem, params) {
  cloudGroup = new THREE.Group();
  volumeGroup = new THREE.Group();
  probeGroup = new THREE.Group();

  group.add(cloudGroup);
  group.add(volumeGroup);
  group.add(probeGroup);

  // Probe marker
  const pGeo = new THREE.SphereGeometry(0.08, 20, 20);
  const pMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.9,
    roughness: 0.2
  });
  probeMarker = new THREE.Mesh(pGeo, pMat);
  probeGroup.add(probeMarker);

  buildEnergyCloud(coordSystem, params);
  buildIntegrationVolume(coordSystem, params);
  updateVolumeAndProbe(coordSystem, params);
}

/**
 * Builds 3D Volumetric Energy Density Point Cloud
 */
function buildEnergyCloud(coordSystem, params) {
  while (cloudGroup.children.length > 0) {
    const child = cloudGroup.children.pop();
    if (child.geometry) child.geometry.dispose();
    if (child.material) child.material.dispose();
  }

  const epsR = params.modeSecondary ? 4.0 : 1.0;
  const positions = new Float32Array(NUM_ENERGY_POINTS * 3);
  const colors = new Float32Array(NUM_ENERGY_POINTS * 3);

  for (let i = 0; i < NUM_ENERGY_POINTS; i++) {
    const r = 0.4 + Math.random() * 2.8;
    const th = Math.random() * Math.PI;
    const ph = Math.random() * 2 * Math.PI;

    const x = r * Math.sin(th) * Math.cos(ph);
    const y = r * Math.sin(th) * Math.sin(ph);
    const z = r * Math.cos(th);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    const we = evalEnergyDensity(x, y, z, coordSystem, epsR);
    // Color map: Low energy -> Cyan/Blue, High energy -> Yellow/Orange/Red
    const norm = Math.min(1.0, we / (0.1 * epsR));
    const col = new THREE.Color().setHSL(0.65 * (1.0 - norm), 0.95, 0.55);

    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }

  cloudGeometry = new THREE.BufferGeometry();
  cloudGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  cloudGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const cloudMaterial = new THREE.PointsMaterial({
    size: 0.12,
    vertexColors: true,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending
  });

  cloudPoints = new THREE.Points(cloudGeometry, cloudMaterial);
  cloudGroup.add(cloudPoints);
}

/**
 * Builds coordinate-matched Integration Volume V
 */
function buildIntegrationVolume(coordSystem, params) {
  while (volumeGroup.children.length > 0) {
    const child = volumeGroup.children.pop();
    if (child.geometry) child.geometry.dispose();
    if (child.material) child.material.dispose();
  }

  const mat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b, // Amber glow
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    depthWrite: false,
    roughness: 0.3,
    metalness: 0.1
  });

  switch (coordSystem) {
    case COORD_SYSTEMS.CARTESIAN: {
      // Integration Box: dx = 1.0, dy = 1.0, dz = 1.0
      const geo = new THREE.BoxGeometry(1.0, 1.0, 1.0);
      volumeMesh = new THREE.Mesh(geo, mat);
      break;
    }
    case COORD_SYSTEMS.CYLINDRICAL: {
      // Integration Cylindrical Shell: radius 0.6, height 1.0
      const geo = new THREE.CylinderGeometry(0.6, 0.6, 1.0, 24);
      volumeMesh = new THREE.Mesh(geo, mat);
      break;
    }
    case COORD_SYSTEMS.SPHERICAL: {
      // Integration Spherical Shell: radius 0.75
      const geo = new THREE.SphereGeometry(0.75, 24, 20);
      volumeMesh = new THREE.Mesh(geo, mat);
      break;
    }
  }

  const edges = new THREE.EdgesGeometry(volumeMesh.geometry);
  const edgeLine = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }));
  volumeMesh.add(edgeLine);

  volumeGroup.add(volumeMesh);
}

/**
 * Numerically integrates We = ∫ we dv over the integration volume V centered at P
 */
function integrateEnergy(pCart, coordSystem, epsR) {
  const samples = 4;
  let totalEnergy = 0;

  switch (coordSystem) {
    case COORD_SYSTEMS.CARTESIAN: {
      // Box [-0.5, 0.5]^3 => V = 1.0 m³
      const d = 1.0 / samples;
      const dV = d * d * d;
      for (let ix = 0; ix < samples; ix++) {
        for (let iy = 0; iy < samples; iy++) {
          for (let iz = 0; iz < samples; iz++) {
            const x = pCart.x - 0.5 + (ix + 0.5) * d;
            const y = pCart.y - 0.5 + (iy + 0.5) * d;
            const z = pCart.z - 0.5 + (iz + 0.5) * d;
            totalEnergy += evalEnergyDensity(x, y, z, coordSystem, epsR) * dV;
          }
        }
      }
      return { totalEnergy, volume: 1.0 };
    }

    case COORD_SYSTEMS.CYLINDRICAL: {
      // Cylinder: radius = 0.6, height = 1.0 => V = pi * r² * h ≈ 1.131 m³
      const volume = Math.PI * (0.6 ** 2) * 1.0;
      const dV = volume / (samples * samples * samples);
      for (let ir = 0; ir < samples; ir++) {
        for (let ip = 0; ip < samples; ip++) {
          for (let iz = 0; iz < samples; iz++) {
            const r = 0.6 * Math.sqrt((ir + 0.5) / samples);
            const phi = (ip / samples) * 2 * Math.PI;
            const z = pCart.z - 0.5 + ((iz + 0.5) / samples) * 1.0;
            const x = pCart.x + r * Math.cos(phi);
            const y = pCart.y + r * Math.sin(phi);
            totalEnergy += evalEnergyDensity(x, y, z, coordSystem, epsR) * dV;
          }
        }
      }
      return { totalEnergy, volume };
    }

    case COORD_SYSTEMS.SPHERICAL: {
      // Sphere: radius = 0.75 => V = 4/3 pi r³ ≈ 1.767 m³
      const volume = (4 / 3) * Math.PI * (0.75 ** 3);
      const dV = volume / (samples * samples * samples);
      for (let ir = 0; ir < samples; ir++) {
        for (let it = 0; it < samples; it++) {
          for (let ip = 0; ip < samples; ip++) {
            const rad = 0.75 * Math.cbrt((ir + 0.5) / samples);
            const th = Math.acos(2 * ((it + 0.5) / samples) - 1);
            const phi = (ip / samples) * 2 * Math.PI;
            const x = pCart.x + rad * Math.sin(th) * Math.cos(phi);
            const y = pCart.y + rad * Math.sin(th) * Math.sin(phi);
            const z = pCart.z + rad * Math.cos(th);
            totalEnergy += evalEnergyDensity(x, y, z, coordSystem, epsR) * dV;
          }
        }
      }
      return { totalEnergy, volume };
    }

    default:
      return { totalEnergy: 0, volume: 1.0 };
  }
}

/**
 * Updates integration volume position and probe marker
 */
function updateVolumeAndProbe(coordSystem, params) {
  const u = params.u;
  const pCart = toCartesian(u, coordSystem);

  if (volumeMesh) {
    volumeMesh.position.set(pCart.x, pCart.y, pCart.z);
  }
  if (probeMarker) {
    probeMarker.position.set(pCart.x, pCart.y, pCart.z);
  }
}

/**
 * Uniform Topic Module Contract: update()
 */
export function update(time, coordSystem, params) {
  cloudGroup.visible = params.showSurfaces;
  volumeGroup.visible = params.showSurfaces;

  // Slowly rotate cloud for subtle volumetric depth
  if (cloudPoints) {
    cloudPoints.rotation.y = time * 0.1;
  }

  updateVolumeAndProbe(coordSystem, params);
}

/**
 * Uniform Topic Module Contract: getFormulaData()
 */
export function getFormulaData(coordSystem, params) {
  const u = params.u;
  const epsR = params.modeSecondary ? 4.0 : 1.0;
  const pCart = toCartesian(u, coordSystem);

  const localWe = evalEnergyDensity(pCart.x, pCart.y, pCart.z, coordSystem, epsR);
  const { totalEnergy, volume } = integrateEnergy(pCart, coordSystem, epsR);
  const localE = evalFieldMagnitude(pCart.x, pCart.y, pCart.z, coordSystem);

  const formulaLatex = `\\begin{aligned}
w_e &= \\frac{1}{2}\\vec{D}\\cdot\\vec{E} = \\frac{1}{2}\\epsilon_0\\epsilon_r |\\vec{E}|^2 \\quad (\\text{J/m}^3) \\\\
W_e &= \\int_V \\frac{1}{2}\\epsilon_0\\epsilon_r |\\vec{E}|^2\\,dv \\quad (\\text{J})
\\end{aligned}`;

  let detailLatex = '';
  switch (coordSystem) {
    case COORD_SYSTEMS.CARTESIAN: {
      detailLatex = `W_e = \\int_V w_e\\,dx\\,dy\\,dz \\quad (\\text{Rectangular Box Volume } V = 1.00\\text{ m}^3)`;
      break;
    }
    case COORD_SYSTEMS.CYLINDRICAL: {
      detailLatex = `W_e = \\int_V w_e\\,\\rho\\,d\\rho\\,d\\phi\\,dz \\quad (\\text{Cylindrical Shell Volume } V = ${volume.toFixed(2)}\\text{ m}^3)`;
      break;
    }
    case COORD_SYSTEMS.SPHERICAL: {
      detailLatex = `W_e = \\int_V w_e\\,r^2\\sin\\theta\\,dr\\,d\\theta\\,d\\phi \\quad (\\text{Spherical Shell Volume } V = ${volume.toFixed(2)}\\text{ m}^3)`;
      break;
    }
  }

  const readout = [
    { label: 'Medium Permittivity', value: epsR === 1.0 ? 'Free Space (εᵣ = 1.0)' : 'Dielectric Material (εᵣ = 4.0)' },
    { label: 'Local Field |E| at P', value: `${localE.toFixed(2)} V/m` },
    {
      label: 'Local Energy Density we(P)',
      value: `${localWe.toFixed(3)} nJ/m³  (0.5 ε₀ εᵣ |E|²)`,
      fullWidth: true
    },
    {
      label: 'Total Integrated Stored Energy We',
      value: `${totalEnergy.toFixed(3)} nJ (over volume V = ${volume.toFixed(2)} m³)`,
      fullWidth: true
    },
    {
      label: 'Integration Volume Geometry',
      value: `Coordinate-aligned volume element centered at probe point P`,
      fullWidth: true
    }
  ];

  return {
    topicTag: 'Energy Density',
    topicTitle: 'Energy in Electrostatic Fields (We)',
    modeBtnText: epsR === 1.0 ? 'Medium: Free Space (εᵣ = 1.0)' : 'Medium: Dielectric (εᵣ = 4.0)',
    modeDesc: epsR === 1.0
      ? 'Free space vacuum (εᵣ = 1.0). Volumetric point cloud shows energy density.'
      : 'Dielectric medium (εᵣ = 4.0). Energy density we is quadrupled for the same electric field.',
    formulaLatex,
    detailTitle: 'Curvilinear Volume Energy Integral',
    detailLatex,
    readout
  };
}

