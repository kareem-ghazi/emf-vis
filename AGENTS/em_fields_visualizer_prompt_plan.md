# MASTER PROMPT: 3D Electromagnetic Fields & Vector Operators Web Visualizer

## 1. ROLE & CORE OBJECTIVE

You are a Senior Scientific Computing Developer and 3D Graphics Programmer. Your task is to build a complete, interactive Web Visualizer for undergraduate **Electromagnetic Field Theory & Vector Calculus**.

The application contains **EXACTLY 4 specialized educational topics**, designed with interactive visual clarity, high-fidelity aesthetic modeling (including 3Blue1Brown style), and rigorous mathematical backing:

1. **Coordinate Systems** (`src/topics/coords.js`):
   - Visualize how Cartesian (rectangular), circular cylindrical, and spherical coordinate systems define points using intersecting surfaces (planes, cylinders, cones, and spheres).
   - Robust cone geometry ($\theta = \text{const}$) with slant-length parameterization ensuring smooth continuity across all polar angles $\theta \in (0, \pi)$ without disappearing when crossing $\theta = 90^\circ$.
   - Mathematical formulation panel containing strictly the differential elements: $d\vec{l}$, $d\vec{S}$, and $dv$.
   - Point readout displaying solely evaluated point coordinates.
   - Comprehensive unit vector transformation matrices for the other two coordinate systems.
   - Simplified Scientific Calculator dedicated solely to coordinate conversions, dynamically reflecting the source coordinate system inputs ($x, y, z$, $\rho, \phi, z$, or $r, \theta, \phi$) with enlarged math symbols.

2. **The Gradient ($\nabla V$)** (`src/topics/gradient.js`):
   - Visualized as the path of steepest ascent on a 3D topographical scalar potential hill in Cartesian coordinates.
   - Dynamic 3D surface-tangent gradient vector arrows pointing uphill, strictly perpendicular to concentric equipotential contour rings ($V = \text{const}$).
   - Smooth ascending streamlines and non-flashing soft glow particles with individual continuous progression and summit fade-out.
   - Robust support for all 3 topographical profiles (Single Gaussian Peak, Twin Peaks, Volcano Crater) with depth-offsetting to prevent Z-fighting.
   - Streamlined HUD displaying gradient formulation for Cartesian, Cylindrical, and Spherical coordinate systems, active hill profile, and peak altitude only.
   - Built-in Natural Keyboard Gradient Calculator supporting Cartesian, Cylindrical, and Spherical coordinate systems with dynamic metric scaling factors, live KaTeX LaTeX preview, and real-time scalar potential $V(P)$ and gradient evaluation without focus loss.

3. **Divergence ($\nabla \cdot \vec{A}$)** (`src/topics/divergence.js`):
   - Visualized as the net outward flow of flux from sources and inward flow to sinks.
   - Designed to match **Reference Image 1**: deep dark background, dense 2D vector field grid, and **4 controllable points on the 2D Cartesian plane** (Sources with outward radial white arrows and yellow halo; Sinks with inward radial white arrows and blue convergence; Zero-strength points with slate neutral aura).
   - Locked 2D canvas controls: strictly disables rotation and panning, allowing only mouse wheel zoom for an authentic 2D planar perspective, with bottom-left navigation hint displaying `Scroll: Zoom`.
   - High-contrast centered bold point numbers (`1`, `2`, `3`, `4`) inside the middle of each point disk using contrasting deep navy on yellow sources and blue sinks, and outlined text on slate zero points.
   - Radial $360^\circ$ sink particle inflow: pulls in particles from all directions radially when sources are zero and sinks are active, with drain absorption and respawning.
   - Full support for zero-strength solenoidal sources ($|q| = 0.0$ via slider and 3-way toggle), simulating pure eddyless / solenoidal divergence-free flow ($\nabla \cdot \vec{A} = 0$).
   - Streamlined HUD displaying active mathematical formulation across Cartesian, Cylindrical, and Spherical coordinate systems, live Solenoidal State, and Point Distribution.
   - Vector Function Scientific Calculator: matching the format of the Gradient calculator with coordinate systems (Cartesian, Cylindrical, Spherical), vector components ($A_x, A_y, A_z$ / $A_\rho, A_\phi, A_z$ / $A_r, A_\theta, A_\phi$), live KaTeX formula preview, evaluation point inputs, and real-time evaluation of $\nabla \cdot \vec{A}$, $\vec{A}(P)$, $|\vec{A}|$, and classification without focus loss.
   - Interactive Point Selection Pills (P1, P2, P3, P4) with position sliders ($X, Y$) and Source / Sink / Zero toggles.

