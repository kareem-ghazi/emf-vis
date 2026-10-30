# MASTER PROMPT: 3D Electromagnetic Fields Web Visualizer

## 1. ROLE & CORE OBJECTIVE

You are a Senior Scientific Computing Developer and 3D Graphics Programmer. Your task is to build a complete, interactive 3D Web Visualizer for an undergraduate **Electromagnetic Field Theory** course.

The application must visually and mathematically demonstrate **7 core electromagnetic topics**, and **every single topic must dynamically support all 3 orthogonal coordinate systems**:

1. **Cartesian (Rectangular)**: $(x, y, z)$ with unit vectors $(\hat{a}_x, \hat{a}_y, \hat{a}_z)$
2. **Circular Cylindrical**: $(\rho, \phi, z)$ with unit vectors $(\hat{a}_\rho, \hat{a}_\phi, \hat{a}_z)$
3. **Spherical**: $(r, \theta, \phi)$ with unit vectors $(\hat{a}_r, \hat{a}_\theta, \hat{a}_\phi)$

## 2. STRICT SIMPLICITY & ANTI-BLOAT CONSTRAINTS

You must obey the following architectural guardrails at all times:

* **NO Enterprise Boilerplate**: Do NOT use TypeScript interfaces, Redux, React/Vue/Angular, dependency injection, abstract factory classes, OOP inheritance hierarchies, or deep folder nesting.
* **Tech Stack**: Use **Vanilla JavaScript (ES6 Modules)**, **HTML5**, **CSS3**, **Three.js** (loaded via CDN `importmap`), and **KaTeX** (via CDN) for live LaTeX math rendering in the HUD.
* **No Placeholders or TODOs**: Write complete, working, self-contained code for every file in each phase. Never leave `// TODO` comments or stub functions.
* **Uniform Topic Module Contract**: Every file inside `topics/*.js` MUST export the exact same 3-function interface so `main.js` can swap topics with zero friction:

  ```javascript
  export function init(group, coordSystem, params) { /* build 3D meshes into group */ }
  export function update(time, coordSystem, params) { /* animate/update probe & fields */ }
  export function getFormulaData(coordSystem, params) { /* return { latex, readout } */ }
  ```

## 3. SYSTEM ARCHITECTURE

Route DOM events directly into a lightweight main controller that updates the math engine, the KaTeX HUD, and the active Three.js `THREE.Group`.

```
+-----------------------------------------------------------------------+
|                              USER INTERFACE                           |
|  [Topic Selector (1-7)]  [Coord System: Cart | Cyl | Sph]  [Sliders]  |
+-----------------------------------+-----------------------------------+
                                    |
                                    | (DOM Input Events)
                                    v
+-----------------------------------------------------------------------+
|                         MAIN CONTROLLER (main.js)                     |
|  - Holds active topic module, coordinate system, & probe point P      |
|  - Runs requestAnimationFrame() render loop                           |
|  - Clears & disposes active THREE.Group on topic/system switch        |
+-----------------+-----------------------------------+-----------------+
                  |                                   |
                  v                                   v
+-----------------------------------+   +-------------------------------+
|       MATH ENGINE (math.js)       |   |     UI HUD & LaTeX (ui.js)    |
|  - Coordinate transforms          |   |  - Renders active coordinate  |
|  - Scaling factors (h1, h2, h3)   |   |    equations via KaTeX        |
|  - Pure evaluators:               |   |  - Displays live point probe  |
|    Grad, Div, Curl, Laplacian,    |   |    readouts (Scalar & Vector) |
|    E-Field, Energy Density        |   +-------------------------------+
+-----------------+-----------------+
                  |
                  | (3D Vectors & Scalar Values)
                  v
+-----------------------------------------------------------------------+
|                     TOPIC VISUALIZERS (topics/*.js)                   |
|  1. coords.js     (Constant surfaces, unit vectors, dv elements)      |
|  2. gradient.js   (Equipotential surfaces + 3D steepest-ascent arrows)|
|  3. divergence.js (Gaussian flux surface + source/sink particles)     |
|  4. curl.js       (Circulation loop L + 3D rotating paddlewheel)      |
|  5. laplacian.js  (Scalar curvature lattice + harmonic toggle)        |
|  6. efield.js     (Charge symmetries + 3D field lines + test charge)  |
|  7. energy.js     (Volumetric energy density cloud + volume integral) |
+-----------------------------------------------------------------------+
```

## 4. DIRECTORY STRUCTURE

Create and maintain this exact flat file structure:

