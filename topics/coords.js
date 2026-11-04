/**
 * topics/coords.js - Coordinate Systems
 * Demonstrates how Cartesian, Circular Cylindrical, and Spherical coordinate systems
 * define points using intersecting surfaces, and how local unit vectors change direction in space.
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

// Cache to prevent 60 FPS geometry rebuilding
let lastU = null;
let lastCoordSystem = null;

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
  const probeGeo = new THREE.SphereGeometry(0.09, 24, 24);
  const probeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.9,
    roughness: 0.2
  });
  probeMarker = new THREE.Mesh(probeGeo, probeMat);
  group.add(probeMarker);

  // Unit Vector arrows
  const arrowLen = 1.3;
  arrow1 = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), arrowLen, 0xef4444, 0.26, 0.12);
  arrow2 = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), arrowLen, 0x10b981, 0.26, 0.12);
  arrow3 = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), arrowLen, 0x3b82f6, 0.26, 0.12);

  arrow1.line.material.linewidth = 3;
  arrow2.line.material.linewidth = 3;
  arrow3.line.material.linewidth = 3;

  vectorsGroup.add(arrow1, arrow2, arrow3);

  lastU = null;
  lastCoordSystem = null;

  rebuildAll(coordSystem, params);
}

function rebuildAll(coordSystem, params) {
  buildSurfaces(coordSystem, params);
  buildDifferentialElement(coordSystem, params);
  updateProbeAndVectors(coordSystem, params);

  lastU = [...params.u];
  lastCoordSystem = coordSystem;
}

/**
 * Builds the 3 intersecting constant surfaces passing through point P
 */
