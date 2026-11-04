/**
 * topics/gradient.js - The Gradient (∇V) Visualizer
 * Visualizes the gradient as the path of steepest ascent on a 3D topographical scalar hill.
 * Cartesian by default, without any probe ball.
 * Displays equipotential contour rings, 3D surface tangent gradient vectors,
 * and smooth glowing ascent streamlines climbing to the potential summit without flashing.
 */

import * as THREE from 'three';

let gradientGroup = null;
let hillMesh = null;
let contourGroup = null;
let vectorsGroup = null;
let pathsGroup = null;
let pulseTracers = null;
let pulsePositions = null;

let currentHillProfile = 0; // 0: Single Peak, 1: Twin Peaks, 2: Volcano Crater
let hillAmplitude = 3.5;
let hillSpread = 3.0;

const NUM_STREAMLINES = 16;
let streamlines = []; // Array of arrays of Vector3 points
let particles = [];   // Array of particle tracking objects

// Cache circular glow texture for pulse particles
let glowTexture = null;

function getGlowTexture() {
  if (glowTexture) return glowTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.35, 'rgba(254, 240, 138, 0.85)');
  grad.addColorStop(0.7, 'rgba(234, 179, 8, 0.25)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  glowTexture = new THREE.CanvasTexture(canvas);
  return glowTexture;
}

/**
 * Evaluates the scalar field height V(x, y) based on active profile.
 * hillSpread controls the peak width / spread in all three profiles.
 */
export function evalScalar(x, y) {
  const r2 = x * x + y * y;
  const spread = Math.max(0.5, hillSpread);

  if (currentHillProfile === 0) {
    // Single Gaussian Peak: spread directly scales standard deviation
    return hillAmplitude * Math.exp(-r2 / spread);
  } else if (currentHillProfile === 1) {
    // Twin Peaks (Dipole potential): spread scales both peak widths
    const s1 = spread * 0.65;
    const r1 = (x - 1.4) * (x - 1.4) + y * y;
    const r2 = (x + 1.4) * (x + 1.4) + y * y;
    return (hillAmplitude * 0.95) * (Math.exp(-r1 / s1) + Math.exp(-r2 / s1));
  } else {
    // Volcano Crater / Ring Ridge: spread scales crater radius and outer flanks
    const s2 = spread * 0.8;
    return (hillAmplitude * 1.35) * (r2 / (s2 * 0.8)) * Math.exp(-r2 / s2);
  }
}

/**
 * Evaluates numerical gradient (gx, gy) = (dV/dx, dV/dy)
 */
export function evalGrad(x, y, eps = 1e-4) {
  const gx = (evalScalar(x + eps, y) - evalScalar(x - eps, y)) / (2 * eps);
  const gy = (evalScalar(x, y + eps) - evalScalar(x, y - eps)) / (2 * eps);
  return { gx, gy, mag: Math.sqrt(gx * gx + gy * gy) };
}

/**
 * Evaluates peak altitude for active profile dynamically with spread
 */
function getPeakAltitude() {
  const spread = Math.max(0.5, hillSpread);
  if (currentHillProfile === 0) {
    return evalScalar(0, 0);
  } else if (currentHillProfile === 1) {
    return evalScalar(1.4, 0);
  } else {
    const rRidge = Math.sqrt(spread * 0.8);
    return evalScalar(rRidge, 0);
  }
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
  const size = 6.2;
  const segs = 72;
  const geo = new THREE.PlaneGeometry(size, size, segs, segs);

  const pos = geo.attributes.position;
  const colors = [];
  const col = new THREE.Color();

  const maxZ = Math.max(0.01, getPeakAltitude());
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const zVal = evalScalar(x, y);
    pos.setZ(i, zVal);
  }

  // Colormap based on elevation
  for (let i = 0; i < pos.count; i++) {
    const zVal = pos.getZ(i);
    const t = Math.min(1, Math.max(0, zVal / maxZ));
    // Blue/Teal base -> Vibrant Emerald mid -> Warm Gold summit
    col.setHSL(0.56 * (1.0 - t), 0.88, 0.42 + 0.28 * t);
    colors.push(col.r, col.g, col.b);
  }

  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.38,
    metalness: 0.08,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: 1.0,
    polygonOffsetUnits: 1.0
  });
  hillMesh = new THREE.Mesh(geo, mat);
  gradientGroup.add(hillMesh);

  // Subtle Wireframe overlay
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
    transparent: true,
    opacity: 0.07,
    depthWrite: false
  });
  gradientGroup.add(new THREE.Mesh(geo, wireMat));

  // 2. Equipotential Contour Rings (V = const)
  buildContourRings(maxZ);

  // 3. 3D Surface Tangent Gradient Vector Arrows (Floating reliably above surface)
  buildGradientArrows();

  // 4. Stable Steepest Ascent Streamlines & Particles
  buildAscentStreamlines();
}

