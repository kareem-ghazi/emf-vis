/**
 * math.js - Orthogonal Curvilinear Coordinate Transformations, Metric Factors,
 * Unit Vectors, and Numerical / Analytical Differential Field Operators.
 */

export const COORD_SYSTEMS = {
  CARTESIAN: 'cartesian',
  CYLINDRICAL: 'cylindrical',
  SPHERICAL: 'spherical'
};

/**
 * Normalizes an angle into [0, 2π)
 */
export function normalizeAngle(angle) {
  let a = angle % (2 * Math.PI);
  if (a < 0) a += 2 * Math.PI;
  return a;
}

/**
 * Metric Scaling Factors (h1, h2, h3) and differential volume dv
 * u is an array [u1, u2, u3] representing coordinates in the active system:
 * - Cartesian: [x, y, z]
 * - Cylindrical: [rho, phi, z]  (phi in radians)
 * - Spherical: [r, theta, phi]  (theta, phi in radians)
 */
export function getMetricFactors(u, coordSystem) {
  switch (coordSystem) {
    case COORD_SYSTEMS.CARTESIAN: {
      return {
        h1: 1,
        h2: 1,
        h3: 1,
        dvFormula: 'dx\\,dy\\,dz'
      };
    }
    case COORD_SYSTEMS.CYLINDRICAL: {
      const rho = Math.max(0.001, u[0]);
      return {
        h1: 1,
        h2: rho,
        h3: 1,
        dvFormula: '\\rho\\,d\\rho\\,d\\phi\\,dz'
      };
    }
    case COORD_SYSTEMS.SPHERICAL: {
      const r = Math.max(0.001, u[0]);
      const theta = u[1];
      const sinTheta = Math.max(0.0001, Math.abs(Math.sin(theta)));
      return {
        h1: 1,
        h2: r,
        h3: r * sinTheta,
        dvFormula: 'r^2 \\sin\\theta\\,dr\\,d\\theta\\,d\\phi'
      };
    }
    default:
      return { h1: 1, h2: 1, h3: 1, dvFormula: 'dv' };
  }
}

/**
 * Converts curvilinear coordinates [u1, u2, u3] into Cartesian world coordinates {x, y, z}
 */
export function toCartesian(u, coordSystem) {
  switch (coordSystem) {
    case COORD_SYSTEMS.CARTESIAN:
      return { x: u[0], y: u[1], z: u[2] };

    case COORD_SYSTEMS.CYLINDRICAL: {
      const rho = u[0];
      const phi = u[1];
      const z = u[2];
      return {
        x: rho * Math.cos(phi),
        y: rho * Math.sin(phi),
        z: z
      };
    }

    case COORD_SYSTEMS.SPHERICAL: {
      const r = u[0];
      const theta = u[1];
      const phi = u[2];
      return {
        x: r * Math.sin(theta) * Math.cos(phi),
        y: r * Math.sin(theta) * Math.sin(phi),
        z: r * Math.cos(theta)
      };
    }

    default:
      return { x: u[0], y: u[1], z: u[2] };
  }
}

/**
 * Converts Cartesian coordinates {x, y, z} into active curvilinear coordinates [u1, u2, u3]
 */
export function fromCartesian(cart, coordSystem) {
  const { x, y, z } = cart;
  switch (coordSystem) {
    case COORD_SYSTEMS.CARTESIAN:
      return [x, y, z];

    case COORD_SYSTEMS.CYLINDRICAL: {
      const rho = Math.sqrt(x * x + y * y);
      let phi = Math.atan2(y, x);
      if (phi < 0) phi += 2 * Math.PI;
      return [rho, phi, z];
    }

    case COORD_SYSTEMS.SPHERICAL: {
      const r = Math.sqrt(x * x + y * y + z * z);
      const safeR = Math.max(0.0001, r);
      let theta = Math.acos(Math.max(-1, Math.min(1, z / safeR)));
      let phi = Math.atan2(y, x);
      if (phi < 0) phi += 2 * Math.PI;
      return [r, theta, phi];
    }

    default:
      return [x, y, z];
  }
}

