/**
 * ui.js - User Interface Controller, Topic Control Routing,
 * 4-Point Plane Controls (Images 1 & 2), KaTeX HUD Math Rendering,
 * and Full Suite of Scientific Calculators & Converters.
 */

import {
  COORD_SYSTEMS,
  toCartesian,
  fromCartesian,
  getMetricFactors,
  convertCoordinatesAll,
  calculateUnitVectorsAt,
  calculateVectorMagnitudeAndDirection,
  GRADIENT_PRESETS,
  calculateGradientAt,
  calculateDivergenceAt,
  calculateCurlAt
} from './math.js';
import { DEFAULT_DIVERGENCE_POINTS } from './topics/divergence.js';
import { DEFAULT_CURL_VORTICES } from './topics/curl.js';

export class UIController {
  constructor(onStateChange) {
    this.onStateChange = onStateChange;

    // Cache Core DOM Elements
    this.dom = {
      topicSelect: document.getElementById('topic-select'),

      // Section wrappers
      coordsControlsSection: document.getElementById('coords-controls-section'),
      gradientControlsSection: document.getElementById('gradient-controls-section'),
      multiPointsControlsSection: document.getElementById('multi-points-controls-section'),

      // Coords controls
      coordBtns: document.querySelectorAll('#coord-system-control .segment-btn'),
      resetPointBtn: document.getElementById('reset-point-btn'),
      sliderU1: document.getElementById('slider-u1'),
      sliderU2: document.getElementById('slider-u2'),
      sliderU3: document.getElementById('slider-u3'),
      labelU1: document.getElementById('label-u1'),
      labelU2: document.getElementById('label-u2'),
      labelU3: document.getElementById('label-u3'),
      valU1: document.getElementById('val-u1'),
      valU2: document.getElementById('val-u2'),
      valU3: document.getElementById('val-u3'),

      // Gradient controls
      gradientProfileSelect: document.getElementById('gradient-profile-select'),
      sliderGradAmp: document.getElementById('slider-grad-amp'),
      valGradAmp: document.getElementById('val-grad-amp'),
      sliderGradSpread: document.getElementById('slider-grad-spread'),
      valGradSpread: document.getElementById('val-grad-spread'),

      // Multi-Points controls (Divergence & Curl)
      multiPointsTitle: document.getElementById('multi-points-title'),
      resetPointsLayoutBtn: document.getElementById('reset-points-layout-btn'),
      pointPillBtns: document.querySelectorAll('.point-pill-btn'),
      sliderPtX: document.getElementById('slider-pt-x'),
      valPtX: document.getElementById('val-pt-x'),
      sliderPtY: document.getElementById('slider-pt-y'),
      valPtY: document.getElementById('val-pt-y'),
      pointTypeDivContainer: document.getElementById('point-type-div-container'),
      pointTypeCurlContainer: document.getElementById('point-type-curl-container'),
      divTypeBtns: document.querySelectorAll('#div-type-control .segment-btn'),
      curlTypeBtns: document.querySelectorAll('#curl-type-control .segment-btn'),
      labelPtStrength: document.getElementById('label-pt-strength'),
      sliderPtStrength: document.getElementById('slider-pt-strength'),
      valPtStrength: document.getElementById('val-pt-strength'),

      // Overlays
      toggleGrid: document.getElementById('toggle-grid'),
      toggleSurfaces: document.getElementById('toggle-surfaces'),
      toggleVectors: document.getElementById('toggle-vectors'),
      resetCameraBtn: document.getElementById('reset-camera-btn'),

      // Calculator section
      calcTopicBadge: document.getElementById('calc-topic-badge'),
      calcTabsBar: document.getElementById('calc-tabs-bar'),
      calcViewContainer: document.getElementById('calc-view-container'),

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

    // State
    this.state = {
      topic: 'coords', // 'coords', 'gradient', 'divergence', 'curl'
      coordSystem: COORD_SYSTEMS.CARTESIAN,
      u: [1.5, 1.5, 1.5],

      // Gradient
      profileIndex: 0,
      hillAmplitude: 3.5,
      hillSpread: 3.0,

      // Divergence (4 Points matching Image 1)
      divPoints: JSON.parse(JSON.stringify(DEFAULT_DIVERGENCE_POINTS)),
      activeDivPointIdx: 0,

      // Curl (4 Vortices matching Image 2)
      curlVortices: JSON.parse(JSON.stringify(DEFAULT_CURL_VORTICES)),
      activeCurlVortexIdx: 0,

      // Overlays
      showGrid: true,
      showSurfaces: true,
      showVectors: true
    };

    // Calculator local state
    this.calcState = {
      coordsTab: 'converter', // 'converter', 'unit_vectors', 'magnitude', 'direction'
      convFrom: 'cartesian',
      convU: [1.5, 1.5, 1.5],
      convAngleMode: 'deg',

      unitVecCoord: 'cartesian',
      unitVecPoint: [1.5, 1.5, 1.5],

      magVector: [3.0, 4.0, 0.0],
      dirVector: [1.0, 2.0, 2.0],

      gradPreset: 'gauss',
      gradCustomExpr: '3.5 * exp(-(x^2 + y^2) / 3)',
      gradPoint: [1.0, 1.0, 0.0],

      divEvalPoint: [0.0, 0.0],
      curlEvalPoint: [0.0, 0.0]
    };

    this.initEvents();
    this.updateTopicVisibility();
    this.renderCalculator();
  }

  initEvents() {
    // Topic change
    this.dom.topicSelect.addEventListener('change', (e) => {
      this.state.topic = e.target.value;
      if (this.state.topic !== 'coords') {
        this.state.coordSystem = COORD_SYSTEMS.CARTESIAN;
      }
      this.updateTopicVisibility();
      this.renderCalculator();
      this.notify();
    });

    // Coordinate System change (Coords topic only)
    this.dom.coordBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextCoord = btn.dataset.coord;
        if (nextCoord === this.state.coordSystem) return;

        this.dom.coordBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const currentCart = toCartesian(this.state.u, this.state.coordSystem);
        this.state.coordSystem = nextCoord;
        this.updateSliderConfiguration(currentCart);
        this.notify();
      });
    });

    // Coords Sliders
    const onCoordsSliderInput = () => {
      this.readCoordsSliders();
      this.notify();
    };
    this.dom.sliderU1.addEventListener('input', onCoordsSliderInput);
    this.dom.sliderU2.addEventListener('input', onCoordsSliderInput);
    this.dom.sliderU3.addEventListener('input', onCoordsSliderInput);

    // Reset Point P
    this.dom.resetPointBtn.addEventListener('click', () => {
      this.resetPointToDefault();
      this.notify();
    });

    // Gradient Profile & Sliders
    this.dom.gradientProfileSelect.addEventListener('change', (e) => {
      this.state.profileIndex = parseInt(e.target.value, 10);
      this.notify();
    });

    this.dom.sliderGradAmp.addEventListener('input', (e) => {
      this.state.hillAmplitude = parseFloat(e.target.value);
      this.dom.valGradAmp.textContent = `${this.state.hillAmplitude.toFixed(1)} V`;
      this.notify();
    });

    this.dom.sliderGradSpread.addEventListener('input', (e) => {
      this.state.hillSpread = parseFloat(e.target.value);
      this.dom.valGradSpread.textContent = this.state.hillSpread.toFixed(1);
      this.notify();
    });

    // 4-Point Selection Pills for Divergence / Curl
    this.dom.pointPillBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.pointIdx, 10);
        this.dom.pointPillBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        if (this.state.topic === 'divergence') {
          this.state.activeDivPointIdx = idx;
          this.syncMultiPointsSliders();
        } else if (this.state.topic === 'curl') {
          this.state.activeCurlVortexIdx = idx;
          this.syncMultiPointsSliders();
        }
      });
    });

    // Position X Slider for 4 Points
    this.dom.sliderPtX.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.dom.valPtX.textContent = val.toFixed(2);
      if (this.state.topic === 'divergence') {
        this.state.divPoints[this.state.activeDivPointIdx].x = val;
      } else if (this.state.topic === 'curl') {
        this.state.curlVortices[this.state.activeCurlVortexIdx].x = val;
      }
      this.notify();
      this.renderCalculator();
    });

    // Position Y Slider for 4 Points
    this.dom.sliderPtY.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.dom.valPtY.textContent = val.toFixed(2);
      if (this.state.topic === 'divergence') {
        this.state.divPoints[this.state.activeDivPointIdx].y = val;
      } else if (this.state.topic === 'curl') {
        this.state.curlVortices[this.state.activeCurlVortexIdx].y = val;
      }
      this.notify();
      this.renderCalculator();
    });

    // Divergence Source vs Sink segmented control
    this.dom.divTypeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.dom.divTypeBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const type = btn.dataset.divType;
        const curPt = this.state.divPoints[this.state.activeDivPointIdx];
        const strength = Math.abs(curPt.q) || 2.0;
        curPt.q = type === 'source' ? strength : -strength;
        this.notify();
        this.renderCalculator();
      });
    });

    // Curl CCW vs CW segmented control
    this.dom.curlTypeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.dom.curlTypeBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const type = btn.dataset.curlType;
        const curV = this.state.curlVortices[this.state.activeCurlVortexIdx];
        const strength = Math.abs(curV.gamma) || 2.0;
        curV.gamma = type === 'ccw' ? strength : -strength;
        this.notify();
        this.renderCalculator();
      });
    });

    // Strength Slider for 4 Points
    this.dom.sliderPtStrength.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.dom.valPtStrength.textContent = val.toFixed(1);
      if (this.state.topic === 'divergence') {
        const pt = this.state.divPoints[this.state.activeDivPointIdx];
        const sign = Math.sign(pt.q) || 1;
        pt.q = sign * val;
      } else if (this.state.topic === 'curl') {
        const v = this.state.curlVortices[this.state.activeCurlVortexIdx];
        const sign = Math.sign(v.gamma) || 1;
        v.gamma = sign * val;
      }
      this.notify();
      this.renderCalculator();
    });

    // Reset Points Layout
    this.dom.resetPointsLayoutBtn.addEventListener('click', () => {
      if (this.state.topic === 'divergence') {
        this.state.divPoints = JSON.parse(JSON.stringify(DEFAULT_DIVERGENCE_POINTS));
        this.syncMultiPointsSliders();
      } else if (this.state.topic === 'curl') {
        this.state.curlVortices = JSON.parse(JSON.stringify(DEFAULT_CURL_VORTICES));
        this.syncMultiPointsSliders();
      }
      this.notify();
      this.renderCalculator();
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
   * Toggles visibility of topic-specific sidebar control sections
   */
  updateTopicVisibility() {
    const topic = this.state.topic;

    this.dom.coordsControlsSection.style.display = topic === 'coords' ? 'block' : 'none';
    this.dom.gradientControlsSection.style.display = topic === 'gradient' ? 'block' : 'none';
    this.dom.multiPointsControlsSection.style.display = (topic === 'divergence' || topic === 'curl') ? 'block' : 'none';

    if (topic === 'divergence') {
      this.dom.multiPointsTitle.textContent = '4 Divergence Points (Image 1)';
      this.dom.pointTypeDivContainer.style.display = 'block';
      this.dom.pointTypeCurlContainer.style.display = 'none';
      this.dom.labelPtStrength.textContent = 'Source Strength |q|';
      this.syncMultiPointsSliders();
    } else if (topic === 'curl') {
      this.dom.multiPointsTitle.textContent = '4 Curl Vortices (Image 2)';
      this.dom.pointTypeDivContainer.style.display = 'none';
      this.dom.pointTypeCurlContainer.style.display = 'block';
      this.dom.labelPtStrength.textContent = 'Vorticity Strength |Γ|';
      this.syncMultiPointsSliders();
    } else if (topic === 'coords') {
      this.updateSliderConfiguration();
    }
  }

  /**
   * Syncs the 4-point position and strength sliders with active point data
   */
  syncMultiPointsSliders() {
    if (this.state.topic === 'divergence') {
      const p = this.state.divPoints[this.state.activeDivPointIdx];
      this.dom.sliderPtX.value = p.x;
      this.dom.valPtX.textContent = p.x.toFixed(2);
      this.dom.sliderPtY.value = p.y;
      this.dom.valPtY.textContent = p.y.toFixed(2);

      const isSource = p.q >= 0;
      this.dom.divTypeBtns.forEach((b) => {
        b.classList.toggle('active', (b.dataset.divType === 'source') === isSource);
      });
      const strength = Math.abs(p.q);
      this.dom.sliderPtStrength.value = strength;
      this.dom.valPtStrength.textContent = strength.toFixed(1);
    } else if (this.state.topic === 'curl') {
      const v = this.state.curlVortices[this.state.activeCurlVortexIdx];
      this.dom.sliderPtX.value = v.x;
      this.dom.valPtX.textContent = v.x.toFixed(2);
      this.dom.sliderPtY.value = v.y;
      this.dom.valPtY.textContent = v.y.toFixed(2);

      const isCCW = v.gamma >= 0;
      this.dom.curlTypeBtns.forEach((b) => {
        b.classList.toggle('active', (b.dataset.curlType === 'ccw') === isCCW);
      });
      const strength = Math.abs(v.gamma);
      this.dom.sliderPtStrength.value = strength;
      this.dom.valPtStrength.textContent = strength.toFixed(1);
    }
  }

  /**
   * Resets probe point P in coords topic
   */
  resetPointToDefault() {
    switch (this.state.coordSystem) {
      case COORD_SYSTEMS.CARTESIAN:
        this.state.u = [1.5, 1.5, 1.5];
        break;
      case COORD_SYSTEMS.CYLINDRICAL:
        this.state.u = [2.0, Math.PI / 4, 1.5];
        break;
      case COORD_SYSTEMS.SPHERICAL:
        this.state.u = [2.5, Math.PI / 4, Math.PI / 4];
        break;
    }
    this.applyValuesToSliders();
  }

  updateSliderConfiguration(optionalCartesianPoint) {
    const s1 = this.dom.sliderU1;
    const s2 = this.dom.sliderU2;
    const s3 = this.dom.sliderU3;

    switch (this.state.coordSystem) {
      case COORD_SYSTEMS.CARTESIAN:
        this.dom.labelU1.textContent = 'x';
        this.dom.labelU2.textContent = 'y';
        this.dom.labelU3.textContent = 'z';

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
        this.dom.labelU1.textContent = 'ρ';
        this.dom.labelU2.textContent = 'φ';
        this.dom.labelU3.textContent = 'z';

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
        this.dom.labelU1.textContent = 'r';
        this.dom.labelU2.textContent = 'θ';
        this.dom.labelU3.textContent = 'φ';

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
      this.dom.valU1.textContent = `${u1.toFixed(2)} m`;
      this.dom.valU2.textContent = `${u2.toFixed(2)} m`;
      this.dom.valU3.textContent = `${u3.toFixed(2)} m`;
    } else if (this.state.coordSystem === COORD_SYSTEMS.CYLINDRICAL) {
      this.dom.sliderU1.value = u1;
      const degPhi = (u2 * 180 / Math.PI).toFixed(0);
      this.dom.sliderU2.value = degPhi;
      this.dom.sliderU3.value = u3;
      this.dom.valU1.textContent = `${u1.toFixed(2)} m`;
      this.dom.valU2.textContent = `${degPhi}°`;
      this.dom.valU3.textContent = `${u3.toFixed(2)} m`;
    } else if (this.state.coordSystem === COORD_SYSTEMS.SPHERICAL) {
      this.dom.sliderU1.value = u1;
      const degTheta = (u2 * 180 / Math.PI).toFixed(0);
      const degPhi = (u3 * 180 / Math.PI).toFixed(0);
      this.dom.sliderU2.value = degTheta;
      this.dom.sliderU3.value = degPhi;
      this.dom.valU1.textContent = `${u1.toFixed(2)} m`;
      this.dom.valU2.textContent = `${degTheta}°`;
      this.dom.valU3.textContent = `${degPhi}°`;
    }
  }

  readCoordsSliders() {
    const v1 = parseFloat(this.dom.sliderU1.value);
    const v2 = parseFloat(this.dom.sliderU2.value);
    const v3 = parseFloat(this.dom.sliderU3.value);

    if (this.state.coordSystem === COORD_SYSTEMS.CARTESIAN) {
      this.state.u = [v1, v2, v3];
      this.dom.valU1.textContent = `${v1.toFixed(2)} m`;
      this.dom.valU2.textContent = `${v2.toFixed(2)} m`;
      this.dom.valU3.textContent = `${v3.toFixed(2)} m`;
    } else if (this.state.coordSystem === COORD_SYSTEMS.CYLINDRICAL) {
      const phiRad = (v2 * Math.PI) / 180;
      this.state.u = [v1, phiRad, v3];
      this.dom.valU1.textContent = `${v1.toFixed(2)} m`;
      this.dom.valU2.textContent = `${v2.toFixed(0)}°`;
      this.dom.valU3.textContent = `${v3.toFixed(2)} m`;
    } else if (this.state.coordSystem === COORD_SYSTEMS.SPHERICAL) {
      const thetaRad = (v2 * Math.PI) / 180;
      const phiRad = (v3 * Math.PI) / 180;
      this.state.u = [v1, thetaRad, phiRad];
      this.dom.valU1.textContent = `${v1.toFixed(2)} m`;
      this.dom.valU2.textContent = `${v2.toFixed(0)}°`;
      this.dom.valU3.textContent = `${v3.toFixed(0)}°`;
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
    container.textContent = latex;
  }

  /**
   * Updates HUD with tool data and real-time probe readouts
   */
  updateHUD(formulaData) {
    if (!formulaData) return;

    if (formulaData.topicTag) this.dom.hudTopicTag.textContent = formulaData.topicTag;
    if (formulaData.topicTitle) this.dom.hudTitle.textContent = formulaData.topicTitle;

    const probeSub = document.getElementById('hud-probe-subtitle');
    if (probeSub) {
      probeSub.textContent = formulaData.probeSubtitle || 'Probe Point P Real-Time Evaluation';
    }

    if (formulaData.formulaLatex) {
      this.renderKaTeX(formulaData.formulaLatex, this.dom.katexFormula, true);
    }

    if (formulaData.detailLatex) {
      this.dom.topicDetailSection.style.display = 'block';
      if (formulaData.detailTitle) this.dom.topicDetailTitle.textContent = formulaData.detailTitle;
      this.renderKaTeX(formulaData.detailLatex, this.dom.katexDetail, true);
    } else {
      this.dom.topicDetailSection.style.display = 'none';
    }

    this.renderProbeReadouts(formulaData.readout);
  }

  renderProbeReadouts(readoutData) {
    const container = this.dom.probeReadout;
    container.innerHTML = '';

    (readoutData || []).forEach((item) => {
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

  /* ==========================================================================
     SCIENTIFIC CALCULATOR & CONVERTER RENDERER
     ========================================================================== */

  renderCalculator() {
    const topic = this.state.topic;
    const container = this.dom.calcViewContainer;
    const tabsBar = this.dom.calcTabsBar;

    if (topic === 'coords') {
      tabsBar.style.display = 'none';
      this.dom.calcTopicBadge.textContent = 'CONVERTER';
      this.calcState.coordsTab = 'converter';
      this.renderCoordsConverter(container);

    } else if (topic === 'gradient') {
      tabsBar.style.display = 'none';
      this.dom.calcTopicBadge.textContent = 'GRADIENT';
      this.renderGradientCalculator(container);

    } else if (topic === 'divergence') {
      tabsBar.style.display = 'none';
      this.dom.calcTopicBadge.textContent = 'DIVERGENCE';
      this.renderDivergenceCalculator(container);

    } else if (topic === 'curl') {
      tabsBar.style.display = 'none';
      this.dom.calcTopicBadge.textContent = 'CURL';
      this.renderCurlCalculator(container);
    }
  }

  // 1. Coordinate System Converter
  renderCoordsConverter(container) {
    const u = this.calcState.convU;
    const res = convertCoordinatesAll(this.calcState.convFrom, u, this.calcState.convAngleMode);

    let sym1 = 'x', sym2 = 'y', sym3 = 'z';
    let unit1 = '(m)', unit2 = '(m)', unit3 = '(m)';
    let step1 = '0.1', step2 = '0.1', step3 = '0.1';

    if (this.calcState.convFrom === 'cartesian') {
      sym1 = 'x'; unit1 = '(m)';
      sym2 = 'y'; unit2 = '(m)';
      sym3 = 'z'; unit3 = '(m)';
    } else if (this.calcState.convFrom === 'cylindrical') {
      sym1 = 'ρ'; unit1 = '(m)';
      sym2 = 'φ'; unit2 = '(deg)';
      sym3 = 'z'; unit3 = '(m)';
      step2 = '1';
    } else if (this.calcState.convFrom === 'spherical') {
      sym1 = 'r'; unit1 = '(m)';
      sym2 = 'θ'; unit2 = '(deg)';
      sym3 = 'φ'; unit3 = '(deg)';
      step2 = '1';
      step3 = '1';
    }

    container.innerHTML = `
      <div class="calc-result-box" style="margin-bottom: 6px;">
        <div class="calc-result-title">Source Coordinate System</div>
        <div class="segmented-control" id="calc-conv-src-sys">
          <button type="button" class="segment-btn ${this.calcState.convFrom === 'cartesian' ? 'active' : ''}" data-sys="cartesian">Cartesian (x,y,z)</button>
          <button type="button" class="segment-btn ${this.calcState.convFrom === 'cylindrical' ? 'active' : ''}" data-sys="cylindrical">Cylindrical (ρ,φ,z)</button>
          <button type="button" class="segment-btn ${this.calcState.convFrom === 'spherical' ? 'active' : ''}" data-sys="spherical">Spherical (r,θ,φ)</button>
        </div>
      </div>

      <div class="calc-input-row">
        <div class="calc-input-box">
          <span class="calc-input-label"><span class="calc-sym">${sym1}</span> <span class="calc-unit">${unit1}</span></span>
          <input type="number" step="${step1}" class="calc-input-field" id="calc-conv-u1" value="${u[0]}">
        </div>
        <div class="calc-input-box">
          <span class="calc-input-label"><span class="calc-sym">${sym2}</span> <span class="calc-unit">${unit2}</span></span>
          <input type="number" step="${step2}" class="calc-input-field" id="calc-conv-u2" value="${u[1]}">
        </div>
        <div class="calc-input-box">
          <span class="calc-input-label"><span class="calc-sym">${sym3}</span> <span class="calc-unit">${unit3}</span></span>
          <input type="number" step="${step3}" class="calc-input-field" id="calc-conv-u3" value="${u[2]}">
        </div>
      </div>

      <div class="calc-result-box">
        <div class="calc-result-title">Converted Coordinate Representations</div>
        <div class="calc-result-item">
          <span class="lbl">Cartesian (x, y, z):</span>
          <span class="val" id="calc-conv-res-cart">(${res.cartesian.x.toFixed(2)}, ${res.cartesian.y.toFixed(2)}, ${res.cartesian.z.toFixed(2)}) m</span>
        </div>
        <div class="calc-result-item">
          <span class="lbl">Cylindrical (ρ, φ, z):</span>
          <span class="val" id="calc-conv-res-cyl">(${res.cylindrical.rho.toFixed(2)} m, ${res.cylindrical.phiDeg.toFixed(1)}°, ${res.cylindrical.z.toFixed(2)} m)</span>
        </div>
        <div class="calc-result-item">
          <span class="lbl">Spherical (r, θ, φ):</span>
          <span class="val" id="calc-conv-res-sph">(${res.spherical.r.toFixed(2)} m, ${res.spherical.thetaDeg.toFixed(1)}°, ${res.spherical.phiDeg.toFixed(1)}°)</span>
        </div>
      </div>
    `;

    const resCart = container.querySelector('#calc-conv-res-cart');
    const resCyl = container.querySelector('#calc-conv-res-cyl');
    const resSph = container.querySelector('#calc-conv-res-sph');

    const updateResults = () => {
      const updatedRes = convertCoordinatesAll(this.calcState.convFrom, this.calcState.convU, this.calcState.convAngleMode);
      if (resCart) resCart.textContent = `(${updatedRes.cartesian.x.toFixed(2)}, ${updatedRes.cartesian.y.toFixed(2)}, ${updatedRes.cartesian.z.toFixed(2)}) m`;
      if (resCyl) resCyl.textContent = `(${updatedRes.cylindrical.rho.toFixed(2)} m, ${updatedRes.cylindrical.phiDeg.toFixed(1)}°, ${updatedRes.cylindrical.z.toFixed(2)} m)`;
      if (resSph) resSph.textContent = `(${updatedRes.spherical.r.toFixed(2)} m, ${updatedRes.spherical.thetaDeg.toFixed(1)}°, ${updatedRes.spherical.phiDeg.toFixed(1)}°)`;
    };

    container.querySelectorAll('#calc-conv-src-sys .segment-btn').forEach((b) => {
      b.addEventListener('click', () => {
        this.calcState.convFrom = b.dataset.sys;
        this.renderCalculator();
      });
    });

    ['u1', 'u2', 'u3'].forEach((id, idx) => {
      const el = container.querySelector(`#calc-conv-${id}`);
      el.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.calcState.convU[idx] = isNaN(val) ? 0 : val;
        updateResults();
      });
    });
  }

  // 2. Unit Vector Calculator
  renderUnitVectorCalc(container) {
    const pt = this.calcState.unitVecPoint;
    const { a1, a2, a3, names, mf } = calculateUnitVectorsAt(this.calcState.unitVecCoord, pt);

    container.innerHTML = `
      <div class="segmented-control" id="calc-uv-coord-sys" style="margin-bottom: 8px;">
        <button type="button" class="segment-btn ${this.calcState.unitVecCoord === 'cartesian' ? 'active' : ''}" data-sys="cartesian">Cartesian</button>
        <button type="button" class="segment-btn ${this.calcState.unitVecCoord === 'cylindrical' ? 'active' : ''}" data-sys="cylindrical">Cylindrical</button>
        <button type="button" class="segment-btn ${this.calcState.unitVecCoord === 'spherical' ? 'active' : ''}" data-sys="spherical">Spherical</button>
      </div>

      <div class="calc-result-box">
        <div class="calc-result-title">Local Unit Vectors in Cartesian [x, y, z] Basis</div>
        <div class="calc-result-item">
          <span class="lbl">Unit Vector â₁:</span>
          <span class="val">(${a1.x.toFixed(3)}, ${a1.y.toFixed(3)}, ${a1.z.toFixed(3)})</span>
        </div>
        <div class="calc-result-item">
          <span class="lbl">Unit Vector â₂:</span>
          <span class="val">(${a2.x.toFixed(3)}, ${a2.y.toFixed(3)}, ${a2.z.toFixed(3)})</span>
        </div>
        <div class="calc-result-item">
          <span class="lbl">Unit Vector â₃:</span>
          <span class="val">(${a3.x.toFixed(3)}, ${a3.y.toFixed(3)}, ${a3.z.toFixed(3)})</span>
        </div>
        <div class="calc-result-item">
          <span class="lbl">Metric Scale Factors (h₁, h₂, h₃):</span>
          <span class="val">(${mf.h1.toFixed(2)}, ${mf.h2.toFixed(2)}, ${mf.h3.toFixed(2)})</span>
        </div>
      </div>
    `;

    container.querySelectorAll('#calc-uv-coord-sys .segment-btn').forEach((b) => {
      b.addEventListener('click', () => {
        this.calcState.unitVecCoord = b.dataset.sys;
        this.renderCalculator();
      });
    });
  }

  // 3. Magnitude Calculator
  renderMagnitudeCalc(container) {
    const A = this.calcState.magVector;
    const mag = Math.sqrt(A[0] * A[0] + A[1] * A[1] + A[2] * A[2]);

    container.innerHTML = `
      <div class="calc-input-row">
        <div class="calc-input-box">
          <span class="calc-input-label">A_x</span>
          <input type="number" step="0.1" class="calc-input-field" id="calc-mag-ax" value="${A[0]}">
        </div>
        <div class="calc-input-box">
          <span class="calc-input-label">A_y</span>
          <input type="number" step="0.1" class="calc-input-field" id="calc-mag-ay" value="${A[1]}">
        </div>
        <div class="calc-input-box">
          <span class="calc-input-label">A_z</span>
          <input type="number" step="0.1" class="calc-input-field" id="calc-mag-az" value="${A[2]}">
        </div>
      </div>

      <div class="calc-result-box" style="margin-top: 8px;">
        <div class="calc-result-title">Vector Magnitude Calculation</div>
        <div class="calc-result-item">
          <span class="lbl">Formula:</span>
          <span class="val">|A| = √(A_x² + A_y² + A_z²)</span>
        </div>
        <div class="calc-result-item">
          <span class="lbl">Magnitude |A|:</span>
          <span class="val" id="calc-mag-val">${mag.toFixed(4)}</span>
        </div>
      </div>
    `;

    const valEl = container.querySelector('#calc-mag-val');
    ['ax', 'ay', 'az'].forEach((id, idx) => {
      const el = container.querySelector(`#calc-mag-${id}`);
      el.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.calcState.magVector[idx] = isNaN(val) ? 0 : val;
        const currentMag = Math.sqrt(this.calcState.magVector[0] ** 2 + this.calcState.magVector[1] ** 2 + this.calcState.magVector[2] ** 2);
        if (valEl) valEl.textContent = currentMag.toFixed(4);
      });
    });
  }

  // 4. Direction Calculator
  renderDirectionCalc(container) {
    const A = this.calcState.dirVector;
    const res = calculateVectorMagnitudeAndDirection(A);

    container.innerHTML = `
      <div class="calc-input-row">
        <div class="calc-input-box">
          <span class="calc-input-label">A_x</span>
          <input type="number" step="0.1" class="calc-input-field" id="calc-dir-ax" value="${A[0]}">
        </div>
        <div class="calc-input-box">
          <span class="calc-input-label">A_y</span>
          <input type="number" step="0.1" class="calc-input-field" id="calc-dir-ay" value="${A[1]}">
        </div>
        <div class="calc-input-box">
          <span class="calc-input-label">A_z</span>
          <input type="number" step="0.1" class="calc-input-field" id="calc-dir-az" value="${A[2]}">
        </div>
      </div>

      <div class="calc-result-box" style="margin-top: 8px;">
        <div class="calc-result-title">Direction Angles & Unit Direction Vector</div>
        <div class="calc-result-item">
          <span class="lbl">Unit Vector û_A:</span>
          <span class="val" id="calc-dir-unit">(${res.unitVector.x.toFixed(3)}, ${res.unitVector.y.toFixed(3)}, ${res.unitVector.z.toFixed(3)})</span>
        </div>
        <div class="calc-result-item">
          <span class="lbl">Direction Cosines:</span>
          <span class="val" id="calc-dir-cos">(${res.directionCosines.cosAlpha.toFixed(3)}, ${res.directionCosines.cosBeta.toFixed(3)}, ${res.directionCosines.cosGamma.toFixed(3)})</span>
        </div>
        <div class="calc-result-item">
          <span class="lbl">Direction Angles (α, β, γ):</span>
          <span class="val" id="calc-dir-angles">(${res.directionAngles.alphaDeg.toFixed(1)}°, ${res.directionAngles.betaDeg.toFixed(1)}°, ${res.directionAngles.gammaDeg.toFixed(1)}°)</span>
        </div>
        <div class="calc-result-item">
          <span class="lbl">Spherical Angles (θ, φ):</span>
          <span class="val" id="calc-dir-sph">θ = ${res.sphericalAngles.thetaDeg.toFixed(1)}°, φ = ${res.sphericalAngles.phiDeg.toFixed(1)}°</span>
        </div>
      </div>
    `;

    const unitEl = container.querySelector('#calc-dir-unit');
    const cosEl = container.querySelector('#calc-dir-cos');
    const anglesEl = container.querySelector('#calc-dir-angles');
    const sphEl = container.querySelector('#calc-dir-sph');

    const updateDirResults = () => {
      const updated = calculateVectorMagnitudeAndDirection(this.calcState.dirVector);
      if (unitEl) unitEl.textContent = `(${updated.unitVector.x.toFixed(3)}, ${updated.unitVector.y.toFixed(3)}, ${updated.unitVector.z.toFixed(3)})`;
      if (cosEl) cosEl.textContent = `(${updated.directionCosines.cosAlpha.toFixed(3)}, ${updated.directionCosines.cosBeta.toFixed(3)}, ${updated.directionCosines.cosGamma.toFixed(3)})`;
      if (anglesEl) anglesEl.textContent = `(${updated.directionAngles.alphaDeg.toFixed(1)}°, ${updated.directionAngles.betaDeg.toFixed(1)}°, ${updated.directionAngles.gammaDeg.toFixed(1)}°)`;
      if (sphEl) sphEl.textContent = `θ = ${updated.sphericalAngles.thetaDeg.toFixed(1)}°, φ = ${updated.sphericalAngles.phiDeg.toFixed(1)}°`;
    };

    ['ax', 'ay', 'az'].forEach((id, idx) => {
      const el = container.querySelector(`#calc-dir-${id}`);
      el.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.calcState.dirVector[idx] = isNaN(val) ? 0 : val;
        updateDirResults();
      });
    });
  }

  // 5. Gradient Calculator
  renderGradientCalculator(container) {
    const pt = this.calcState.gradPoint;
    const expr = this.calcState.gradCustomExpr;

    // Helper: Converts natural keyboard formula to LaTeX representation
    const formatFormulaToLatex = (raw) => {
      if (!raw || !raw.trim()) return 'V(x, y, z) = 0';
      let s = raw.trim();
      s = s.replace(/\bexp\b/g, '\\exp');
      s = s.replace(/\bsin\b/g, '\\sin');
      s = s.replace(/\bcos\b/g, '\\cos');
      s = s.replace(/\btan\b/g, '\\tan');
      s = s.replace(/\bsqrt\b/g, '\\sqrt');
      s = s.replace(/\b(log|ln)\b/g, '\\ln');
      s = s.replace(/\^([a-zA-Z0-9]+)/g, '^{$1}');
      s = s.replace(/\^\(([^)]+)\)/g, '^{$1}');
      s = s.replace(/\*/g, ' \\cdot ');
      return `V(x, y, z) = ${s}`;
    };

    // Helper: Evaluates scalar function safely from user expression
    const evaluateCustomScalar = (raw, x, y, z) => {
      let s = (raw || '0').trim();
      s = s.replace(/\^/g, '**');
      s = s.replace(/(\d)\s*([a-zA-Z(])/g, '$1*$2');
      s = s.replace(/([a-zA-Z0-9_])\s*(\()/g, (m, p1) => {
        if (/^(sin|cos|tan|exp|log|ln|sqrt|abs)$/.test(p1)) return `${p1}(`;
        return `${p1}*(`;
      });

      try {
        const fn = new Function('x', 'y', 'z', `
          const { sin, cos, tan, exp, log, sqrt, abs, PI } = Math;
          const ln = log;
          try {
            const val = (${s});
            return (typeof val === 'number' && !isNaN(val)) ? val : 0;
          } catch(e) {
            return 0;
          }
        `);
        return fn(x, y, z);
      } catch (err) {
        return 0;
      }
    };

    // Helper: Computes numerical gradient vector and magnitude
    const evaluateCustomGradientAt = (raw, x, y, z, eps = 1e-4) => {
      const v0 = evaluateCustomScalar(raw, x, y, z);
      const gx = (evaluateCustomScalar(raw, x + eps, y, z) - evaluateCustomScalar(raw, x - eps, y, z)) / (2 * eps);
      const gy = (evaluateCustomScalar(raw, x, y + eps, z) - evaluateCustomScalar(raw, x, y - eps, z)) / (2 * eps);
      const gz = (evaluateCustomScalar(raw, x, y, z + eps) - evaluateCustomScalar(raw, x, y, z - eps)) / (2 * eps);
      const mag = Math.sqrt(gx * gx + gy * gy + gz * gz);
      return { v0, gx, gy, gz, mag };
    };

    const res = evaluateCustomGradientAt(expr, pt[0], pt[1], pt[2]);

    container.innerHTML = `
      <div class="calc-result-box" style="margin-bottom: 6px;">
        <div class="calc-result-title">Scalar Function V(x, y, z)</div>
        <input type="text" class="calc-input-field" id="calc-grad-expr" value="${expr}" placeholder="e.g. 3.5 * exp(-(x^2 + y^2)/3) or x^2 + y^2 + z" style="font-size: 12px; font-weight: 600; color: #38bdf8; margin-bottom: 4px;">
        <div id="calc-grad-latex-display" class="math-display" style="padding: 6px 10px; font-size: 13px; text-align: center; min-height: 32px; background: rgba(10, 14, 22, 0.75);"></div>
      </div>

      <div class="calc-input-row">
        <div class="calc-input-box">
          <span class="calc-input-label"><span class="calc-sym">x</span> <span class="calc-unit">(m)</span></span>
          <input type="number" step="0.1" class="calc-input-field" id="calc-grad-x" value="${pt[0]}">
        </div>
        <div class="calc-input-box">
          <span class="calc-input-label"><span class="calc-sym">y</span> <span class="calc-unit">(m)</span></span>
          <input type="number" step="0.1" class="calc-input-field" id="calc-grad-y" value="${pt[1]}">
        </div>
        <div class="calc-input-box">
          <span class="calc-input-label"><span class="calc-sym">z</span> <span class="calc-unit">(m)</span></span>
          <input type="number" step="0.1" class="calc-input-field" id="calc-grad-z" value="${pt[2]}">
        </div>
      </div>

      <div class="calc-result-box" style="margin-top: 8px;">
        <div class="calc-result-title">Evaluated Scalar Value & Gradient</div>
        <div class="calc-result-item">
          <span class="lbl">Scalar Value V(P):</span>
          <span class="val" id="calc-grad-val" style="color: #38bdf8; font-size: 13px; font-weight: 700;">${res.v0.toFixed(4)} V</span>
        </div>
        <div class="calc-result-item">
          <span class="lbl">Gradient Vector ∇V:</span>
          <span class="val" id="calc-grad-vec">(${res.gx.toFixed(3)}, ${res.gy.toFixed(3)}, ${res.gz.toFixed(3)}) V/m</span>
        </div>
        <div class="calc-result-item">
          <span class="lbl">Gradient Magnitude |∇V|:</span>
          <span class="val" id="calc-grad-mag" style="color: #4ade80; font-weight: 600;">${res.mag.toFixed(4)} V/m</span>
        </div>
      </div>
    `;

    const latexEl = container.querySelector('#calc-grad-latex-display');
    const valEl = container.querySelector('#calc-grad-val');
    const vecEl = container.querySelector('#calc-grad-vec');
    const magEl = container.querySelector('#calc-grad-mag');

    const updateLatex = () => {
      const latex = formatFormulaToLatex(this.calcState.gradCustomExpr);
      this.renderKaTeX(latex, latexEl, true);
    };

    const updateGradResults = () => {
      const curPt = this.calcState.gradPoint;
      const curRes = evaluateCustomGradientAt(this.calcState.gradCustomExpr, curPt[0], curPt[1], curPt[2]);
      if (valEl) valEl.textContent = `${curRes.v0.toFixed(4)} V`;
      if (vecEl) vecEl.textContent = `(${curRes.gx.toFixed(3)}, ${curRes.gy.toFixed(3)}, ${curRes.gz.toFixed(3)}) V/m`;
      if (magEl) magEl.textContent = `${curRes.mag.toFixed(4)} V/m`;
    };

    // Initial render of live KaTeX preview
    updateLatex();

    const exprInput = container.querySelector('#calc-grad-expr');
    exprInput.addEventListener('input', (e) => {
      this.calcState.gradCustomExpr = e.target.value;
      updateLatex();
      updateGradResults();
    });

    ['x', 'y', 'z'].forEach((id, idx) => {
      const el = container.querySelector(`#calc-grad-${id}`);
      el.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.calcState.gradPoint[idx] = isNaN(val) ? 0 : val;
        updateGradResults();
      });
    });
  }

  // 6. Divergence Calculator
  renderDivergenceCalculator(container) {
    const pt = this.calcState.divEvalPoint;
    const res = calculateDivergenceAt(this.state.divPoints, pt[0], pt[1]);

    container.innerHTML = `
      <div class="calc-input-row two-col" style="margin-bottom: 8px;">
        <div class="calc-input-box">
          <span class="calc-input-label">Test Point X</span>
          <input type="number" step="0.1" class="calc-input-field" id="calc-div-x" value="${pt[0]}">
        </div>
        <div class="calc-input-box">
          <span class="calc-input-label">Test Point Y</span>
          <input type="number" step="0.1" class="calc-input-field" id="calc-div-y" value="${pt[1]}">
        </div>
      </div>

      <div class="calc-result-box">
        <div class="calc-result-title">Divergence of Active 4-Point Field (Image 1)</div>
        <div class="calc-result-item">
          <span class="lbl">Field Vector A(x, y):</span>
          <span class="val" id="calc-div-field">(${res.field.Fx.toFixed(3)}, ${res.field.Fy.toFixed(3)})</span>
        </div>
        <div class="calc-result-item">
          <span class="lbl">Field Magnitude |A|:</span>
          <span class="val" id="calc-div-mag">${res.fieldMagnitude.toFixed(3)}</span>
        </div>
        <div class="calc-result-item">
          <span class="lbl">Divergence ∇·A:</span>
          <span class="val" id="calc-div-val" style="color: ${res.divergence >= 0 ? '#4ade80' : '#60a5fa'}; font-size: 12px;">${res.divergence >= 0 ? '+' : ''}${res.divergence.toFixed(3)} s⁻¹</span>
        </div>
        <div class="calc-result-item">
          <span class="lbl">Classification:</span>
          <span class="val" id="calc-div-class" style="color: #facc15;">${res.classification}</span>
        </div>
      </div>
    `;

    const fieldEl = container.querySelector('#calc-div-field');
    const magEl = container.querySelector('#calc-div-mag');
    const divEl = container.querySelector('#calc-div-val');
    const classEl = container.querySelector('#calc-div-class');

    const updateDivResults = () => {
      const updated = calculateDivergenceAt(this.state.divPoints, this.calcState.divEvalPoint[0], this.calcState.divEvalPoint[1]);
      if (fieldEl) fieldEl.textContent = `(${updated.field.Fx.toFixed(3)}, ${updated.field.Fy.toFixed(3)})`;
      if (magEl) magEl.textContent = updated.fieldMagnitude.toFixed(3);
      if (divEl) {
        divEl.style.color = updated.divergence >= 0 ? '#4ade80' : '#60a5fa';
        divEl.textContent = `${updated.divergence >= 0 ? '+' : ''}${updated.divergence.toFixed(3)} s⁻¹`;
      }
      if (classEl) classEl.textContent = updated.classification;
    };

    ['x', 'y'].forEach((id, idx) => {
      const el = container.querySelector(`#calc-div-${id}`);
      el.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.calcState.divEvalPoint[idx] = isNaN(val) ? 0 : val;
        updateDivResults();
      });
    });
  }

  // 7. Curl Calculator
  renderCurlCalculator(container) {
    const pt = this.calcState.curlEvalPoint;
    const res = calculateCurlAt(this.state.curlVortices, pt[0], pt[1]);

    container.innerHTML = `
      <div class="calc-input-row two-col" style="margin-bottom: 8px;">
        <div class="calc-input-box">
          <span class="calc-input-label">Test Point X</span>
          <input type="number" step="0.1" class="calc-input-field" id="calc-curl-x" value="${pt[0]}">
        </div>
        <div class="calc-input-box">
          <span class="calc-input-label">Test Point Y</span>
          <input type="number" step="0.1" class="calc-input-field" id="calc-curl-y" value="${pt[1]}">
        </div>
      </div>

      <div class="calc-result-box">
        <div class="calc-result-title">Curl of Active 4-Vortex Field (Image 2)</div>
        <div class="calc-result-item">
          <span class="lbl">Velocity A(x, y):</span>
          <span class="val" id="calc-curl-field">(${res.field.Fx.toFixed(3)}, ${res.field.Fy.toFixed(3)})</span>
        </div>
        <div class="calc-result-item">
          <span class="lbl">Velocity Magnitude |A|:</span>
          <span class="val" id="calc-curl-mag">${res.fieldMagnitude.toFixed(3)}</span>
        </div>
        <div class="calc-result-item">
          <span class="lbl">Curl (∇×A)_z:</span>
          <span class="val" id="calc-curl-val" style="color: ${res.curlZ >= 0 ? '#facc15' : '#60a5fa'}; font-size: 12px;">${res.curlZ >= 0 ? '+' : ''}${res.curlZ.toFixed(3)} rad/s</span>
        </div>
        <div class="calc-result-item">
          <span class="lbl">Angular Velocity ω_z:</span>
          <span class="val" id="calc-curl-omega">${(res.angularVelocityZ).toFixed(3)} rad/s</span>
        </div>
        <div class="calc-result-item">
          <span class="lbl">Classification:</span>
          <span class="val" id="calc-curl-class" style="color: #f43f5e;">${res.classification}</span>
        </div>
      </div>
    `;

    const fieldEl = container.querySelector('#calc-curl-field');
    const magEl = container.querySelector('#calc-curl-mag');
    const curlEl = container.querySelector('#calc-curl-val');
    const omegaEl = container.querySelector('#calc-curl-omega');
    const classEl = container.querySelector('#calc-curl-class');

    const updateCurlResults = () => {
      const updated = calculateCurlAt(this.state.curlVortices, this.calcState.curlEvalPoint[0], this.calcState.curlEvalPoint[1]);
      if (fieldEl) fieldEl.textContent = `(${updated.field.Fx.toFixed(3)}, ${updated.field.Fy.toFixed(3)})`;
      if (magEl) magEl.textContent = updated.fieldMagnitude.toFixed(3);
      if (curlEl) {
        curlEl.style.color = updated.curlZ >= 0 ? '#facc15' : '#60a5fa';
        curlEl.textContent = `${updated.curlZ >= 0 ? '+' : ''}${updated.curlZ.toFixed(3)} rad/s`;
      }
      if (omegaEl) omegaEl.textContent = `${updated.angularVelocityZ.toFixed(3)} rad/s`;
      if (classEl) classEl.textContent = updated.classification;
    };

    ['x', 'y'].forEach((id, idx) => {
      const el = container.querySelector(`#calc-curl-${id}`);
      el.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.calcState.curlEvalPoint[idx] = isNaN(val) ? 0 : val;
        updateCurlResults();
      });
    });
  }
}
