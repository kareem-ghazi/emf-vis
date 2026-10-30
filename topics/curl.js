/**
 * topics/curl.js - The Curl of a Vector (∇×A)
 * Demonstrates ∇×A and Stokes' Theorem ∮ A·dl = ∫ (∇×A)·dS
 * across Cartesian, Cylindrical, and Spherical coordinate systems,
 * featuring an animated 3D Rotating Paddlewheel Probe whose rotation speed
 * and axle orientation directly represent the local vorticity vector ∇×A.
 */

import * as THREE from 'three';
import {
  COORD_SYSTEMS,
  toCartesian,
  fromCartesian,
  curvilinearVectorToCartesian,
  getUnitVectors
} from '../math.js';

let arrowsGroup = null;
let loopGroup = null;
let probeGroup = null;
let paddlewheel = null;
let curlArrow = null;

let currentRotationAngle = 0;

/**
 * Evaluates vector field A at point u in curvilinear basis [A1, A2, A3]
 */
function evalVectorField(u, coordSystem, isIrrotational) {
  if (isIrrotational) {
    // Irrotational Mode (∇×A = 0)
    switch (coordSystem) {
      case COORD_SYSTEMS.CARTESIAN:
        // A = x ax + y ay + z az => ∇×A = 0
        return [0.6 * u[0], 0.6 * u[1], 0.6 * u[2]];

      case COORD_SYSTEMS.CYLINDRICAL: {
        // Free vortex: A_phi = 1.5 / rho => (1/rho)*d/drho(rho * 1.5/rho) = (1/rho)*d/drho(1.5) = 0
        const rho = Math.max(0.2, u[0]);
        return [0, 1.5 / rho, 0];
      }

      case COORD_SYSTEMS.SPHERICAL: {
        // Pure radial: A_r = 1.5 / r² => ∇×A = 0
        const r = Math.max(0.3, u[0]);
        return [1.5 / (r * r), 0, 0];
      }

      default:
        return [0, 0, 0];
    }
  } else {
    // Rotational Mode (∇×A ≠ 0)
    switch (coordSystem) {
      case COORD_SYSTEMS.CARTESIAN:
        // Rigid-body rotation: A = -0.8 y ax + 0.8 x ay => ∇×A = 1.6 az
        return [-0.8 * u[1], 0.8 * u[0], 0];

      case COORD_SYSTEMS.CYLINDRICAL: {
        // A_phi = 0.8 rho => (1/rho)*d/drho(0.8 rho²) = 1.6 az
        const rho = Math.max(0.1, u[0]);
        return [0, 0.8 * rho, 0];
      }

      case COORD_SYSTEMS.SPHERICAL: {
        // A_phi = 0.8 r sin(theta) => ∇×A = 1.6 az = 1.6 (cos(theta) ar - sin(theta) a_theta)
        const r = Math.max(0.2, u[0]);
        const theta = u[1];
        return [0, 0, 0.8 * r * Math.sin(theta)];
      }

      default:
        return [0, 0, 0];
    }
  }
}

/**
 * Analytical Curl Vector in Cartesian World Space {x, y, z}
 */
function evalAnalyticalCurl(u, coordSystem, isIrrotational) {
  if (isIrrotational) {
    return { x: 0, y: 0, z: 0, mag: 0 };
  }
  // All three rotational examples represent uniform rotation around the z-axis with curl = (0, 0, 1.6)
  return { x: 0, y: 0, z: 1.6, mag: 1.6 };
}

/**
 * Uniform Topic Module Contract: init()
 */
export function init(group, coordSystem, params) {
  arrowsGroup = new THREE.Group();
  loopGroup = new THREE.Group();
  probeGroup = new THREE.Group();

  group.add(arrowsGroup);
  group.add(loopGroup);
  group.add(probeGroup);

  buildFieldGrid(coordSystem, params);
  buildPaddlewheelProbe();
  buildCirculationLoop();
  updateProbe(coordSystem, params, 0);
}

/**
 * Builds 3D vector arrow grid
 */
