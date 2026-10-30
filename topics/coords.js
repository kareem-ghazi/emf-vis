/**
 * topics/coords.js - Topic 1: Coordinate Systems & Differential Elements
 * Demonstrates constant-coordinate surfaces, local unit vectors, and differential volume elements (dv).
 */

import * as THREE from 'three';
import { COORD_SYSTEMS, toCartesian, getUnitVectors, getMetricFactors } from '../math.js';

let surfacesGroup = null;
let vectorsGroup = null;
let dvGroup = null;
let probeMarker = null;

let arrow1 = null;
let arrow2 = null;
let arrow3 = null;

// Surface references for fast geometry / position updates
let surfaceMeshes = [];

/**
 * Uniform Topic Module Contract: init()
 */
export function init(group, coordSystem, params) {
  surfacesGroup = new THREE.Group();
  vectorsGroup = new THREE.Group();
  dvGroup = new THREE.Group();

  group.add(surfacesGroup);
  group.add(vectorsGroup);
  group.add(dvGroup);

  // Probe marker at P
  const probeGeo = new THREE.SphereGeometry(0.08, 24, 24);
  const probeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.8,
    roughness: 0.2
  });
  probeMarker = new THREE.Mesh(probeGeo, probeMat);
  group.add(probeMarker);

  // Create Unit Vector arrows
  const arrowLen = 1.2;
  arrow1 = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), arrowLen, 0xef4444, 0.25, 0.12);
  arrow2 = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), arrowLen, 0x10b981, 0.25, 0.12);
  arrow3 = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), arrowLen, 0x3b82f6, 0.25, 0.12);

  // Thicken arrow line appearance
  arrow1.line.material.linewidth = 3;
  arrow2.line.material.linewidth = 3;
  arrow3.line.material.linewidth = 3;

  vectorsGroup.add(arrow1);
  vectorsGroup.add(arrow2);
  vectorsGroup.add(arrow3);

  buildSurfaces(coordSystem, params);
  buildDifferentialElement(coordSystem, params);
  updateProbeAndVectors(coordSystem, params);
}

/**
 * Builds the 3 constant-coordinate surfaces according to active coordinate system
 */
