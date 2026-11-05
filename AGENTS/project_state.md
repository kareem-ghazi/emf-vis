# Project State: 3D Electromagnetic Fields & Vector Operators Visualizer

**Status:** Complete Implementation & Professional Repository Organization  
**Author / Copyright:** Kareem Ghazi (2026)  
**License:** MIT License (`LICENSE.txt`)  
**Deployment Target:** GitHub Pages (`https://kareem-ghazi.github.io/emf-visualizer/`)  
**Technology Stack:** Vanilla JavaScript (ES Modules), HTML5, CSS3, Three.js (r160), KaTeX (0.16.9), Vite (v6)

---

## 1. Executive Summary

The application is structured into **EXACTLY 4 core topics**:
1. **Coordinate Systems** (`coords`)
2. **The Gradient** ($\nabla V$) (`gradient`)
3. **Divergence** ($\nabla \cdot \vec{A}$) (`divergence`)
4. **The Curl** ($\nabla \times \vec{A}$) (`curl`)

Key Highlights & Recent Architectural Improvements:
- **Clean Standardized `src/` Directory Layout**: Source code modularized into `src/` containing `main.js`, `math.js`, `ui.js`, `style.css`, and `topics/` (`coords.js`, `gradient.js`, `divergence.js`, `curl.js`).
- **GitHub Pages Ready**: Configured `vite.config.js` with `base: './'` ensuring fully relative asset resolution (`./assets/...`) on GitHub Pages subpaths.
- **Automated CI/CD Workflow**: Added `.github/workflows/deploy.yml` using modern GitHub Actions (`configure-pages`, `upload-pages-artifact`, `deploy-pages`) for automated builds and deployment on push to `main`.
- **Comprehensive Documentation**: Complete `README.md` and `LICENSE.txt` (MIT License © 2026 Kareem Ghazi).
- **Custom Vector SVG Favicon**: Sleek Nabla ∇ and circulating flux field icon (`public/favicon.svg` and `favicon.svg`) loaded via `<link rel="icon" type="image/svg+xml" href="./favicon.svg">`, replacing default wireframe browser icon.
- **Dynamic Concept Tab Title**: Automatically updates the browser document title to match the active concept with em-dash separator (e.g. `emf.vis — The Gradient`, `emf.vis — Coordinate Systems`, `emf.vis — The Divergence`, `emf.vis — The Curl`).
- **Fully Responsive Mobile UI**:
  - Full-screen 3D canvas viewport with touch gesture support (`touch-action: none` on WebGL canvas, `touch-action: manipulation` on page body).
  - Floating glassmorphic `Controls` pill button (`.mobile-floating-btn`) positioned unobtrusively on the top-left of the canvas.
  - Slide-out drawer sidebar (`#sidebar.mobile-open`) with smooth bezier transition, dark backdrop overlay (`#sidebar-backdrop`), mobile close button (`#sidebar-close-btn`), and "View 3D Canvas" dismissal button.
  - Collapsible HUD panel (`#hud-card`) that auto-collapses on mobile screens (`<= 768px`) on initial load and expands with a single tap on the header.
  - Touch-optimized slider controls, enlarged tap targets, and horizontal KaTeX formula scrolling preventing layout breaking on screens from 320px to 768px.
- **Zero Vulnerabilities & Clean Production Build**: Verified with `npm run build` (built in ~2.8s) and `0 vulnerabilities`.
- **Full Scientific Calculator & Converter Suite**:
  - *Coordinate Converter*: Real-time conversions between Cartesian $(x,y,z)$, Cylindrical $(\rho,\phi,z)$, and Spherical $(r,\theta,\phi)$ with degrees/radians support.
  - *Persistent Input Focus*: Input updates modify only the dynamic result text nodes without replacing input elements in the DOM, eliminating focus drops across all numerical inputs.
  - *Unit Vector Calculator*: Evaluates local curvilinear basis vectors $(\hat{a}_1, \hat{a}_2, \hat{a}_3)$ at any point $P$, expressed in Cartesian basis.
  - *Magnitude Calculator*: Computes 3D vector length $|\vec{A}|$.
  - *Direction Calculator*: Computes direction cosines $(\cos\alpha, \cos\beta, \cos\gamma)$, directional angles $(\alpha, \beta, \gamma)$, and spherical angles $(\theta, \phi)$.
  - *Gradient Calculator*: Evaluates scalar height $V$, gradient components with curvilinear metric scale factors, magnitude, and steepest ascent direction across Cartesian, Cylindrical, and Spherical coordinate systems.
  - *Divergence Calculator*: Evaluates vector divergence $\nabla \cdot \vec{A}$ across Cartesian, Cylindrical, and Spherical coordinate systems with dynamic KaTeX formula preview and tri-color classification (Source, Sink, Solenoidal).
  - *Curl Calculator*: Evaluates 3D curl $\nabla \times \vec{A}$ across Cartesian, Cylindrical, and Spherical systems with dynamic KaTeX formula preview, magnitude, and tri-color classification (CCW, CW, Irrotational).

