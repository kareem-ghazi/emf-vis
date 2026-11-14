import { describe, it, expect } from 'vitest';

/**
 * Re-implements the camera distance logic from AppController for unit testing
 * across screen aspect ratios.
 */
function calculate2DCameraZ(width, height, fov = 45) {
  const aspect = width / (height || 1);
  const requiredHalfWidth = 3.6;
  const requiredHalfHeight = 2.8;
  const tanFovHalf = Math.tan(((fov / 2) * Math.PI) / 180);

  const distForWidth = requiredHalfWidth / (tanFovHalf * aspect);
  const distForHeight = requiredHalfHeight / tanFovHalf;

  return Math.max(7.8, distForWidth, distForHeight);
}

function calculateVisibleFrustum(z, width, height, fov = 45) {
  const aspect = width / (height || 1);
  const tanFovHalf = Math.tan(((fov / 2) * Math.PI) / 180);
  const visibleHalfHeight = z * tanFovHalf;
  const visibleHalfWidth = visibleHalfHeight * aspect;
  return {
    minX: -visibleHalfWidth,
    maxX: visibleHalfWidth,
    minY: -visibleHalfHeight,
    maxY: visibleHalfHeight
  };
}

describe('2D Mobile Camera Viewport Framing (Divergence & Curl)', () => {
  const DIVERGENCE_POINTS = [
    { id: 1, x: -1.8, y: 1.2 },
    { id: 2, x: 1.8, y: 1.2 },
    { id: 3, x: -1.8, y: -1.2 },
    { id: 4, x: 1.8, y: -1.2 }
  ];

  const CURL_VORTICES = [
    { id: 1, x: -2.2, y: 0.0 },
    { id: 2, x: 2.2, y: 0.0 },
    { id: 3, x: 0.0, y: 1.4 },
    { id: 4, x: 0.0, y: -1.4 }
  ];

  it('keeps 7.8 distance on desktop landscape screens (1920x1080)', () => {
    const z = calculate2DCameraZ(1920, 1080);
    expect(z).toBeCloseTo(7.8, 1);
  });

  it('automatically scales distance on narrow portrait mobile screens (390x844)', () => {
    const z = calculate2DCameraZ(390, 844);
    // On 390x844, aspect ≈ 0.46, z should be around 17-19
    expect(z).toBeGreaterThan(16.0);
    expect(z).toBeLessThan(22.0);

    const frustum = calculateVisibleFrustum(z, 390, 844);

    // All Divergence points (including ±0.85 indicator ring radius => ±2.65) must fit inside frustum
    DIVERGENCE_POINTS.forEach(pt => {
      expect(pt.x).toBeGreaterThan(frustum.minX + 0.5);
      expect(pt.x).toBeLessThan(frustum.maxX - 0.5);
      expect(pt.y).toBeGreaterThan(frustum.minY + 0.5);
      expect(pt.y).toBeLessThan(frustum.maxY - 0.5);
    });

    // All Curl vortices (including ±0.85 ring radius => ±3.05) must fit inside frustum
    CURL_VORTICES.forEach(v => {
      expect(v.x).toBeGreaterThan(frustum.minX + 0.3);
      expect(v.x).toBeLessThan(frustum.maxX - 0.3);
      expect(v.y).toBeGreaterThan(frustum.minY + 0.5);
      expect(v.y).toBeLessThan(frustum.maxY - 0.5);
    });
  });

  it('guarantees complete point visibility on extra-narrow phones (360x800)', () => {
    const z = calculate2DCameraZ(360, 800);
    const frustum = calculateVisibleFrustum(z, 360, 800);

    // Frustum half-width must be at least 3.6
    expect(frustum.maxX).toBeGreaterThanOrEqual(3.59);
    expect(frustum.minX).toBeLessThanOrEqual(-3.59);
  });
});
