# Software Architecture & Implementation Design

This document outlines the software design, module structure, camera framing pipeline, and rendering flow of the **emf.vis** application.

---

## 1. High-Level System Overview

The application is engineered as a zero-framework, modular web application utilizing modern ECMAScript modules (ESM), WebGL via Three.js (r160), and math typography via KaTeX.

```
                          ┌───────────────────────┐
                          │      index.html       │
                          └──────────┬────────────┘
                                     │
                                     ▼
                          ┌───────────────────────┐
                          │      src/main.js      │
                          │ (AppController Loop)  │
                          └─────┬───────────┬─────┘
                                │           │
                 ┌──────────────┘           └──────────────┐
                 ▼                                         ▼
      ┌────────────────────┐                    ┌────────────────────┐
      │     src/ui.js      │                    │  Topic Visualizers │
      │  (UIController &   │                    │  (src/topics/*.js) │
      │   HUD Dispatcher)  │                    │                    │
      └──────────┬─────────┘                    │ - coords.js        │
                 │                              │ - gradient.js      │
                 ▼                              │ - divergence.js    │
      ┌────────────────────┐                    │ - curl.js          │
      │    src/math.js     │                    └──────────┬─────────┘
      │ (Calculus Engine & │◄──────────────────────────────┘
      │  Transformations)  │
      └────────────────────┘
```

---

## 2. Directory Layout & Responsibilities

- **`src/main.js`**:
  - Initializes the Three.js WebGL renderer, perspective camera, lights, and orbit controls.
  - Maintains the global animation loop via `requestAnimationFrame`.
  - Manages topic switching, geometry cleanup, memory disposal, and camera position transitions.
  - Implements dynamic aspect-ratio-aware camera framing for mobile and desktop screens.
- **`src/math.js`**:
  - Analytical and numerical vector calculus functions.
  - Transformations between Cartesian, Cylindrical, and Spherical coordinate systems.
  - Calculation of metric scale factors ($h_1, h_2, h_3$), basis unit vectors, gradients, divergences, curls, and Laplacians.
  - High-precision scientific notation formatting with singularity safeguards.
- **`src/ui.js`**:
  - Manages DOM bindings, event listeners, input validation, and real-time KaTeX LaTeX equation rendering.
  - Controls the mobile slide-over drawer sidebar and collapsible floating HUD panel.
  - Hosts the scientific calculator suite with continuous input focus retention.
- **`src/topics/`**:
  - Self-contained visualizer modules adhering to a uniform interface contract (`init`, `update`, `getFormulaData`).
  - `coords.js`: Coordinate surfaces, unit vector frames, and differential volume visualization.
  - `gradient.js`: 3D topographical potential hills, equipotential contour rings, and non-flashing steepest-ascent streamlines.
  - `divergence.js`: 2D planar vector field with controllable source and sink flux centers and streaming particles.
  - `curl.js`: 2D planar vorticity visualizer with 4 controllable counter-clockwise and clockwise vortices.

---

## 3. Aspect-Ratio-Aware Camera System

### Problem in Portrait Orientation
Three.js uses a vertical field of view (`fov`). When a mobile phone is in portrait mode ($\text{aspect} = \frac{\text{width}}{\text{height}} \approx 0.45$), the horizontal field of view narrows significantly:
$$\text{visibleWidth} = 2 \cdot Z \cdot \tan\left(\frac{\text{fov}}{2}\right) \cdot \text{aspect}$$

With fixed camera distance ($Z = 7.8$), horizontal visibility on phones spans only $\approx [-1.5, +1.5]$, which cuts off points located at $x = \pm 1.8$ (Divergence) and $x = \pm 2.2$ (Curl).

### Adaptive Camera Distance Implementation
In `AppController.get2DCameraDistance()`, the camera distance is calculated dynamically based on the current aspect ratio to guarantee that all points and streamlines fit with comfortable padding:

```javascript
get2DCameraDistance() {
  const width = this.container.clientWidth || window.innerWidth;
  const height = this.container.clientHeight || window.innerHeight;
  const aspect = width / (height || 1);

  const requiredHalfWidth = 3.6;
  const requiredHalfHeight = 2.8;
  const tanFovHalf = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));

  const distForWidth = requiredHalfWidth / (tanFovHalf * aspect);
  const distForHeight = requiredHalfHeight / tanFovHalf;

  return Math.max(7.8, distForWidth, distForHeight);
}
```

- On landscape desktop ($\text{aspect} \ge 1.4$), $Z = 7.8$.
- On mobile portrait ($\text{aspect} \approx 0.46$), $Z \approx 17.5 - 18.0$, ensuring all four points and vectors fit inside the screen without clipping.

---

## 4. State Management & Lifecycle

1. **Topic Switching**:
   - `AppController.loadTopic(topicId)` disposes of previous meshes, buffers, and materials.
   - Reinitializes the active topic module group.
   - Adjusts controls (2D constrained pan/zoom vs. 3D orbit) and invokes `resetCamera()`.
2. **Animation Loop**:
   - Computes delta time via `THREE.Clock`.
   - Passes cumulative time and state parameters to `activeModule.update(time, coordSystem, state)`.
   - Updates `OrbitControls` and calls `renderer.render(scene, camera)`.
3. **UI Synchronization**:
   - User inputs notify `UIController`, which updates internal state and invokes registered callbacks to update Three.js geometries reactively.