function buildSurfaces(coordSystem, params) {
  while (surfacesGroup.children.length > 0) {
    const child = surfacesGroup.children.pop();
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
      else child.material.dispose();
    }
  }

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
      // 1. Plane x = const (Red, normal along X)
      const geoX = new THREE.PlaneGeometry(8, 8);
      geoX.rotateY(Math.PI / 2);
      const meshX = new THREE.Mesh(geoX, new THREE.MeshStandardMaterial({ ...matBase, color: 0xef4444 }));
      meshX.position.set(pCart.x, 0, 0);

      // 2. Plane y = const (Green, normal along Y)
      const geoY = new THREE.PlaneGeometry(8, 8);
      geoY.rotateX(-Math.PI / 2);
      const meshY = new THREE.Mesh(geoY, new THREE.MeshStandardMaterial({ ...matBase, color: 0x10b981 }));
      meshY.position.set(0, pCart.y, 0);

      // 3. Plane z = const (Blue, normal along Z)
      const geoZ = new THREE.PlaneGeometry(8, 8);
      const meshZ = new THREE.Mesh(geoZ, new THREE.MeshStandardMaterial({ ...matBase, color: 0x3b82f6 }));
      meshZ.position.set(0, 0, pCart.z);

      surfacesGroup.add(meshX, meshY, meshZ);
      break;
    }

    case COORD_SYSTEMS.CYLINDRICAL: {
      const rho = Math.max(0.1, u[0]);
      const phi = u[1];
      const z = u[2];

      // 1. Cylinder rho = const (Cyan, axis along Z)
      const cylGeo = new THREE.CylinderGeometry(rho, rho, 8, 48, 1, true);
      cylGeo.rotateX(Math.PI / 2); // Orient cylinder axis along Z
      const cylMesh = new THREE.Mesh(cylGeo, new THREE.MeshStandardMaterial({ ...matBase, color: 0x06b6d4 }));
      cylMesh.position.set(0, 0, 0);

      // 2. Azimuthal half-plane phi = const (Amber, originating at Z-axis)
      const halfPlaneGeo = new THREE.PlaneGeometry(5, 8);
      halfPlaneGeo.translate(2.5, 0, 0);
      halfPlaneGeo.rotateX(Math.PI / 2);
      halfPlaneGeo.rotateZ(phi);
      const halfPlaneMesh = new THREE.Mesh(halfPlaneGeo, new THREE.MeshStandardMaterial({ ...matBase, color: 0xf59e0b }));

      // 3. Horizontal disk z = const (Blue, normal along Z)
      const discGeo = new THREE.CircleGeometry(5, 48);
      const discMesh = new THREE.Mesh(discGeo, new THREE.MeshStandardMaterial({ ...matBase, color: 0x3b82f6 }));
      discMesh.position.set(0, 0, z);

      surfacesGroup.add(cylMesh, halfPlaneMesh, discMesh);
      break;
    }

    case COORD_SYSTEMS.SPHERICAL: {
      const r = Math.max(0.2, u[0]);
      const theta = u[1];
      const phi = u[2];

      // 1. Sphere r = const (Purple)
      const sphereGeo = new THREE.SphereGeometry(r, 48, 32);
      const sphereMesh = new THREE.Mesh(sphereGeo, new THREE.MeshStandardMaterial({ ...matBase, color: 0x8b5cf6 }));

      // 2. Cone theta = const (Pink, apex at origin opening around Z-axis)
      const slantL = Math.max(5.0, r + 1.2);
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      const coneR = Math.max(0.01, slantL * sinTheta);
      const coneH = Math.max(0.02, slantL * Math.abs(cosTheta));

      let coneGeo;
      if (Math.abs(cosTheta) < 0.02) {
        // At theta ~ 90 deg, the cone becomes a flat circular disk in the X-Y plane
        coneGeo = new THREE.CircleGeometry(slantL, 48);
      } else {
        coneGeo = new THREE.ConeGeometry(coneR, coneH, 48, 1, true);
        coneGeo.translate(0, -coneH / 2, 0); // apex at origin, base at (0, -coneH, 0)
        if (cosTheta >= 0) {
          coneGeo.rotateX(-Math.PI / 2); // open along +Z
        } else {
          coneGeo.rotateX(Math.PI / 2); // open along -Z
        }
      }
      const coneMesh = new THREE.Mesh(coneGeo, new THREE.MeshStandardMaterial({ ...matBase, color: 0xec4899 }));

      // 3. Azimuthal half-plane phi = const (Amber)
      const halfPlaneGeo = new THREE.PlaneGeometry(5.5, 9);
      halfPlaneGeo.translate(2.75, 0, 0);
      halfPlaneGeo.rotateX(Math.PI / 2);
      halfPlaneGeo.rotateZ(phi);
      const halfPlaneMesh = new THREE.Mesh(halfPlaneGeo, new THREE.MeshStandardMaterial({ ...matBase, color: 0xf59e0b }));

      surfacesGroup.add(sphereMesh, coneMesh, halfPlaneMesh);
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

  switch (coordSystem) {
    case COORD_SYSTEMS.CARTESIAN: {
      const dx = 0.5, dy = 0.5, dz = 0.5;
      const boxGeo = new THREE.BoxGeometry(dx, dy, dz);
      boxGeo.translate(pCart.x + dx / 2, pCart.y + dy / 2, pCart.z + dz / 2);

      const boxMesh = new THREE.Mesh(boxGeo, new THREE.MeshBasicMaterial({ color: dvColor, transparent: true, opacity: 0.25, depthWrite: false }));
      const edges = new THREE.EdgesGeometry(boxGeo);
      const edgeLine = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 }));
      dvGroup.add(boxMesh, edgeLine);
      break;
    }

    case COORD_SYSTEMS.CYLINDRICAL: {
      const rho0 = Math.max(0.2, u[0]);
      const phi0 = u[1];
      const z0 = u[2];
      const drho = 0.45, dphi = 0.25, dz = 0.45;

      const linePositions = [];
      const segs = 6;
      for (let iz = 0; iz <= 1; iz++) {
        const curZ = z0 + iz * dz;
        for (let ip = 0; ip < segs; ip++) {
          const p1 = phi0 + (ip / segs) * dphi;
          const p2 = phi0 + ((ip + 1) / segs) * dphi;
          linePositions.push(
            rho0 * Math.cos(p1), rho0 * Math.sin(p1), curZ,
            rho0 * Math.cos(p2), rho0 * Math.sin(p2), curZ,
            (rho0 + drho) * Math.cos(p1), (rho0 + drho) * Math.sin(p1), curZ,
            (rho0 + drho) * Math.cos(p2), (rho0 + drho) * Math.sin(p2), curZ
          );
        }
      }

      // Vertical & radial edges
      const c1 = [rho0 * Math.cos(phi0), rho0 * Math.sin(phi0)];
      const c2 = [(rho0 + drho) * Math.cos(phi0), (rho0 + drho) * Math.sin(phi0)];
      const c3 = [rho0 * Math.cos(phi0 + dphi), rho0 * Math.sin(phi0 + dphi)];
      const c4 = [(rho0 + drho) * Math.cos(phi0 + dphi), (rho0 + drho) * Math.sin(phi0 + dphi)];

      [c1, c2, c3, c4].forEach(([x, y]) => {
        linePositions.push(x, y, z0, x, y, z0 + dz);
      });
      linePositions.push(c1[0], c1[1], z0, c2[0], c2[1], z0);
      linePositions.push(c3[0], c3[1], z0, c4[0], c4[1], z0);
      linePositions.push(c1[0], c1[1], z0 + dz, c2[0], c2[1], z0 + dz);
      linePositions.push(c3[0], c3[1], z0 + dz, c4[0], c4[1], z0 + dz);

      const wedgeGeo = new THREE.BufferGeometry();
      wedgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
      const wedgeMesh = new THREE.LineSegments(wedgeGeo, new THREE.LineBasicMaterial({ color: dvColor, linewidth: 2 }));
      dvGroup.add(wedgeMesh);
      break;
    }

    case COORD_SYSTEMS.SPHERICAL: {
      const r0 = Math.max(0.3, u[0]);
      const theta0 = u[1];
      const phi0 = u[2];
      const dr = 0.45, dtheta = 0.22, dphi = 0.22;

      const sphToCart = (r, t, p) => ({
        x: r * Math.sin(t) * Math.cos(p),
        y: r * Math.sin(t) * Math.sin(p),
        z: r * Math.cos(t)
      });

      const linePositions = [];
      const segs = 5;

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
      const wedgeMesh = new THREE.LineSegments(wedgeGeo, new THREE.LineBasicMaterial({ color: dvColor, linewidth: 2 }));
      dvGroup.add(wedgeMesh);
      break;
    }
  }
}

