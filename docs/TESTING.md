# Unit Testing & Quality Assurance Guide

The **emf.vis** project includes an automated unit test suite built with [Vitest](https://vitest.dev/). The tests execute against the core mathematical transformations, differential operators, numerical formatters, and mobile camera frustum calculations.

---

## 1. Running the Tests

To run the complete test suite once:

```bash
npm test
```

To run the tests in interactive watch mode during development:

```bash
npm run test:watch
```

---

## 2. Test Architecture & Coverage

The test files reside in the `tests/` directory:

```
tests/
├── camera.test.js    # 2D mobile camera frustum and aspect ratio framing tests
└── math.test.js      # Vector calculus, transformations, and formatting tests
```

### 2.1 Coordinate Systems & Transformations (`tests/math.test.js`)
- **Round-Trip Conversions**: Verifies that converting from Cartesian to Cylindrical/Spherical and back returns identical coordinates within floating-point epsilon.
- **Singularity Safety**: Tests polar angles at $\theta = 0$ (North Pole) and $\theta = \pi$ (South Pole).
- **Angle Normalization**: Tests angle wrapping into $[0, 2\pi)$.
- **Simultaneous Conversion**: Tests `convertCoordinatesAll` across Cartesian, Cylindrical, and Spherical representations with degree and radian output.

### 2.2 Metric Factors & Basis Unit Vectors (`tests/math.test.js`)
- **Scale Factors**: Validates $h_i$ values and differential volume strings for all three coordinate systems.
- **Orthonormality**: Tests that unit vectors $\hat{a}_1, \hat{a}_2, \hat{a}_3$ have unit length ($|\hat{a}_i| = 1$) and pairwise zero dot products ($\hat{a}_i \cdot \hat{a}_j = 0$ for $i \neq j$).
- **Basis Projection**: Tests mutual inverse transformations between local curvilinear vectors and 3D world Cartesian vectors.

### 2.3 Differential Operators (`tests/math.test.js`)
- **Gradient**: Compares numerical gradient calculations with analytical polynomials ($\nabla(x^2 + y^2 + z^2) = (2x, 2y, 2z)$).
- **Divergence**: Verifies scalar divergence for radial fields ($\nabla \cdot \vec{r} = 3$) and solenoidal fields ($\nabla \cdot (-y, x, 0) = 0$).
- **Curl**: Verifies rigid vortex rotation ($\nabla \times (-y, x, 0) = (0, 0, 2)$).
- **Vector Identity**: Proves $\nabla \times (\nabla \Phi) = \mathbf{0}$ for arbitrary scalar fields.
- **Laplacian**: Validates harmonic functions ($\nabla^2 \Phi = 0$).

### 2.4 Physical Field Simulators (`tests/math.test.js`)
- Tests 4-point divergence calculations for source ($q > 0$), sink ($q < 0$), and solenoidal ($q = 0$) states.
- Tests 4-vortex curl calculations for counter-clockwise ($\Gamma > 0$) and clockwise ($\Gamma < 0$) states.

### 2.5 Scientific Number Formatter (`tests/math.test.js`)
- Verifies exact zero formatting (`0.0000`).
- Verifies elimination of negative zero (`-0.000`).
- Validates exponential notation for small magnitudes ($< 0.0005$) and large magnitudes ($\ge 10000$).

### 2.6 Camera Frustum & Mobile Viewport (`tests/camera.test.js`)
- Validates that $Z = 7.8$ on landscape desktop screens ($\text{aspect} \ge 1.4$).
- Validates that on portrait mobile screens ($\text{aspect} \approx 0.46$), $Z$ scales to $\ge 17.0$, ensuring all four points and vortices ($x = \pm 1.8$, $x = \pm 2.2$) fall well inside the visible horizontal boundaries.

---

## 3. Continuous Integration (CI)

The GitHub Actions workflow (`.github/workflows/deploy.yml`) runs `npm test` automatically on every push to `main` before building and publishing to GitHub Pages.