/**
 * Returns the three local unit vectors (a_1, a_2, a_3) in Cartesian 3D world space at point u
 * Each unit vector is an object { x, y, z } of length 1.
 */
export function getUnitVectors(u, coordSystem) {
  switch (coordSystem) {
    case COORD_SYSTEMS.CARTESIAN:
      return {
        a1: { x: 1, y: 0, z: 0 }, // a_x
        a2: { x: 0, y: 1, z: 0 }, // a_y
        a3: { x: 0, y: 0, z: 1 }, // a_z
        names: ['\\hat{a}_x', '\\hat{a}_y', '\\hat{a}_z']
      };

    case COORD_SYSTEMS.CYLINDRICAL: {
      const phi = u[1];
      const cosP = Math.cos(phi);
      const sinP = Math.sin(phi);

      return {
        a1: { x: cosP, y: sinP, z: 0 },     // a_rho
        a2: { x: -sinP, y: cosP, z: 0 },    // a_phi
        a3: { x: 0, y: 0, z: 1 },          // a_z
        names: ['\\hat{a}_\\rho', '\\hat{a}_\\phi', '\\hat{a}_z']
      };
    }

    case COORD_SYSTEMS.SPHERICAL: {
      const theta = u[1];
      const phi = u[2];
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);
      const sinP = Math.sin(phi);
      const cosP = Math.cos(phi);

      return {
        a1: { x: sinT * cosP, y: sinT * sinP, z: cosT },    // a_r
        a2: { x: cosT * cosP, y: cosT * sinP, z: -sinT },   // a_theta
        a3: { x: -sinP, y: cosP, z: 0 },                    // a_phi
        names: ['\\hat{a}_r', '\\hat{a}_\\theta', '\\hat{a}_\\phi']
      };
    }

    default:
      return {
        a1: { x: 1, y: 0, z: 0 },
        a2: { x: 0, y: 1, z: 0 },
        a3: { x: 0, y: 0, z: 1 },
        names: ['\\hat{a}_1', '\\hat{a}_2', '\\hat{a}_3']
      };
  }
}

/**
 * Transforms vector components [A1, A2, A3] in the local curvilinear basis at u
 * into Cartesian world coordinates [Ax, Ay, Az].
 */
export function curvilinearVectorToCartesian(A, u, coordSystem) {
  const { a1, a2, a3 } = getUnitVectors(u, coordSystem);
  return {
    x: A[0] * a1.x + A[1] * a2.x + A[2] * a3.x,
    y: A[0] * a1.y + A[1] * a2.y + A[2] * a3.y,
    z: A[0] * a1.z + A[1] * a2.z + A[2] * a3.z
  };
}

/**
 * Projects a Cartesian vector {x, y, z} onto the local curvilinear basis at u.
 * Returns [A1, A2, A3].
 */
export function cartesianVectorToCurvilinear(V, u, coordSystem) {
  const { a1, a2, a3 } = getUnitVectors(u, coordSystem);
  return [
    V.x * a1.x + V.y * a1.y + V.z * a1.z,
    V.x * a2.x + V.y * a2.y + V.z * a2.z,
    V.x * a3.x + V.y * a3.y + V.z * a3.z
  ];
}

/* ==========================================================================
   General Orthogonal Differential Operators (Numerical via Central Difference)
   ========================================================================== */

/**
 * Computes numerical Gradient ∇Φ of a scalar field Φ(u)
 * Returns { components: [G1, G2, G3], worldVector: {x,y,z}, magnitude }
 */
