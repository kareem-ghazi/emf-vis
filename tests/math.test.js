import { describe, it, expect } from 'vitest';
import {
  COORD_SYSTEMS,
  normalizeAngle,
  getMetricFactors,
  toCartesian,
  fromCartesian,
  getUnitVectors,
  curvilinearVectorToCartesian,
  cartesianVectorToCurvilinear,
  computeGradient,
  computeDivergence,
  computeCurl,
  computeLaplacian,
  convertCoordinatesAll,
  calculateUnitVectorsAt,
  calculateVectorMagnitudeAndDirection,
  calculateGradientAt,
  calculateDivergenceAt,
  calculateCurlAt,
  formatScientific
} from '../src/math.js';

describe('Coordinate Systems & Angle Transformations', () => {
  it('normalizes angles into [0, 2π)', () => {
    expect(normalizeAngle(0)).toBeCloseTo(0);
    expect(normalizeAngle(2 * Math.PI)).toBeCloseTo(0);
    expect(normalizeAngle(-Math.PI / 2)).toBeCloseTo((3 * Math.PI) / 2);
    expect(normalizeAngle(5 * Math.PI)).toBeCloseTo(Math.PI);
  });

  it('correctly converts Cartesian coordinates round-trip', () => {
    const p = [2.5, -3.1, 4.2];
    const cart = toCartesian(p, COORD_SYSTEMS.CARTESIAN);
    expect(cart).toEqual({ x: 2.5, y: -3.1, z: 4.2 });
    const back = fromCartesian(cart, COORD_SYSTEMS.CARTESIAN);
    expect(back).toEqual(p);
  });

  it('correctly converts Cylindrical coordinates round-trip', () => {
    const rho = 3.0;
    const phi = Math.PI / 3; // 60 degrees
    const z = -2.5;

    const cart = toCartesian([rho, phi, z], COORD_SYSTEMS.CYLINDRICAL);
    expect(cart.x).toBeCloseTo(rho * Math.cos(phi));
    expect(cart.y).toBeCloseTo(rho * Math.sin(phi));
    expect(cart.z).toBeCloseTo(z);

    const [rRho, rPhi, rZ] = fromCartesian(cart, COORD_SYSTEMS.CYLINDRICAL);
    expect(rRho).toBeCloseTo(rho);
    expect(rPhi).toBeCloseTo(phi);
    expect(rZ).toBeCloseTo(z);
  });

  it('correctly converts Spherical coordinates round-trip', () => {
    const r = 5.0;
    const theta = Math.PI / 4; // 45 degrees
    const phi = Math.PI / 6;   // 30 degrees

    const cart = toCartesian([r, theta, phi], COORD_SYSTEMS.SPHERICAL);
    expect(cart.x).toBeCloseTo(r * Math.sin(theta) * Math.cos(phi));
    expect(cart.y).toBeCloseTo(r * Math.sin(theta) * Math.sin(phi));
    expect(cart.z).toBeCloseTo(r * Math.cos(theta));

    const [rr, rTheta, rPhi] = fromCartesian(cart, COORD_SYSTEMS.SPHERICAL);
    expect(rr).toBeCloseTo(r);
    expect(rTheta).toBeCloseTo(theta);
    expect(rPhi).toBeCloseTo(phi);
  });

  it('handles spherical polar singularities gracefully', () => {
    // North pole: z = +r, x = 0, y = 0 => theta = 0
    const north = fromCartesian({ x: 0, y: 0, z: 4 }, COORD_SYSTEMS.SPHERICAL);
    expect(north[0]).toBeCloseTo(4);
    expect(north[1]).toBeCloseTo(0);

    // South pole: z = -r, x = 0, y = 0 => theta = π
    const south = fromCartesian({ x: 0, y: 0, z: -4 }, COORD_SYSTEMS.SPHERICAL);
    expect(south[0]).toBeCloseTo(4);
    expect(south[1]).toBeCloseTo(Math.PI);
  });

  it('convertCoordinatesAll converts simultaneously between all three systems', () => {
    const res = convertCoordinatesAll(COORD_SYSTEMS.CARTESIAN, [1, 1, Math.sqrt(2)], 'deg');
    expect(res.cartesian.x).toBeCloseTo(1);
    expect(res.cartesian.y).toBeCloseTo(1);
    expect(res.cylindrical.rho).toBeCloseTo(Math.SQRT2);
    expect(res.cylindrical.phiDeg).toBeCloseTo(45);
    expect(res.spherical.r).toBeCloseTo(2);
    expect(res.spherical.thetaDeg).toBeCloseTo(45);
    expect(res.spherical.phiDeg).toBeCloseTo(45);
  });
});