```
./
├── index.html          # Main layout, sidebar controls, 3D canvas, Three.js & KaTeX CDNs
├── style.css           # Clean dark-mode scientific UI styling
├── main.js             # Three.js scene, camera, OrbitControls, render loop, topic switcher
├── math.js             # Coordinate conversions, unit vector matrices, & differential operators
├── ui.js               # DOM event bindings, slider labels, & KaTeX HUD updater
└── topics/
    ├── coords.js       # Topic 1: Coordinate Systems & Differential Elements
    ├── gradient.js     # Topic 2: The Gradient
    ├── divergence.js   # Topic 3: Divergence of a Vector
    ├── curl.js         # Topic 4: The Curl of a Vector
    ├── laplacian.js    # Topic 5: The Laplacian Operator
    ├── efield.js       # Topic 6: Electric Field Intensity
    └── energy.js       # Topic 7: Energy in Electrostatic Fields
```

## 5. MATHEMATICAL & PHYSICAL SPECIFICATION

All calculations in `math.js` and `topics/*.js` must strictly obey these orthogonal curvilinear definitions:

### 5.1 Coordinate Transformations & Metric Scaling Factors $(h_1, h_2, h_3)$

* **Cartesian** $(x, y, z)$:
  $$
  (h_1, h_2, h_3) = (1, 1, 1), \quad dv = dx\,dy\,dz
  $$

* **Circular Cylindrical** $(\rho, \phi, z)$:
  $$
  x = \rho \cos\phi, \quad y = \rho \sin\phi, \quad z = z
  $$
  $$
  \rho = \sqrt{x^2 + y^2}, \quad \phi = \tan^{-1}\left(\frac{y}{x}\right), \quad (h_1, h_2, h_3) = (1, \rho, 1), \quad dv = \rho\,d\rho\,d\phi\,dz
  $$

* **Spherical** $(r, \theta, \phi)$:
  $$
  x = r \sin\theta \cos\phi, \quad y = r \sin\theta \sin\phi, \quad z = r \cos\theta
  $$
  $$
  r = \sqrt{x^2 + y^2 + z^2}, \quad \theta = \cos^{-1}\left(\frac{z}{r}\right), \quad \phi = \tan^{-1}\left(\frac{y}{x}\right), \quad (h_1, h_2, h_3) = (1, r, r \sin\theta), \quad dv = r^2 \sin\theta\,dr\,d\theta\,d\phi
  $$

### 5.2 Unit Vector Transformations to Cartesian World Space

* **Cylindrical to Cartesian**:
  $$
  \begin{bmatrix} A_x \\ A_y \\ A_z \end{bmatrix} = \begin{bmatrix} \cos\phi & -\sin\phi & 0 \\ \sin\phi & \cos\phi & 0 \\ 0 & 0 & 1 \end{bmatrix} \begin{bmatrix} A_\rho \\ A_\phi \\ A_z \end{bmatrix}
  $$

* **Spherical to Cartesian**:
  $$
  \begin{bmatrix} A_x \\ A_y \\ A_z \end{bmatrix} = \begin{bmatrix} \sin\theta \cos\phi & \cos\theta \cos\phi & -\sin\phi \\ \sin\theta \sin\phi & \cos\theta \sin\phi & \cos\phi \\ \cos\theta & -\sin\theta & 0 \end{bmatrix} \begin{bmatrix} A_r \\ A_\theta \\ A_\phi \end{bmatrix}
  $$

## 6. PHASED EXECUTION PLAN

Execute this project in **4 sequential phases**. Mark each checkbox `[x]` as you complete it, and verify there are no syntax or import errors before moving to the next phase.

### PHASE 1: Core Engine, Math Library, & Topic 1 (Coordinate Systems)

- [x] **Build `index.html` & `style.css`**:
  - [x] Create a responsive dark-mode split layout: a 340px left sidebar and a full-height 3D WebGL viewport.
  - [x] Include a Topic `<select>` menu (all 7 topics), a 3-button segmented control for Coordinate System (`cartesian`, `cylindrical`, `spherical`), 3 coordinate sliders for the test point $P$ (which dynamically relabel to $(x, y, z)$, $(\rho, \phi, z)$, or $(r, \theta, \phi)$ with appropriate ranges), and a secondary mode toggle button.
  - [x] Add a HUD overlay card for KaTeX equations and live numerical readouts.