function buildSurfaces(coordSystem, params) {
  // Clear previous surfaces
  while (surfacesGroup.children.length > 0) {
    const child = surfacesGroup.children.pop();
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
      else child.material.dispose();
    }
  }
  surfaceMeshes = [];

  const u = params.u;
  const pCart = toCartesian(u, coordSystem);

  const matBase = {
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    depthWrite: false,
    roughness: 0.3,
    metalness: 0.1
  };

  switch (coordSystem) {
    case COORD_SYSTEMS.CARTESIAN: {
      // 1. Plane x = const (Red tint)
      const geoX = new THREE.PlaneGeometry(8, 8);
      geoX.rotateY(Math.PI / 2);
      const matX = new THREE.MeshStandardMaterial({ ...matBase, color: 0xef4444 });
      const meshX = new THREE.Mesh(geoX, matX);
      meshX.position.set(pCart.x, 0, 0);

      // 2. Plane y = const (Green tint)
      const geoY = new THREE.PlaneGeometry(8, 8);
      geoY.rotateX(Math.PI / 2);
      const matY = new THREE.MeshStandardMaterial({ ...matBase, color: 0x10b981 });
      const meshY = new THREE.Mesh(geoY, matY);
      meshY.position.set(0, pCart.y, 0);

      // 3. Plane z = const (Blue tint)
      const geoZ = new THREE.PlaneGeometry(8, 8);
      const matZ = new THREE.MeshStandardMaterial({ ...matBase, color: 0x3b82f6 });
      const meshZ = new THREE.Mesh(geoZ, matZ);
      meshZ.position.set(0, 0, pCart.z);

      surfacesGroup.add(meshX, meshY, meshZ);
      surfaceMeshes = [meshX, meshY, meshZ];
      break;
    }

    case COORD_SYSTEMS.CYLINDRICAL: {
      const rho = Math.max(0.1, u[0]);
      const phi = u[1];
      const z = u[2];

      // 1. Cylinder rho = const (Cyan tint)
      const cylGeo = new THREE.CylinderGeometry(rho, rho, 8, 48, 1, true);
      const cylMat = new THREE.MeshStandardMaterial({ ...matBase, color: 0x06b6d4 });
      const cylMesh = new THREE.Mesh(cylGeo, cylMat);
      cylMesh.position.set(0, 0, 0);

      // 2. Azimuthal half-plane phi = const (Amber tint)
      const halfPlaneGeo = new THREE.PlaneGeometry(5, 8);
      halfPlaneGeo.translate(2.5, 0, 0); // starts at z-axis and extends outward
      halfPlaneGeo.rotateY(-phi);
      const halfPlaneMat = new THREE.MeshStandardMaterial({ ...matBase, color: 0xf59e0b });
      const halfPlaneMesh = new THREE.Mesh(halfPlaneGeo, halfPlaneMat);

      // 3. Horizontal plane z = const (Blue tint)
      const discGeo = new THREE.CircleGeometry(5, 48);
      discGeo.rotateX(Math.PI / 2);
      const discMat = new THREE.MeshStandardMaterial({ ...matBase, color: 0x3b82f6 });
      const discMesh = new THREE.Mesh(discGeo, discMat);
      discMesh.position.set(0, z, 0);

      surfacesGroup.add(cylMesh, halfPlaneMesh, discMesh);
      surfaceMeshes = [cylMesh, halfPlaneMesh, discMesh];
      break;
    }

    case COORD_SYSTEMS.SPHERICAL: {
      const r = Math.max(0.2, u[0]);
      const theta = u[1];
      const phi = u[2];

      // 1. Sphere r = const (Purple tint)
      const sphereGeo = new THREE.SphereGeometry(r, 48, 32);
      const sphereMat = new THREE.MeshStandardMaterial({ ...matBase, color: 0x8b5cf6 });
      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);

      // 2. Cone theta = const (Pink tint)
      // Cone with half-angle theta opening from apex at origin
      const coneHeight = 6;
      const coneRadius = Math.max(0.01, coneHeight * Math.tan(theta));
      const coneGeo = new THREE.ConeGeometry(coneRadius, coneHeight, 48, 1, true);
      // Align cone apex to origin pointing along +z
      coneGeo.translate(0, -coneHeight / 2, 0);
      coneGeo.rotateX(-Math.PI / 2); // align with z-axis
      const coneMat = new THREE.MeshStandardMaterial({ ...matBase, color: 0xec4899 });
      const coneMesh = new THREE.Mesh(coneGeo, coneMat);

      // 3. Azimuthal half-plane phi = const (Amber tint)
      const halfPlaneGeo = new THREE.PlaneGeometry(5.5, 9);
      halfPlaneGeo.translate(2.75, 0, 0);
      halfPlaneGeo.rotateY(-phi);
      const halfPlaneMat = new THREE.MeshStandardMaterial({ ...matBase, color: 0xf59e0b });
      const halfPlaneMesh = new THREE.Mesh(halfPlaneGeo, halfPlaneMat);

      surfacesGroup.add(sphereMesh, coneMesh, halfPlaneMesh);
      surfaceMeshes = [sphereMesh, coneMesh, halfPlaneMesh];
      break;
    }
  }
}

/**
 * Builds the 3D differential volume element dv at P
 */
