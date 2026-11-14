# Mathematical Formulations & Coordinate Calculus

This document describes the orthogonal curvilinear coordinate formulations and differential vector operators implemented in `src/math.js`.

---

## 1. Orthogonal Curvilinear Coordinate Systems

The three coordinate systems supported across the visualizer and calculators are defined below:

### 1.1 Cartesian Coordinates $(x, y, z)$
- **Ranges**: $x \in (-\infty, \infty), \quad y \in (-\infty, \infty), \quad z \in (-\infty, \infty)$
- **Metric scale factors**:
  $$h_1 = 1, \quad h_2 = 1, \quad h_3 = 1$$
- **Differential volume element**:
  $$dv = dx \, dy \, dz$$

---

### 1.2 Circular Cylindrical Coordinates $(\rho, \phi, z)$
- **Ranges**: $\rho \in [0, \infty), \quad \phi \in [0, 2\pi), \quad z \in (-\infty, \infty)$
- **Forward transformation** to Cartesian:
  $$x = \rho \cos\phi, \quad y = \rho \sin\phi, \quad z = z$$
- **Inverse transformation** from Cartesian:
  $$\rho = \sqrt{x^2 + y^2}, \quad \phi = \text{atan2}(y, x), \quad z = z$$
- **Metric scale factors**:
  $$h_1 = 1, \quad h_2 = \rho, \quad h_3 = 1$$
- **Differential volume element**:
  $$dv = \rho \, d\rho \, d\phi \, dz$$

---

### 1.3 Spherical Coordinates $(r, \theta, \phi)$
- **Ranges**: $r \in [0, \infty), \quad \theta \in [0, \pi], \quad \phi \in [0, 2\pi)$
- **Forward transformation** to Cartesian:
  $$x = r \sin\theta \cos\phi, \quad y = r \sin\theta \sin\phi, \quad z = r \cos\theta$$
- **Inverse transformation** from Cartesian:
  $$r = \sqrt{x^2 + y^2 + z^2}, \quad \theta = \arccos\left(\frac{z}{\max(\epsilon, r)}\right), \quad \phi = \text{atan2}(y, x)$$
- **Metric scale factors**:
  $$h_1 = 1, \quad h_2 = r, \quad h_3 = r \sin\theta$$
- **Differential volume element**:
  $$dv = r^2 \sin\theta \, dr \, d\theta \, d\phi$$

---

## 2. General Curvilinear Differential Operators

For generalized orthogonal curvilinear coordinates $(u_1, u_2, u_3)$ with scale factors $(h_1, h_2, h_3)$:

### 2.1 The Gradient ($\nabla \Phi$)
The gradient of a scalar field $\Phi(u_1, u_2, u_3)$ yields a vector field pointing in the direction of maximum spatial rate of increase:
$$\nabla \Phi = \frac{1}{h_1} \frac{\partial \Phi}{\partial u_1} \hat{a}_1 + \frac{1}{h_2} \frac{\partial \Phi}{\partial u_2} \hat{a}_2 + \frac{1}{h_3} \frac{\partial \Phi}{\partial u_3} \hat{a}_3$$

---

### 2.2 The Divergence ($\nabla \cdot \vec{A}$)
The divergence of a vector field $\vec{A} = A_1 \hat{a}_1 + A_2 \hat{a}_2 + A_3 \hat{a}_3$ measures net outward flux per unit volume:
$$\nabla \cdot \vec{A} = \frac{1}{h_1 h_2 h_3} \left[ \frac{\partial}{\partial u_1} (h_2 h_3 A_1) + \frac{\partial}{\partial u_2} (h_1 h_3 A_2) + \frac{\partial}{\partial u_3} (h_1 h_2 A_3) \right]$$

- **Net Source**: $\nabla \cdot \vec{A} > 0$
- **Net Sink**: $\nabla \cdot \vec{A} < 0$
- **Solenoidal (Incompressible)**: $\nabla \cdot \vec{A} = 0$

---

### 2.3 The Curl ($\nabla \times \vec{A}$)
The curl of a vector field $\vec{A}$ measures local circulation and vorticity:
$$\nabla \times \vec{A} = \frac{1}{h_1 h_2 h_3} \begin{vmatrix} h_1 \hat{a}_1 & h_2 \hat{a}_2 & h_3 \hat{a}_3 \\ \frac{\partial}{\partial u_1} & \frac{\partial}{\partial u_2} & \frac{\partial}{\partial u_3} \\ h_1 A_1 & h_2 A_2 & h_3 A_3 \end{vmatrix}$$

Expanding by components:
$$(\nabla \times \vec{A})_1 = \frac{1}{h_2 h_3} \left[ \frac{\partial (h_3 A_3)}{\partial u_2} - \frac{\partial (h_2 A_2)}{\partial u_3} \right]$$
$$(\nabla \times \vec{A})_2 = \frac{1}{h_1 h_3} \left[ \frac{\partial (h_1 A_1)}{\partial u_3} - \frac{\partial (h_3 A_3)}{\partial u_1} \right]$$
$$(\nabla \times \vec{A})_3 = \frac{1}{h_1 h_2} \left[ \frac{\partial (h_2 A_2)}{\partial u_1} - \frac{\partial (h_1 A_1)}{\partial u_2} \right]$$

---

## 3. Numerical Central-Difference Implementation

In `src/math.js`, partial derivatives are computed via second-order central difference quotients:
$$\frac{\partial f}{\partial u_i} \approx \frac{f(u_i + \epsilon) - f(u_i - \epsilon)}{2\epsilon}$$
with step size $\epsilon = 10^{-4}$, combined with singularity floor thresholds ($\rho_{\min} = 10^{-3}$, $r_{\min} = 10^{-3}$, $\sin\theta_{\min} = 10^{-4}$) to prevent division by zero near axes and origin.