- [x] **Build `math.js`, `main.js`, & `ui.js`**:
  - [x] Implement coordinate conversions and local unit vector world-space directions at any point $P$.
  - [x] Implement numerical central-difference evaluators for Gradient, Divergence, Curl, and Laplacian using $(h_1, h_2, h_3)$.
  - [x] Set up the Three.js scene, camera, `OrbitControls`, `requestAnimationFrame` loop, and `THREE.Group` cleanup on topic/coordinate switch.
- [x] **Build `topics/coords.js` (Topic 1: Coordinate Systems)**:
  - [x] Render the 3 intersecting constant-coordinate surfaces passing through point $P$ as semi-transparent color-coded meshes:
    - [x] **Cartesian**: 3 orthogonal planes ($x = \text{const}$, $y = \text{const}$, $z = \text{const}$).
    - [x] **Cylindrical**: Cylinder ($\rho = \text{const}$), azimuthal half-plane ($\phi = \text{const}$), horizontal plane ($z = \text{const}$).
    - [x] **Spherical**: Sphere ($r = \text{const}$), cone ($\theta = \text{const}$), azimuthal half-plane ($\phi = \text{const}$).
  - [x] Render 3 bold `THREE.ArrowHelper` unit vectors originating at $P$ ($(\hat{a}_x, \hat{a}_y, \hat{a}_z)$, $(\hat{a}_\rho, \hat{a}_\phi, \hat{a}_z)$, or $(\hat{a}_r, \hat{a}_\theta, \hat{a}_\phi)$) to show how curvilinear unit vectors change orientation with position.
  - [x] Render a wireframe differential volume element $dv$ at $P$ ($dx\,dy\,dz$, $\rho\,d\rho\,d\phi\,dz$, or $r^2 \sin\theta\,dr\,d\theta\,d\phi$).

### PHASE 2: Scalar Field Operators — Topic 2 (The Gradient) & Topic 5 (The Laplacian)

- [x] **Build `topics/gradient.js` (Topic 2: The Gradient)**:
  - [x] Evaluate and visualize $\nabla \Phi$ in all 3 coordinate systems using canonical scalar fields:
    - [x] **Cartesian**: $\Phi(x,y,z) = 0.2(x^2 - y^2 + 2z)$ with
      $$
      \nabla \Phi = \frac{\partial \Phi}{\partial x}\hat{a}_x + \frac{\partial \Phi}{\partial y}\hat{a}_y + \frac{\partial \Phi}{\partial z}\hat{a}_z
      $$
    - [x] **Cylindrical**: $\Phi(\rho,\phi,z) = 0.15\rho^2 z \cos(2\phi)$ with
      $$
      \nabla \Phi = \frac{\partial \Phi}{\partial \rho}\hat{a}_\rho + \frac{1}{\rho}\frac{\partial \Phi}{\partial \phi}\hat{a}_\phi + \frac{\partial \Phi}{\partial z}\hat{a}_z
      $$
    - [x] **Spherical**: $\Phi(r,\theta,\phi) = r \sin^2\theta \cos\phi$ with
      $$
      \nabla \Phi = \frac{\partial \Phi}{\partial r}\hat{a}_r + \frac{1}{r}\frac{\partial \Phi}{\partial \theta}\hat{a}_theta + \frac{1}{r \sin\theta}\frac{\partial \Phi}{\partial \phi}\hat{a}_\phi
      $$
  - [x] Render semi-transparent equipotential surfaces/contours alongside a 3D vector field of arrows pointing in the direction of maximum rate of ascent.
  - [x] Render a highlighted $\nabla \Phi$ vector at probe point $P$ and display its exact components in the active coordinate basis.