function buildDifferentialElement(coordSystem, params) {
  while (dvGroup.children.length > 0) {
    const child = dvGroup.children.pop();
    if (child.geometry) child.geometry.dispose();
    if (child.material) child.material.dispose();
  }

  const u = params.u;
  const pCart = toCartesian(u, coordSystem);

  const dvColor = 0xffeb3b; // Bright gold
  const edgeColor = 0xffffff;

  switch (coordSystem) {
    case COORD_SYSTEMS.CARTESIAN: {
      // dv = dx dy dz
      const dx = 0.5;
      const dy = 0.5;
      const dz = 0.5;

      const boxGeo = new THREE.BoxGeometry(dx, dy, dz);
      boxGeo.translate(pCart.x + dx / 2, pCart.y + dy / 2, pCart.z + dz / 2);

      const boxMat = new THREE.MeshBasicMaterial({
        color: dvColor,
        transparent: true,
        opacity: 0.25,
        depthWrite: false
      });
      const boxMesh = new THREE.Mesh(boxGeo, boxMat);

      const edges = new THREE.EdgesGeometry(boxGeo);
      const edgeLine = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: edgeColor, linewidth: 2 }));

      dvGroup.add(boxMesh);
      dvGroup.add(edgeLine);
      break;
    }

    case COORD_SYSTEMS.CYLINDRICAL: {
      // dv = rho * drho * dphi * dz
      const rho0 = Math.max(0.2, u[0]);
      const phi0 = u[1];
      const z0 = u[2];

      const drho = 0.45;
      const dphi = 0.25; // radians (~14 deg)
      const dz = 0.45;

      // Construct cylindrical wedge vertices
      const pts = [];
      const segs = 6;
      for (let iz = 0; iz <= 1; iz++) {
        const curZ = z0 + iz * dz;
        for (let ip = 0; ip <= segs; ip++) {
          const curPhi = phi0 + (ip / segs) * dphi;
          // Inner arc
          pts.push(new THREE.Vector3(rho0 * Math.cos(curPhi), rho0 * Math.sin(curPhi), curZ));
          // Outer arc
          pts.push(new THREE.Vector3((rho0 + drho) * Math.cos(curPhi), (rho0 + drho) * Math.sin(curPhi), curZ));
        }
      }

      // Build wedge lines for wireframe visualization
      const linePositions = [];
      // Bottom face
      for (let ip = 0; ip < segs; ip++) {
        const p1 = new THREE.Vector3(rho0 * Math.cos(phi0 + (ip / segs) * dphi), rho0 * Math.sin(phi0 + (ip / segs) * dphi), z0);
        const p2 = new THREE.Vector3(rho0 * Math.cos(phi0 + ((ip + 1) / segs) * dphi), rho0 * Math.sin(phi0 + ((ip + 1) / segs) * dphi), z0);
        const p3 = new THREE.Vector3((rho0 + drho) * Math.cos(phi0 + (ip / segs) * dphi), (rho0 + drho) * Math.sin(phi0 + (ip / segs) * dphi), z0);
        const p4 = new THREE.Vector3((rho0 + drho) * Math.cos(phi0 + ((ip + 1) / segs) * dphi), (rho0 + drho) * Math.sin(phi0 + ((ip + 1) / segs) * dphi), z0);
        linePositions.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
        linePositions.push(p3.x, p3.y, p3.z, p4.x, p4.y, p4.z);

        // Top face
        linePositions.push(p1.x, p1.y, p1.z + dz, p2.x, p2.y, p2.z + dz);
        linePositions.push(p3.x, p3.y, p3.z + dz, p4.x, p4.y, p4.z + dz);
      }
      // Radial spokes
      const rA1 = new THREE.Vector3(rho0 * Math.cos(phi0), rho0 * Math.sin(phi0), z0);
      const rA2 = new THREE.Vector3((rho0 + drho) * Math.cos(phi0), (rho0 + drho) * Math.sin(phi0), z0);
      const rB1 = new THREE.Vector3(rho0 * Math.cos(phi0 + dphi), rho0 * Math.sin(phi0 + dphi), z0);
      const rB2 = new THREE.Vector3((rho0 + drho) * Math.cos(phi0 + dphi), (rho0 + drho) * Math.sin(phi0 + dphi), z0);
      linePositions.push(rA1.x, rA1.y, rA1.z, rA2.x, rA2.y, rA2.z);
      linePositions.push(rB1.x, rB1.y, rB1.z, rB2.x, rB2.y, rB2.z);
      linePositions.push(rA1.x, rA1.y, rA1.z + dz, rA2.x, rA2.y, rA2.z + dz);
      linePositions.push(rB1.x, rB1.y, rB1.z + dz, rB2.x, rB2.y, rB2.z + dz);

      // Vertical posts
      linePositions.push(rA1.x, rA1.y, rA1.z, rA1.x, rA1.y, rA1.z + dz);
      linePositions.push(rA2.x, rA2.y, rA2.z, rA2.x, rA2.y, rA2.z + dz);
      linePositions.push(rB1.x, rB1.y, rB1.z, rB1.x, rB1.y, rB1.z + dz);
      linePositions.push(rB2.x, rB2.y, rB2.z, rB2.x, rB2.y, rB2.z + dz);

      const wedgeGeo = new THREE.BufferGeometry();
      wedgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
      const wedgeMat = new THREE.LineBasicMaterial({ color: dvColor, linewidth: 2 });
      const wedgeMesh = new THREE.LineSegments(wedgeGeo, wedgeMat);

      dvGroup.add(wedgeMesh);
      break;
    }

    case COORD_SYSTEMS.SPHERICAL: {
      // dv = r^2 sin(theta) dr dtheta dphi
      const r0 = Math.max(0.3, u[0]);
      const theta0 = u[1];
      const phi0 = u[2];

      const dr = 0.45;
      const dtheta = 0.22; // ~12 deg
      const dphi = 0.22;   // ~12 deg

      const sphToCart = (r, t, p) => ({
        x: r * Math.sin(t) * Math.cos(p),
        y: r * Math.sin(t) * Math.sin(p),
        z: r * Math.cos(t)
      });

      const linePositions = [];
      const segs = 5;

      // Draw arcs along phi and theta on inner and outer shells
      for (const r of [r0, r0 + dr]) {
        for (let ip = 0; ip < segs; ip++) {
          const p1 = phi0 + (ip / segs) * dphi;
          const p2 = phi0 + ((ip + 1) / segs) * dphi;
          const v1 = sphToCart(r, theta0, p1);
          const v2 = sphToCart(r, theta0, p2);
          const v3 = sphToCart(r, theta0 + dtheta, p1);
          const v4 = sphToCart(r, theta0 + dtheta, p2);
          linePositions.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
          linePositions.push(v3.x, v3.y, v3.z, v4.x, v4.y, v4.z);
        }
        for (let it = 0; it < segs; it++) {
          const t1 = theta0 + (it / segs) * dtheta;
          const t2 = theta0 + ((it + 1) / segs) * dtheta;
          const v1 = sphToCart(r, t1, phi0);
          const v2 = sphToCart(r, t2, phi0);
          const v3 = sphToCart(r, t1, phi0 + dphi);
          const v4 = sphToCart(r, t2, phi0 + dphi);
          linePositions.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
          linePositions.push(v3.x, v3.y, v3.z, v4.x, v4.y, v4.z);
        }
      }

      // Radial corner spokes connecting inner and outer spheres
      const corners = [
        [theta0, phi0],
        [theta0 + dtheta, phi0],
        [theta0, phi0 + dphi],
        [theta0 + dtheta, phi0 + dphi]
      ];
      corners.forEach(([t, p]) => {
        const c1 = sphToCart(r0, t, p);
        const c2 = sphToCart(r0 + dr, t, p);
        linePositions.push(c1.x, c1.y, c1.z, c2.x, c2.y, c2.z);
      });

      const wedgeGeo = new THREE.BufferGeometry();
      wedgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
      const wedgeMat = new THREE.LineBasicMaterial({ color: dvColor, linewidth: 2 });
      const wedgeMesh = new THREE.LineSegments(wedgeGeo, wedgeMat);

      dvGroup.add(wedgeMesh);
      break;
    }
  }
}

