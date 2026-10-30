/**
 * topics/efield.js - Electric Field Intensity (E)
 * Visualizes Coulomb's Law, field lines, and test charge probe Qt across
 * Cartesian, Cylindrical, and Spherical coordinate systems,
 * with a mode toggle between Canonical Symmetry Charges and an Electric Dipole.
 */

import * as THREE from 'three';
import {
  COORD_SYSTEMS,
  toCartesian,
  fromCartesian,
  curvilinearVectorToCartesian,
  cartesianVectorToCurvilinear,
  getUnitVectors
} from '../math.js';

let arrowsGroup = null;
let streamlinesGroup = null;
let sourcesGroup = null;
let probeGroup = null;

let probeTestCharge = null;
let eVectorArrow = null;
let projectionArrows = [];

const EPS0 = 8.854e-12; // Permittivity of free space
const K_E = 1.0; // Scaled Coulomb constant for visualization

/**
 * Computes electric field E (in Cartesian {x,y,z}) and potential V
 */
function evalElectricField(cartPos, coordSystem, isDipole) {
  const { x, y, z } = cartPos;

  if (isDipole) {
    // Electric Dipole: +Q at (0, 0, 1.2), -Q at (0, 0, -1.2)
    const d = 1.2;
    const Q = 2.0;

    const rPlus = { x, y, z: z - d };
    const distPlus = Math.max(0.2, Math.sqrt(rPlus.x ** 2 + rPlus.y ** 2 + rPlus.z ** 2));
    const factorPlus = (K_E * Q) / (distPlus ** 3);

    const rMinus = { x, y, z: z + d };
    const distMinus = Math.max(0.2, Math.sqrt(rMinus.x ** 2 + rMinus.y ** 2 + rMinus.z ** 2));
    const factorMinus = (K_E * Q) / (distMinus ** 3);

    const Ex = factorPlus * rPlus.x - factorMinus * rMinus.x;
    const Ey = factorPlus * rPlus.y - factorMinus * rMinus.y;
    const Ez = factorPlus * rPlus.z - factorMinus * rMinus.z;

    const V = (K_E * Q) / distPlus - (K_E * Q) / distMinus;

    return { Ex, Ey, Ez, V, mag: Math.sqrt(Ex * Ex + Ey * Ey + Ez * Ez) };
  } else {
    // Canonical Symmetry Charge
    switch (coordSystem) {
      case COORD_SYSTEMS.CARTESIAN: {
        // Parallel charged sheets at z = -1.5 (negative) and z = +1.5 (positive)
        // Uniform field between plates Ez ~ -1.5, fringing outside
        let Ez = 0;
        let V = 0;
        if (Math.abs(z) <= 1.5) {
          Ez = -1.5;
          V = 1.5 * z;
        } else {
          Ez = -1.5 * Math.exp(-Math.abs(z) + 1.5);
          V = Math.sign(z) * 2.25;
        }
        return { Ex: 0, Ey: 0, Ez, V, mag: Math.abs(Ez) };
      }

      case COORD_SYSTEMS.CYLINDRICAL: {
        // Infinite line charge along z-axis: E = (rho_L / 2pi eps0 rho) a_rho
        const rho = Math.max(0.3, Math.sqrt(x * x + y * y));
        const Erho = 2.0 / rho;
        const cosP = x / rho;
        const sinP = y / rho;
        const V = -2.0 * Math.log(rho);
        return {
          Ex: Erho * cosP,
          Ey: Erho * sinP,
          Ez: 0,
          V,
          mag: Erho
        };
      }

      case COORD_SYSTEMS.SPHERICAL: {
        // Point charge at the origin: E = (Q / 4pi eps0 r²) a_r
        const r = Math.max(0.4, Math.sqrt(x * x + y * y + z * z));
        const Er = 3.0 / (r * r);
        const V = 3.0 / r;
        return {
          Ex: Er * (x / r),
          Ey: Er * (y / r),
          Ez: Er * (z / r),
          V,
          mag: Er
        };
      }

      default:
        return { Ex: 0, Ey: 0, Ez: 0, V: 0, mag: 0 };
    }
  }
}