function buildFieldGrid(coordSystem, params) {
  while (arrowsGroup.children.length > 0) {
    const child = arrowsGroup.children.pop();
    if (child.dispose) child.dispose();
  }

  const isIrrotational = params.modeSecondary;
  const span = 2.8;
  const step = 1.4;

  for (let x = -span; x <= span; x += step) {
    for (let y = -span; y <= span; y += step) {
      for (let z = -span; z <= span; z += step) {
        if (Math.abs(x) < 0.2 && Math.abs(y) < 0.2 && Math.abs(z) < 0.2) continue;

        const u = fromCartesian({ x, y, z }, coordSystem);
        const A = evalVectorField(u, coordSystem, isIrrotational);
        const worldA = curvilinearVectorToCartesian(A, u, coordSystem);
        const mag = Math.sqrt(worldA.x ** 2 + worldA.y ** 2 + worldA.z ** 2);
        if (mag < 0.05) continue;

        const dir = new THREE.Vector3(worldA.x, worldA.y, worldA.z).normalize();
        const len = Math.min(0.85, Math.max(0.2, mag * 0.35));
        const color = isIrrotational ? 0x10b981 : 0xf59e0b; // Green vs Amber

        const arrow = new THREE.ArrowHelper(
          dir,
          new THREE.Vector3(x, y, z),
          len,
          color,
          len * 0.35,
          len * 0.18
        );
        arrow.line.material.transparent = true;
        arrow.line.material.opacity = 0.65;
        arrowsGroup.add(arrow);
      }
    }
  }
}

/**
 * Builds the 3D Paddlewheel Probe and Curl Vector Arrow
 */
function buildPaddlewheelProbe() {
  while (probeGroup.children.length > 0) {
    const child = probeGroup.children.pop();
    if (child.dispose) child.dispose();
  }

  paddlewheel = new THREE.Group();

  // Central hub / axle cylinder along local Y-axis
  const axleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 16);
  const axleMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.8 });
  const axleMesh = new THREE.Mesh(axleGeo, axleMat);
  paddlewheel.add(axleMesh);

  // 4 paddle blades
  const bladeGeo = new THREE.BoxGeometry(0.5, 0.2, 0.02);
  bladeGeo.translate(0.25, 0, 0); // extend from axle
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.3,
    metalness: 0.2,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide
  });

  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.rotation.y = (i * Math.PI) / 2;
    paddlewheel.add(blade);
  }

  probeGroup.add(paddlewheel);

  // Curl Vector Arrow (bold Red/Orange along axle)
  curlArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 0, 0),
    1.4,
    0xef4444,
    0.3,
    0.15
  );
  curlArrow.line.material.linewidth = 4;
  probeGroup.add(curlArrow);
}

/**
 * Builds the closed circulation loop L around P
 */
function buildCirculationLoop() {
  while (loopGroup.children.length > 0) {
    const child = loopGroup.children.pop();
    if (child.geometry) child.geometry.dispose();
    if (child.material) child.material.dispose();
  }

  const loopRadius = 0.65;
  const loopCurve = new THREE.EllipseCurve(0, 0, loopRadius, loopRadius, 0, 2 * Math.PI, false, 0);
  const points = loopCurve.getPoints(48);
  const loopGeo = new THREE.BufferGeometry().setFromPoints(points);

  const loopMat = new THREE.LineBasicMaterial({
    color: 0xffeb3b,
    linewidth: 2,
    transparent: true,
    opacity: 0.85
  });
  const loopMesh = new THREE.LineLoop(loopGeo, loopMat);
  loopMesh.rotation.x = Math.PI / 2; // Lie in horizontal plane
  loopGroup.add(loopMesh);
}

/**
 * Updates probe position, orientations, and spins the paddlewheel
 */
function updateProbe(coordSystem, params, dt = 0.016) {
  const u = params.u;
  const isIrrotational = params.modeSecondary;
  const pCart = toCartesian(u, coordSystem);
  const curl = evalAnalyticalCurl(u, coordSystem, isIrrotational);

  const root = new THREE.Vector3(pCart.x, pCart.y, pCart.z);

  // Position circulation loop L at P
  if (loopGroup.children[0]) {
    loopGroup.children[0].position.copy(root);
  }

  // Position paddlewheel at P
  if (paddlewheel) {
    paddlewheel.position.copy(root);

    // If curl > 0, align axle with curl vector and spin
    if (curl.mag > 0.05) {
      const curlDir = new THREE.Vector3(curl.x, curl.y, curl.z).normalize();

      // Three.js Cylinder is originally along local Y. Orient Y to curlDir
      paddlewheel.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), curlDir);

      // Spin blades around local Y axis
      currentRotationAngle += curl.mag * dt * 2.5;
      paddlewheel.rotateY(currentRotationAngle);

      // Orient curl vector arrow
      curlArrow.position.copy(root);
      curlArrow.setDirection(curlDir);
      curlArrow.setLength(1.4, 0.3, 0.15);
      curlArrow.visible = true;
    } else {
      // Irrotational: paddlewheel stops spinning
      curlArrow.visible = false;
    }
  }
}

/**
 * Uniform Topic Module Contract: update()
 */