/**
 * Updates probe marker position and local unit vector orientations
 */
function updateProbeAndVectors(coordSystem, params) {
  const u = params.u;
  const pCart = toCartesian(u, coordSystem);

  // Probe marker position
  probeMarker.position.set(pCart.x, pCart.y, pCart.z);

  // Local Unit Vectors
  const { a1, a2, a3 } = getUnitVectors(u, coordSystem);

  const root = new THREE.Vector3(pCart.x, pCart.y, pCart.z);
  arrow1.position.copy(root);
  arrow1.setDirection(new THREE.Vector3(a1.x, a1.y, a1.z).normalize());

  arrow2.position.copy(root);
  arrow2.setDirection(new THREE.Vector3(a2.x, a2.y, a2.z).normalize());

  arrow3.position.copy(root);
  arrow3.setDirection(new THREE.Vector3(a3.x, a3.y, a3.z).normalize());

  // Colors match coordinate system theme
  if (coordSystem === COORD_SYSTEMS.CARTESIAN) {
    arrow1.setColor(0xef4444); // x (Red)
    arrow2.setColor(0x10b981); // y (Green)
    arrow3.setColor(0x3b82f6); // z (Blue)
  } else if (coordSystem === COORD_SYSTEMS.CYLINDRICAL) {
    arrow1.setColor(0x06b6d4); // rho (Cyan)
    arrow2.setColor(0xf59e0b); // phi (Amber)
    arrow3.setColor(0x3b82f6); // z (Blue)
  } else if (coordSystem === COORD_SYSTEMS.SPHERICAL) {
    arrow1.setColor(0x8b5cf6); // r (Purple)
    arrow2.setColor(0xec4899); // theta (Pink)
    arrow3.setColor(0xf59e0b); // phi (Amber)
  }
}

