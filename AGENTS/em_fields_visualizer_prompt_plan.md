# MASTER PROMPT: 3D Electromagnetic Fields & Vector Operators Web Visualizer

## 1. ROLE & CORE OBJECTIVE

You are a Senior Scientific Computing Developer and 3D Graphics Programmer. Your task is to build a complete, interactive Web Visualizer for undergraduate **Electromagnetic Field Theory & Vector Calculus**.

The application contains **EXACTLY 4 specialized educational topics**, designed with interactive visual clarity, high-fidelity aesthetic modeling (including 3Blue1Brown style), and rigorous mathematical backing:

1. **Coordinate Systems**:
   - Visualize how Cartesian (rectangular), circular cylindrical, and spherical coordinate systems define points using intersecting surfaces (planes, cylinders, cones, and spheres).
   - Robust cone geometry ($\theta = \text{const}$) with slant-length parameterization ensuring smooth continuity across all polar angles $\theta \in (0, \pi)$ without disappearing when crossing $\theta = 90^\circ$.
   - Mathematical formulation panel containing strictly the differential elements: $d\vec{l}$, $d\vec{S}$, and $dv$.
   - Point readout displaying solely evaluated point coordinates.
   - Comprehensive unit vector transformation matrices for the other two coordinate systems.
   - Simplified Scientific Calculator dedicated solely to coordinate conversions, dynamically reflecting the source coordinate system inputs ($x, y, z$, $\rho, \phi, z$, or $r, \theta, \phi$) with enlarged math symbols.

2. **The Gradient ($\nabla V$)**:
   - Visualized as the path of steepest ascent on a 3D topographical scalar potential hill in Cartesian coordinates.
   - Dynamic 3D surface-tangent gradient vector arrows pointing uphill, strictly perpendicular to concentric equipotential contour rings ($V = \text{const}$).
   - Smooth ascending streamlines and non-flashing soft glow particles with individual continuous progression and summit fade-out.
   - Robust support for all 3 topographical profiles (Single Gaussian Peak, Twin Peaks, Volcano Crater) with depth-offsetting to prevent Z-fighting.
   - Streamlined HUD displaying gradient formulation for Cartesian, Cylindrical, and Spherical coordinate systems, active hill profile, and peak altitude only.
   - Built-in Natural Keyboard Gradient Calculator with live KaTeX LaTeX preview and real-time scalar potential $V(P)$ and gradient evaluation without focus loss.

3. **Divergence ($\nabla \cdot \vec{A}$)**:
   - Visualized as the net outward flow of flux from sources and inward flow to sinks.
   - Designed to match **Reference Image 1**: deep dark background, dense 2D vector field grid, and **4 controllable points on the 2D Cartesian plane** (Sources with outward radial white arrows and yellow/cyan glow; Sinks with inward radial white arrows and blue convergence; Zero-strength points with slate neutral aura).
   - Locked 2D canvas controls: strictly disables rotation and panning, allowing only mouse wheel zoom for an authentic 2D planar perspective.
   - High-contrast centered bold point numbers (`1`, `2`, `3`, `4`) inside the middle of each point disk matching P1-P4 selector pills.
   - Full support for zero-strength solenoidal sources ($|q| = 0.0$ via slider and 3-way toggle), simulating pure eddyless / solenoidal divergence-free flow ($\nabla \cdot \vec{A} = 0$).
   - Animated streaming fluid particles demonstrating continuous flux lines.
   - Interactive Point Selection Pills (P1, P2, P3, P4) with position sliders ($X, Y$) and Source / Sink / Zero toggles.
   - Built-in Divergence Calculator calculating the net flux and scalar divergence at any point $(x, y)$.

4. **The Curl ($\nabla \times \vec{A}$)**:
   - Visualized as local rotation, swirl, and vorticity of a vector field.
   - Designed to match **Reference Image 2 (3Blue1Brown Aesthetic)**: deep dark background with fiery red $\to$ orange $\to$ yellow streamlines, **4 controllable vortex centers on the 2D Cartesian plane** (2 counter-clockwise with circulating white arrow loops labeled $\text{curl } \mathbf{F} > 0$, 2 clockwise with circulating white arrow loops labeled $\text{curl } \mathbf{F} < 0$).
   - Locked 2D top-down canvas controls with zoom-only interaction.
   - Bold numeric identification sprites (`1`, `2`, `3`, `4`) inside vortex center disks matching V1-V4 selector pills.
   - Animated swirling fluid streamlines circulating around vortex cores.
   - Interactive Vortex Selection Pills (V1, V2, V3, V4) with position sliders ($X, Y$) and Counter-Clockwise (CCW, $\text{curl} > 0$) / Clockwise (CW, $\text{curl} < 0$) circulation toggles.
   - Built-in Curl Calculator calculating the vorticity vector and circulation magnitude at any point $(x, y)$.

---

## 2. STRICT SIMPLICITY & ANTI-BLOAT CONSTRAINTS

* **Tech Stack**: Vanilla JavaScript (ES6 Modules), HTML5, CSS3, Three.js (r160), KaTeX (0.16.9) for live LaTeX math rendering in HUD and calculators, Vite (Dev Server / Bundler).
* **Cartesian Default & Clean Vector Operators**: Vector operator visualizers (Gradient, Divergence, Curl) operate on standard Cartesian coordinates and have **no probe ball**, focusing purely on the continuous field lines, potential topography, and multi-point dynamics.
* **Top-Down Perspective Alignment**: Divergence and Curl visualizers automatically orient the camera to a clean top-down $(X, Y)$ plane view matching Image 1 and Image 2 reference aesthetics.
* **No Placeholders or TODOs**: Complete, verified, and self-contained implementation with 0 console warnings or stubs.
* **Uniform Module Contract**: Every file inside `topics/*.js` exports the standard 3-function interface:
  ```javascript
  export function init(group, coordSystem, params) { /* build 3D/2D meshes into group */ }
  export function update(time, coordSystem, params) { /* animate particles, streamlines, & fields */ }
  export function getFormulaData(coordSystem, params) { /* return { latex, readout, details, ... } */ }
  ```