/**
 * Updates probe marker position and unit vector orientations
 */
function updateProbeAndVectors(coordSystem, params) {
  const u = params.u;
  const pCart = toCartesian(u, coordSystem);

  probeMarker.position.set(pCart.x, pCart.y, pCart.z);

  const { a1, a2, a3 } = getUnitVectors(u, coordSystem);
  const root = new THREE.Vector3(pCart.x, pCart.y, pCart.z);

  arrow1.position.copy(root);
  arrow1.setDirection(new THREE.Vector3(a1.x, a1.y, a1.z).normalize());

  arrow2.position.copy(root);
  arrow2.setDirection(new THREE.Vector3(a2.x, a2.y, a2.z).normalize());

  arrow3.position.copy(root);
  arrow3.setDirection(new THREE.Vector3(a3.x, a3.y, a3.z).normalize());

  if (coordSystem === COORD_SYSTEMS.CARTESIAN) {
    arrow1.setColor(0xef4444);
    arrow2.setColor(0x10b981);
    arrow3.setColor(0x3b82f6);
  } else if (coordSystem === COORD_SYSTEMS.CYLINDRICAL) {
    arrow1.setColor(0x06b6d4);
    arrow2.setColor(0xf59e0b);
    arrow3.setColor(0x3b82f6);
  } else if (coordSystem === COORD_SYSTEMS.SPHERICAL) {
    arrow1.setColor(0x8b5cf6);
    arrow2.setColor(0xec4899);
    arrow3.setColor(0xf59e0b);
  }
}

/**
 * Uniform Topic Module Contract: update()
 */