export function update(time, coordSystem, params) {
  arrowsGroup.visible = params.showVectors;
  loopGroup.visible = params.showSurfaces;

  updateProbe(coordSystem, params, 0.016);
}

/**
 * Uniform Topic Module Contract: getFormulaData()
 */
export function getFormulaData(coordSystem, params) {
  const u = params.u;
  const isIrrotational = params.modeSecondary;
  const curl = evalAnalyticalCurl(u, coordSystem, isIrrotational);
  const A = evalVectorField(u, coordSystem, isIrrotational);

  let formulaLatex = '';
  switch (coordSystem) {
    case COORD_SYSTEMS.CARTESIAN: {
      formulaLatex = `\\nabla \\times \\vec{A} = \\begin{vmatrix} \\hat{a}_x & \\hat{a}_y & \\hat{a}_z \\\\ \\frac{\\partial}{\\partial x} & \\frac{\\partial}{\\partial y} & \\frac{\\partial}{\\partial z} \\\\ A_x & A_y & A_z \\end{vmatrix}`;
      break;
    }
    case COORD_SYSTEMS.CYLINDRICAL: {
      formulaLatex = `\\nabla \\times \\vec{A} = \\frac{1}{\\rho}\\begin{vmatrix} \\hat{a}_\\rho & \\rho\\hat{a}_\\phi & \\hat{a}_z \\\\ \\frac{\\partial}{\\partial \\rho} & \\frac{\\partial}{\\partial \\phi} & \\frac{\\partial}{\\partial z} \\\\ A_\\rho & \\rho A_\\phi & A_z \\end{vmatrix}`;
      break;
    }
    case COORD_SYSTEMS.SPHERICAL: {
      formulaLatex = `\\nabla \\times \\vec{A} = \\frac{1}{r^2 \\sin\\theta}\\begin{vmatrix} \\hat{a}_r & r\\hat{a}_\\theta & r\\sin\\theta\\hat{a}_\\phi \\\\ \\frac{\\partial}{\\partial r} & \\frac{\\partial}{\\partial \\theta} & \\frac{\\partial}{\\partial \\phi} \\\\ A_r & r A_\\theta & r\\sin\\theta A_\\phi \\end{vmatrix}`;
      break;
    }
  }

  const detailLatex = `\\begin{aligned}
\\oint_L \\vec{A} \\cdot d\\vec{l} &= \\int_S (\\nabla \\times \\vec{A}) \\cdot d\\vec{S} \\quad \\text{(Stokes' Theorem)} \\\\
|\\nabla \\times \\vec{A}| &= ${curl.mag.toFixed(2)} \\quad \\left[\\text{Paddlewheel Spin: } ${curl.mag > 0 ? '\\text{Rotating (Active Vorticity)}' : '\\text{Stationary (Zero Circulation)}'}\\right]
\\end{aligned}`;

  const loopArea = Math.PI * (0.65 ** 2);
  const approxCirculation = curl.mag * loopArea;

  const readout = [
    { label: 'Field Mode', value: isIrrotational ? 'Irrotational / Conservative (∇×A = 0)' : 'Rotational / Eddy Field (∇×A ≠ 0)' },
    { label: 'Curl Magnitude |∇×A|', value: `${curl.mag.toFixed(2)} rad/s` },
    {
      label: 'Paddlewheel Probe Status',
      value: curl.mag > 0.05
        ? 'Spinning at ω = 1.6 rad/s (Axle aligned with ∇×A)'
        : 'Stationary (Zero Microscopic Circulation)',
      fullWidth: true
    },
    {
      label: 'Stokes Line Integral ∮ A·dl',
      value: `${approxCirculation.toFixed(3)} circulation units (Loop Area ≈ ${loopArea.toFixed(2)} m²)`,
      fullWidth: true
    },
    {
      label: 'Vector A at P',
      value: `(${A[0].toFixed(2)}, ${A[1].toFixed(2)}, ${A[2].toFixed(2)})`,
      fullWidth: true
    }
  ];

  return {
    topicTag: 'Curl',
    topicTitle: 'The Curl of a Vector (∇×A)',
    modeBtnText: isIrrotational ? 'Mode: Irrotational (∇×A = 0)' : 'Mode: Rotational (∇×A ≠ 0)',
    modeDesc: isIrrotational
      ? 'Conservative/irrotational field. The paddlewheel does not rotate.'
      : 'Vortical eddy field. The paddlewheel rotates around its normal axle along ∇×A.',
    formulaLatex,
    detailTitle: "Stokes' Circulation Theorem Evaluation",
    detailLatex,
    readout
  };
}

