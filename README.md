# emf.vis — 3D Electromagnetic Fields & Vector Calculus Visualizer

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE.txt)
[![Deploy to GitHub Pages](https://github.com/kareem-ghazi/emf-visualizer/actions/workflows/deploy.yml/badge.svg)](https://github.com/kareem-ghazi/emf-visualizer/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-brightgreen)](https://kareem-ghazi.github.io/emf-visualizer/)

**emf.vis** is a real-time, interactive 3D WebGL application designed to demystify electromagnetic fields and vector calculus concepts. Built with modern Vanilla JavaScript, Three.js, and KaTeX, it provides intuitive spatial visualizations, rigorous mathematical formulations, and interactive scientific calculators for coordinate systems, gradients, divergence, and curl.

---

## 🌐 Live Demo

Explore the visualizer live in your browser:  
👉 **[https://kareem-ghazi.github.io/emf-visualizer/](https://kareem-ghazi.github.io/emf-visualizer/)**

---

## 🧭 Key Features & Topics

### 1. Coordinate Systems
- **Three Supported Systems**:
  - **Cartesian** $(x, y, z)$
  - **Circular Cylindrical** $(\rho, \phi, z)$
  - **Spherical** $(r, \theta, \phi)$
- **Interactive Surfaces**: Intersecting constant coordinate surfaces (planes, cylinders, spheres, cones) defining the position of probe point $P$.
- **Local Unit Vectors**: Dynamic basis vectors ($\hat{a}_x, \hat{a}_y, \hat{a}_z$, $\hat{a}_\rho, \hat{a}_\phi, \hat{a}_z$, $\hat{a}_r, \hat{a}_\theta, \hat{a}_\phi$) showing how orthogonal directions change orientation in curvilinear space.
- **Differential Volume Element ($dV$)**: Visualized volume element defined by metric scale factors:
  $$dV = h_1 h_2 h_3 \, du_1 du_2 du_3$$
- **Multi-Coordinate Converter & Calculator**: Real-time cross-system point conversion, unit vector dot-product projections, and metric factor calculations.

---

### 2. The Gradient ($\nabla V$)
- **Steepest Ascent Topography**: 3D scalar potential hills $V(x, y)$ rendered as smooth heightmaps with dynamic contour rings (equipotential curves).
- **Multiple Hill Profiles**:
  - **Single Peak**: Symmetric Gaussian hill $V = V_0 e^{-(x^2 + y^2)/\sigma^2}$
  - **Twin Peaks**: Bimodal potential landscape
  - **Volcano Crater**: Annular caldera with central depression
- **Glowing Ascent Streamlines**: Non-flashing gradient trajectories tracing paths of maximum slope with animated pulse particles climbing smoothly to summits.
- **Surface Tangent Gradient Vectors**: 3D vector arrows pointing in the direction of steepest rate of change:
  $$\nabla V = \sum_{i=1}^3 \frac{1}{h_i} \frac{\partial V}{\partial u_i} \hat{a}_{u_i}$$
- **Full Gradient Scientific Calculator**: Evaluates custom scalar functions $V(u_1, u_2, u_3)$ across Cartesian, Cylindrical, and Spherical coordinates with natural keyboard math parsing and auto-rendered KaTeX preview.

---

### 3. The Divergence ($\nabla \cdot \vec{A}$)
- **Fluid Flux Analogy**: Visualizes net outward flux per unit volume from sources (faucets) and sinks (drains).
- **4 Interactive Planar Points**: Independent coordinate and strength controls for 4 charge/mass flux centers, numbered in contrasting colors:
  - **Sources ($\nabla \cdot \vec{A} > 0$)**: Outward white directional rings and radiant amber particles.
  - **Sinks ($\nabla \cdot \vec{A} < 0$)**: Inward white directional rings and convergent cyan/blue particles.
  - **Solenoidal ($\nabla \cdot \vec{A} = 0$)**: Zero divergence / eddyless field mode.
- **Orthographic Canvas Navigation**: Locked 2D overhead camera with smooth zoom controls.
- **HUD Formulations**: Complete mathematical expressions across Cartesian, Cylindrical, and Spherical systems:
  $$\nabla \cdot \vec{A} = \frac{1}{h_1 h_2 h_3} \left[ \frac{\partial (h_2 h_3 A_1)}{\partial u_1} + \frac{\partial (h_1 h_3 A_2)}{\partial u_2} + \frac{\partial (h_1 h_2 A_3)}{\partial u_3} \right]$$
- **Vector Divergence Calculator**: Evaluates arbitrary 3-component vector fields $\vec{A}(u_1, u_2, u_3)$ across all three coordinate systems.

---

### 4. The Curl ($\nabla \times \vec{A}$)
- **Vorticity & Swirl**: Visualizes micro-circulation and local paddle-wheel rotation within a vector field.
- **4 Interactive Vortex Centers**: Controllable vortex positions and circulation strengths:
  - **Counter-Clockwise ($\nabla \times \vec{A} > 0$)**: Highlighted in vibrant red with circulating loops.
  - **Clockwise ($\nabla \times \vec{A} < 0$)**: Highlighted in electric blue with reverse circulating loops.
  - **Zero Rotation ($\nabla \times \vec{A} = 0$)**: Purely irrotational, conservative field mode.
- **HUD Determinant Matrices**: KaTeX-rendered cross-product determinant formulas for Cartesian, Cylindrical, and Spherical systems:
  $$\nabla \times \vec{A} = \frac{1}{h_1 h_2 h_3} \begin{vmatrix} h_1 \hat{a}_1 & h_2 \hat{a}_2 & h_3 \hat{a}_3 \\ \frac{\partial}{\partial u_1} & \frac{\partial}{\partial u_2} & \frac{\partial}{\partial u_3} \\ h_1 A_1 & h_2 A_2 & h_3 A_3 \end{vmatrix}$$
- **Vector Curl Calculator**: Component-wise numerical curl evaluation across all 3 coordinate systems with live field magnitude and conservative state classification.

---

## 🗂️ Project Structure

```
emf-visualizer/
├── .github/
│   └── workflows/
│       └── deploy.yml        # Automatic GitHub Pages deployment workflow
├── AGENTS/                   # Agent memory, planning, and state tracking
│   ├── em_fields_visualizer_prompt_plan.md
│   └── project_state.md
├── dist/                     # Optimized production bundle (created on build)
├── src/                      # Application source code
│   ├── topics/               # Individual visualizer topic modules
│   │   ├── coords.js         # Coordinate Systems topic
│   │   ├── curl.js           # The Curl topic
│   │   ├── divergence.js     # The Divergence topic
│   │   └── gradient.js       # The Gradient topic
│   ├── main.js               # Application bootstrap & 3D render loop
│   ├── math.js               # Analytical & numerical vector calculus engine
│   ├── style.css             # Glassmorphic dark UI design system
│   └── ui.js                 # UI controls, HUD updates, & calculators
├── index.html                # Main entry HTML
├── vite.config.js            # Vite build configuration (base: './')
├── package.json              # Project dependencies & scripts
├── LICENSE.txt               # MIT License (2026 Kareem Ghazi)
└── README.md                 # Project documentation
```

---

## 🛠️ Technology Stack

- **Vanilla JavaScript (ES2022+)**: Modular, zero-framework architecture for fast load times and clean code.
- **Three.js (r160)**: WebGL-accelerated 3D scene rendering, custom geometries, instanced markers, and particle engines.
- **KaTeX (v0.16.9)**: High-performance LaTeX typography for equations in the HUD and calculators.
- **Vite (v6)**: Next-generation frontend tooling and production bundler.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0 or higher recommended)
- `npm` (bundled with Node.js)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/kareem-ghazi/emf-visualizer.git
   cd emf-visualizer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```
   Open the local URL displayed in the terminal (usually `http://localhost:5173`).

---

## 📦 Building for Production

To create a minified, production-ready build:

```bash
npm run build
```

To preview the built production bundle locally:

```bash
npm run preview
```

---

## 🚀 GitHub Pages Deployment

This repository includes an automated GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds and publishes the visualizer to GitHub Pages whenever changes are pushed to the `main` branch.

### Enabling GitHub Pages in Repository Settings:
1. Go to your GitHub repository: `https://github.com/kareem-ghazi/emf-visualizer`.
2. Navigate to **Settings** > **Pages**.
3. Under **Build and deployment** > **Source**, select **GitHub Actions**.
4. The deployment will automatically run on the next push to `main`.

---

## 📄 License

This project is open-source software licensed under the [MIT License](LICENSE.txt).

Copyright © 2026 **Kareem Ghazi**. All rights reserved.