export function computeGradient(scalarFunc, u, coordSystem, eps = 1e-4) {
  const { h1, h2, h3 } = getMetricFactors(u, coordSystem);

  const uP1 = [u[0] + eps, u[1], u[2]];
  const uM1 = [u[0] - eps, u[1], u[2]];
  const dPhi_du1 = (scalarFunc(uP1) - scalarFunc(uM1)) / (2 * eps);

  const uP2 = [u[0], u[1] + eps, u[2]];
  const uM2 = [u[0], u[1] - eps, u[2]];
  const dPhi_du2 = (scalarFunc(uP2) - scalarFunc(uM2)) / (2 * eps);

  const uP3 = [u[0], u[1], u[2] + eps];
  const uM3 = [u[0], u[1], u[2] - eps];
  const dPhi_du3 = (scalarFunc(uP3) - scalarFunc(uM3)) / (2 * eps);

  const G1 = dPhi_du1 / h1;
  const G2 = dPhi_du2 / h2;
  const G3 = dPhi_du3 / h3;

  const worldVector = curvilinearVectorToCartesian([G1, G2, G3], u, coordSystem);
  const magnitude = Math.sqrt(G1 * G1 + G2 * G2 + G3 * G3);

  return {
    components: [G1, G2, G3],
    worldVector,
    magnitude
  };
}

/**
 * Computes numerical Divergence ∇·A of a vector field A(u)
 * vectorFunc(u) returns [A1, A2, A3] in curvilinear basis
 */
export function computeDivergence(vectorFunc, u, coordSystem, eps = 1e-4) {
  const mf0 = getMetricFactors(u, coordSystem);
  const detH = mf0.h1 * mf0.h2 * mf0.h3;

  // Term 1: ∂(h2 * h3 * A1) / ∂u1
  const uP1 = [u[0] + eps, u[1], u[2]];
  const uM1 = [u[0] - eps, u[1], u[2]];
  const mfP1 = getMetricFactors(uP1, coordSystem);
  const mfM1 = getMetricFactors(uM1, coordSystem);
  const f1_P = mfP1.h2 * mfP1.h3 * vectorFunc(uP1)[0];
  const f1_M = mfM1.h2 * mfM1.h3 * vectorFunc(uM1)[0];
  const d1 = (f1_P - f1_M) / (2 * eps);

  // Term 2: ∂(h1 * h3 * A2) / ∂u2
  const uP2 = [u[0], u[1] + eps, u[2]];
  const uM2 = [u[0], u[1] - eps, u[2]];
  const mfP2 = getMetricFactors(uP2, coordSystem);
  const mfM2 = getMetricFactors(uM2, coordSystem);
  const f2_P = mfP2.h1 * mfP2.h3 * vectorFunc(uP2)[1];
  const f2_M = mfM2.h1 * mfM2.h3 * vectorFunc(uM2)[1];
  const d2 = (f2_P - f2_M) / (2 * eps);

  // Term 3: ∂(h1 * h2 * A3) / ∂u3
  const uP3 = [u[0], u[1], u[2] + eps];
  const uM3 = [u[0], u[1], u[2] - eps];
  const mfP3 = getMetricFactors(uP3, coordSystem);
  const mfM3 = getMetricFactors(uM3, coordSystem);
  const f3_P = mfP3.h1 * mfP3.h2 * vectorFunc(uP3)[2];
  const f3_M = mfM3.h1 * mfM3.h2 * vectorFunc(uM3)[2];
  const d3 = (f3_P - f3_M) / (2 * eps);

  return (d1 + d2 + d3) / Math.max(1e-6, detH);
}

/**
 * Computes numerical Curl ∇×A of a vector field A(u)
 * vectorFunc(u) returns [A1, A2, A3] in curvilinear basis
 * Returns { components: [C1, C2, C3], worldVector: {x,y,z}, magnitude }
 */