/**
 * Uniform Topic Module Contract: init()
 */
export function init(group, coordSystem, params) {
  arrowsGroup = new THREE.Group();
  streamlinesGroup = new THREE.Group();
  sourcesGroup = new THREE.Group();
  probeGroup = new THREE.Group();

  group.add(arrowsGroup);
  group.add(streamlinesGroup);
  group.add(sourcesGroup);
  group.add(probeGroup);

  // Probe Test Charge Qt
  const probeGeo = new THREE.SphereGeometry(0.12, 24, 24);
  const probeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.9,
    roughness: 0.2
  });
  probeTestCharge = new THREE.Mesh(probeGeo, probeMat);
  probeGroup.add(probeTestCharge);

  // E-field Force Arrow
  eVectorArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 0, 0),
    1.4,
    0xf59e0b,
    0.3,
    0.14
  );
  eVectorArrow.line.material.linewidth = 4;
  probeGroup.add(eVectorArrow);

  // 3 Component projection arrows
  projectionArrows = [
    new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 0.5, 0xef4444, 0.15, 0.08),
    new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 0.5, 0x10b981, 0.15, 0.08),
    new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), 0.5, 0x3b82f6, 0.15, 0.08)
  ];
  projectionArrows.forEach((arr) => probeGroup.add(arr));

  buildChargeSources(coordSystem, params);
  buildFieldGrid(coordSystem, params);
  buildStreamlines(coordSystem, params);
  updateProbe(coordSystem, params);
}

/**
 * Builds visible charge sources (plates, line, point charges, or dipole)
 */
function buildChargeSources(coordSystem, params) {
  while (sourcesGroup.children.length > 0) {
    const child = sourcesGroup.children.pop();
    if (child.geometry) child.geometry.dispose();
    if (child.material) child.material.dispose();
  }

  const isDipole = params.modeSecondary;

  if (isDipole) {
    // Dipole: +Q (Red) at (0, 0, 1.2), -Q (Blue) at (0, 0, -1.2)
    const posGeo = new THREE.SphereGeometry(0.25, 24, 24);
    const posMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.6 });
    const posMesh = new THREE.Mesh(posGeo, posMat);
    posMesh.position.set(0, 0, 1.2);

    const negGeo = new THREE.SphereGeometry(0.25, 24, 24);
    const negMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x3b82f6, emissiveIntensity: 0.6 });
    const negMesh = new THREE.Mesh(negGeo, negMat);
    negMesh.position.set(0, 0, -1.2);

    sourcesGroup.add(posMesh, negMesh);
  } else {
    // Canonical Symmetry Sources
    switch (coordSystem) {
      case COORD_SYSTEMS.CARTESIAN: {
        // Two parallel plates
        const plateGeo = new THREE.BoxGeometry(4.5, 4.5, 0.06);
        const topMat = new THREE.MeshStandardMaterial({ color: 0xef4444, transparent: true, opacity: 0.6 });
        const botMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.6 });

        const topPlate = new THREE.Mesh(plateGeo, topMat);
        topPlate.position.set(0, 0, 1.5);

        const botPlate = new THREE.Mesh(plateGeo, botMat);
        botPlate.position.set(0, 0, -1.5);

        sourcesGroup.add(topPlate, botPlate);
        break;
      }

      case COORD_SYSTEMS.CYLINDRICAL: {
        // Infinite line charge along z-axis (glowing amber cylinder)
        const lineGeo = new THREE.CylinderGeometry(0.06, 0.06, 7, 24);
        const lineMat = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          emissive: 0xf59e0b,
          emissiveIntensity: 0.8
        });
        const lineMesh = new THREE.Mesh(lineGeo, lineMat);
        sourcesGroup.add(lineMesh);
        break;
      }

      case COORD_SYSTEMS.SPHERICAL: {
        // Point charge at the origin (+Q Red)
        const ptGeo = new THREE.SphereGeometry(0.28, 24, 24);
        const ptMat = new THREE.MeshStandardMaterial({
          color: 0xef4444,
          emissive: 0xef4444,
          emissiveIntensity: 0.8
        });
        const ptMesh = new THREE.Mesh(ptGeo, ptMat);
        sourcesGroup.add(ptMesh);
        break;
      }
    }
  }
}

