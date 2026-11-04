/**
 * topics/gradient.js - The Gradient (∇V) Visualizer
 * Visualizes the gradient as the path of steepest ascent on a 3D topographical scalar hill.
 * Cartesian by default, without any probe ball.
 * Displays equipotential contour rings, 3D surface tangent gradient vectors,
 * and animated ascent streamlines climbing to the potential summit.
 */

import * as THREE from 'three';

let gradientGroup = null;
let hillMesh = null;
let contourGroup = null;
let vectorsGroup = null;
let pathsGroup = null;
let pulseTracers = null;
let pulsePositions = null;
let pulseData = [];

let currentHillProfile = 0; // 0: Single Peak, 1: Twin Peaks, 2: Volcano Crater
let hillAmplitude = 3.5;
let hillSpread = 3.0;

const NUM_STREAMLINES = 16;
const NUM_PULSES = 64;

/**
 * Evaluates the scalar field height V(x, y) based on active profile
 */
function evalScalar(x, y) {
  const r2 = x * x + y * y;
  if (currentHillProfile === 0) {
    // Single Gaussian Peak
    return hillAmplitude * Math.exp(-r2 / Math.max(0.5, hillSpread));
  } else if (currentHillProfile === 1) {
    // Twin Peaks
    const r1 = (x - 1.5) * (x - 1.5) + y * y;
    const r2 = (x + 1.5) * (x + 1.5) + y * y;
    return (hillAmplitude * 0.9) * (Math.exp(-r1 / 2.2) + Math.exp(-r2 / 2.2));
  } else {
    // Volcano Crater / Ring Peak
    const r = Math.sqrt(r2);
    return hillAmplitude * (r2 / 2.0) * Math.exp(-r2 / 3.0);
  }
}

/**
 * Evaluates numerical gradient (gx, gy) = (dV/dx, dV/dy)
 */
function evalGrad(x, y, eps = 1e-4) {
  const gx = (evalScalar(x + eps, y) - evalScalar(x - eps, y)) / (2 * eps);
  const gy = (evalScalar(x, y + eps) - evalScalar(x, y - eps)) / (2 * eps);
  return { gx, gy, mag: Math.sqrt(gx * gx + gy * gy) };
}

/**
 * Uniform Topic Module Contract: init()
 */
export function init(group, coordSystem, params) {
  gradientGroup = new THREE.Group();
  group.add(gradientGroup);

  currentHillProfile = (params.profileIndex !== undefined) ? params.profileIndex % 3 : 0;
  hillAmplitude = params.hillAmplitude !== undefined ? params.hillAmplitude : 3.5;
  hillSpread = params.hillSpread !== undefined ? params.hillSpread : 3.0;

  buildScene(params);
}

/**
 * Builds the topographical hill, vectors, contours, and streamlines
 */