export function computeCurl(vectorFunc, u, coordSystem, eps = 1e-4) {
  const mf = getMetricFactors(u, coordSystem);

  // Component 1: (1 / (h2*h3)) * [ ∂(h3 A3)/∂u2 - ∂(h2 A2)/∂u3 ]
  const u_p2 = [u[0], u[1] + eps, u[2]];
  const u_m2 = [u[0], u[1] - eps, u[2]];
  const d_h3A3_du2 = (getMetricFactors(u_p2, coordSystem).h3 * vectorFunc(u_p2)[2] -
                      getMetricFactors(u_m2, coordSystem).h3 * vectorFunc(u_m2)[2]) / (2 * eps);

  const u_p3 = [u[0], u[1], u[2] + eps];
  const u_m3 = [u[0], u[1], u[2] - eps];
  const d_h2A2_du3 = (getMetricFactors(u_p3, coordSystem).h2 * vectorFunc(u_p3)[1] -
                      getMetricFactors(u_m3, coordSystem).h2 * vectorFunc(u_m3)[1]) / (2 * eps);

  const C1 = (d_h3A3_du2 - d_h2A2_du3) / Math.max(1e-6, mf.h2 * mf.h3);

  // Component 2: (1 / (h1*h3)) * [ ∂(h1 A1)/∂u3 - ∂(h3 A3)/∂u1 ]
  const d_h1A1_du3 = (getMetricFactors(u_p3, coordSystem).h1 * vectorFunc(u_p3)[0] -
                      getMetricFactors(u_m3, coordSystem).h1 * vectorFunc(u_m3)[0]) / (2 * eps);

  const u_p1 = [u[0] + eps, u[1], u[2]];
  const u_m1 = [u[0] - eps, u[1], u[2]];
  const d_h3A3_du1 = (getMetricFactors(u_p1, coordSystem).h3 * vectorFunc(u_p1)[2] -
                      getMetricFactors(u_m1, coordSystem).h3 * vectorFunc(u_m1)[2]) / (2 * eps);

  const C2 = (d_h1A1_du3 - d_h3A3_du1) / Math.max(1e-6, mf.h1 * mf.h3);

  // Component 3: (1 / (h1*h2)) * [ ∂(h2 A2)/∂u1 - ∂(h1 A1)/∂u2 ]
  const d_h2A2_du1 = (getMetricFactors(u_p1, coordSystem).h2 * vectorFunc(u_p1)[1] -
                      getMetricFactors(u_m1, coordSystem).h2 * vectorFunc(u_m1)[1]) / (2 * eps);

  const d_h1A1_du2 = (getMetricFactors(u_p2, coordSystem).h1 * vectorFunc(u_p2)[0] -
                      getMetricFactors(u_m2, coordSystem).h1 * vectorFunc(u_m2)[0]) / (2 * eps);

  const C3 = (d_h2A2_du1 - d_h1A1_du2) / Math.max(1e-6, mf.h1 * mf.h2);

  const worldVector = curvilinearVectorToCartesian([C1, C2, C3], u, coordSystem);
  const magnitude = Math.sqrt(C1 * C1 + C2 * C2 + C3 * C3);

  return {
    components: [C1, C2, C3],
    worldVector,
    magnitude
  };
}

/**
 * Computes numerical Laplacian ∇²Φ of a scalar field Φ(u)
 */