/**
 * Builds 3D vector arrow grid
 */
function buildFieldGrid(coordSystem, params) {
  while (arrowsGroup.children.length > 0) {
    const child = arrowsGroup.children.pop();
    if (child.dispose) child.dispose();
  }

  const isDipole = params.modeSecondary;
  const span = 2.6;
  const step = 1.3;

  for (let x = -span; x <= span; x += step) {
    for (let y = -span; y <= span; y += step) {
      for (let z = -span; z <= span; z += step) {
        if (Math.abs(x) < 0.25 && Math.abs(y) < 0.25 && Math.abs(z) < 0.25) continue;

        const { Ex, Ey, Ez, mag } = evalElectricField({ x, y, z }, coordSystem, isDipole);
        if (mag < 0.05) continue;

        const dir = new THREE.Vector3(Ex, Ey, Ez).normalize();
        const len = Math.min(0.85, Math.max(0.2, mag * 0.35));

        // Color based on field intensity
        const t = Math.min(1, mag / 2.5);
        const color = new THREE.Color().setHSL(0.15 - 0.15 * t, 1.0, 0.55);

        const arrow = new THREE.ArrowHelper(
          dir,
          new THREE.Vector3(x, y, z),
          len,
          color.getHex(),
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
 * Builds 3D streamline field curves
 */
function buildStreamlines(coordSystem, params) {
  while (streamlinesGroup.children.length > 0) {
    const child = streamlinesGroup.children.pop();
    if (child.geometry) child.geometry.dispose();
    if (child.material) child.material.dispose();
  }

  const isDipole = params.modeSecondary;
  const seedPoints = [];

  if (isDipole) {
    // Seeds surrounding positive charge (+Q at z = 1.2)
    for (let a = 0; a < 16; a++) {
      const angle = (a / 16) * 2 * Math.PI;
      seedPoints.push(new THREE.Vector3(0.35 * Math.cos(angle), 0.35 * Math.sin(angle), 1.2 + 0.1));
      seedPoints.push(new THREE.Vector3(0.35 * Math.cos(angle), 0.35 * Math.sin(angle), 1.2 - 0.1));
    }
  } else if (coordSystem === COORD_SYSTEMS.SPHERICAL) {
    // Radial streamlines from origin
    for (let a = 0; a < 20; a++) {
      const theta = Math.acos(2 * (a / 20) - 1);
      const phi = a * 2.399; // golden angle
      seedPoints.push(new THREE.Vector3(
        0.35 * Math.sin(theta) * Math.cos(phi),
        0.35 * Math.sin(theta) * Math.sin(phi),
        0.35 * Math.cos(theta)
      ));
    }
  } else if (coordSystem === COORD_SYSTEMS.CYLINDRICAL) {
    // Radial streamlines from z-axis
    for (let a = 0; a < 16; a++) {
      const angle = (a / 16) * 2 * Math.PI;
      for (const z of [-1.5, 0, 1.5]) {
        seedPoints.push(new THREE.Vector3(0.2 * Math.cos(angle), 0.2 * Math.sin(angle), z));
      }
    }
  } else {
    // Cartesian: vertical lines between plates
    for (let i = -1.5; i <= 1.5; i += 0.75) {
      for (let j = -1.5; j <= 1.5; j += 0.75) {
        seedPoints.push(new THREE.Vector3(i, j, 1.4));
      }
    }
  }

  const lineMat = new THREE.LineBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.65
  });

  seedPoints.forEach((seed) => {
    const pts = [seed.clone()];
    let cur = seed.clone();
    const dt = 0.08;
    const maxSteps = 45;

    for (let s = 0; s < maxSteps; s++) {
      const { Ex, Ey, Ez, mag } = evalElectricField(cur, coordSystem, isDipole);
      if (mag < 0.02 || cur.length() > 5.0) break;
      cur.x += (Ex / mag) * dt;
      cur.y += (Ey / mag) * dt;
      cur.z += (Ez / mag) * dt;
      pts.push(cur.clone());
    }

    if (pts.length > 2) {
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(geo, lineMat);
      streamlinesGroup.add(line);
    }
  });
}

/**
 * Updates probe test charge Qt, force arrow E, and coordinate basis projections
 */
function updateProbe(coordSystem, params) {
  const u = params.u;
  const isDipole = params.modeSecondary;
  const pCart = toCartesian(u, coordSystem);

  probeTestCharge.position.set(pCart.x, pCart.y, pCart.z);

  const { Ex, Ey, Ez, mag } = evalElectricField(pCart, coordSystem, isDipole);
  const root = new THREE.Vector3(pCart.x, pCart.y, pCart.z);
  eVectorArrow.position.copy(root);

  if (mag > 0.01) {
    const dir = new THREE.Vector3(Ex, Ey, Ez).normalize();
    const len = Math.min(2.5, Math.max(0.5, mag * 0.7));
    eVectorArrow.setDirection(dir);
    eVectorArrow.setLength(len, len * 0.3, len * 0.15);
    eVectorArrow.visible = true;

    // Component projections on local curvilinear unit vectors
    const curvilinearE = cartesianVectorToCurvilinear({ x: Ex, y: Ey, z: Ez }, u, coordSystem);
    const { a1, a2, a3 } = getUnitVectors(u, coordSystem);

    const bases = [
      { unit: a1, comp: curvilinearE[0], arrow: projectionArrows[0], color: 0xef4444 },
      { unit: a2, comp: curvilinearE[1], arrow: projectionArrows[1], color: 0x10b981 },
      { unit: a3, comp: curvilinearE[2], arrow: projectionArrows[2], color: 0x3b82f6 }
    ];

    bases.forEach(({ unit, comp, arrow, color }) => {
      arrow.position.copy(root);
      const cMag = Math.abs(comp);
      if (cMag > 0.05) {
        const sign = Math.sign(comp);
        arrow.setDirection(new THREE.Vector3(sign * unit.x, sign * unit.y, sign * unit.z));
        const arrLen = Math.min(1.8, cMag * 0.6);
        arrow.setLength(arrLen, arrLen * 0.3, arrLen * 0.15);
        arrow.setColor(color);
        arrow.visible = params.showVectors;
      } else {
        arrow.visible = false;
      }
    });
  } else {
    eVectorArrow.visible = false;
    projectionArrows.forEach((arr) => (arr.visible = false));
  }
}

/**
 * Uniform Topic Module Contract: update()
 */
export function update(time, coordSystem, params) {
  arrowsGroup.visible = params.showVectors;
  streamlinesGroup.visible = params.showSurfaces;

  updateProbe(coordSystem, params);
}

/**
 * Uniform Topic Module Contract: getFormulaData()
 */
export function getFormulaData(coordSystem, params) {
  const u = params.u;
  const isDipole = params.modeSecondary;
  const pCart = toCartesian(u, coordSystem);
  const { Ex, Ey, Ez, V, mag } = evalElectricField(pCart, coordSystem, isDipole);
  const curvilinearE = cartesianVectorToCurvilinear({ x: Ex, y: Ey, z: Ez }, u, coordSystem);

  let formulaLatex = '';
  let detailLatex = '';

  if (isDipole) {
    formulaLatex = `\\vec{E} = \\frac{Q}{4\\pi\\epsilon_0}\\left[\\frac{\\vec{r} - \\vec{d}_+}{|\\vec{r} - \\vec{d}_+|^3} - \\frac{\\vec{r} - \\vec{d}_-}{|\\vec{r} - \\vec{d}_-|^3}\\right] = -\\nabla V`;
    detailLatex = `\\begin{aligned}
\\text{Dipole Moment: } & \\vec{p} = Q\\vec{d} \\\\
V(P) &= ${V.toFixed(2)} \\text{ V} \\\\
|\\vec{E}| &= ${mag.toFixed(2)} \\text{ V/m}
\\end{aligned}`;
  } else {
    switch (coordSystem) {
      case COORD_SYSTEMS.CARTESIAN: {
        formulaLatex = `\\vec{E} = E_x\\hat{a}_x + E_y\\hat{a}_y + E_z\\hat{a}_z = -\\nabla V \\quad (\\text{Parallel Sheets})`;
        detailLatex = `\\vec{E} = -1.50\\,\\hat{a}_z \\text{ V/m between sheets}, \\quad V(P) = ${V.toFixed(2)} \\text{ V}`;
        break;
      }
      case COORD_SYSTEMS.CYLINDRICAL: {
        formulaLatex = `\\vec{E} = \\frac{\\rho_L}{2\\pi\\epsilon_0\\rho}\\hat{a}_\\rho = -\\nabla V \\quad (\\text{Infinite Line Charge})`;
        detailLatex = `\\vec{E} = ${curvilinearE[0].toFixed(2)}\\,\\hat{a}_\\rho \\text{ V/m}, \\quad V(P) = ${V.toFixed(2)} \\text{ V}`;
        break;
      }
      case COORD_SYSTEMS.SPHERICAL: {
        formulaLatex = `\\vec{E} = \\frac{Q}{4\\pi\\epsilon_0 r^2}\\hat{a}_r = -\\nabla V \\quad (\\text{Point Charge at Origin})`;
        detailLatex = `\\vec{E} = ${curvilinearE[0].toFixed(2)}\\,\\hat{a}_r \\text{ V/m}, \\quad V(P) = ${V.toFixed(2)} \\text{ V}`;
        break;
      }
    }
  }

  const readout = [
    { label: 'Configuration', value: isDipole ? 'Electric Dipole (+Q / -Q)' : 'Canonical Symmetry Charge' },
    { label: 'Field Intensity |E|', value: `${mag.toFixed(3)} V/m` },
    { label: 'Electrostatic Potential V', value: `${V.toFixed(3)} V` },
    {
      label: 'Curvilinear E-Field (E₁, E₂, E₃)',
      value: `(${curvilinearE[0].toFixed(2)}, ${curvilinearE[1].toFixed(2)}, ${curvilinearE[2].toFixed(2)}) V/m`,
      fullWidth: true
    },
    {
      label: 'Force on Unit Test Charge Qt = +1 C',
      value: `Ft = ${mag.toFixed(2)} N along orange vector (projections: Red, Green, Blue)`,
      fullWidth: true
    }
  ];

  return {
    topicTag: 'Electric Field',
    topicTitle: 'Electric Field Intensity (E)',
    modeBtnText: isDipole ? 'Mode: Electric Dipole (+Q / -Q)' : 'Mode: Canonical Symmetry Charge',
    modeDesc: isDipole
      ? 'Electric dipole field. Streamlines connect positive (+Q) and negative (-Q) charges.'
      : 'Canonical symmetry field (Plate, Line, or Point Charge). Probe shows test charge force Ft.',
    formulaLatex,
    detailTitle: 'Electrostatic Formulation & Potential',
    detailLatex,
    readout
  };
}