/**
 * Builds equipotential contour curves V(x, y) = const
 */
function buildContourRings(maxZ) {
  const numContours = 6;
  const ringMat = new THREE.LineBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.65,
    depthWrite: false
  });

  const spread = Math.max(0.5, hillSpread);

  for (let c = 1; c <= numContours; c++) {
    const targetV = (c / (numContours + 1)) * maxZ;

    if (currentHillProfile === 0) {
      // Concentric circles for Single Peak
      const r = Math.sqrt(Math.max(0, -spread * Math.log(Math.max(1e-4, targetV / hillAmplitude))));
      if (r > 0.08 && r < 3.0) {
        const pts = [];
        for (let a = 0; a <= 64; a++) {
          const theta = (a / 64) * 2 * Math.PI;
          pts.push(new THREE.Vector3(r * Math.cos(theta), r * Math.sin(theta), targetV + 0.035));
        }
        const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
        contourGroup.add(new THREE.Line(lineGeo, ringMat));
      }
    } else if (currentHillProfile === 1) {
      // Loops around Twin Peaks dynamically scaling with spread
      const s1 = spread * 0.65;
      [-1.4, 1.4].forEach(cx => {
        const rApprox = Math.sqrt(Math.max(0, -s1 * Math.log(Math.max(1e-4, targetV / (hillAmplitude * 0.95)))));
        if (rApprox > 0.05 && rApprox < 1.3) {
          const pts = [];
          for (let a = 0; a <= 48; a++) {
            const theta = (a / 48) * 2 * Math.PI;
            pts.push(new THREE.Vector3(cx + rApprox * Math.cos(theta), rApprox * Math.sin(theta), targetV + 0.035));
          }
          const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
          contourGroup.add(new THREE.Line(lineGeo, ringMat));
        }
      });
    } else {
      // Volcano Crater: two rings dynamically scaling with spread
      const s2 = spread * 0.8;
      const rRidge = Math.sqrt(s2);
      [rRidge * 0.55, rRidge * 1.4].forEach(rEst => {
        if (rEst > 0.1 && rEst < 3.0) {
          const pts = [];
          for (let a = 0; a <= 64; a++) {
            const theta = (a / 64) * 2 * Math.PI;
            const x = rEst * Math.cos(theta);
            const y = rEst * Math.sin(theta);
            pts.push(new THREE.Vector3(x, y, evalScalar(x, y) + 0.035));
          }
          const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
          contourGroup.add(new THREE.Line(lineGeo, ringMat));
        }
      });
    }
  }
}

/**
 * Builds surface-tangent gradient arrows lying on the 3D topographical hill.
 * Guaranteed never to disappear inside the hill mesh.
 */
function buildGradientArrows() {
  const arrowSpacing = 0.65;

  for (let x = -2.6; x <= 2.6; x += arrowSpacing) {
    for (let y = -2.6; y <= 2.6; y += arrowSpacing) {
      const z = evalScalar(x, y);
      const { gx, gy, mag } = evalGrad(x, y);

      if (mag > 0.08) {
        // Horizontal tangent direction
        const ux = gx / mag;
        const uy = gy / mag;

        // True surface-tangent direction in 3D:
        // Along horizontal unit direction (ux, uy), height changes with rate dz/ds = mag.
        // Unit tangent vector = (ux, uy, mag) / sqrt(1 + mag^2)
        const tangentDir = new THREE.Vector3(ux, uy, mag).normalize();

        // Local surface normal vector: (-gx, -gy, 1) normalized
        const normal = new THREE.Vector3(-gx, -gy, 1).normalize();

        // Add a gentle normal bias (+0.12 * normal) so the arrow follows the curvature
        // of convex/concave slopes and never cuts beneath the mesh
        const arrowDir = tangentDir.clone().addScaledVector(normal, 0.12).normalize();

        const len = Math.min(0.48, Math.max(0.18, mag * 0.32));
        // Elevate origin comfortably above surface (+0.05 m)
        const origin = new THREE.Vector3(x, y, z + 0.05);

        const arr = new THREE.ArrowHelper(arrowDir, origin, len, 0xf59e0b, len * 0.35, len * 0.18);

        // Ensure arrows always render cleanly in front of hill mesh
        arr.line.material.linewidth = 2;
        arr.line.material.transparent = true;
        arr.line.material.opacity = 0.95;
        arr.line.material.depthTest = false;
        arr.line.material.depthWrite = false;

        arr.cone.material.transparent = true;
        arr.cone.material.opacity = 0.95;
        arr.cone.material.depthTest = false;
        arr.cone.material.depthWrite = false;

        arr.renderOrder = 8;
        vectorsGroup.add(arr);
      }
    }
  }
}