export function computeLaplacian(scalarFunc, u, coordSystem, eps = 1e-4) {
  const mf0 = getMetricFactors(u, coordSystem);
  const detH = mf0.h1 * mf0.h2 * mf0.h3;

  // Direction 1: ∂/∂u1 [ (h2*h3/h1) * ∂Φ/∂u1 ]
  const uP1 = [u[0] + eps, u[1], u[2]];
  const uM1 = [u[0] - eps, u[1], u[2]];
  const mfP1 = getMetricFactors(uP1, coordSystem);
  const mfM1 = getMetricFactors(uM1, coordSystem);
  const k1_P = (mfP1.h2 * mfP1.h3) / mfP1.h1;
  const k1_M = (mfM1.h2 * mfM1.h3) / mfM1.h1;
  const dPhi1_P = (scalarFunc([u[0] + 2 * eps, u[1], u[2]]) - scalarFunc(u)) / (2 * eps);
  const dPhi1_M = (scalarFunc(u) - scalarFunc([u[0] - 2 * eps, u[1], u[2]])) / (2 * eps);
  const term1 = (k1_P * dPhi1_P - k1_M * dPhi1_M) / (2 * eps);

  // Direction 2: ∂/∂u2 [ (h1*h3/h2) * ∂Φ/∂u2 ]
  const uP2 = [u[0], u[1] + eps, u[2]];
  const uM2 = [u[0], u[1] - eps, u[2]];
  const mfP2 = getMetricFactors(uP2, coordSystem);
  const mfM2 = getMetricFactors(uM2, coordSystem);
  const k2_P = (mfP2.h1 * mfP2.h3) / mfP2.h2;
  const k2_M = (mfM2.h1 * mfM2.h3) / mfM2.h2;
  const dPhi2_P = (scalarFunc([u[0], u[1] + 2 * eps, u[2]]) - scalarFunc(u)) / (2 * eps);
  const dPhi2_M = (scalarFunc(u) - scalarFunc([u[0], u[1] - 2 * eps, u[2]])) / (2 * eps);
  const term2 = (k2_P * dPhi2_P - k2_M * dPhi2_M) / (2 * eps);

  // Direction 3: ∂/∂u3 [ (h1*h2/h3) * ∂Φ/∂u3 ]
  const uP3 = [u[0], u[1], u[2] + eps];
  const uM3 = [u[0], u[1], u[2] - eps];
  const mfP3 = getMetricFactors(uP3, coordSystem);
  const mfM3 = getMetricFactors(uM3, coordSystem);
  const k3_P = (mfP3.h1 * mfP3.h2) / mfP3.h3;
  const k3_M = (mfM3.h1 * mfM3.h2) / mfM3.h3;
  const dPhi3_P = (scalarFunc([u[0], u[1], u[2] + 2 * eps]) - scalarFunc(u)) / (2 * eps);
  const dPhi3_M = (scalarFunc(u) - scalarFunc([u[0], u[1], u[2] - 2 * eps])) / (2 * eps);
  const term3 = (k3_P * dPhi3_P - k3_M * dPhi3_M) / (2 * eps);

  return (term1 + term2 + term3) / Math.max(1e-6, detH);
}

/* ==========================================================================
   Analytical Canonical Fields for Topic 2 (Gradient) & Topic 5 (Laplacian)
   ========================================================================== */

/**
 * Topic 2: Canonical Scalar Fields & Exact Gradients
 */
export const GRADIENT_FIELDS = {
  [COORD_SYSTEMS.CARTESIAN]: {
    name: '\\Phi(x,y,z) = 0.2(x^2 - y^2 + 2z)',
    evalScalar: (u) => 0.2 * (u[0] * u[0] - u[1] * u[1] + 2 * u[2]),
    evalGradient: (u) => {
      // ∂Φ/∂x = 0.4x, ∂Φ/∂y = -0.4y, ∂Φ/∂z = 0.4
      const g1 = 0.4 * u[0];
      const g2 = -0.4 * u[1];
      const g3 = 0.4;
      return [g1, g2, g3];
    }
  },
  [COORD_SYSTEMS.CYLINDRICAL]: {
    name: '\\Phi(\\rho,\\phi,z) = 0.15\\rho^2 z \\cos(2\\phi)',
    evalScalar: (u) => 0.15 * u[0] * u[0] * u[2] * Math.cos(2 * u[1]),
    evalGradient: (u) => {
      const rho = Math.max(0.001, u[0]);
      const phi = u[1];
      const z = u[2];
      // ∂Φ/∂ρ = 0.30 ρ z cos(2φ)
      // (1/ρ) ∂Φ/∂φ = (1/ρ) [-0.30 ρ² z sin(2φ)] = -0.30 ρ z sin(2φ)
      // ∂Φ/∂z = 0.15 ρ² cos(2φ)
      const g1 = 0.30 * rho * z * Math.cos(2 * phi);
      const g2 = -0.30 * rho * z * Math.sin(2 * phi);
      const g3 = 0.15 * rho * rho * Math.cos(2 * phi);
      return [g1, g2, g3];
    }
  },
  [COORD_SYSTEMS.SPHERICAL]: {
    name: '\\Phi(r,\\theta,\\phi) = r \\sin^2\\theta \\cos\\phi',
    evalScalar: (u) => u[0] * Math.pow(Math.sin(u[1]), 2) * Math.cos(u[2]),
    evalGradient: (u) => {
      const r = Math.max(0.001, u[0]);
      const theta = u[1];
      const phi = u[2];
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);
      const sinP = Math.sin(phi);
      const cosP = Math.cos(phi);
      // ∂Φ/∂r = sin²θ cosφ
      // (1/r) ∂Φ/∂θ = 2 sinθ cosθ cosφ = sin(2θ) cosφ
      // (1 / (r sinθ)) ∂Φ/∂φ = -sinθ sinφ
      const g1 = sinT * sinT * cosP;
      const g2 = 2 * sinT * cosT * cosP;
      const g3 = -sinT * sinP;
      return [g1, g2, g3];
    }
  }
};

