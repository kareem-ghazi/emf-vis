# emf.vis — 3D Electromagnetic Fields & Vector Calculus Visualizer

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE.txt)
[![Deploy to GitHub Pages](https://github.com/kareem-ghazi/emf-vis/actions/workflows/deploy.yml/badge.svg)](https://github.com/kareem-ghazi/emf-vis/actions/workflows/deploy.yml)
[![Tests: Vitest](https://img.shields.io/badge/Tests-31%20Passing-brightgreen.svg)](tests/)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-brightgreen)](https://kareem-ghazi.github.io/emf-vis/)

**emf.vis** is a real-time, interactive 3D WebGL application designed to demystify electromagnetic fields and vector calculus concepts. Built with modern Vanilla JavaScript, Three.js, and KaTeX, it provides intuitive spatial visualizations, rigorous mathematical formulations, and interactive scientific calculators for coordinate systems, gradients, divergence, and curl.

---

## 🌐 Live Demo

Explore the visualizer live in your browser:  
👉 **[https://kareem-ghazi.github.io/emf-vis/](https://kareem-ghazi.github.io/emf-vis/)**

---

## 🧭 Key Features & Topics

emf.vis covers the foundations of vector calculus and electromagnetic field theory across 4 interactive modules:

### 1. Coordinate Systems
- **Three Core Systems**: Real-time switching between **Cartesian** $(x, y, z)$, **Cylindrical** $(\rho, \phi, z)$, and **Spherical** $(r, \theta, \phi)$ representations.
- **Dynamic Geometric Visuals**: Intersecting constant-coordinate surfaces, local orthonormal basis vectors ($\hat{a}_i$), and differential volume elements ($dV$).
- **Multi-System Point Converter**: Live cross-coordinate translations, metric scale factors ($h_i$), and projection products.

### 2. The Gradient ($\nabla V$)
- **Topographical Potential Hills**: 3D heightmaps for Single Peak Gaussian, Twin Peaks, and Volcano Crater potential profiles.
- **Steepest Ascent Visuals**: Equipotential contour rings, tangent gradient vector arrows, and animated particle streamlines ascending toward local maxima.
- **Custom Potential Calculator**: Real-time evaluation of user-defined scalar functions $V(u_1, u_2, u_3)$ across all three coordinate systems with live KaTeX rendering.

### 3. The Divergence ($\nabla \cdot \vec{A}$)
- **Fluid Flux Analogy**: Visual representation of net outward flux (sources) and net inward flux (sinks) per unit volume.
- **4 Interactive Centers**: Configurable source and sink points with radiant/convergent particle flow and solenoidal (zero-divergence) mode.
- **Vector Divergence Calculator**: Real-time analytical evaluation and classification (Net Source, Net Sink, or Incompressible) for arbitrary 3D vector fields.

### 4. The Curl ($\nabla \times \vec{A}$)
- **Vorticity & Swirl**: Micro-circulation dynamics illustrating local paddle-wheel rotation and circulation.
- **4 Interactive Vortex Centers**: Independent position and circulation controls for counter-clockwise, clockwise, and irrotational (curl-free) field states.
- **Vector Curl Calculator**: Component-wise numerical curl evaluation across all coordinate systems with rotational orientation classification.

---

## 🗂️ Project Structure

```
emf-vis/
├── .github/
│   └── workflows/
│       └── deploy.yml        # CI/CD: Automated Vitest runs & GitHub Pages deployment
├── .archive/                 # Archived agent prompt plans and project state
│   └── AGENTS/
│       ├── em_fields_visualizer_prompt_plan.md
│       └── project_state.md
├── docs/                     # Technical documentation
│   ├── ARCHITECTURE.md       # Architecture, camera math, and data flow
│   ├── MATHEMATICAL_FORMULATIONS.md # Vector calculus & coordinate equations
│   └── TESTING.md            # Unit testing guide & test architecture
├── dist/                     # Optimized production bundle (created on build)
├── public/                   # Static assets & favicon.svg
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
├── tests/                    # Vitest unit test suite (31 tests)
│   ├── camera.test.js        # Mobile camera framing & frustum tests
│   └── math.test.js          # Calculus transformations & operator tests
├── index.html                # Main entry HTML
├── vite.config.js            # Vite build configuration (base: './')
├── package.json              # Project dependencies & test scripts
├── LICENSE.txt               # MIT License (2026 Kareem Ghazi)
└── README.md                 # Project documentation
```

---

## 📚 Technical Documentation

Comprehensive documentation is available in the [`docs/`](docs/) directory:
- 🏗️ **[Architecture & Design (`docs/ARCHITECTURE.md`)](docs/ARCHITECTURE.md)**: Zero-framework ESM design, Three.js scene management, memory cleanup, and adaptive mobile camera framing.
- 📐 **[Mathematical Formulations (`docs/MATHEMATICAL_FORMULATIONS.md`)](docs/MATHEMATICAL_FORMULATIONS.md)**: Curvilinear scale factors, metric tensors, coordinate transformations, and differential operators.
- 🧪 **[Testing Guide (`docs/TESTING.md`)](docs/TESTING.md)**: Automated unit testing architecture and test suite overview.

---

## 🧪 Unit Testing

The project includes an automated unit test suite with 31 tests covering coordinate transformations, metric scale factors, vector identities, and mobile camera frustum calculations:

```bash
# Run all unit tests
npm test

# Run tests in interactive watch mode
npm run test:watch
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
   git clone https://github.com/kareem-ghazi/emf-vis.git
   cd emf-vis
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
1. Go to your GitHub repository.
2. Navigate to **Settings** > **Pages**.
3. Under **Build and deployment** > **Source**, select **GitHub Actions**.
4. The deployment will automatically run on the next push to `main`.

---

## 📄 License

This project is open-source software licensed under the [MIT License](LICENSE.txt).