/**
 * Builds smooth, rock-solid steepest ascent streamlines and particle tracers
 */
function buildAscentStreamlines() {
  streamlines = [];
  particles = [];

  const seedAngles = [];
  for (let i = 0; i < NUM_STREAMLINES; i++) {
    seedAngles.push((i / NUM_STREAMLINES) * 2 * Math.PI);
  }

  const startRadius = 2.65;
  const spread = Math.max(0.5, hillSpread);
  const rRidge = Math.sqrt(spread * 0.8);

  seedAngles.forEach((angle) => {
    let curX = startRadius * Math.cos(angle);
    let curY = startRadius * Math.sin(angle);

    const pts = [];
    pts.push(new THREE.Vector3(curX, curY, evalScalar(curX, curY) + 0.035));

    for (let s = 0; s < 70; s++) {
      const { gx, gy, mag } = evalGrad(curX, curY);
      if (mag < 0.02) break;

      const step = 0.07;
      curX += (gx / mag) * step;
      curY += (gy / mag) * step;

      const curZ = evalScalar(curX, curY);
      pts.push(new THREE.Vector3(curX, curY, curZ + 0.035));

      // Stop near summits
      if (currentHillProfile === 0 && Math.hypot(curX, curY) < 0.12) break;
      if (currentHillProfile === 1 && (Math.hypot(curX - 1.4, curY) < 0.14 || Math.hypot(curX + 1.4, curY) < 0.14)) break;
      if (currentHillProfile === 2 && Math.abs(Math.hypot(curX, curY) - rRidge) < 0.08) break;
    }

    if (pts.length > 5) {
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0xfacc15,
        transparent: true,
        opacity: 0.75,
        linewidth: 2,
        depthWrite: false
      });
      pathsGroup.add(new THREE.Line(lineGeo, lineMat));
      streamlines.push(pts);
    }
  });

  // For Volcano crater: add interior radial rays climbing outwards to the ridge
  if (currentHillProfile === 2) {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * 2 * Math.PI;
      let curX = (rRidge * 0.25) * Math.cos(angle);
      let curY = (rRidge * 0.25) * Math.sin(angle);

      const pts = [];
      pts.push(new THREE.Vector3(curX, curY, evalScalar(curX, curY) + 0.035));

      for (let s = 0; s < 45; s++) {
        const { gx, gy, mag } = evalGrad(curX, curY);
        if (mag < 0.02) break;

        const step = 0.06;
        curX += (gx / mag) * step;
        curY += (gy / mag) * step;

        pts.push(new THREE.Vector3(curX, curY, evalScalar(curX, curY) + 0.035));
        if (Math.abs(Math.hypot(curX, curY) - rRidge) < 0.08) break;
      }

      if (pts.length > 4) {
        const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
        const lineMat = new THREE.LineBasicMaterial({
          color: 0xfacc15,
          transparent: true,
          opacity: 0.75,
          depthWrite: false
        });
        pathsGroup.add(new THREE.Line(lineGeo, lineMat));
        streamlines.push(pts);
      }
    }
  }

  // Setup smooth, continuous particle tracers (2 per streamline)
  if (streamlines.length > 0) {
    const totalParticles = streamlines.length * 2;
    pulsePositions = new Float32Array(totalParticles * 3);

    particles = [];
    for (let sIdx = 0; sIdx < streamlines.length; sIdx++) {
      for (let pIdx = 0; pIdx < 2; pIdx++) {
        particles.push({
          streamIdx: sIdx,
          offset: pIdx * 0.5 + (sIdx * 0.07) % 0.5,
          speed: 0.18 // cycles per second
        });
      }
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pulsePositions, 3));

    const pMat = new THREE.PointsMaterial({
      map: getGlowTexture(),
      size: 0.22,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    pulseTracers = new THREE.Points(pGeo, pMat);
    pathsGroup.add(pulseTracers);
  }
}

