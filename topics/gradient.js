/**
 * topics/gradient.js - Topic 2: The Gradient
 * Visualizes ∇Φ as the vector of maximum rate of ascent perpendicular to equipotential surfaces.
 */

import * as THREE from 'three';
import {
  COORD_SYSTEMS,
  toCartesian,
  fromCartesian,
  curvilinearVectorToCartesian,
  GRADIENT_FIELDS,
  computeGradient,
  getUnitVectors
} from '../math.js';

let arrowsGroup = null;
let equipotentialGroup = null;
let probeGroup = null;

let probeArrow = null;
let probeMarker = null;
let tangentPlane = null;

// Secondary mode alternative: Radial Point Source Potential Φ = 3 / r
const RADIAL_FIELD = {
  evalScalar: (u, coordSystem) => {
    const c = toCartesian(u, coordSystem);
    const r = Math.sqrt(c.x * c.x + c.y * c.y + c.z * c.z);
    return 3.5 / Math.max(0.4, r);
  },
  evalGradient: (u, coordSystem) => {
    // ∇(k/r) = -k/r² a_r
    const c = toCartesian(u, coordSystem);
    const r = Math.max(0.4, Math.sqrt(c.x * c.x + c.y * c.y + c.z * c.z));
    const factor = -3.5 / (r * r * r);
    const cartGrad = { x: factor * c.x, y: factor * c.y, z: factor * c.z };

    // Project onto local basis
    const { a1, a2, a3 } = getUnitVectors(u, coordSystem);
    return [
      cartGrad.x * a1.x + cartGrad.y * a1.y + cartGrad.z * a1.z,
      cartGrad.x * a2.x + cartGrad.y * a2.y + cartGrad.z * a2.z,
      cartGrad.x * a3.x + cartGrad.y * a3.y + cartGrad.z * a3.z
    ];
  }
};

/**
 * Uniform Topic Module Contract: init()
 */
export function init(group, coordSystem, params) {
  arrowsGroup = new THREE.Group();
  equipotentialGroup = new THREE.Group();
  probeGroup = new THREE.Group();

  group.add(arrowsGroup);
  group.add(equipotentialGroup);
  group.add(probeGroup);

  // Probe marker
  const pGeo = new THREE.SphereGeometry(0.09, 24, 24);
  const pMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.9,
    roughness: 0.2
  });
  probeMarker = new THREE.Mesh(pGeo, pMat);
  probeGroup.add(probeMarker);

  // Probe Gradient Vector (bold orange/gold)
  probeArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 0, 0),
    1.5,
    0xf59e0b,
    0.35,
    0.15
  );
  probeArrow.line.material.linewidth = 4;
  probeGroup.add(probeArrow);

  // Local equipotential tangent disc at P
  const discGeo = new THREE.CircleGeometry(0.7, 32);
  const discMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    depthWrite: false,
    roughness: 0.4
  });
  tangentPlane = new THREE.Mesh(discGeo, discMat);
  probeGroup.add(tangentPlane);

  buildFieldGrid(coordSystem, params);
  buildEquipotentialSurfaces(coordSystem, params);
  updateProbe(coordSystem, params);
}

/**
 * Evaluates active scalar field and gradient at point u
 */
function evalField(u, coordSystem, isSecondary) {
  if (isSecondary) {
    const s = RADIAL_FIELD.evalScalar(u, coordSystem);
    const g = RADIAL_FIELD.evalGradient(u, coordSystem);
    return { scalar: s, gradComponents: g };
  }
  const fieldDef = GRADIENT_FIELDS[coordSystem];
  if (!fieldDef) return { scalar: 0, gradComponents: [0, 0, 0] };
  return {
    scalar: fieldDef.evalScalar(u),
    gradComponents: fieldDef.evalGradient(u)
  };
}

/**
 * Builds 3D vector field of arrows pointing in direction of ∇Φ
 */