/**
 * Topic 5: Canonical Laplacian Fields (Harmonic vs Non-Harmonic)
 */
export const LAPLACIAN_FIELDS = {
  HARMONIC: {
    [COORD_SYSTEMS.CARTESIAN]: {
      name: '\\Phi(x,y,z) = 0.25(x^2 - y^2)',
      evalScalar: (u) => 0.25 * (u[0] * u[0] - u[1] * u[1]),
      evalLaplacian: () => 0.0 // ∂²/∂x² + ∂²/∂y² = 0.5 - 0.5 = 0
    },
    [COORD_SYSTEMS.CYLINDRICAL]: {
      name: 'U(\\rho,\\phi,z) = \\rho^2 z \\cos(2\\phi)',
      evalScalar: (u) => u[0] * u[0] * u[2] * Math.cos(2 * u[1]),
      evalLaplacian: () => 0.0 // 4z cos(2φ) - 4z cos(2φ) = 0
    },
    [COORD_SYSTEMS.SPHERICAL]: {
      name: '\\Phi(r,\\theta,\\phi) = r \\cos\\theta \\quad (z)',
      evalScalar: (u) => u[0] * Math.cos(u[1]),
      evalLaplacian: () => 0.0 // Linear in z => Laplacian is identically 0
    }
  },
  NON_HARMONIC: {
    [COORD_SYSTEMS.CARTESIAN]: {
      name: '\\Phi(x,y,z) = 0.2(x^2 + y^2 + z^2)',
      evalScalar: (u) => 0.2 * (u[0] * u[0] + u[1] * u[1] + u[2] * u[2]),
      evalLaplacian: () => 1.2 // 0.4 + 0.4 + 0.4 = 1.2
    },
    [COORD_SYSTEMS.CYLINDRICAL]: {
      name: '\\Phi(\\rho,\\phi,z) = 0.2(\\rho^2 + z^2)',
      evalScalar: (u) => 0.2 * (u[0] * u[0] + u[2] * u[2]),
      evalLaplacian: () => 1.2 // (1/ρ)(∂/∂ρ(0.4ρ²)) + 0.4 = 0.8 + 0.4 = 1.2
    },
    [COORD_SYSTEMS.SPHERICAL]: {
      name: 'W(r,\\theta,\\phi) = 10 r \\sin^2\\theta \\cos\\phi',
      evalScalar: (u) => 10 * u[0] * Math.pow(Math.sin(u[1]), 2) * Math.cos(u[2]),
      evalLaplacian: (u) => {
        const r = Math.max(0.1, u[0]);
        const theta = u[1];
        const phi = u[2];
        const cosT = Math.cos(theta);
        const cosP = Math.cos(phi);
        // (10 / r) cosφ * (4 cos²θ - 1)
        return (10 / r) * cosP * (4 * cosT * cosT - 1);
      }
    }
  }
};

/* ==========================================================================
   Scientific Calculator & Converter Engine
   ========================================================================== */

/**
 * Converts a point [u1, u2, u3] from any coordinate system to all 3 systems
 * angleMode: 'deg' or 'rad'
 */