---

## 3. SYSTEM ARCHITECTURE

```
+---------------------------------------------------------------------------------------+
|                                    USER INTERFACE                                     |
|  [Topic Selector: Coords | Gradient | Divergence | Curl]                              |
|  - Topic Controls: Coord System (Cart/Cyl/Sph) | Gradient Profiles | 4-Point Plane    |
|  - Scientific Calculators: Coordinate Converter, Unit Vectors, Mag & Dir, Grad/Div/Curl|
+-------------------------------------------+-------------------------------------------+
                                            | (DOM Input Events)
                                            v
+---------------------------------------------------------------------------------------+
|                               MAIN CONTROLLER (main.js)                               |
|  - Manages active topic module, camera perspective (3D angled vs. 2D top-down)        |
|  - Runs requestAnimationFrame() render loop and animation timing                      |
|  - Deeply disposes geometries, materials, and textures on topic swap                  |
+---------------------+-------------------------------------+---------------------------+
                      |                                     |
                      v                                     v
+-------------------------------------+   +---------------------------------------------+
|        MATH ENGINE (math.js)        |   |           UI CONTROLLER (ui.js)             |
|  - Orthogonal coordinate transforms |   |  - Real-time KaTeX HUD equations & readouts |
|  - Curvilinear unit vector bases    |   |  - 4-Point Plane Controls (Images 1 & 2)    |
|  - Vector magnitudes & directions   |   |  - 7 Reactive Scientific Calculators        |
|  - Numerical & analytical Grad/Div/Curl +---------------------------------------------+
+---------------------+---------------+
                      | (3D/2D Geometries, Vector Fields, & Particles)
                      v
+---------------------------------------------------------------------------------------+
|                                 THE 4 TOPIC MODULES                                   |
|  1. coords.js     (Cartesian, Cylindrical, Spherical, Intersecting Surfaces, dv)      |
|  2. gradient.js   (Topographical Potential Hill, Equipotential Rings, Streamlines)     |
|  3. divergence.js (Image 1 Style: 4-Point Sources/Sinks, White Arrows, Fluid Streams) |
|  4. curl.js       (Image 2 Style: 4 Vortices, 3Blue1Brown Heat Colormap, White Loops) |
+---------------------------------------------------------------------------------------+
```

---

## 4. DIRECTORY STRUCTURE

```
./
├── .gitignore            # Ignores node_modules/, dist/, logs/, OS & IDE files
├── package.json          # Manifest with dev & build scripts
├── index.html            # Main UI layout, controls, 3D viewport, KaTeX HUD & Calculators
├── style.css             # Dark-mode scientific UI styling, pills, calculator tabs
├── main.js               # Three.js scene, camera, OrbitControls, topic loader & disposer
├── math.js               # Coordinate transforms, metric factors, & vector calculus engine
├── ui.js                 # DOM bindings, 4-point plane controls, calculators, KaTeX HUD
├── AGENTS/
│   ├── em_fields_visualizer_prompt_plan.md   # Master plan & progress tracking
│   └── project_state.md                      # Live project state documentation
└── topics/
    ├── coords.js         # 1. Coordinate Systems
    ├── gradient.js       # 2. The Gradient (∇V Topographical Ascent)
    ├── divergence.js     # 3. Divergence (∇·A 4-Point Sources & Sinks)
    └── curl.js           # 4. The Curl (∇×A 3Blue1Brown 4-Vortex Vorticity)
```

---

## 5. PROGRESS & VERIFICATION CHECKLIST

- [x] Phase 1: Core Framework, Physics Z-up Orientation, and Theme Setup
- [x] Phase 2: Coordinate Systems & Curvilinear Geometries (Cartesian, Cylindrical, Spherical)
- [x] Phase 3: The Gradient Visualizer (Topographical Scalar Potential Hill, Equipotential Rings)
- [x] Phase 4: Divergence Visualizer (Matching Image 1: 4 Controllable Points, Dense Field, Inward/Outward Arrows)
- [x] Phase 5: Curl Visualizer (Matching Image 2: 3Blue1Brown Aesthetic, 4 Controllable Vortices, Swirling Loops)
- [x] Phase 6: Full Suite of Scientific Calculators (Coord Converter, Unit Vector, Magnitude, Direction, Grad, Div, Curl)
- [x] Phase 7: Vite Production Build & npm Audit Security Verification (0 vulnerabilities)
- [x] Phase 8: AGENTS Documentation Synchronization
- [x] Phase 9: Persistent Input Focus across Calculator Suite & Face View Camera Positioning for Probe Point P
- [x] Phase 10: Dynamic Hill Spread across All 3 Profiles, Gradient Arrow Occlusion Resolution, and Calculator Expression Parser Fix
- [x] Phase 11: Scientific Number Formatting (Exponential Notation for Extreme Coordinates, Zero-Artifact Elimination) and Balanced Parentheses Formula Parser for KaTeX Display
- [x] Phase 12: Algebraic Juxtaposition Multiplication (Implicit Multiplication for Adjacent Variables e.g. xy, zx, 2zx, 2xy, zx^2, Power Variable Products)