- [x] **Build `topics/laplacian.js` (Topic 5: The Laplacian Operator)**:
  - [x] Evaluate and visualize $\nabla^2 \Phi = \nabla \cdot (\nabla \Phi)$ in all 3 coordinate systems:
    - [x] **Cartesian**:
      $$
      \nabla^2 \Phi = \frac{\partial^2 \Phi}{\partial x^2} + \frac{\partial^2 \Phi}{\partial y^2} + \frac{\partial^2 \Phi}{\partial z^2}
      $$
    - [x] **Cylindrical**:
      $$
      \nabla^2 \Phi = \frac{1}{\rho}\frac{\partial}{\partial \rho}\left(\rho \frac{\partial \Phi}{\partial \rho}\right) + \frac{1}{\rho^2}\frac{\partial^2 \Phi}{\partial \phi^2} + \frac{\partial^2 \Phi}{\partial z^2}
      $$
    - [x] **Spherical**:
      $$
      \nabla^2 \Phi = \frac{1}{r^2}\frac{\partial}{\partial r}\left(r^2 \frac{\partial \Phi}{\partial r}\right) + \frac{1}{r^2 \sin\theta}\frac{\partial}{\partial \theta}\left(\sin\theta \frac{\partial \Phi}{\partial \theta}\right) + \frac{1}{r^2 \sin^2\theta}\frac{\partial^2 \Phi}{\partial \phi^2}
      $$
  - [x] Render a 3D lattice of spheres color-mapped by $\nabla^2 \Phi$ (Blue for $\nabla^2 \Phi < 0$, White/Translucent for $\nabla^2 \Phi = 0$, Red for $\nabla^2 \Phi > 0$).
  - [x] Implement a mode toggle between a **Harmonic Field** ($\nabla^2 \Phi = 0$, satisfying Laplace's equation, e.g., $U = \rho^2 z \cos 2\phi$) and a **Non-Harmonic Field** ($\nabla^2 \Phi \neq 0$, satisfying Poisson's equation, e.g., $W = 10r \sin^2\theta \cos\phi$).
- [x] **Register Topic 2 and Topic 5 in `main.js` and `ui.js`**.

### PHASE 3: Vector Field Operators — Topic 3 (Divergence) & Topic 4 (Curl)

- [x] **Build `topics/divergence.js` (Topic 3: Divergence of a Vector)**:
  - [x] Evaluate and visualize $\nabla \cdot \vec{A}$ and Gauss's Divergence Theorem $\oint_S \vec{A} \cdot d\vec{S} = \int_v (\nabla \cdot \vec{A})\,dv$ across all 3 coordinate systems:
    - [x] **Cartesian**:
      $$
      \nabla \cdot \vec{A} = \frac{\partial A_x}{\partial x} + \frac{\partial A_y}{\partial y} + \frac{\partial A_z}{\partial z}
      $$
    - [x] **Cylindrical**:
      $$
      \nabla \cdot \vec{A} = \frac{1}{\rho}\frac{\partial(\rho A_\rho)}{\partial \rho} + \frac{1}{\rho}\frac{\partial A_\phi}{\partial \phi} + \frac{\partial A_z}{\partial z}
      $$
    - [x] **Spherical**:
      $$
      \nabla \cdot \vec{A} = \frac{1}{r^2}\frac{\partial(r^2 A_r)}{\partial r} + \frac{1}{r \sin\theta}\frac{\partial(\sin\theta A_\theta)}{\partial \theta} + \frac{1}{r \sin\theta}\frac{\partial A_\phi}{\partial \phi}
      $$
  - [x] Render the 3D vector field $\vec{A}$ plus animated tracer particles flowing outward/inward, with a mode toggle between **Source/Sink Field** ($\nabla \cdot \vec{A} \neq 0$) and **Solenoidal/Source-Free Field** ($\nabla \cdot \vec{A} = 0$, such as $\vec{G} = 10e^{-2z}(\rho\hat{a}_\rho + \hat{a}_z)$).
  - [x] Render a closed Gaussian surface at probe point $P$ matched to the coordinate system (Cube, Cylinder, or Sphere) that colors Red for positive outward flux ($\nabla \cdot \vec{A} > 0$), Blue for negative inward flux ($\nabla \cdot \vec{A} < 0$), and Green for zero net flux ($\nabla \cdot \vec{A} = 0$).
- [x] **Build `topics/curl.js` (Topic 4: The Curl of a Vector)**:
  - [x] Evaluate and visualize $\nabla \times \vec{A}$ and Stokes' Theorem $\oint_L \vec{A} \cdot d\vec{l} = \int_S (\nabla \times \vec{A}) \cdot d\vec{S}$ across all 3 coordinate systems:
    - [x] **Cartesian**:
      $$
      \nabla \times \vec{A} = \begin{vmatrix} \hat{a}_x & \hat{a}_y & \hat{a}_z \\ \frac{\partial}{\partial x} & \frac{\partial}{\partial y} & \frac{\partial}{\partial z} \\ A_x & A_y & A_z \end{vmatrix}
      $$
    - [x] **Cylindrical**:
      $$
      \nabla \times \vec{A} = \frac{1}{\rho}\begin{vmatrix} \hat{a}_\rho & \rho\hat{a}_\phi & \hat{a}_z \\ \frac{\partial}{\partial \rho} & \frac{\partial}{\partial \phi} & \frac{\partial}{\partial z} \\ A_\rho & \rho A_\phi & A_z \end{vmatrix}
      $$
    - [x] **Spherical**:
      $$
      \nabla \times \vec{A} = \frac{1}{r^2 \sin\theta}\begin{vmatrix} \hat{a}_r & r\hat{a}_\theta & r\sin\theta\hat{a}_\phi \\ \frac{\partial}{\partial r} & \frac{\partial}{\partial \theta} & \frac{\partial}{\partial \phi} \\ A_r & r A_\theta & r\sin\theta A_\phi \end{vmatrix}
      $$
  - [x] Render the 3D vector field $\vec{A}$ with a toggle between a **Rotational (Eddy) Field** ($\nabla \times \vec{A} \neq 0$) and an **Irrotational (Conservative/Eddy-less) Field** ($\nabla \times \vec{A} = 0$).
  - [x] Render a **3D Paddlewheel Probe** at probe point $P$ surrounded by a closed circulation path $L$, orienting the paddlewheel's normal axis along $\nabla \times \vec{A}$ and spinning its blades at an angular speed proportional to $\vert\nabla \times \vec{A}\vert$.