export function update(time, coordSystem, params) {
  surfacesGroup.visible = params.showSurfaces;
  vectorsGroup.visible = params.showVectors;
  dvGroup.visible = true;

  // Only rebuild geometries if coordinates or system changed!
  const u = params.u;
  const coordChanged = coordSystem !== lastCoordSystem;
  const uChanged = !lastU || Math.abs(u[0] - lastU[0]) > 0.001 || Math.abs(u[1] - lastU[1]) > 0.001 || Math.abs(u[2] - lastU[2]) > 0.001;

  if (coordChanged || uChanged) {
    rebuildAll(coordSystem, params);
  }
}

/**
 * Uniform Topic Module Contract: getFormulaData()
 */
export function getFormulaData(coordSystem, params) {
  const u = params.u;

  let formulaLatex = '';
  let detailLatex = '';
  let readout = [];

  switch (coordSystem) {
    case COORD_SYSTEMS.CARTESIAN: {
      formulaLatex = `\\begin{aligned}
d\\vec{l} &= dx\\,\\hat{a}_x + dy\\,\\hat{a}_y + dz\\,\\hat{a}_z \\\\[4pt]
d\\vec{S} &= dy\\,dz\\,\\hat{a}_x + dx\\,dz\\,\\hat{a}_y + dx\\,dy\\,\\hat{a}_z \\\\[4pt]
dv &= dx\\,dy\\,dz
\\end{aligned}`;

      detailLatex = `\\begin{aligned}
\\begin{bmatrix} \\hat{a}_\\rho \\\\ \\hat{a}_\\phi \\\\ \\hat{a}_z \\end{bmatrix} &=
\\begin{bmatrix}
\\cos\\phi & \\sin\\phi & 0 \\\\
-\\sin\\phi & \\cos\\phi & 0 \\\\
0 & 0 & 1
\\end{bmatrix}
\\begin{bmatrix} \\hat{a}_x \\\\ \\hat{a}_y \\\\ \\hat{a}_z \\end{bmatrix} \\\\[16pt]
\\begin{bmatrix} \\hat{a}_r \\\\ \\hat{a}_\\theta \\\\ \\hat{a}_\\phi \\end{bmatrix} &=
\\begin{bmatrix}
\\sin\\theta\\cos\\phi & \\sin\\theta\\sin\\phi & \\cos\\theta \\\\
\\cos\\theta\\cos\\phi & \\cos\\theta\\sin\\phi & -\\sin\\theta \\\\
-\\sin\\phi & \\cos\\phi & 0
\\end{bmatrix}
\\begin{bmatrix} \\hat{a}_x \\\\ \\hat{a}_y \\\\ \\hat{a}_z \\end{bmatrix}
\\end{aligned}`;

      readout = [
        { label: 'Coordinates (x, y, z)', value: `(${u[0].toFixed(2)} m, ${u[1].toFixed(2)} m, ${u[2].toFixed(2)} m)`, fullWidth: true }
      ];
      break;
    }

    case COORD_SYSTEMS.CYLINDRICAL: {
      const rho = u[0];
      const phi = u[1];
      const z = u[2];
      const phiDeg = ((phi * 180) / Math.PI).toFixed(1);

      formulaLatex = `\\begin{aligned}
d\\vec{l} &= d\\rho\\,\\hat{a}_\\rho + \\rho\\,d\\phi\\,\\hat{a}_\\phi + dz\\,\\hat{a}_z \\\\[4pt]
d\\vec{S} &= \\rho\\,d\\phi\\,dz\\,\\hat{a}_\\rho + d\\rho\\,dz\\,\\hat{a}_\\phi + \\rho\\,d\\rho\\,d\\phi\\,\\hat{a}_z \\\\[4pt]
dv &= \\rho\\,d\\rho\\,d\\phi\\,dz
\\end{aligned}`;

      detailLatex = `\\begin{aligned}
\\begin{bmatrix} \\hat{a}_x \\\\ \\hat{a}_y \\\\ \\hat{a}_z \\end{bmatrix} &=
\\begin{bmatrix}
\\cos\\phi & -\\sin\\phi & 0 \\\\
\\sin\\phi & \\cos\\phi & 0 \\\\
0 & 0 & 1
\\end{bmatrix}
\\begin{bmatrix} \\hat{a}_\\rho \\\\ \\hat{a}_\\phi \\\\ \\hat{a}_z \\end{bmatrix} \\\\[16pt]
\\begin{bmatrix} \\hat{a}_r \\\\ \\hat{a}_\\theta \\\\ \\hat{a}_\\phi \\end{bmatrix} &=
\\begin{bmatrix}
\\sin\\theta & 0 & \\cos\\theta \\\\
\\cos\\theta & 0 & -\\sin\\theta \\\\
0 & 1 & 0
\\end{bmatrix}
\\begin{bmatrix} \\hat{a}_\\rho \\\\ \\hat{a}_\\phi \\\\ \\hat{a}_z \\end{bmatrix}
\\end{aligned}`;

      readout = [
        { label: 'Coordinates (ρ, φ, z)', value: `(${rho.toFixed(2)} m, ${phiDeg}°, ${z.toFixed(2)} m)`, fullWidth: true }
      ];
      break;
    }

    case COORD_SYSTEMS.SPHERICAL: {
      const r = u[0];
      const theta = u[1];
      const phi = u[2];
      const thetaDeg = ((theta * 180) / Math.PI).toFixed(1);
      const phiDeg = ((phi * 180) / Math.PI).toFixed(1);

      formulaLatex = `\\begin{aligned}
d\\vec{l} &= dr\\,\\hat{a}_r + r\\,d\\theta\\,\\hat{a}_\\theta + r\\sin\\theta\\,d\\phi\\,\\hat{a}_\\phi \\\\[4pt]
d\\vec{S} &= r^2\\sin\\theta\\,d\\theta\\,d\\phi\\,\\hat{a}_r + r\\sin\\theta\\,dr\\,d\\phi\\,\\hat{a}_\\theta + r\\,dr\\,d\\theta\\,\\hat{a}_\\phi \\\\[4pt]
dv &= r^2\\sin\\theta\\,dr\\,d\\theta\\,d\\phi
\\end{aligned}`;

      detailLatex = `\\begin{aligned}
\\begin{bmatrix} \\hat{a}_x \\\\ \\hat{a}_y \\\\ \\hat{a}_z \\end{bmatrix} &=
\\begin{bmatrix}
\\sin\\theta\\cos\\phi & \\cos\\theta\\cos\\phi & -\\sin\\phi \\\\
\\sin\\theta\\sin\\phi & \\cos\\theta\\sin\\phi & \\cos\\phi \\\\
\\cos\\theta & -\\sin\\theta & 0
\\end{bmatrix}
\\begin{bmatrix} \\hat{a}_r \\\\ \\hat{a}_\\theta \\\\ \\hat{a}_\\phi \\end{bmatrix} \\\\[16pt]
\\begin{bmatrix} \\hat{a}_\\rho \\\\ \\hat{a}_\\phi \\\\ \\hat{a}_z \\end{bmatrix} &=
\\begin{bmatrix}
\\sin\\theta & \\cos\\theta & 0 \\\\
0 & 0 & 1 \\\\
\\cos\\theta & -\\sin\\theta & 0
\\end{bmatrix}
\\begin{bmatrix} \\hat{a}_r \\\\ \\hat{a}_\\theta \\\\ \\hat{a}_\\phi \\end{bmatrix}
\\end{aligned}`;

      readout = [
        { label: 'Coordinates (r, θ, φ)', value: `(${r.toFixed(2)} m, ${thetaDeg}°, ${phiDeg}°)`, fullWidth: true }
      ];
      break;
    }
  }

  return {
    topicTag: 'Coordinates',
    topicTitle: 'Coordinate Systems',
    modeBtnText: 'Focus: Surfaces & dv',
    modeDesc: 'Points are defined by intersecting constant surfaces. Unit vectors change orientation dynamically with position.',
    formulaLatex,
    probeSubtitle: 'Coordinates of Point P',
    detailTitle: 'Unit Vector Transformation Matrices',
    detailLatex,
    readout
  };
}