describe('Metric Scaling Factors (h1, h2, h3) & Differential Volume', () => {
  it('returns h = [1, 1, 1] for Cartesian', () => {
    const mf = getMetricFactors([2, 3, 4], COORD_SYSTEMS.CARTESIAN);
    expect(mf.h1).toBe(1);
    expect(mf.h2).toBe(1);
    expect(mf.h3).toBe(1);
    expect(mf.dvFormula).toContain('dx');
  });

  it('returns h = [1, ρ, 1] for Cylindrical', () => {
    const rho = 3.5;
    const mf = getMetricFactors([rho, Math.PI / 4, 1.0], COORD_SYSTEMS.CYLINDRICAL);
    expect(mf.h1).toBe(1);
    expect(mf.h2).toBeCloseTo(rho);
    expect(mf.h3).toBe(1);
    expect(mf.dvFormula).toContain('\\rho');
  });

  it('returns h = [1, r, r sin θ] for Spherical', () => {
    const r = 4.0;
    const theta = Math.PI / 6; // 30 deg => sin(30) = 0.5
    const mf = getMetricFactors([r, theta, 0], COORD_SYSTEMS.SPHERICAL);
    expect(mf.h1).toBe(1);
    expect(mf.h2).toBeCloseTo(r);
    expect(mf.h3).toBeCloseTo(r * Math.sin(theta));
    expect(mf.dvFormula).toContain('r^2');
  });
});

describe('Curvilinear Basis Unit Vectors', () => {
  function dot(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  }
  function norm(v) {
    return Math.sqrt(dot(v, v));
  }

  it('maintains orthonormality in Cylindrical basis', () => {
    const u = [2.5, Math.PI / 3, 1.0];
    const { a1, a2, a3 } = getUnitVectors(u, COORD_SYSTEMS.CYLINDRICAL);

    expect(norm(a1)).toBeCloseTo(1.0);
    expect(norm(a2)).toBeCloseTo(1.0);
    expect(norm(a3)).toBeCloseTo(1.0);

    expect(dot(a1, a2)).toBeCloseTo(0.0);
    expect(dot(a2, a3)).toBeCloseTo(0.0);
    expect(dot(a1, a3)).toBeCloseTo(0.0);
  });

  it('maintains orthonormality in Spherical basis', () => {
    const u = [3.0, Math.PI / 4, Math.PI / 6];
    const { a1, a2, a3 } = getUnitVectors(u, COORD_SYSTEMS.SPHERICAL);

    expect(norm(a1)).toBeCloseTo(1.0);
    expect(norm(a2)).toBeCloseTo(1.0);
    expect(norm(a3)).toBeCloseTo(1.0);

    expect(dot(a1, a2)).toBeCloseTo(0.0);
    expect(dot(a2, a3)).toBeCloseTo(0.0);
    expect(dot(a1, a3)).toBeCloseTo(0.0);
  });

  it('curvilinearVectorToCartesian and cartesianVectorToCurvilinear are mutual inverses', () => {
    const u = [2.0, Math.PI / 4, Math.PI / 3];
    const localA = [1.5, -2.2, 3.1];

    const world = curvilinearVectorToCartesian(localA, u, COORD_SYSTEMS.SPHERICAL);
    const backToLocal = cartesianVectorToCurvilinear(world, u, COORD_SYSTEMS.SPHERICAL);

    expect(backToLocal[0]).toBeCloseTo(localA[0]);
    expect(backToLocal[1]).toBeCloseTo(localA[1]);
    expect(backToLocal[2]).toBeCloseTo(localA[2]);
  });
});