- [x] **Register Topic 3 and Topic 4 in `main.js` and `ui.js`**.

### PHASE 4: Electrostatics — Topic 6 (Electric Field Intensity) & Topic 7 (Electrostatic Energy)

- [x] **Build `topics/efield.js` (Topic 6: Electric Field Intensity)**:
  - [x] Visualize Coulomb's Law and Electric Field Intensity $\vec{E} = \frac{\vec{F}_t}{Q_t} = -\nabla V$ (in $\text{V/m}$ or $\text{N/C}$) across all 3 coordinate systems, with a mode toggle between **Canonical Symmetry Charge** and **Electric Dipole** ($+Q$ and $-Q$):
    - [x] **Cartesian**: Charged parallel plates / sheet charge + dipole superpositions expressed in $(E_x\hat{a}_x + E_y\hat{a}_y + E_z\hat{a}_z)$.
    - [x] **Cylindrical**: Infinite line charge along the $z$-axis ($\vec{E} = \frac{\rho_L}{2\pi\epsilon_0\rho}\hat{a}_\rho$) or dipole expressed in $(E_\rho\hat{a}_\rho + E_\phi\hat{a}_\phi + E_z\hat{a}_z)$.
    - [x] **Spherical**: Point charge at the origin ($\vec{E} = \frac{Q}{4\pi\epsilon_0 r^2}\hat{a}_r$) or dipole expressed in $(E_r\hat{a}_r + E_\theta\hat{a}_\theta + E_\phi\hat{a}_phi)$.
  - [x] Render non-crossing 3D streamline curves and a 3D vector arrow grid.
  - [x] Render a glowing unit positive test charge $Q_t$ at probe point $P$ with its force/field vector $\vec{E}$ and component projections onto the active coordinate unit vectors.
- [x] **Build `topics/energy.js` (Topic 7: Energy in Electrostatic Fields)**:
  - [x] Visualize Electrostatic Energy Density $w_e$ and Total Stored Energy $W_e$ across all 3 coordinate systems:
    $$
    w_e = \frac{1}{2}\vec{D}\cdot\vec{E} = \frac{1}{2}\epsilon_0 \epsilon_r \vert\vec{E}\vert^2 \quad (\text{J/m}^3), \qquad W_e = \int_V \frac{1}{2}\epsilon_0 \epsilon_r \vert\vec{E}\vert^2\,dv \quad (\text{J})
    $$
  - [x] Render a 3D volumetric energy density point cloud where point size and color glow scale with $w_e$.
  - [x] Render an interactive integration volume $V$ whose geometry matches the active coordinate system around/near $P$:
    - [x] **Cartesian**: Rectangular box integrating $dv = dx\,dy\,dz$.
    - [x] **Cylindrical**: Cylindrical shell integrating $dv = \rho\,d\rho\,d\phi\,dz$.
    - [x] **Spherical**: Spherical shell integrating $dv = r^2 \sin\theta\,dr\,d\theta\,d\phi$.
  - [x] Numerically integrate $\int_V w_e\,dv$ in real time and display both local $w_e$ at $P$ and total integrated energy $W_e$ in the HUD, with the mode toggle switching dielectric relative permittivity $\epsilon_r$ (e.g., Free Space $\epsilon_r = 1$ vs. Dielectric $\epsilon_r = 4$).
- [x] **Finalize all UI bindings and verify all 7 topics across all 3 coordinate systems in `main.js` and `ui.js`**.