export function convertCoordinatesAll(fromSystem, u, angleMode = 'deg') {
  let normU = [...u];
  if (angleMode === 'deg') {
    if (fromSystem === COORD_SYSTEMS.CYLINDRICAL) {
      normU[1] = (u[1] * Math.PI) / 180;
    } else if (fromSystem === COORD_SYSTEMS.SPHERICAL) {
      normU[1] = (u[1] * Math.PI) / 180;
      normU[2] = (u[2] * Math.PI) / 180;
    }
  }

  // Convert to Cartesian
  const cart = toCartesian(normU, fromSystem);
  const x = cart.x;
  const y = cart.y;
  const z = cart.z;

  // Convert from Cartesian to Cylindrical
  const cyl = fromCartesian(cart, COORD_SYSTEMS.CYLINDRICAL);
  const rho = cyl[0];
  const phiRad = cyl[1];
  const phiDeg = (phiRad * 180) / Math.PI;

  // Convert from Cartesian to Spherical
  const sph = fromCartesian(cart, COORD_SYSTEMS.SPHERICAL);
  const r = sph[0];
  const thetaRad = sph[1];
  const thetaDeg = (thetaRad * 180) / Math.PI;
  const sphPhiRad = sph[2];
  const sphPhiDeg = (sphPhiRad * 180) / Math.PI;

  return {
    cartesian: { x, y, z },
    cylindrical: { rho, phiRad, phiDeg, z },
    spherical: { r, thetaRad, thetaDeg, phiRad: sphPhiRad, phiDeg: sphPhiDeg }
  };
}

/**
 * Calculates unit vectors, metric scaling factors, and transformation matrix at u
 */
export function calculateUnitVectorsAt(coordSystem, u) {
  const { a1, a2, a3, names } = getUnitVectors(u, coordSystem);
  const mf = getMetricFactors(u, coordSystem);
  return { a1, a2, a3, names, mf };
}

/**
 * Calculates magnitude, unit vector, direction cosines, and direction angles
 */
export function calculateVectorMagnitudeAndDirection(A) {
  const [Ax, Ay, Az] = A;
  const mag = Math.sqrt(Ax * Ax + Ay * Ay + Az * Az);
  const safeMag = Math.max(1e-12, mag);

  const ux = Ax / safeMag;
  const uy = Ay / safeMag;
  const uz = Az / safeMag;

  const alphaRad = Math.acos(Math.max(-1, Math.min(1, ux)));
  const betaRad = Math.acos(Math.max(-1, Math.min(1, uy)));
  const gammaRad = Math.acos(Math.max(-1, Math.min(1, uz)));

  const alphaDeg = (alphaRad * 180) / Math.PI;
  const betaDeg = (betaRad * 180) / Math.PI;
  const gammaDeg = (gammaRad * 180) / Math.PI;

  const thetaRad = Math.acos(Math.max(-1, Math.min(1, uz)));
  let phiRad = Math.atan2(Ay, Ax);
  if (phiRad < 0) phiRad += 2 * Math.PI;

  return {
    magnitude: mag,
    unitVector: { x: ux, y: uy, z: uz },
    directionCosines: { cosAlpha: ux, cosBeta: uy, cosGamma: uz },
    directionAngles: {
      alphaRad, betaRad, gammaRad,
      alphaDeg, betaDeg, gammaDeg
    },
    sphericalAngles: {
      thetaRad, thetaDeg: (thetaRad * 180) / Math.PI,
      phiRad, phiDeg: (phiRad * 180) / Math.PI
    }
  };
}

/**
 * Evaluates gradient of preset or custom scalar functions at (x, y, z)
 */