---

## 2. Security & Package Safety Audit

- **Audit Status:** Verified Clean  
- **Vulnerabilities Found:** `0 vulnerabilities`  
- **Audit Command Output:**
  ```text
  found 0 vulnerabilities
  ```
- **Vite Production Build:** Completed successfully with exit code 0 (`✓ 12 modules transformed`, clean bundle in `dist/`).

---

## 3. Directory Structure

```
emf-visualizer/
├── .github/
│   └── workflows/
│       └── deploy.yml        # GitHub Actions Pages deployment
├── AGENTS/                   # Agent memory & project state tracking
│   ├── em_fields_visualizer_prompt_plan.md
│   └── project_state.md
├── dist/                     # Production build artifacts
├── src/                      # Source code
│   ├── topics/               # Visualizer topic modules
│   │   ├── coords.js         # 1. Coordinate Systems
│   │   ├── gradient.js       # 2. The Gradient (∇V Topographical Ascent)
│   │   ├── divergence.js     # 3. Divergence (∇·A 4-Point Sources & Sinks)
│   │   └── curl.js           # 4. The Curl (∇×A 3Blue1Brown 4-Vortex Vorticity)
│   ├── main.js               # Application bootstrap & 3D render loop
│   ├── math.js               # Analytical & numerical vector calculus engine
│   ├── style.css             # UI styling & glassmorphic dark theme
│   └── ui.js                 # UI controls, HUD updates, & calculators
├── .gitignore                # Git exclusions
├── index.html                # Main UI layout & WebGL viewport
├── LICENSE.txt               # MIT License (2026 Kareem Ghazi)
├── package.json              # Package manifest & scripts
├── README.md                 # Complete project documentation
└── vite.config.js            # Vite bundler configuration (base: './')
```

---

## 4. Topic Specifications & Mathematical Formulations

### 1. Coordinate Systems (`src/topics/coords.js`)
- **Cartesian, Cylindrical, and Spherical**: Points defined via intersecting surfaces (planes $x, y, z$; cylinders $\rho$, half-planes $\phi$; spheres $r$, cones $\theta$).
- **Cone Geometry ($\theta = \text{const}$)**: Slant-length parameterization ensures polar angles $\theta \in (0, \pi)$ transition smoothly without singularities or disappearing when crossing $\theta = 90^\circ$; seamlessly flips into the lower hemisphere ($-Z$) for $\theta > 90^\circ$ and renders a clean equatorial disk at $\theta \approx 90^\circ$.
- **Streamlined HUD Mathematical Formulation**: Focused strictly on fundamental differential elements: line element $d\vec{l}$, vector surface element $d\vec{S}$, and volume element $dv$.
- **Clean Point Readout**: Features solely the exact evaluated point coordinates.
- **Unit Vector Transformation Matrices**: Displays the complete $3 \times 3$ transformation matrices converting the active unit vectors into the other two coordinate systems.
- **Simplified Scientific Calculator (Converter Only)**: Dedicated solely to coordinate conversions without tabs; input labels dynamically match the selected source coordinate system ($x, y, z$, $\rho, \phi, z$, or $r, \theta, \phi$) with enlarged mathematical symbol typography.

### 2. The Gradient ($\nabla V$) (`src/topics/gradient.js`)
- **Topographical Potential Hill**: 3D surface $z = V(x, y)$ in Cartesian coordinates with no probe ball, polygon offset to eliminate Z-fighting, and 3 distinct profiles: Single Gaussian Peak, Twin Peaks (Dipole Potential), and Volcano Crater / Ring Ridge.
- **Dynamic Hill Spread Across All Profiles**: The `hillSpread` parameter is fully active across all 3 profiles, dynamically scaling peak variance in Twin Peaks and crater rim radius & flank breadth in Volcano Crater, with synchronized contour rings and peak altitude readouts.
- **Surface Tangent Gradient Vectors**: 3D gradient vector arrows lie directly tangent to the surface pointing uphill, strictly perpendicular to equipotential contour rings ($V = \text{const}$). Vector arrows are projected with a normal offset and have depth testing disabled (`depthTest: false`, `renderOrder: 8`) to guarantee they never clip or submerge into the hill geometry regardless of spread or slope steepness.
- **Non-Flashing Streamlines & Particles**: Robust Runge-Kutta steepest ascent streamlines for all 3 profiles; particles follow individual continuous phases with soft circular glow textures and smooth summit dissolve, completely eliminating flashing lines and summit clumping.
- **Streamlined HUD Formulation**: Features the complete mathematical formulation of the gradient across all three coordinate systems (Cartesian, Cylindrical, Spherical), along with the active hill profile and peak altitude only.
- **Natural Keyboard Gradient Calculator**: Custom function input allows natural typing (e.g. `sin(xy) + cos(2zx) - zx`, `2xy + xy + zx^2`, or `3.5 * exp(-(x^2 + y^2)/3)`) with real-time automatic conversion to LaTeX preview via KaTeX; evaluates scalar potential $V(P)$, gradient vector $\nabla V$, and slope magnitude $|\nabla V|$ at point $(x, y, z)$ without focus loss. Features full support for algebraic juxtaposition multiplication, a balanced parenthetical scanner for nested functions, case-insensitive variables and coordinate aliases (`x, y, z`, `X, Y, Z`, `r, rho, phi, theta`, `e, pi`), and high-precision scientific formatting (`formatScientific`).