function buildFieldGrid(coordSystem, params) {
  while (arrowsGroup.children.length > 0) {
    const child = arrowsGroup.children.pop();
    if (child.dispose) child.dispose();
  }

  const isSecondary = params.modeSecondary;
  const samplePoints = [];
  const span = 3.0;
  const step = 1.5;

  for (let x = -span; x <= span; x += step) {
    for (let y = -span; y <= span; y += step) {
      for (let z = -span; z <= span; z += step) {
        if (Math.abs(x) < 0.2 && Math.abs(y) < 0.2 && Math.abs(z) < 0.2) continue;
        samplePoints.push({ x, y, z });
      }
    }
  }

  samplePoints.forEach((pt) => {
    const u = fromCartesian(pt, coordSystem);
    const { gradComponents } = evalField(u, coordSystem, isSecondary);

    const worldGrad = curvilinearVectorToCartesian(gradComponents, u, coordSystem);
    const mag = Math.sqrt(worldGrad.x ** 2 + worldGrad.y ** 2 + worldGrad.z ** 2);
    if (mag < 0.05) return;

    const dir = new THREE.Vector3(worldGrad.x, worldGrad.y, worldGrad.z).normalize();
    const len = Math.min(0.9, Math.max(0.25, mag * 0.45));

    // Color code arrow by gradient magnitude
    // Low: cyan/blue -> Medium: green/yellow -> High: orange/red
    const t = Math.min(1, mag / 2.5);
    const color = new THREE.Color().setHSL(0.6 * (1 - t), 0.9, 0.55);

    const arrow = new THREE.ArrowHelper(
      dir,
      new THREE.Vector3(pt.x, pt.y, pt.z),
      len,
      color.getHex(),
      len * 0.35,
      len * 0.18
    );
    arrow.line.material.transparent = true;
    arrow.line.material.opacity = 0.65;
    arrowsGroup.add(arrow);
  });
}

/**
 * Builds equipotential surfaces / contour rings
 */