function buildScene(params) {
  while (gradientGroup.children.length > 0) {
    const child = gradientGroup.children.pop();
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
      else child.material.dispose();
    }
  }

  contourGroup = new THREE.Group();
  vectorsGroup = new THREE.Group();
  pathsGroup = new THREE.Group();

  gradientGroup.add(contourGroup);
  gradientGroup.add(vectorsGroup);
  gradientGroup.add(pathsGroup);

  // 1. Topographical Hill Mesh in X-Y (elevation along Z)
  const size = 6.0;
  const segs = 64;
  const geo = new THREE.PlaneGeometry(size, size, segs, segs);

  const pos = geo.attributes.position;
  const colors = [];
  const col = new THREE.Color();

  let maxZ = 0.001;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const zVal = evalScalar(x, y);
    pos.setZ(i, zVal);
    if (zVal > maxZ) maxZ = zVal;
  }

  // Colormap based on elevation
  for (let i = 0; i < pos.count; i++) {
    const zVal = pos.getZ(i);
    const t = Math.min(1, Math.max(0, zVal / maxZ));
    // Blue/Teal base -> Vibrant Green mid -> Bright Gold summit
    col.setHSL(0.58 * (1.0 - t), 0.9, 0.45 + 0.25 * t);
    colors.push(col.r, col.g, col.b);
  }

  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.35,
    metalness: 0.1,
    side: THREE.DoubleSide
  });
  hillMesh = new THREE.Mesh(geo, mat);
  gradientGroup.add(hillMesh);

  // Wireframe subtle overlay
  const wireMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.08 });
  gradientGroup.add(new THREE.Mesh(geo, wireMat));

  // 2. Equipotential Contour Rings (V = const)
  const numContours = 6;
  for (let c = 1; c <= numContours; c++) {
    const targetV = (c / (numContours + 1)) * maxZ;
    // Sample circle or contour line at targetV
    const ringRadius = Math.sqrt(Math.max(0, -hillSpread * Math.log(Math.max(1e-4, targetV / hillAmplitude))));
    if (ringRadius > 0.05 && ringRadius < 3.2 && currentHillProfile === 0) {
      const curve = new THREE.EllipseCurve(0, 0, ringRadius, ringRadius, 0, 2 * Math.PI, false, 0);
      const pts = curve.getPoints(64).map(p => new THREE.Vector3(p.x, p.y, targetV + 0.02));
      const ringGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const ringLine = new THREE.LineLoop(ringGeo, new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6 }));
      contourGroup.add(ringLine);
    }
  }

  // 3. Dense 3D Surface Tangent Gradient Arrows
  const arrowSpacing = 0.65;
  for (let x = -2.6; x <= 2.6; x += arrowSpacing) {
    for (let y = -2.6; y <= 2.6; y += arrowSpacing) {
      const z = evalScalar(x, y);
      const { gx, gy, mag } = evalGrad(x, y);
      if (mag > 0.08) {
        // Gradient points in direction of steepest ascent:
        // Horizontal: (gx, gy). Along surface: elevation increases by mag.
        const dir = new THREE.Vector3(gx, gy, mag).normalize();
        const len = Math.min(0.5, Math.max(0.18, mag * 0.35));
        const arr = new THREE.ArrowHelper(dir, new THREE.Vector3(x, y, z + 0.03), len, 0xf59e0b, len * 0.35, len * 0.18);
        arr.line.material.linewidth = 2;
        arr.line.material.transparent = true;
        arr.line.material.opacity = 0.75;
        vectorsGroup.add(arr);
      }
    }
  }

  // 4. Steepest Ascent Streamlines from base to summit
  pulseData = [];
  const startRadius = 2.7;
  for (let i = 0; i < NUM_STREAMLINES; i++) {
    const angle = (i / NUM_STREAMLINES) * 2 * Math.PI;
    let curX = startRadius * Math.cos(angle);
    let curY = startRadius * Math.sin(angle);

    const pts = [];
    pts.push(new THREE.Vector3(curX, curY, evalScalar(curX, curY) + 0.03));

    for (let s = 0; s < 60; s++) {
      const { gx, gy, mag } = evalGrad(curX, curY);
      if (mag < 0.04) break;
      const step = 0.08;
      curX += (gx / mag) * step;
      curY += (gy / mag) * step;
      pts.push(new THREE.Vector3(curX, curY, evalScalar(curX, curY) + 0.03));
      if (Math.sqrt(curX * curX + curY * curY) < 0.08) break;
    }

    if (pts.length > 3) {
      const pathGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const pathLine = new THREE.Line(pathGeo, new THREE.LineBasicMaterial({ color: 0xffeb3b, transparent: true, opacity: 0.7, linewidth: 2 }));
      pathsGroup.add(pathLine);
      pulseData.push({ pts, step: Math.random() * (pts.length - 1) });
    }
  }

  // 5. Animated glowing pulse particles climbing along streamlines
  initPulses();
}

function initPulses() {
  if (pulseData.length === 0) return;
  pulsePositions = new Float32Array(NUM_PULSES * 3);

  for (let i = 0; i < NUM_PULSES; i++) {
    const stream = pulseData[i % pulseData.length];
    const pt = stream.pts[0];
    pulsePositions[i * 3] = pt.x;
    pulsePositions[i * 3 + 1] = pt.y;
    pulsePositions[i * 3 + 2] = pt.z;
  }

  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pulsePositions, 3));
  const pMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.12,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending
  });
  pulseTracers = new THREE.Points(pGeo, pMat);
  pathsGroup.add(pulseTracers);
}