### 3. Divergence ($\nabla \cdot \vec{A}$) (`src/topics/divergence.js`)
- **Image 1 Styling**: Deep dark background, dense 2D vector field grid.
- **Locked 2D Canvas Controls**: Strictly disables rotate and pan (`controls.enableRotate = false`, `controls.enablePan = false`), allowing mouse wheel zooming only, ensuring an authentic, undistorted top-down 2D planar view. Bottom-left navigation hint dynamically displays `Scroll: Zoom`.
- **High-Contrast Point Number Identification**: Center core disks feature contrasting numbering: deep navy/black text (`#090e1a`) on bright yellow sources ($q > 0$) AND on light blue sinks ($q < 0$), with outlined white text on slate zero points, guaranteeing high visibility against all colored disks.
- **4 Controllable Points**: 2 Sources ($q > 0$) with outward radial white arrows and luminous yellow halo; 2 Sinks ($q < 0$) with inward radial white arrows and blue convergence; and Solenoidal Zero-Charge points ($q = 0$) with slate neutral aura and radial arrows suppressed.
- **Radial 360° Sink Particle Inflow**: When sources are off and sinks are active (e.g. single sink mode), particles spawn radially in all directions across $360^\circ$ around the active sink and stream continuously inward from all sides into the drain, with absorption respawning.
- **Zero-Strength Solenoidal Mode ($q = 0$)**: Slider supports $|q| \in [0.0, 3.5]$ with dedicated `Zero (q = 0)` segmented button. When all points are set to zero, the visualizer simulates pure eddyless, solenoidal fluid flow ($\vec{A} = (1.2, 0)$, $\nabla \cdot \vec{A} = 0$) with smooth laminar streamers.
- **Streamlined HUD Formulation**: Contains the complete mathematical formulation of divergence for all three coordinate systems (Cartesian, Cylindrical, Spherical), live Solenoidal State, and Point Distribution.
- **Vector Function Scientific Calculator**: Built in the exact same format as the Gradient calculator, featuring coordinate system selection (Cartesian, Cylindrical, Spherical), vector component inputs ($A_x, A_y, A_z$ / $A_\rho, A_\phi, A_z$ / $A_r, A_\theta, A_\phi$), live KaTeX formula preview, evaluation point inputs, and real-time evaluation of scalar divergence $\nabla \cdot \vec{A}$, field vector $\vec{A}(P)$, magnitude $|\vec{A}|$, and source/sink/solenoidal classification without focus loss.
- **Controls**: Pill selector (P1, P2, P3, P4), position sliders ($X \in [-3.0, 3.0], Y \in [-2.0, 2.0]$), 3-way Source/Sink/Zero toggle, strength slider ($0.0 - 3.5$).
- **450 Animated Streamline Particles**: Fluid particles streaming from sources and converging into sinks, or gliding in laminar lines when solenoidal.

### 4. The Curl ($\nabla \times \vec{A}$) (`src/topics/curl.js`)
- **Image 2 Styling (3Blue1Brown Aesthetic)**: Dark background with fiery red outer region $\to$ vibrant orange $\to$ golden streamlines $\to$ cyan central streams.
- **Locked 2D Canvas Controls**: Top-down 2D canvas controls with zoom-only interaction (`enableRotate = false`, `enablePan = false`), bottom-left navigation hint displaying `Scroll: Zoom`.
- **Canvas Label Removal & Clean Vortex Disks**: All redundant text floating labels removed from the 3D scene, keeping only clean centered numbers matching the divergence color scheme (red core `0xef4444` with white outline text for CCW, light blue core `0x38bdf8` with dark navy text `#090e1a` for CW, slate core `0x64748b` with white outline text for Zero).
- **4 Controllable Vortices**: 2 Counter-Clockwise vortices ($\text{curl} > 0$), 2 Clockwise vortices ($\text{curl} < 0$), with 3-way toggle support for zero rotation (`curl = 0`).
- **Zero-Rotation Mode (`curl = 0`)**: Dedicated segmented button `Zero (curl = 0)` setting $\Gamma = 0$ with circulating perimeter arrows suppressed and slate neutral indicator. When all vortices are zero, visualizer displays uniform irrotational laminar streamline flow ($\nabla \times \vec{A} = \mathbf{0}$).
- **Streamlined HUD Formulation**: Contains the complete mathematical formulation with cross product determinant matrices for all three coordinate systems (Cartesian, Cylindrical, Spherical), live Conservative State, and Point Distribution.
- **Controls**: Pill selector (V1, V2, V3, V4), position sliders ($X \in [-3.0, 3.0], Y \in [-2.0, 2.0]$), 3-way CCW/CW/Zero rotation toggle, strength slider.
- **480 Animated Streamline Particles**: Swirling fluid particles tracing vortex circulation lines.