function buildEquipotentialSurfaces(coordSystem, params) {
  while (equipotentialGroup.children.length > 0) {
    const child = equipotentialGroup.children.pop();
    if (child.geometry) child.geometry.dispose();
    if (child.material) child.material.dispose();
  }

  const isSecondary = params.modeSecondary;
  const mat = new THREE.MeshStandardMaterial({
    color: 0x60a5fa,
    transparent: true,
    opacity: 0.2,
    wireframe: true,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  if (isSecondary) {
    // Radial potential equipotentials are concentric spheres
    [1.0, 1.8, 2.6].forEach((radius) => {
      const sphGeo = new THREE.SphereGeometry(radius, 28, 20);
      const mesh = new THREE.Mesh(sphGeo, mat);
      equipotentialGroup.add(mesh);
    });
  } else {
    // Canonical coordinate-dependent surfaces
    if (coordSystem === COORD_SYSTEMS.CARTESIAN) {
      // Hyperbolic paraboloid saddles Φ = 0.2(x² - y² + 2z) = C
      [-1.0, 0, 1.0].forEach((cVal) => {
        const segs = 20;
        const geo = new THREE.PlaneGeometry(5, 5, segs, segs);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          const y = pos.getY(i);
          // 2z = 5 * cVal - x² + y² => z = 2.5*cVal - 0.5*x² + 0.5*y²
          const z = 2.5 * cVal - 0.5 * x * x + 0.5 * y * y;
          pos.setZ(i, Math.max(-3, Math.min(3, z)));
        }
        geo.computeVertexNormals();
        const mesh = new THREE.Mesh(geo, mat);
        equipotentialGroup.add(mesh);
      });
    } else if (coordSystem === COORD_SYSTEMS.CYLINDRICAL) {
      // Φ = 0.15 ρ² z cos(2φ)
      // Visualized via cylindrical contour shells
      [1.2, 2.2, 3.2].forEach((rho) => {
        const geo = new THREE.CylinderGeometry(rho, rho, 4, 32, 4, true);
        const mesh = new THREE.Mesh(geo, mat);
        equipotentialGroup.add(mesh);
      });
    } else if (coordSystem === COORD_SYSTEMS.SPHERICAL) {
      // Φ = r sin²θ cosφ
      [1.5, 2.5, 3.5].forEach((radius) => {
        const geo = new THREE.SphereGeometry(radius, 24, 18);
        const mesh = new THREE.Mesh(geo, mat);
        equipotentialGroup.add(mesh);
      });
    }
  }
}

/**
 * Updates probe marker, gradient vector at P, and local equipotential tangent disk
 */
function updateProbe(coordSystem, params) {
  const u = params.u;
  const isSecondary = params.modeSecondary;
  const pCart = toCartesian(u, coordSystem);

  probeMarker.position.set(pCart.x, pCart.y, pCart.z);

  const { gradComponents } = evalField(u, coordSystem, isSecondary);
  const worldGrad = curvilinearVectorToCartesian(gradComponents, u, coordSystem);
  const mag = Math.sqrt(worldGrad.x ** 2 + worldGrad.y ** 2 + worldGrad.z ** 2);

  const root = new THREE.Vector3(pCart.x, pCart.y, pCart.z);
  probeArrow.position.copy(root);

  if (mag > 1e-4) {
    const dir = new THREE.Vector3(worldGrad.x, worldGrad.y, worldGrad.z).normalize();
    const len = Math.min(2.5, Math.max(0.6, mag * 0.7));
    probeArrow.setDirection(dir);
    probeArrow.setLength(len, len * 0.3, len * 0.15);
    probeArrow.visible = true;

    // Orient tangent equipotential plane so its normal matches dir (∇Φ ⊥ equipotential)
    tangentPlane.position.copy(root);
    tangentPlane.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
    tangentPlane.visible = params.showSurfaces;
  } else {
    probeArrow.visible = false;
    tangentPlane.visible = false;
  }
}

/**
 * Uniform Topic Module Contract: update()
 */
export function update(time, coordSystem, params) {
  arrowsGroup.visible = params.showVectors;
  equipotentialGroup.visible = params.showSurfaces;

  updateProbe(coordSystem, params);
}

/**
 * Uniform Topic Module Contract: getFormulaData()
 */
export function getFormulaData(coordSystem, params) {
  const u = params.u;
  const isSecondary = params.modeSecondary;
  const { scalar, gradComponents } = evalField(u, coordSystem, isSecondary);
  const worldGrad = curvilinearVectorToCartesian(gradComponents, u, coordSystem);
  const mag = Math.sqrt(worldGrad.x ** 2 + worldGrad.y ** 2 + worldGrad.z ** 2);

  let formulaLatex = '';
  let detailLatex = '';
  let readout = [];

  if (isSecondary) {
    formulaLatex = `\\begin{aligned}
\\Phi(\\vec{r}) &= \\frac{k}{r} \\quad (k = 3.5) \\\\
\\nabla \\Phi &= -\\frac{k}{r^2} \\hat{a}_r \\\\
|\\nabla \\Phi| &= \\frac{k}{r^2}
\\end{aligned}`;

    detailLatex = `\\text{Radial symmetry: } \\nabla \\Phi \\text{ points along } -\\hat{a}_r \\text{ towards the source center.}`;
  } else {
    switch (coordSystem) {
      case COORD_SYSTEMS.CARTESIAN: {
        formulaLatex = `\\begin{aligned}
\\Phi(x,y,z) &= 0.2(x^2 - y^2 + 2z) \\\\
\\nabla \\Phi &= \\frac{\\partial \\Phi}{\\partial x}\\hat{a}_x + \\frac{\\partial \\Phi}{\\partial y}\\hat{a}_y + \\frac{\\partial \\Phi}{\\partial z}\\hat{a}_z \\\\
&= 0.4x\\,\\hat{a}_x - 0.4y\\,\\hat{a}_y + 0.4\\,\\hat{a}_z
\\end{aligned}`;

        detailLatex = `\\begin{aligned}
\\frac{\\partial \\Phi}{\\partial x} &= 0.4(${u[0].toFixed(2)}) = ${gradComponents[0].toFixed(2)} \\\\
\\frac{\\partial \\Phi}{\\partial y} &= -0.4(${u[1].toFixed(2)}) = ${gradComponents[1].toFixed(2)} \\\\
\\frac{\\partial \\Phi}{\\partial z} &= 0.40
\\end{aligned}`;
        break;
      }

      case COORD_SYSTEMS.CYLINDRICAL: {
        formulaLatex = `\\begin{aligned}
\\Phi(\\rho,\\phi,z) &= 0.15\\rho^2 z \\cos(2\\phi) \\\\
\\nabla \\Phi &= \\frac{\\partial \\Phi}{\\partial \\rho}\\hat{a}_\\rho + \\frac{1}{\\rho}\\frac{\\partial \\Phi}{\\partial \\phi}\\hat{a}_\\phi + \\frac{\\partial \\Phi}{\\partial z}\\hat{a}_z \\\\
&= 0.3\\rho z \\cos 2\\phi\\,\\hat{a}_\\rho - 0.3\\rho z \\sin 2\\phi\\,\\hat{a}_\\phi + 0.15\\rho^2 \\cos 2\\phi\\,\\hat{a}_z
\\end{aligned}`;

        detailLatex = `\\begin{aligned}
G_\\rho &= 0.30(${u[0].toFixed(2)})(${u[2].toFixed(2)})\\cos(2\\phi) = ${gradComponents[0].toFixed(2)} \\\\
G_\\phi &= -0.30(${u[0].toFixed(2)})(${u[2].toFixed(2)})\\sin(2\\phi) = ${gradComponents[1].toFixed(2)} \\\\
G_z &= 0.15(${u[0].toFixed(2)})^2\\cos(2\\phi) = ${gradComponents[2].toFixed(2)}
\\end{aligned}`;
        break;
      }

      case COORD_SYSTEMS.SPHERICAL: {
        formulaLatex = `\\begin{aligned}
\\Phi(r,\\theta,\\phi) &= r\\sin^2\\theta\\cos\\phi \\\\
\\nabla \\Phi &= \\frac{\\partial \\Phi}{\\partial r}\\hat{a}_r + \\frac{1}{r}\\frac{\\partial \\Phi}{\\partial \\theta}\\hat{a}_\\theta + \\frac{1}{r\\sin\\theta}\\frac{\\partial \\Phi}{\\partial \\phi}\\hat{a}_\\phi \\\\
&= \\sin^2\\theta\\cos\\phi\\,\\hat{a}_r + \\sin(2\\theta)\\cos\\phi\\,\\hat{a}_\\theta - \\sin\\theta\\sin\\phi\\,\\hat{a}_\\phi
\\end{aligned}`;

        detailLatex = `\\begin{aligned}
G_r &= \\sin^2\\theta\\cos\\phi = ${gradComponents[0].toFixed(2)} \\\\
G_\\theta &= \\sin(2\\theta)\\cos\\phi = ${gradComponents[1].toFixed(2)} \\\\
G_\\phi &= -\\sin\\theta\\sin\\phi = ${gradComponents[2].toFixed(2)}
\\end{aligned}`;
        break;
      }
    }
  }

  readout = [
    { label: 'Scalar Field Φ at P', value: scalar.toFixed(3) },
    { label: '|∇Φ| (Steepest Ascent)', value: `${mag.toFixed(3)} units/m` },
    {
      label: '∇Φ Components (Curvilinear)',
      value: `(${gradComponents[0].toFixed(2)}, ${gradComponents[1].toFixed(2)}, ${gradComponents[2].toFixed(2)})`,
      fullWidth: true
    },
    {
      label: '∇Φ World Vector (Cartesian)',
      value: `(${worldGrad.x.toFixed(2)}, ${worldGrad.y.toFixed(2)}, ${worldGrad.z.toFixed(2)})`,
      fullWidth: true
    }
  ];

  return {
    topicTag: 'Gradient',
    topicTitle: 'The Gradient of a Scalar Field (∇Φ)',
    modeBtnText: isSecondary ? 'Mode: Central Source Well' : 'Mode: Canonical Polynomial Field',
    modeDesc: isSecondary
      ? 'Radial well Φ = 3.5/r with spherical equipotential shells.'
      : 'Canonical field. Orange vector points along ∇Φ (normal to translucent equipotential disc at P).',
    formulaLatex,
    detailTitle: 'Gradient Component Breakdown',
    detailLatex,
    readout
  };
}