/**
 * Uniform Topic Module Contract: update()
 */
export function update(time, coordSystem, params) {
  // Respect visibility checkboxes
  surfacesGroup.visible = params.showSurfaces;
  vectorsGroup.visible = params.showVectors;
  dvGroup.visible = true;

  // Rebuild surfaces & differential wedge to track probe point P
  buildSurfaces(coordSystem, params);
  buildDifferentialElement(coordSystem, params);
  updateProbeAndVectors(coordSystem, params);
}

/**
 * Uniform Topic Module Contract: getFormulaData()
 */
export function getFormulaData(coordSystem, params) {
  const u = params.u;
  const pCart = toCartesian(u, coordSystem);
  const mf = getMetricFactors(u, coordSystem);
  const { a1, a2, a3, names } = getUnitVectors(u, coordSystem);

  let formulaLatex = '';
  let detailLatex = '';
  let readout = [];

  switch (coordSystem) {
    case COORD_SYSTEMS.CARTESIAN: {
      formulaLatex = `\\begin{aligned}
(h_1, h_2, h_3) &= (1, 1, 1) \\\\
dv &= dx\\,dy\\,dz \\\\
\\vec{r} &= x\\hat{a}_x + y\\hat{a}_y + z\\hat{a}_z
\\end{aligned}`;

      detailLatex = `\\begin{aligned}
\\hat{a}_x &= [1, 0, 0]^T \\\\
\\hat{a}_y &= [0, 1, 0]^T \\\\
\\hat{a}_z &= [0, 0, 1]^T
\\end{aligned}`;

      readout = [
        { label: 'Coordinates (x, y, z)', value: `(${u[0].toFixed(2)}, ${u[1].toFixed(2)}, ${u[2].toFixed(2)}) m` },
        { label: 'Differential Volume dv', value: `${(0.5 * 0.5 * 0.5).toFixed(3)} m³ (sample)` },
        { label: 'Unit Vector â_x (World)', value: `(${a1.x.toFixed(2)}, ${a1.y.toFixed(2)}, ${a1.z.toFixed(2)})` },
        { label: 'Unit Vector â_y (World)', value: `(${a2.x.toFixed(2)}, ${a2.y.toFixed(2)}, ${a2.z.toFixed(2)})` },
        { label: 'Unit Vector â_z (World)', value: `(${a3.x.toFixed(2)}, ${a3.y.toFixed(2)}, ${a3.z.toFixed(2)})` }
      ];
      break;
    }

    case COORD_SYSTEMS.CYLINDRICAL: {
      const rho = u[0];
      const phi = u[1];
      const z = u[2];
      const phiDeg = (phi * 180 / Math.PI).toFixed(1);

      formulaLatex = `\\begin{aligned}
x &= \\rho\\cos\\phi, \\quad y = \\rho\\sin\\phi, \\quad z = z \\\\
(h_1, h_2, h_3) &= (1, \\rho, 1) \\\\
dv &= \\rho\\,d\\rho\\,d\\phi\\,dz
\\end{aligned}`;

      detailLatex = `\\begin{aligned}
\\begin{bmatrix} \\hat{a}_\\rho \\\\ \\hat{a}_\\phi \\\\ \\hat{a}_z \\end{bmatrix} =
\\begin{bmatrix}
\\cos\\phi & \\sin\\phi & 0 \\\\
-\\sin\\phi & \\cos\\phi & 0 \\\\
0 & 0 & 1
\\end{bmatrix}
\\begin{bmatrix} \\hat{a}_x \\\\ \\hat{a}_y \\\\ \\hat{a}_z \\end{bmatrix}
\\end{aligned}`;

      readout = [
        { label: 'Coordinates (ρ, φ, z)', value: `(${rho.toFixed(2)} m, ${phiDeg}°, ${z.toFixed(2)} m)` },
        { label: 'Scaling Factor h₂ = ρ', value: `${rho.toFixed(2)}` },
        { label: 'Unit Vector â_ρ (World)', value: `(${a1.x.toFixed(2)}, ${a1.y.toFixed(2)}, ${a1.z.toFixed(2)})` },
        { label: 'Unit Vector â_φ (World)', value: `(${a2.x.toFixed(2)}, ${a2.y.toFixed(2)}, ${a2.z.toFixed(2)})` },
        { label: 'Unit Vector â_z (World)', value: `(${a3.x.toFixed(2)}, ${a3.y.toFixed(2)}, ${a3.z.toFixed(2)})` }
      ];
      break;
    }

    case COORD_SYSTEMS.SPHERICAL: {
      const r = u[0];
      const theta = u[1];
      const phi = u[2];
      const thetaDeg = (theta * 180 / Math.PI).toFixed(1);
      const phiDeg = (phi * 180 / Math.PI).toFixed(1);

      formulaLatex = `\\begin{aligned}
x &= r\\sin\\theta\\cos\\phi, \\quad y = r\\sin\\theta\\sin\\phi, \\quad z = r\\cos\\theta \\\\
(h_1, h_2, h_3) &= (1, r, r\\sin\\theta) \\\\
dv &= r^2 \\sin\\theta\\,dr\\,d\\theta\\,d\\phi
\\end{aligned}`;

      detailLatex = `\\begin{aligned}
\\begin{bmatrix} \\hat{a}_r \\\\ \\hat{a}_\\theta \\\\ \\hat{a}_\\phi \\end{bmatrix} =
\\begin{bmatrix}
\\sin\\theta\\cos\\phi & \\sin\\theta\\sin\\phi & \\cos\\theta \\\\
\\cos\\theta\\cos\\phi & \\cos\\theta\\sin\\phi & -\\sin\\theta \\\\
-\\sin\\phi & \\cos\\phi & 0
\\end{bmatrix}
\\begin{bmatrix} \\hat{a}_x \\\\ \\hat{a}_y \\\\ \\hat{a}_z \\end{bmatrix}
\\end{aligned}`;

      readout = [
        { label: 'Coordinates (r, θ, φ)', value: `(${r.toFixed(2)} m, ${thetaDeg}°, ${phiDeg}°)` },
        { label: 'Metric Factors (h₂, h₃)', value: `h₂ = ${mf.h2.toFixed(2)}, h₃ = ${mf.h3.toFixed(2)}` },
        { label: 'Unit Vector â_r (World)', value: `(${a1.x.toFixed(2)}, ${a1.y.toFixed(2)}, ${a1.z.toFixed(2)})` },
        { label: 'Unit Vector â_θ (World)', value: `(${a2.x.toFixed(2)}, ${a2.y.toFixed(2)}, ${a2.z.toFixed(2)})` },
        { label: 'Unit Vector â_φ (World)', value: `(${a3.x.toFixed(2)}, ${a3.y.toFixed(2)}, ${a3.z.toFixed(2)})` }
      ];
      break;
    }
  }

  return {
    topicTag: 'Coordinates',
    topicTitle: 'Orthogonal Coordinate Systems & Differential Elements',
    modeBtnText: 'Focus: Surfaces & dv',
    modeDesc: 'Constant surfaces color-coded: Red/Cyan/Purple (u₁), Green/Amber/Pink (u₂), Blue (u₃). Yellow wireframe shows dv.',
    formulaLatex,
    detailTitle: 'Unit Vector Transformation Matrix',
    detailLatex,
    readout
  };
}