describe('Vector Magnitude & Direction Calculations', () => {
  it('correctly computes magnitude and direction cosines for 3D vector', () => {
    const vec = [3, 4, 12]; // |A| = sqrt(9 + 16 + 144) = 13
    const res = calculateVectorMagnitudeAndDirection(vec);

    expect(res.magnitude).toBeCloseTo(13.0);
    expect(res.unitVector.x).toBeCloseTo(3 / 13);
    expect(res.unitVector.y).toBeCloseTo(4 / 13);
    expect(res.unitVector.z).toBeCloseTo(12 / 13);

    // Sum of squared direction cosines must equal 1
    const sumSq = Math.pow(res.directionCosines.cosAlpha, 2) +
                  Math.pow(res.directionCosines.cosBeta, 2) +
                  Math.pow(res.directionCosines.cosGamma, 2);
    expect(sumSq).toBeCloseTo(1.0);
  });
});

describe('Differential Vector Operators (Gradient, Divergence, Curl, Laplacian)', () => {
  it('computes numerical gradient ∇(x² + y² + z²) = (2x, 2y, 2z)', () => {
    const scalarFunc = (p) => p[0]*p[0] + p[1]*p[1] + p[2]*p[2];
    const u = [1.5, -2.0, 3.0];
    const res = computeGradient(scalarFunc, u, COORD_SYSTEMS.CARTESIAN);

    expect(res.components[0]).toBeCloseTo(2 * 1.5, 3);
    expect(res.components[1]).toBeCloseTo(2 * (-2.0), 3);
    expect(res.components[2]).toBeCloseTo(2 * 3.0, 3);
  });

  it('computes numerical divergence ∇·(x, y, z) = 3 in Cartesian', () => {
    const vecFunc = (p) => [p[0], p[1], p[2]];
    const div = computeDivergence(vecFunc, [1, 2, 3], COORD_SYSTEMS.CARTESIAN);
    expect(div).toBeCloseTo(3.0, 2);
  });

  it('identifies solenoidal field ∇·(-y, x, 0) = 0 in Cartesian', () => {
    const vecFunc = (p) => [-p[1], p[0], 0];
    const div = computeDivergence(vecFunc, [2.5, 3.5, 1.0], COORD_SYSTEMS.CARTESIAN);
    expect(div).toBeCloseTo(0.0, 3);
  });

  it('computes numerical curl ∇×(-y, x, 0) = (0, 0, 2) in Cartesian', () => {
    const vecFunc = (p) => [-p[1], p[0], 0];
    const res = computeCurl(vecFunc, [1.5, 2.5, 0], COORD_SYSTEMS.CARTESIAN);

    expect(res.components[0]).toBeCloseTo(0.0, 2);
    expect(res.components[1]).toBeCloseTo(0.0, 2);
    expect(res.components[2]).toBeCloseTo(2.0, 2);
  });

  it('verifies vector identity ∇×(∇Φ) = 0 (curl of gradient is identically zero)', () => {
    // Φ = x³ y + sin(z)
    const scalarFunc = (p) => Math.pow(p[0], 3) * p[1] + Math.sin(p[2]);
    const gradFunc = (p) => {
      const g = computeGradient(scalarFunc, p, COORD_SYSTEMS.CARTESIAN);
      return g.components;
    };

    const curlOfGrad = computeCurl(gradFunc, [1.2, -0.8, 0.5], COORD_SYSTEMS.CARTESIAN, 1e-3);
    expect(curlOfGrad.magnitude).toBeCloseTo(0.0, 1);
  });

  it('computes Laplacian ∇²(x² - y²) = 0 (Harmonic function)', () => {
    const harmonicFunc = (p) => p[0]*p[0] - p[1]*p[1];
    const lap = computeLaplacian(harmonicFunc, [2.0, 3.0, 1.0], COORD_SYSTEMS.CARTESIAN);
    expect(lap).toBeCloseTo(0.0, 2);
  });
});