4. **The Curl ($\nabla \times \vec{A}$)** (`src/topics/curl.js`):
   - Visualized as local rotation, swirl, and vorticity of a vector field.
   - Designed to match **Reference Image 2 (3Blue1Brown Aesthetic)**: deep dark background with fiery red $\to$ orange $\to$ yellow streamlines, **4 controllable vortex centers on the 2D Cartesian plane** (2 counter-clockwise, 2 clockwise, with zero-rotation support).
   - Locked 2D top-down canvas controls with zoom-only interaction (`Scroll: Zoom`).
   - Clean vortex center disks without floating label badges, featuring centered bold numbers matching the divergence color scheme (red CCW, blue CW, slate Zero).
   - Animated swirling fluid streamlines circulating around vortex cores; when all vortices are zero, displays uniform irrotational laminar streamline flow.
   - Interactive Vortex Selection Pills (V1, V2, V3, V4) with position sliders ($X, Y$) and 3-way Counter-Clockwise (CCW, $\text{curl} > 0$) / Clockwise (CW, $\text{curl} < 0$) / Zero ($\text{curl} = 0$) toggles.
   - Streamlined HUD displaying cross product determinant matrices for Cartesian, Cylindrical, and Spherical coordinate systems, live Conservative State, and Point Distribution.
   - Built-in Vector Function Curl Calculator supporting Cartesian, Cylindrical, and Spherical coordinates with metric scaling factors, live KaTeX formula preview, 3D curl vector, magnitude, and tri-color classification without focus loss.

---

## 2. STRICT SIMPLICITY & ANTI-BLOAT CONSTRAINTS

* **Tech Stack**: Vanilla JavaScript (ES Modules), HTML5, CSS3, Three.js (r160), KaTeX (0.16.9) for live LaTeX math rendering in HUD and calculators, Vite (Dev Server / Bundler).
* **Cartesian Default & Clean Vector Operators**: Vector operator visualizers (Gradient, Divergence, Curl) operate on standard Cartesian coordinates and have **no probe ball**, focusing purely on continuous field lines, potential topography, and multi-point dynamics.
* **Top-Down Perspective Alignment**: Divergence and Curl visualizers automatically orient the camera to a clean top-down $(X, Y)$ plane view matching Image 1 and Image 2 reference aesthetics.
* **No Placeholders or TODOs**: Complete, verified, and self-contained implementation with 0 console warnings or stubs.
* **Standard `src/` Directory Layout**: Modularized code inside `src/` with `main.js`, `math.js`, `ui.js`, `style.css`, and `topics/`.
* **Mobile & Responsive Experience**: Full-screen 3D canvas with touch interaction, slide-out sidebar drawer, floating controls toggle, auto-collapsing HUD, and mobile-friendly inputs.
* **Vector SVG Favicon & Dynamic Concept Titles**: Custom Nabla/flux SVG tab icon and automatic browser title synchronization (`emf.vis — The Gradient`, etc.).
* **GitHub Pages Ready**: `vite.config.js` with `base: './'` and `.github/workflows/deploy.yml` for automated GitHub Pages continuous deployment.
* **Uniform Module Contract**: Every file inside `src/topics/*.js` exports the standard 3-function interface:
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
|                               MAIN CONTROLLER (src/main.js)                           |
|  - Manages active topic module, camera perspective (3D angled vs. 2D top-down)        |
|  - Runs requestAnimationFrame() render loop and animation timing                      |
|  - Deeply disposes geometries, materials, and textures on topic swap                  |
+---------------------+-------------------------------------+---------------------------+
                      |                                     |
                      v                                     v
+-------------------------------------+   +---------------------------------------------+
|        MATH ENGINE (src/math.js)    |   |           UI CONTROLLER (src/ui.js)         |
|  - Orthogonal coordinate transforms |   |  - Real-time KaTeX HUD equations & readouts |
|  - Curvilinear unit vector bases    |   |  - 4-Point Plane Controls (Images 1 & 2)    |
|  - Vector magnitudes & directions   |   |  - 7 Reactive Scientific Calculators        |
|  - Numerical & analytical Grad/Div/Curl +---------------------------------------------+
+---------------------+---------------+
                      | (3D/2D Geometries, Vector Fields, & Particles)
                      v
+---------------------------------------------------------------------------------------+
|                                 THE 4 TOPIC MODULES (src/topics/)                     |
|  1. coords.js     (Cartesian, Cylindrical, Spherical, Intersecting Surfaces, dv)      |
|  2. gradient.js   (Topographical Potential Hill, Equipotential Rings, Streamlines)     |
|  3. divergence.js (Image 1 Style: 4-Point Sources/Sinks, White Arrows, Fluid Streams) |
|  4. curl.js       (Image 2 Style: 4 Vortices, 3Blue1Brown Heat Colormap, White Loops) |
+---------------------------------------------------------------------------------------+
```
