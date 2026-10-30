/**
 * ui.js - User Interface Controller, Dynamic DOM Bindings,
 * Slider Relabeling, and KaTeX HUD Math Rendering.
 */

import { COORD_SYSTEMS, getMetricFactors, toCartesian } from './math.js';

export class UIController {
  constructor(onStateChange) {
    this.onStateChange = onStateChange;

    // Cache DOM Elements
    this.dom = {
      topicSelect: document.getElementById('topic-select'),
      coordBtns: document.querySelectorAll('#coord-system-control .segment-btn'),
      resetPointBtn: document.getElementById('reset-point-btn'),
      resetCameraBtn: document.getElementById('reset-camera-btn'),
      modeToggleBtn: document.getElementById('mode-toggle'),
      modeToggleText: document.getElementById('mode-toggle-text'),
      modeDescription: document.getElementById('mode-description'),

      // Sliders & Labels
      sliderU1: document.getElementById('slider-u1'),
      sliderU2: document.getElementById('slider-u2'),
      sliderU3: document.getElementById('slider-u3'),
      labelU1: document.getElementById('label-u1'),
      labelU2: document.getElementById('label-u2'),
      labelU3: document.getElementById('label-u3'),
      valU1: document.getElementById('val-u1'),
      valU2: document.getElementById('val-u2'),
      valU3: document.getElementById('val-u3'),

      // Toggles
      toggleGrid: document.getElementById('toggle-grid'),
      toggleSurfaces: document.getElementById('toggle-surfaces'),
      toggleVectors: document.getElementById('toggle-vectors'),

      // HUD
      hudCard: document.getElementById('hud-card'),
      hudCollapseBtn: document.getElementById('hud-collapse-btn'),
      hudTopicTag: document.getElementById('hud-topic-tag'),
      hudTitle: document.getElementById('hud-title'),
      katexFormula: document.getElementById('katex-formula'),
      probeReadout: document.getElementById('probe-readout'),
      topicDetailSection: document.getElementById('topic-detail-section'),
      topicDetailTitle: document.getElementById('topic-detail-title'),
      katexDetail: document.getElementById('katex-detail')
    };

    // Current State
    this.state = {
      topic: 'coords',
      coordSystem: COORD_SYSTEMS.CARTESIAN,
      u: [1.5, 1.5, 1.5], // active coordinate representation
      modeSecondary: false, // topic-specific mode toggle
      showGrid: true,
      showSurfaces: true,
      showVectors: true
    };

    this.initEvents();
    this.updateSliderConfiguration();
  }