/**
 * Uniform Topic Module Contract: update()
 */
export function update(time, coordSystem, params) {
  const nextProfile = (params.profileIndex !== undefined) ? params.profileIndex % 3 : 0;
  const nextAmp = params.hillAmplitude !== undefined ? params.hillAmplitude : hillAmplitude;
  const nextSpread = params.hillSpread !== undefined ? params.hillSpread : hillSpread;

  if (nextProfile !== currentHillProfile || Math.abs(nextAmp - hillAmplitude) > 0.02 || Math.abs(nextSpread - hillSpread) > 0.02) {
    currentHillProfile = nextProfile;
    hillAmplitude = nextAmp;
    hillSpread = nextSpread;
    buildScene(params);
  }

  if (vectorsGroup) vectorsGroup.visible = params.showVectors !== false;
  if (contourGroup) contourGroup.visible = params.showSurfaces !== false;

  // Smooth, non-flashing continuous particle progression
  if (pulseTracers && pulsePositions && streamlines.length > 0 && particles.length > 0) {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const pts = streamlines[p.streamIdx];
      if (!pts || pts.length < 2) continue;

      // Continuous phase [0, 1)
      const t = (time * p.speed + p.offset) % 1.0;

      // Smoothly hide particle near summit (t > 0.92) to avoid clumping
      if (t > 0.92) {
        pulsePositions[i * 3 + 2] = -100; // Place below ground
        continue;
      }

      // Sample along streamline points
      const exactIdx = t * (pts.length - 1);
      const idx0 = Math.floor(exactIdx);
      const idx1 = Math.min(pts.length - 1, idx0 + 1);
      const frac = exactIdx - idx0;

      const pt0 = pts[idx0];
      const pt1 = pts[idx1];

      pulsePositions[i * 3] = pt0.x + (pt1.x - pt0.x) * frac;
      pulsePositions[i * 3 + 1] = pt0.y + (pt1.y - pt0.y) * frac;
      pulsePositions[i * 3 + 2] = pt0.z + (pt1.z - pt0.z) * frac;
    }

    pulseTracers.geometry.attributes.position.needsUpdate = true;
  }
}

/**
 * Uniform Topic Module Contract: getFormulaData()
 * HUD contains:
 * 1. Mathematical formulation for the three different coordinate systems (Cartesian, Cylindrical, Spherical)
 * 2. Active hill profile
 * 3. Peak altitude ONLY
 */
export function getFormulaData(coordSystem, params) {
  const profileNames = [
    'Single Peak',
    'Twin Peaks',
    'Ring Ridge'
  ];
  const profileName = profileNames[currentHillProfile] || profileNames[0];
  const peakAlt = getPeakAltitude();

  const formulaLatex = `\\begin{aligned}
\\nabla V = \\frac{\\partial V}{\\partial x}\\hat{a}_x + \\frac{\\partial V}{\\partial y}\\hat{a}_y + \\frac{\\partial V}{\\partial z}\\hat{a}_z \\\\[8pt]
\\nabla V = \\frac{\\partial V}{\\partial \\rho}\\hat{a}_\\rho + \\frac{1}{\\rho}\\frac{\\partial V}{\\partial \\phi}\\hat{a}_\\phi + \\frac{\\partial V}{\\partial z}\\hat{a}_z \\\\[8pt]
\\nabla V = \\frac{\\partial V}{\\partial r}\\hat{a}_r + \\frac{1}{r}\\frac{\\partial V}{\\partial \\theta}\\hat{a}_\\theta + \\frac{1}{r\\sin\\theta}\\frac{\\partial V}{\\partial \\phi}\\hat{a}_\\phi
\\end{aligned}`;

  return {
    topicTag: 'Gradient',
    topicTitle: 'The Gradient (∇V)',
    modeBtnText: 'Switch Hill Profile: ' + profileNames[(currentHillProfile + 1) % 3] + ' →',
    modeDesc: 'The gradient ∇V points in the direction of steepest ascent and is perpendicular to equipotential contours.',
    formulaLatex,
    probeSubtitle: 'Active Hill Profile & Summit',
    detailTitle: '',
    detailLatex: '', // Hides the bottom detail section completely!
    readout: [
      { label: 'Active Hill Profile', value: profileName },
      { label: 'Peak Altitude', value: `${peakAlt.toFixed(1)} V` }
    ]
  };
}