/**
 * Uniform Topic Module Contract: update()
 */
export function update(time, coordSystem, params) {
  const nextProfile = (params.profileIndex !== undefined) ? params.profileIndex % 3 : 0;
  const nextAmp = params.hillAmplitude !== undefined ? params.hillAmplitude : hillAmplitude;
  const nextSpread = params.hillSpread !== undefined ? params.hillSpread : hillSpread;

  if (nextProfile !== currentHillProfile || Math.abs(nextAmp - hillAmplitude) > 0.05 || Math.abs(nextSpread - hillSpread) > 0.05) {
    currentHillProfile = nextProfile;
    hillAmplitude = nextAmp;
    hillSpread = nextSpread;
    buildScene(params);
  }

  if (vectorsGroup) vectorsGroup.visible = params.showVectors !== false;
  if (contourGroup) contourGroup.visible = params.showSurfaces !== false;

  // Animate glowing pulses climbing up the hill
  if (pulseTracers && pulsePositions && pulseData.length > 0) {
    for (let i = 0; i < NUM_PULSES; i++) {
      const stream = pulseData[i % pulseData.length];
      const speed = 0.35 + 0.1 * (i % 3);
      stream.step = (stream.step + speed) % (stream.pts.length - 1);

      const idx = Math.floor(stream.step);
      const frac = stream.step - idx;
      const p1 = stream.pts[idx];
      const p2 = stream.pts[Math.min(stream.pts.length - 1, idx + 1)];

      pulsePositions[i * 3] = p1.x + (p2.x - p1.x) * frac;
      pulsePositions[i * 3 + 1] = p1.y + (p2.y - p1.y) * frac;
      pulsePositions[i * 3 + 2] = p1.z + (p2.z - p1.z) * frac;
    }
    pulseTracers.geometry.attributes.position.needsUpdate = true;
  }
}

/**
 * Uniform Topic Module Contract: getFormulaData()
 */
export function getFormulaData(coordSystem, params) {
  const profileNames = ['Single Gaussian Potential Peak', 'Twin Peaks (Dipole Potential)', 'Volcano Crater / Ring Ridge'];
  const profileName = profileNames[currentHillProfile] || profileNames[0];

  return {
    topicTag: 'Gradient',
    topicTitle: 'The Gradient (∇V): Steepest Ascent on a Scalar Potential Hill',
    modeBtnText: 'Switch Hill Profile: ' + profileNames[(currentHillProfile + 1) % 3] + ' →',
    modeDesc: 'The gradient ∇V is a vector that points strictly along the path of steepest ascent on a topographical scalar hill. Notice how gradient vectors are always perpendicular to the blue equipotential contour rings!',
    formulaLatex: `\\nabla V = \\frac{\\partial V}{\\partial x}\\hat{a}_x + \\frac{\\partial V}{\\partial y}\\hat{a}_y + \\frac{\\partial V}{\\partial z}\\hat{a}_z`,
    detailTitle: 'Steepest Ascent & Orthogonality Theorem',
    detailLatex: `\\begin{aligned}
\\text{Direction of Maximum Increase: } & \\hat{u}_{\\max} = \\frac{\\nabla V}{|\\nabla V|} \\\\
\\text{Maximum Directional Derivative: } & \\left(\\frac{dV}{ds}\\right)_{\\max} = |\\nabla V| \\\\
\\text{Equipotential Orthogonality: } & \\nabla V \\cdot d\\vec{r}_{\\text{contour}} = 0
\\end{aligned}`,
    readout: [
      { label: 'Active Hill Profile', value: profileName },
      { label: 'Peak Altitude', value: `${hillAmplitude.toFixed(1)} V` },
      { label: 'Coordinate System', value: 'Cartesian (x, y, z) by default' },
      { label: 'Yellow Trajectories', value: 'Paths of steepest climb from valley to peak', fullWidth: true },
      { label: 'Blue Contour Rings', value: 'Equipotential curves V(x,y) = const (perpendicular to ∇V)', fullWidth: true }
    ]
  };
}