  initEvents() {
    // Topic change
    this.dom.topicSelect.addEventListener('change', (e) => {
      this.state.topic = e.target.value;
      this.state.modeSecondary = false;
      this.notify();
    });

    // Coordinate system change
    this.dom.coordBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextCoord = btn.dataset.coord;
        if (nextCoord === this.state.coordSystem) return;

        this.dom.coordBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        // Convert current point P (in Cartesian) to the new coordinate system
        const currentCart = toCartesian(this.state.u, this.state.coordSystem);
        this.state.coordSystem = nextCoord;
        this.updateSliderConfiguration(currentCart);
        this.notify();
      });
    });

    // Sliders input
    const onSliderInput = () => {
      this.readSliders();
      this.notify();
    };

    this.dom.sliderU1.addEventListener('input', onSliderInput);
    this.dom.sliderU2.addEventListener('input', onSliderInput);
    this.dom.sliderU3.addEventListener('input', onSliderInput);

    // Reset Point P
    this.dom.resetPointBtn.addEventListener('click', () => {
      this.resetPointToDefault();
      this.notify();
    });

    // Mode Toggle
    this.dom.modeToggleBtn.addEventListener('click', () => {
      this.state.modeSecondary = !this.state.modeSecondary;
      this.notify();
    });

    // Overlays checkboxes
    this.dom.toggleGrid.addEventListener('change', (e) => {
      this.state.showGrid = e.target.checked;
      this.notify();
    });

    this.dom.toggleSurfaces.addEventListener('change', (e) => {
      this.state.showSurfaces = e.target.checked;
      this.notify();
    });

    this.dom.toggleVectors.addEventListener('change', (e) => {
      this.state.showVectors = e.target.checked;
      this.notify();
    });

    // HUD Collapse
    this.dom.hudCollapseBtn.addEventListener('click', () => {
      this.dom.hudCard.classList.toggle('collapsed');
      this.dom.hudCollapseBtn.textContent = this.dom.hudCard.classList.contains('collapsed') ? '+' : '_';
    });
  }

  notify() {
    if (this.onStateChange) {
      this.onStateChange(this.state);
    }
  }

  /**
   * Resets probe point P to an aesthetic default for the current coordinate system
   */
  resetPointToDefault() {
    switch (this.state.coordSystem) {
      case COORD_SYSTEMS.CARTESIAN:
        this.state.u = [1.5, 1.5, 1.5];
        break;
      case COORD_SYSTEMS.CYLINDRICAL:
        this.state.u = [2.0, Math.PI / 4, 1.5]; // rho=2.0, phi=45°, z=1.5
        break;
      case COORD_SYSTEMS.SPHERICAL:
        this.state.u = [2.5, Math.PI / 4, Math.PI / 4]; // r=2.5, theta=45°, phi=45°
        break;
    }
    this.applyValuesToSliders();
  }

  /**
   * Updates slider labels, min, max, step according to active coordinate system
   */
  updateSliderConfiguration(optionalCartesianPoint) {
    const s1 = this.dom.sliderU1;
    const s2 = this.dom.sliderU2;
    const s3 = this.dom.sliderU3;

    switch (this.state.coordSystem) {
      case COORD_SYSTEMS.CARTESIAN:
        this.dom.labelU1.textContent = 'x (m)';
        this.dom.labelU2.textContent = 'y (m)';
        this.dom.labelU3.textContent = 'z (m)';

        s1.min = '-4'; s1.max = '4'; s1.step = '0.05';
        s2.min = '-4'; s2.max = '4'; s2.step = '0.05';
        s3.min = '-4'; s3.max = '4'; s3.step = '0.05';

        if (optionalCartesianPoint) {
          this.state.u = [
            Math.max(-4, Math.min(4, optionalCartesianPoint.x)),
            Math.max(-4, Math.min(4, optionalCartesianPoint.y)),
            Math.max(-4, Math.min(4, optionalCartesianPoint.z))
          ];
        }
        break;

      case COORD_SYSTEMS.CYLINDRICAL:
        this.dom.labelU1.textContent = 'ρ (m)';
        this.dom.labelU2.textContent = 'φ (deg)';
        this.dom.labelU3.textContent = 'z (m)';

        s1.min = '0.2'; s1.max = '4.0'; s1.step = '0.05';
        s2.min = '0';   s2.max = '360'; s2.step = '1';
        s3.min = '-4';  s3.max = '4';   s3.step = '0.05';

        if (optionalCartesianPoint) {
          const rho = Math.max(0.2, Math.min(4.0, Math.sqrt(optionalCartesianPoint.x ** 2 + optionalCartesianPoint.y ** 2)));
          let phi = Math.atan2(optionalCartesianPoint.y, optionalCartesianPoint.x);
          if (phi < 0) phi += 2 * Math.PI;
          const z = Math.max(-4, Math.min(4, optionalCartesianPoint.z));
          this.state.u = [rho, phi, z];
        }
        break;

      case COORD_SYSTEMS.SPHERICAL:
        this.dom.labelU1.textContent = 'r (m)';
        this.dom.labelU2.textContent = 'θ (deg)';
        this.dom.labelU3.textContent = 'φ (deg)';

        s1.min = '0.2'; s1.max = '4.5'; s1.step = '0.05';
        s2.min = '5';   s2.max = '175'; s2.step = '1';
        s3.min = '0';   s3.max = '360'; s3.step = '1';

        if (optionalCartesianPoint) {
          const r = Math.max(0.2, Math.min(4.5, Math.sqrt(
            optionalCartesianPoint.x ** 2 + optionalCartesianPoint.y ** 2 + optionalCartesianPoint.z ** 2
          )));
          const safeR = Math.max(0.01, r);
          const theta = Math.acos(Math.max(-1, Math.min(1, optionalCartesianPoint.z / safeR)));
          let phi = Math.atan2(optionalCartesianPoint.y, optionalCartesianPoint.x);
          if (phi < 0) phi += 2 * Math.PI;
          this.state.u = [r, theta, phi];
        }
        break;
    }

    this.applyValuesToSliders();
  }

  applyValuesToSliders() {
    const [u1, u2, u3] = this.state.u;

    if (this.state.coordSystem === COORD_SYSTEMS.CARTESIAN) {
      this.dom.sliderU1.value = u1;
      this.dom.sliderU2.value = u2;
      this.dom.sliderU3.value = u3;
      this.dom.valU1.textContent = u1.toFixed(2);
      this.dom.valU2.textContent = u2.toFixed(2);
      this.dom.valU3.textContent = u3.toFixed(2);
    } else if (this.state.coordSystem === COORD_SYSTEMS.CYLINDRICAL) {
      this.dom.sliderU1.value = u1;
      const degPhi = (u2 * 180 / Math.PI).toFixed(0);
      this.dom.sliderU2.value = degPhi;
      this.dom.sliderU3.value = u3;
      this.dom.valU1.textContent = `${u1.toFixed(2)} m`;
      this.dom.valU2.textContent = `${degPhi}° (${u2.toFixed(2)} rad)`;
      this.dom.valU3.textContent = `${u3.toFixed(2)} m`;
    } else if (this.state.coordSystem === COORD_SYSTEMS.SPHERICAL) {
      this.dom.sliderU1.value = u1;
      const degTheta = (u2 * 180 / Math.PI).toFixed(0);
      const degPhi = (u3 * 180 / Math.PI).toFixed(0);
      this.dom.sliderU2.value = degTheta;
      this.dom.sliderU3.value = degPhi;
      this.dom.valU1.textContent = `${u1.toFixed(2)} m`;
      this.dom.valU2.textContent = `${degTheta}° (${u2.toFixed(2)} rad)`;
      this.dom.valU3.textContent = `${degPhi}° (${u3.toFixed(2)} rad)`;
    }
  }

  readSliders() {
    const v1 = parseFloat(this.dom.sliderU1.value);
    const v2 = parseFloat(this.dom.sliderU2.value);
    const v3 = parseFloat(this.dom.sliderU3.value);

    if (this.state.coordSystem === COORD_SYSTEMS.CARTESIAN) {
      this.state.u = [v1, v2, v3];
      this.dom.valU1.textContent = v1.toFixed(2);
      this.dom.valU2.textContent = v2.toFixed(2);
      this.dom.valU3.textContent = v3.toFixed(2);
    } else if (this.state.coordSystem === COORD_SYSTEMS.CYLINDRICAL) {
      const phiRad = (v2 * Math.PI) / 180;
      this.state.u = [v1, phiRad, v3];
      this.dom.valU1.textContent = `${v1.toFixed(2)} m`;
      this.dom.valU2.textContent = `${v2.toFixed(0)}° (${phiRad.toFixed(2)} rad)`;
      this.dom.valU3.textContent = `${v3.toFixed(2)} m`;
    } else if (this.state.coordSystem === COORD_SYSTEMS.SPHERICAL) {
      const thetaRad = (v2 * Math.PI) / 180;
      const phiRad = (v3 * Math.PI) / 180;
      this.state.u = [v1, thetaRad, phiRad];
      this.dom.valU1.textContent = `${v1.toFixed(2)} m`;
      this.dom.valU2.textContent = `${v2.toFixed(0)}° (${thetaRad.toFixed(2)} rad)`;
      this.dom.valU3.textContent = `${v3.toFixed(0)}° (${phiRad.toFixed(2)} rad)`;
    }
  }

  /**
   * Safe KaTeX render helper
   */
  renderKaTeX(latex, container, isDisplay = true) {
    if (!container) return;
    if (window.katex) {
      try {
        window.katex.render(latex, container, {
          throwOnError: false,
          displayMode: isDisplay
        });
        return;
      } catch (err) {
        console.warn('KaTeX render error:', err);
      }
    }
    // Fallback if KaTeX is loading or unavailable
    container.textContent = latex;
  }

  /**
   * Updates HUD with topic data and real-time probe readouts
   */
  updateHUD(formulaData) {
    if (!formulaData) return;

    // Header info
    if (formulaData.topicTag) this.dom.hudTopicTag.textContent = formulaData.topicTag;
    if (formulaData.topicTitle) this.dom.hudTitle.textContent = formulaData.topicTitle;

    // Mode button label & description
    if (formulaData.modeBtnText) this.dom.modeToggleText.textContent = formulaData.modeBtnText;
    if (formulaData.modeDesc) this.dom.modeDescription.textContent = formulaData.modeDesc;

    // Main LaTeX formula
    if (formulaData.formulaLatex) {
      this.renderKaTeX(formulaData.formulaLatex, this.dom.katexFormula, true);
    }

    // Detail LaTeX section (if any)
    if (formulaData.detailLatex) {
      this.dom.topicDetailSection.style.display = 'block';
      if (formulaData.detailTitle) this.dom.topicDetailTitle.textContent = formulaData.detailTitle;
      this.renderKaTeX(formulaData.detailLatex, this.dom.katexDetail, true);
    } else {
      this.dom.topicDetailSection.style.display = 'none';
    }

    // Live Probe Readout grid
    this.renderProbeReadouts(formulaData.readout);
  }

  renderProbeReadouts(readoutData) {
    const container = this.dom.probeReadout;
    container.innerHTML = '';

    const cart = toCartesian(this.state.u, this.state.coordSystem);
    const mf = getMetricFactors(this.state.u, this.state.coordSystem);

    // Standard probe items
    const standardItems = [
      {
        label: 'Position (Cartesian)',
        value: `(${cart.x.toFixed(2)}, ${cart.y.toFixed(2)}, ${cart.z.toFixed(2)})`
      },
      {
        label: 'Metric Factors (h₁, h₂, h₃)',
        value: `(${mf.h1.toFixed(2)}, ${mf.h2.toFixed(2)}, ${mf.h3.toFixed(2)})`
      }
    ];

    // Combine standard items and topic-specific readout cards
    const allItems = [...standardItems, ...(readoutData || [])];

    allItems.forEach((item) => {
      const card = document.createElement('div');
      card.className = `readout-card ${item.fullWidth ? 'full-width' : ''}`;

      const lbl = document.createElement('div');
      lbl.className = 'label';
      lbl.textContent = item.label;

      const val = document.createElement('div');
      val.className = 'value';
      val.textContent = item.value;

      card.appendChild(lbl);
      card.appendChild(val);
      container.appendChild(card);
    });
  }
}