export const GRADIENT_PRESETS = [
  { id: 'quad', label: 'f(x, y, z) = x² + y² + z²', formula: 'x^2 + y^2 + z^2',
    eval: (x, y, z) => x*x + y*y + z*z,
    grad: (x, y, z) => ({ gx: 2*x, gy: 2*y, gz: 2*z })
  },
  { id: 'gauss', label: 'V(x, y) = 3.5 exp(-(x² + y²)/3)', formula: '3.5 e^{-(x^2 + y^2)/3}',
    eval: (x, y) => 3.5 * Math.exp(-(x*x + y*y)/3),
    grad: (x, y) => {
      const v = 3.5 * Math.exp(-(x*x + y*y)/3);
      return { gx: -(2/3)*x*v, gy: -(2/3)*y*v, gz: 0 };
    }
  },
  { id: 'hyp', label: 'f(x, y, z) = 2xy - z²', formula: '2xy - z^2',
    eval: (x, y, z) => 2*x*y - z*z,
    grad: (x, y, z) => ({ gx: 2*y, gy: 2*x, gz: -2*z })
  },
  { id: 'inv_r', label: 'V(r) = 1 / √(x² + y² + z²)', formula: '\\frac{1}{\\sqrt{x^2 + y^2 + z^2}}',
    eval: (x, y, z) => 1 / Math.max(0.01, Math.sqrt(x*x + y*y + z*z)),
    grad: (x, y, z) => {
      const r2 = x*x + y*y + z*z;
      const r3 = Math.max(0.001, Math.pow(r2, 1.5));
      return { gx: -x/r3, gy: -y/r3, gz: -z/r3 };
    }
  }
];

export function calculateGradientAt(presetId, x, y, z) {
  const p = GRADIENT_PRESETS.find(pr => pr.id === presetId) || GRADIENT_PRESETS[0];
  const value = p.eval(x, y, z);
  const { gx, gy, gz } = p.grad(x, y, z);
  const mag = Math.sqrt(gx*gx + gy*gy + gz*gz);
  const safeMag = Math.max(1e-12, mag);
  return {
    preset: p,
    value,
    gradient: { gx, gy, gz },
    magnitude: mag,
    unitDirection: { x: gx/safeMag, y: gy/safeMag, z: gz/safeMag }
  };
}

/**
 * Evaluates divergence for 4-point divergence field at (x, y)
 */
export function calculateDivergenceAt(pointsData, x, y, eps = 0.35) {
  let divTotal = 0;
  let Fx = 0;
  let Fy = 0;

  pointsData.forEach(p => {
    const dx = x - p.x;
    const dy = y - p.y;
    const r2 = dx*dx + dy*dy;
    const denom = r2 + eps*eps;
    Fx += p.q * dx / denom;
    Fy += p.q * dy / denom;

    const dDiv = p.q * (2 * eps * eps) / (denom * denom);
    divTotal += dDiv;
  });

  let classification = 'Incompressible / Solenoidal (∇·A ≈ 0)';
  if (divTotal > 0.08) classification = 'Source (Net Outflow / Expansion, ∇·A > 0)';
  else if (divTotal < -0.08) classification = 'Sink (Net Inflow / Compression, ∇·A < 0)';

  return {
    field: { Fx, Fy },
    fieldMagnitude: Math.sqrt(Fx*Fx + Fy*Fy),
    divergence: divTotal,
    classification
  };
}

/**
 * Evaluates curl for 4-vortex curl field at (x, y)
 */
export function calculateCurlAt(vorticesData, x, y, eps = 0.35) {
  let curlTotal = 0;
  let Fx = 0;
  let Fy = 0;

  vorticesData.forEach(v => {
    const dx = x - v.x;
    const dy = y - v.y;
    const r2 = dx*dx + dy*dy;
    const denom = r2 + eps*eps;

    Fx += v.gamma * (-dy) / denom;
    Fy += v.gamma * (dx) / denom;

    const dCurl = v.gamma * (2 * eps * eps) / (denom * denom);
    curlTotal += dCurl;
  });

  let classification = 'Irrotational Flow (∇×A ≈ 0)';
  if (curlTotal > 0.08) classification = 'Rotational Vortex (Counter-Clockwise, ∇×A > 0)';
  else if (curlTotal < -0.08) classification = 'Rotational Vortex (Clockwise, ∇×A < 0)';

  return {
    field: { Fx, Fy },
    fieldMagnitude: Math.sqrt(Fx*Fx + Fy*Fy),
    curlZ: curlTotal,
    angularVelocityZ: 0.5 * curlTotal,
    classification
  };
}