---

## 5. Scientific Calculators Suite (`src/ui.js` & `src/math.js`)

1. **Coordinate System Converter**:
   - Converts input coordinates between Cartesian $(x,y,z)$, Cylindrical $(\rho,\phi,z)$, and Spherical $(r,\theta,\phi)$.
   - Supports both degree and radian display with full precision and KaTeX formatted equations.
2. **Unit Vector Calculator**:
   - Computes local unit vectors $(\hat{a}_1, \hat{a}_2, \hat{a}_3)$ at any user-specified point $P$.
   - Expresses curvilinear basis vectors in terms of Cartesian unit vectors $(\hat{a}_x, \hat{a}_y, \hat{a}_z)$.
3. **Magnitude Calculator**:
   - Calculates the exact 3D Euclidean magnitude $|\vec{A}| = \sqrt{A_x^2 + A_y^2 + A_z^2}$.
4. **Direction Calculator**:
   - Computes direction cosines $\cos\alpha = A_x/|\vec{A}|$, $\cos\beta = A_y/|\vec{A}|$, $\cos\gamma = A_z/|\vec{A}|$.
   - Computes coordinate angles $\alpha, \beta, \gamma \in [0^\circ, 180^\circ]$ and spherical direction angles $\theta, \phi$.
5. **Gradient Calculator**:
   - Segmented coordinate system selector (`Cartesian`, `Cylindrical`, `Spherical`), dynamically updating point input labels/units ($\rho, \phi, z$ with $\phi$ in degrees; $r, \theta, \phi$ with $\theta, \phi$ in degrees).
   - Metric factor-aware numerical evaluation: calculates $V(P)$, gradient components with metric scale factors ($h_\rho = 1, h_\phi = \rho, h_z = 1$ in cylindrical; $h_r = 1, h_\theta = r, h_\phi = r\sin\theta$ in spherical), and magnitude $|\nabla V|$ without losing input focus.
   - Live KaTeX preview displays active scalar potential function $V(x,y,z)$, $V(\rho,\phi,z)$, or $V(r,\theta,\phi)$.
6. **Divergence Calculator**:
   - Segmented coordinate system selector (`Cartesian`, `Cylindrical`, `Spherical`).
   - Evaluates analytical/numerical divergence $\nabla \cdot \vec{A}$, field vector $\vec{A}(P)$, and magnitude $|\vec{A}|$ at any point in Cartesian, Cylindrical, or Spherical coordinates without losing input focus.
   - Live KaTeX formula preview reflects the active coordinate system and component functions.
   - Tri-color status palette: Net Source ($\nabla \cdot \vec{A} > 0.005$, bright green `#4ade80`), Net Sink ($\nabla \cdot \vec{A} < -0.005$, bright red `#ef4444`), or Solenoidal / Zero Divergence ($|\nabla \cdot \vec{A}| \le 0.005$, amber `#fbbf24`).
7. **Curl Calculator**:
   - Formatted identically to the Divergence calculator with coordinate system selection (Cartesian, Cylindrical, Spherical) and 3 vector component inputs ($A_x, A_y, A_z$ / $A_\rho, A_\phi, A_z$ / $A_r, A_\theta, A_\phi$).
   - Evaluates analytical/numerical 3D curl vector $\nabla \times \vec{A}$, curl magnitude $|\nabla \times \vec{A}|$, field vector $\vec{A}(P)$, and magnitude $|\vec{A}|$ with curvilinear metric scale factors in Cartesian, Cylindrical, and Spherical coordinate systems without input focus loss.
   - Live KaTeX preview displays $\vec{A}(x,y,z)$, $\vec{A}(\rho,\phi,z)$, or $\vec{A}(r,\theta,\phi)$.
   - Tri-color status palette: Rotational / CCW (`#4ade80`), Rotational / CW (`#ef4444`), or Irrotational / Conservative ($\nabla \times \vec{A} = 0$, amber `#fbbf24`).