describe('4-Point Divergence & 4-Vortex Curl Simulators', () => {
  it('correctly evaluates 4-point divergence near a source as positive', () => {
    const points = [
      { id: 1, x: 0, y: 0, q: 2.0 },
      { id: 2, x: 5, y: 5, q: 0.0 }
    ];
    // Evaluate near source (0.1, 0.1)
    const res = calculateDivergenceAt(points, 0.1, 0.1);
    expect(res.divergence).toBeGreaterThan(0.5);
    expect(res.classification).toContain('Source');
  });

  it('correctly evaluates 4-point divergence near a sink as negative', () => {
    const points = [
      { id: 1, x: 0, y: 0, q: -2.0 }
    ];
    const res = calculateDivergenceAt(points, 0.1, 0.1);
    expect(res.divergence).toBeLessThan(-0.5);
    expect(res.classification).toContain('Sink');
  });

  it('evaluates divergence as solenoidal when all source strengths are zero', () => {
    const zeroPoints = [
      { id: 1, x: -1.8, y: 1.2, q: 0.0 },
      { id: 2, x: 1.8, y: 1.2, q: 0.0 },
      { id: 3, x: -1.8, y: -1.2, q: 0.0 },
      { id: 4, x: 1.8, y: -1.2, q: 0.0 }
    ];
    const res = calculateDivergenceAt(zeroPoints, 0.5, 0.5);
    expect(res.divergence).toBe(0.0);
    expect(res.classification).toContain('Solenoidal');
  });

  it('evaluates curl near CCW vortex as positive and CW vortex as negative', () => {
    const vortices = [
      { id: 1, x: -2.0, y: 0.0, gamma: 2.0 }, // CCW
      { id: 2, x: 2.0, y: 0.0, gamma: -2.0 }  // CW
    ];

    const nearCCW = calculateCurlAt(vortices, -1.9, 0.1);
    expect(nearCCW.curlZ).toBeGreaterThan(0.5);
    expect(nearCCW.classification).toContain('Counter-Clockwise');

    const nearCW = calculateCurlAt(vortices, 1.9, 0.1);
    expect(nearCW.curlZ).toBeLessThan(-0.5);
    expect(nearCW.classification).toContain('Clockwise');
  });
});

describe('Scientific Formatting Engine', () => {
  it('formats exact 0 as 0.0000 without negative zero', () => {
    expect(formatScientific(0, 4)).toBe('0.0000');
    expect(formatScientific(-0, 4)).toBe('0.0000');
  });

  it('formats standard numbers with fixed precision', () => {
    expect(formatScientific(3.14159, 3)).toBe('3.142');
    expect(formatScientific(-2.71828, 2)).toBe('-2.72');
  });

  it('switches to exponential notation for tiny numbers to prevent false zeros', () => {
    const tiny = 4.62e-9;
    const str = formatScientific(tiny, 4);
    expect(str).toContain('e-9');
    expect(str).not.toBe('0.0000');
  });

  it('switches to exponential notation for large numbers', () => {
    const large = 2.5e6;
    const str = formatScientific(large, 2);
    expect(str).toContain('e+6');
  });

  it('handles infinity correctly', () => {
    expect(formatScientific(Infinity)).toBe('+∞');
    expect(formatScientific(-Infinity)).toBe('-∞');
  });
});
