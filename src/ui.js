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
  calculateCurlAt,
  formatScientific
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
      hudHeader: document.querySelector('.hud-header'),
      hudTopicTag: document.getElementById('hud-topic-tag'),
      hudTitle: document.getElementById('hud-title'),
      katexFormula: document.getElementById('katex-formula'),
      probeReadout: document.getElementById('probe-readout'),
      topicDetailSection: document.getElementById('topic-detail-section'),
      topicDetailTitle: document.getElementById('topic-detail-title'),
      katexDetail: document.getElementById('katex-detail'),
      canvasNavHint: document.getElementById('canvas-nav-hint'),

      // Mobile Drawer Controls
      sidebar: document.getElementById('sidebar'),
      sidebarBackdrop: document.getElementById('sidebar-backdrop'),
      sidebarCloseBtn: document.getElementById('sidebar-close-btn'),
      mobileSidebarToggle: document.getElementById('mobile-sidebar-toggle'),
      mobileViewCanvasBtn: document.getElementById('mobile-view-canvas-btn')
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

      gradCoord: 'cartesian',
      gradExpressions: {
        cartesian: '3.5 * exp(-(x^2 + y^2) / 3)',
        cylindrical: '3.5 * exp(-rho^2 / 3)',
        spherical: '3.5 * exp(-r^2 / 3)'
      },
      gradPoints: {
        cartesian: [1.0, 1.0, 0.0],
        cylindrical: [1.414, 45.0, 0.0],
        spherical: [1.414, 90.0, 45.0]
      },

      divCoord: 'cartesian',
      divComponents: {
        cartesian: ['x^2', '2xy', '-z^2'],
        cylindrical: ['rho*sin(phi)', 'rho^2', 'z'],
        spherical: ['r^2', '0', '0']
      },
      divPoint: {
        cartesian: [1.0, 2.0, 3.0],
        cylindrical: [2.0, 90.0, 1.0],
        spherical: [3.0, 45.0, 60.0]
      },

      curlCoord: 'cartesian',
      curlComponents: {
        cartesian: ['-y', 'x', '0'],
        cylindrical: ['0', 'rho', '0'],
        spherical: ['0', '0', 'r*sin(theta)']
      },
      curlPoint: {
        cartesian: [1.0, 1.0, 0.0],
        cylindrical: [1.414, 45.0, 0.0],
        spherical: [1.414, 90.0, 45.0]
      }
    };

    // Check URL query parameters for topic pre-selection (e.g. app.html?topic=gradient)
    if (typeof window !== 'undefined' && window.location) {
      const urlParams = new URLSearchParams(window.location.search);
      const urlTopic = urlParams.get('topic');
      if (urlTopic && ['coords', 'gradient', 'divergence', 'curl'].includes(urlTopic)) {
        this.state.topic = urlTopic;
        if (this.dom.topicSelect) {
          this.dom.topicSelect.value = urlTopic;
        }
      }
    }

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
        if (type === 'zero') {
          curPt.q = 0.0;
          this.dom.sliderPtStrength.value = 0.0;
          this.dom.valPtStrength.textContent = '0.0';
        } else if (type === 'source') {
          const strength = (Math.abs(curPt.q) < 0.05) ? 2.0 : Math.abs(curPt.q);
          curPt.q = strength;
          this.dom.sliderPtStrength.value = strength;
          this.dom.valPtStrength.textContent = strength.toFixed(1);
        } else if (type === 'sink') {
          const strength = (Math.abs(curPt.q) < 0.05) ? 2.0 : Math.abs(curPt.q);
          curPt.q = -strength;
          this.dom.sliderPtStrength.value = strength;
          this.dom.valPtStrength.textContent = strength.toFixed(1);
        }
        this.notify();
        this.renderCalculator();
      });
    });

    // Curl CCW vs CW vs Zero segmented control
    this.dom.curlTypeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.dom.curlTypeBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const type = btn.dataset.curlType;
        const curV = this.state.curlVortices[this.state.activeCurlVortexIdx];
        if (type === 'zero') {
          curV.gamma = 0.0;
          this.dom.sliderPtStrength.value = 0.0;
          this.dom.valPtStrength.textContent = '0.0';
        } else {
          const strength = (Math.abs(curV.gamma) > 0.05) ? Math.abs(curV.gamma) : 2.0;
          curV.gamma = type === 'ccw' ? strength : -strength;
          this.dom.sliderPtStrength.value = strength;
          this.dom.valPtStrength.textContent = strength.toFixed(1);
        }
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
        if (val < 0.05) {
          pt.q = 0.0;
          this.dom.divTypeBtns.forEach((b) => {
            b.classList.toggle('active', b.dataset.divType === 'zero');
          });
        } else {
          let sign = Math.sign(pt.q);
          if (sign === 0) {
            const activeBtn = Array.from(this.dom.divTypeBtns).find(b => b.classList.contains('active'));
            sign = (activeBtn && activeBtn.dataset.divType === 'sink') ? -1 : 1;
          }
          pt.q = sign * val;
          this.dom.divTypeBtns.forEach((b) => {
            if (b.dataset.divType === 'zero') b.classList.remove('active');
            else if (b.dataset.divType === 'source') b.classList.toggle('active', pt.q > 0);
            else if (b.dataset.divType === 'sink') b.classList.toggle('active', pt.q < 0);
          });
        }
      } else if (this.state.topic === 'curl') {
        const v = this.state.curlVortices[this.state.activeCurlVortexIdx];
        if (val < 0.05) {
          v.gamma = 0.0;
          this.dom.curlTypeBtns.forEach((b) => {
            b.classList.toggle('active', b.dataset.curlType === 'zero');
          });
        } else {
          let sign = Math.sign(v.gamma);
          if (sign === 0) {
            const activeBtn = Array.from(this.dom.curlTypeBtns).find(b => b.classList.contains('active'));
            sign = (activeBtn && activeBtn.dataset.curlType === 'cw') ? -1 : 1;
          }
          v.gamma = sign * val;
          this.dom.curlTypeBtns.forEach((b) => {
            if (b.dataset.curlType === 'zero') b.classList.remove('active');
            else if (b.dataset.curlType === 'ccw') b.classList.toggle('active', v.gamma > 0);
            else if (b.dataset.curlType === 'cw') b.classList.toggle('active', v.gamma < 0);
          });
        }
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
    const toggleHUDCollapse = () => {
      this.dom.hudCard.classList.toggle('collapsed');
      this.dom.hudCollapseBtn.textContent = this.dom.hudCard.classList.contains('collapsed') ? '+' : '_';
    };
    this.dom.hudCollapseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleHUDCollapse();
    });
    if (this.dom.hudHeader) {
      this.dom.hudHeader.addEventListener('click', (e) => {
        if (e.target !== this.dom.hudCollapseBtn) {
          toggleHUDCollapse();
        }
      });
    }

    // Auto-collapse HUD on mobile screens (<= 768px) on load
    if (window.innerWidth <= 768) {
      this.dom.hudCard.classList.add('collapsed');
      this.dom.hudCollapseBtn.textContent = '+';
    }

    // Mobile Sidebar Drawer Handlers
    const openMobileSidebar = () => {
      if (this.dom.sidebar) this.dom.sidebar.classList.add('mobile-open');
      if (this.dom.sidebarBackdrop) this.dom.sidebarBackdrop.classList.add('active');
    };
    const closeMobileSidebar = () => {
      if (this.dom.sidebar) this.dom.sidebar.classList.remove('mobile-open');
      if (this.dom.sidebarBackdrop) this.dom.sidebarBackdrop.classList.remove('active');
    };

    if (this.dom.mobileSidebarToggle) {
      this.dom.mobileSidebarToggle.addEventListener('click', openMobileSidebar);
    }
    if (this.dom.sidebarCloseBtn) {
      this.dom.sidebarCloseBtn.addEventListener('click', closeMobileSidebar);
    }
    if (this.dom.sidebarBackdrop) {
      this.dom.sidebarBackdrop.addEventListener('click', closeMobileSidebar);
    }
    if (this.dom.mobileViewCanvasBtn) {
      this.dom.mobileViewCanvasBtn.addEventListener('click', closeMobileSidebar);
    }
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMobileSidebar();
    });

    // Update navigation hint on window resize / orientation change
    window.addEventListener('resize', () => this.updateNavHint());
  }

  notify() {
    if (this.onStateChange) {
      this.onStateChange(this.state);
    }
  }

  /**
   * Updates canvas navigation description hint based on active topic and device type
   */
  updateNavHint() {
    if (!this.dom.canvasNavHint) return;
    const topic = this.state.topic;
    const isMobile = window.innerWidth <= 768;
    if (topic === 'divergence' || topic === 'curl') {
      this.dom.canvasNavHint.innerHTML = isMobile
        ? '<span>Drag: Pan</span> · <span>Pinch: Zoom</span>'
        : '<span>Right Click + Drag: Pan</span> · <span>Scroll: Zoom</span>';
    } else {
      this.dom.canvasNavHint.innerHTML = isMobile
        ? '<span>Drag: Rotate</span> · <span>2-Finger Drag: Pan</span> · <span>Pinch: Zoom</span>'
        : '<span>Left Click + Drag: Rotate</span> · <span>Right Click + Drag: Pan</span> · <span>Scroll: Zoom</span>';
    }
  }

  /**
   * Toggles visibility of topic-specific sidebar control sections
   */
  updateTopicVisibility() {
    const topic = this.state.topic;

    // Update document title dynamically based on active concept
    const TOPIC_TITLES = {
      coords: 'emf.vis — Coordinate Systems',
      gradient: 'emf.vis — The Gradient',
      divergence: 'emf.vis — The Divergence',
      curl: 'emf.vis — The Curl'
    };
    document.title = TOPIC_TITLES[topic] || 'emf.vis';

    this.dom.coordsControlsSection.style.display = topic === 'coords' ? 'block' : 'none';
    this.dom.gradientControlsSection.style.display = topic === 'gradient' ? 'block' : 'none';
    this.dom.multiPointsControlsSection.style.display = (topic === 'divergence' || topic === 'curl') ? 'block' : 'none';

    if (topic === 'divergence') {
      this.dom.multiPointsTitle.textContent = 'Points';
      this.dom.pointTypeDivContainer.style.display = 'block';
      this.dom.pointTypeCurlContainer.style.display = 'none';
      this.dom.labelPtStrength.textContent = 'Source Strength |q|';
      this.syncMultiPointsSliders();
    } else if (topic === 'curl') {
      this.dom.multiPointsTitle.textContent = 'Points';
      this.dom.pointTypeDivContainer.style.display = 'none';
      this.dom.pointTypeCurlContainer.style.display = 'block';
      this.dom.labelPtStrength.textContent = 'Vorticity Strength |Γ|';
      this.syncMultiPointsSliders();
    } else if (topic === 'coords') {
      this.updateSliderConfiguration();
    }

    // Canvas navigation hint: divergence & curl allow Pan & Zoom, others allow Rotate, Pan & Zoom
    this.updateNavHint();
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

      const isZero = Math.abs(p.q) < 0.05;
      const isSource = !isZero && p.q > 0;
      const isSink = !isZero && p.q < 0;
      this.dom.divTypeBtns.forEach((b) => {
        if (b.dataset.divType === 'zero') b.classList.toggle('active', isZero);
        else if (b.dataset.divType === 'source') b.classList.toggle('active', isSource);
        else if (b.dataset.divType === 'sink') b.classList.toggle('active', isSink);
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

      const isZero = Math.abs(v.gamma) < 0.05;
      const isCCW = !isZero && v.gamma > 0;
      const isCW = !isZero && v.gamma < 0;
      this.dom.curlTypeBtns.forEach((b) => {
        if (b.dataset.curlType === 'zero') b.classList.toggle('active', isZero);
        else if (b.dataset.curlType === 'ccw') b.classList.toggle('active', isCCW);
        else if (b.dataset.curlType === 'cw') b.classList.toggle('active', isCW);
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
        s2.min = '0'; s2.max = '360'; s2.step = '1';
        s3.min = '-4'; s3.max = '4'; s3.step = '0.05';

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
        s2.min = '5'; s2.max = '175'; s2.step = '1';
        s3.min = '0'; s3.max = '360'; s3.step = '1';

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
          <button type="button" class="segment-btn ${this.calcState.convFrom === 'cartesian' ? 'active' : ''}" data-sys="cartesian">Cartesian <br>(x, y, z)</button>
          <button type="button" class="segment-btn ${this.calcState.convFrom === 'cylindrical' ? 'active' : ''}" data-sys="cylindrical">Cylindrical <br>(ρ, φ, z)</button>
          <button type="button" class="segment-btn ${this.calcState.convFrom === 'spherical' ? 'active' : ''}" data-sys="spherical">Spherical <br>(r, θ, φ)</button>
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
          <span class="val" id="calc-conv-res-cart">(${res.cartesian.x.toFixed(2)} m, ${res.cartesian.y.toFixed(2)} m, ${res.cartesian.z.toFixed(2)} m)</span>
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

  // 5. Gradient Calculator (Custom Scalar Function in Cartesian, Cylindrical, Spherical)
  renderGradientCalculator(container) {
    const coord = this.calcState.gradCoord;
    const expr = this.calcState.gradExpressions[coord];
    const pt = this.calcState.gradPoints[coord];

    // Helper: Scans balanced parentheses starting at openIdx
    const extractBalanced = (str, openIdx) => {
      let depth = 1;
      let i = openIdx + 1;
      while (i < str.length && depth > 0) {
        if (str[i] === '(') depth++;
        else if (str[i] === ')') depth--;
        i++;
      }
      if (depth === 0) {
        return { inside: str.slice(openIdx + 1, i - 1), endIdx: i };
      }
      return null;
    };

    // Helper: Replaces functions with balanced parens
    const replaceBalancedFn = (str, prefix, callback) => {
      let out = '';
      let lastIdx = 0;
      const regex = new RegExp(prefix + '\\s*\\(', 'gi');
      let match;
      while ((match = regex.exec(str)) !== null) {
        out += str.slice(lastIdx, match.index);
        const openIdx = match.index + match[0].length - 1;
        const res = extractBalanced(str, openIdx);
        if (res) {
          out += callback(res.inside);
          lastIdx = res.endIdx;
          regex.lastIndex = res.endIdx;
        } else {
          out += str.slice(match.index);
          lastIdx = str.length;
          break;
        }
      }
      out += str.slice(lastIdx);
      return out;
    };

    // Helper: Converts natural keyboard formula to LaTeX representation
    const formatFormulaToLatex = (coordSys, raw) => {
      let prefix = 'V(x, y, z)';
      if (coordSys === 'cylindrical') prefix = 'V(\\rho, \\phi, z)';
      else if (coordSys === 'spherical') prefix = 'V(r, \\theta, \\phi)';
      if (!raw || !raw.trim()) return `${prefix} = 0`;
      let s = raw.trim();

      const formatInner = (str) => {
        let sub = str.trim();
        sub = replaceBalancedFn(sub, '\\bexp', (inner) => `e^{${formatInner(inner)}}`);
        sub = replaceBalancedFn(sub, '\\be\\s*\\^', (inner) => `e^{${formatInner(inner)}}`);
        sub = replaceBalancedFn(sub, '\\bsqrt', (inner) => `\\sqrt{${formatInner(inner)}}`);
        sub = replaceBalancedFn(sub, '\\babs', (inner) => `\\left|${formatInner(inner)}\\right|`);
        sub = replaceBalancedFn(sub, '\\bsin', (inner) => `\\sin\\left(${formatInner(inner)}\\right)`);
        sub = replaceBalancedFn(sub, '\\bcos', (inner) => `\\cos\\left(${formatInner(inner)}\\right)`);
        sub = replaceBalancedFn(sub, '\\btan', (inner) => `\\tan\\left(${formatInner(inner)}\\right)`);
        sub = replaceBalancedFn(sub, '\\bln', (inner) => `\\ln\\left(${formatInner(inner)}\\right)`);
        sub = replaceBalancedFn(sub, '\\blog', (inner) => `\\log\\left(${formatInner(inner)}\\right)`);
        sub = sub.replace(/ρ/g, '\\rho');
        sub = sub.replace(/φ/g, '\\phi');
        sub = sub.replace(/θ/g, '\\theta');
        sub = sub.replace(/(?<!\\)\brho\b/gi, '\\rho');
        sub = sub.replace(/(?<!\\)\bphi\b/gi, '\\phi');
        sub = sub.replace(/(?<!\\)\btheta\b/gi, '\\theta');
        sub = sub.replace(/\^([a-zA-Z0-9]+)/g, '^{$1}');
        sub = sub.replace(/\*/g, ' \\cdot ');
        return sub;
      };

      // 1. Balanced function replacements
      s = replaceBalancedFn(s, '\\bexp', (inner) => `e^{${formatInner(inner)}}`);
      s = replaceBalancedFn(s, '\\be\\s*\\^', (inner) => `e^{${formatInner(inner)}}`);
      s = replaceBalancedFn(s, '\\bsqrt', (inner) => `\\sqrt{${formatInner(inner)}}`);
      s = replaceBalancedFn(s, '\\babs', (inner) => `\\left|${formatInner(inner)}\\right|`);
      s = replaceBalancedFn(s, '\\bsin', (inner) => `\\sin\\left(${formatInner(inner)}\\right)`);
      s = replaceBalancedFn(s, '\\bcos', (inner) => `\\cos\\left(${formatInner(inner)}\\right)`);
      s = replaceBalancedFn(s, '\\btan', (inner) => `\\tan\\left(${formatInner(inner)}\\right)`);
      s = replaceBalancedFn(s, '\\bln', (inner) => `\\ln\\left(${formatInner(inner)}\\right)`);
      s = replaceBalancedFn(s, '\\blog', (inner) => `\\log\\left(${formatInner(inner)}\\right)`);
      s = s.replace(/ρ/g, '\\rho');
      s = s.replace(/φ/g, '\\phi');
      s = s.replace(/θ/g, '\\theta');
      s = s.replace(/(?<!\\)\brho\b/gi, '\\rho');
      s = s.replace(/(?<!\\)\bphi\b/gi, '\\phi');
      s = s.replace(/(?<!\\)\btheta\b/gi, '\\theta');

      // 2. Format powers and products
      s = s.replace(/\^([a-zA-Z0-9]+)/g, '^{$1}');
      s = s.replace(/\*/g, ' \\cdot ');

      return `${prefix} = ${s}`;
    };

    // Helper: Evaluates scalar function safely from user expression in active coordinate system
    const evaluateCustomScalar = (raw, u1, u2, u3, coordSys) => {
      if (!raw || !raw.trim()) return 0;
      let s = raw.trim();

      // Convert Greek letters to ascii variable names
      s = s.replace(/ρ/g, 'rho');
      s = s.replace(/φ/g, 'phi');
      s = s.replace(/θ/g, 'theta');

      // 1. Convert e^(...) -> exp(...) with balanced parentheses
      s = replaceBalancedFn(s, '\\be\\s*\\^', (inside) => `exp(${inside})`);
      s = s.replace(/\be\s*\^\s*([a-zA-Z0-9_]+)/gi, 'exp($1)');

      // 2. Unary minus before exponentiation: -z^2 -> (0 - 1) * z^2
      s = s.replace(/(^|[+\-*/(,])\s*-\s*([a-zA-Z_]\w*|\d+(?:\.\d+)?)\s*\^/g, '$1 (0 - 1) * $2^');

      // 3. Replace remaining powers ^ with **
      s = s.replace(/\^/g, '**');

      // 4. Numbers before variables, functions, or opening parens
      s = s.replace(/(\d)\s*([a-zA-Z_]\w*|\()/g, '$1*$2');

      // 5. Power results followed by variable, paren, or function
      s = s.replace(/(\*\*)\s*(\d+)\s*([a-zA-Z_(])/g, '$1$2*$3');

      // 6. Closing paren followed by variable, number, opening paren, or function
      s = s.replace(/\)\s*(\(|\d|[a-zA-Z_])/g, ')*$1');

      // 7. Split adjacent coordinate variables (e.g. xy -> x*y, zx -> z*x)
      s = s.replace(/\b([xyzXYZ]{2,})\b/g, (match) => {
        return match.split('').join('*');
      });

      // 8. Variables or identifiers before opening paren (preserving standard math functions)
      s = s.replace(/\b([a-zA-Z_]\w*)\s*\(/g, (match, name) => {
        const fnNames = ['sin', 'cos', 'tan', 'exp', 'log', 'ln', 'sqrt', 'abs', 'sinh', 'cosh', 'tanh', 'asin', 'acos', 'atan'];
        if (fnNames.includes(name.toLowerCase())) {
          return `${name.toLowerCase()}(`;
        }
        return `${name}*(`;
      });

      // 9. Adjacent separated variables: x y -> x*y
      s = s.replace(/\b([xyzXYZ])\s+([xyzXYZ])\b/g, '$1*$2');

      try {
        const fn = new Function('u1', 'u2', 'u3', `
          const { sin, cos, tan, exp, log, sqrt, abs, sinh, cosh, tanh, asin, acos, atan, PI } = Math;
          const ln = log;
          const e = Math.E, E = Math.E;
          const pi = PI, Pi = PI;
          let x = u1, y = u2, z = u3;
          let rho = u1, phi = u2;
          let r = u1, theta = u2;
          if ('${coordSys}' === 'cylindrical') {
            rho = u1; phi = u2; z = u3;
            x = rho * Math.cos(phi); y = rho * Math.sin(phi);
          } else if ('${coordSys}' === 'spherical') {
            r = u1; theta = u2; phi = u3;
            x = r * Math.sin(theta) * Math.cos(phi);
            y = r * Math.sin(theta) * Math.sin(phi);
            z = r * Math.cos(theta);
            rho = r * Math.sin(theta);
          }
          const X = x, Y = y, Z = z;
          const RHO = rho, Rho = rho;
          const R = r;
          const PHI = phi, Phi = phi;
          const THETA = theta, Theta = theta;
          const Sin = sin, Cos = cos, Tan = tan, Exp = exp, Log = log, Ln = ln, Sqrt = sqrt, Abs = abs;
          try {
            const val = Number(${s});
            return (typeof val === 'number' && !isNaN(val) && isFinite(val)) ? val : 0;
          } catch (e) {
            return 0;
          }
        `);
        return fn(u1, u2, u3);
      } catch (err) {
        return 0;
      }
    };

    // Helper: Computes numerical gradient vector and magnitude with metric factors in active coordinate system
    const evaluateCustomGradientAt = (coordSys, raw, pList, eps = 1e-5) => {
      let u1 = pList[0];
      let u2 = pList[1];
      let u3 = pList[2];

      if (coordSys === 'cylindrical') {
        u2 = (pList[1] * Math.PI) / 180; // phi in radians
      } else if (coordSys === 'spherical') {
        u2 = (pList[1] * Math.PI) / 180; // theta in radians
        u3 = (pList[2] * Math.PI) / 180; // phi in radians
      }

      const v0 = evaluateCustomScalar(raw, u1, u2, u3, coordSys);

      let g1 = 0, g2 = 0, g3 = 0;
      if (coordSys === 'cartesian') {
        g1 = (evaluateCustomScalar(raw, u1 + eps, u2, u3, coordSys) - evaluateCustomScalar(raw, u1 - eps, u2, u3, coordSys)) / (2 * eps);
        g2 = (evaluateCustomScalar(raw, u1, u2 + eps, u3, coordSys) - evaluateCustomScalar(raw, u1, u2 - eps, u3, coordSys)) / (2 * eps);
        g3 = (evaluateCustomScalar(raw, u1, u2, u3 + eps, coordSys) - evaluateCustomScalar(raw, u1, u2, u3 - eps, coordSys)) / (2 * eps);
      } else if (coordSys === 'cylindrical') {
        const rho = Math.max(1e-4, u1);
        g1 = (evaluateCustomScalar(raw, rho + eps, u2, u3, coordSys) - evaluateCustomScalar(raw, rho - eps, u2, u3, coordSys)) / (2 * eps);
        g2 = (1 / rho) * (evaluateCustomScalar(raw, u1, u2 + eps, u3, coordSys) - evaluateCustomScalar(raw, u1, u2 - eps, u3, coordSys)) / (2 * eps);
        g3 = (evaluateCustomScalar(raw, u1, u2, u3 + eps, coordSys) - evaluateCustomScalar(raw, u1, u2, u3 - eps, coordSys)) / (2 * eps);
      } else if (coordSys === 'spherical') {
        const r = Math.max(1e-4, u1);
        const theta = u2;
        const sinTheta = Math.max(1e-4, Math.abs(Math.sin(theta)));
        g1 = (evaluateCustomScalar(raw, r + eps, u2, u3, coordSys) - evaluateCustomScalar(raw, r - eps, u2, u3, coordSys)) / (2 * eps);
        g2 = (1 / r) * (evaluateCustomScalar(raw, u1, theta + eps, u3, coordSys) - evaluateCustomScalar(raw, u1, theta - eps, u3, coordSys)) / (2 * eps);
        g3 = (1 / (r * sinTheta)) * (evaluateCustomScalar(raw, u1, u2, u3 + eps, coordSys) - evaluateCustomScalar(raw, u1, u2, u3 - eps, coordSys)) / (2 * eps);
      }

      const mag = Math.sqrt(g1 * g1 + g2 * g2 + g3 * g3);
      return { v0, g1, g2, g3, mag };
    };

    const getGradLabels = (coordSys) => {
      if (coordSys === 'cartesian') {
        return {
          p1Sym: 'x', p1Unit: '(m)',
          p2Sym: 'y', p2Unit: '(m)',
          p3Sym: 'z', p3Unit: '(m)'
        };
      } else if (coordSys === 'cylindrical') {
        return {
          p1Sym: 'ρ', p1Unit: '(m)',
          p2Sym: 'φ', p2Unit: '(°)',
          p3Sym: 'z', p3Unit: '(m)'
        };
      } else {
        return {
          p1Sym: 'r', p1Unit: '(m)',
          p2Sym: 'θ', p2Unit: '(°)',
          p3Sym: 'φ', p3Unit: '(°)'
        };
      }
    };

    const initialLabels = getGradLabels(coord);
    const initialRes = evaluateCustomGradientAt(coord, expr, pt);

    container.innerHTML = `
      <!-- Coordinate System Segmented Control -->
      <div class="segmented-control" id="calc-grad-coord-control" style="margin-bottom: 8px;">
        <button type="button" class="segment-btn ${coord === 'cartesian' ? 'active' : ''}" data-grad-coord="cartesian">Cartesian <br>(x, y, z)</button>
        <button type="button" class="segment-btn ${coord === 'cylindrical' ? 'active' : ''}" data-grad-coord="cylindrical">Cylindrical <br>(ρ, φ, z)</button>
        <button type="button" class="segment-btn ${coord === 'spherical' ? 'active' : ''}" data-grad-coord="spherical">Spherical <br>(r, θ, φ)</button>
      </div>

      <div class="calc-result-box" style="margin-bottom: 6px;">
        <div class="calc-result-title">Scalar Function</div>
        <input type="text" class="calc-input-field" id="calc-grad-expr" value="${expr}" placeholder="e.g. 3.5 * exp(-(x^2 + y^2)/3) or x^2 + y^2 + z" style="font-size: 12px; font-weight: 600; color: #38bdf8; margin-bottom: 4px;">
        <div id="calc-grad-latex-display" class="math-display" style="padding: 6px 10px; font-size: 13px; text-align: center; min-height: 32px; background: rgba(10, 14, 22, 0.75);"></div>
      </div>

      <div class="calc-input-row">
        <div class="calc-input-box">
          <span class="calc-input-label" id="calc-grad-p1-label"><span class="calc-sym">${initialLabels.p1Sym}</span> <span class="calc-unit">${initialLabels.p1Unit}</span></span>
          <input type="number" step="0.1" class="calc-input-field" id="calc-grad-p1" value="${pt[0]}">
        </div>
        <div class="calc-input-box">
          <span class="calc-input-label" id="calc-grad-p2-label"><span class="calc-sym">${initialLabels.p2Sym}</span> <span class="calc-unit">${initialLabels.p2Unit}</span></span>
          <input type="number" step="0.1" class="calc-input-field" id="calc-grad-p2" value="${pt[1]}">
        </div>
        <div class="calc-input-box">
          <span class="calc-input-label" id="calc-grad-p3-label"><span class="calc-sym">${initialLabels.p3Sym}</span> <span class="calc-unit">${initialLabels.p3Unit}</span></span>
          <input type="number" step="0.1" class="calc-input-field" id="calc-grad-p3" value="${pt[2]}">
        </div>
      </div>

      <div class="calc-result-box" style="margin-top: 8px;">
        <div class="calc-result-title">Evaluated Scalar Value & Gradient</div>
        <div class="calc-result-item">
          <span class="lbl">Scalar Value V(P):</span>
          <span class="val" id="calc-grad-val" style="color: #38bdf8; font-size: 13px; font-weight: 700;">${formatScientific(initialRes.v0, 4)} V</span>
        </div>
        <div class="calc-result-item">
          <span class="lbl">Gradient Vector ∇V:</span>
          <span class="val" id="calc-grad-vec">(${formatScientific(initialRes.g1, 3)}, ${formatScientific(initialRes.g2, 3)}, ${formatScientific(initialRes.g3, 3)}) V/m</span>
        </div>
        <div class="calc-result-item">
          <span class="lbl">Gradient Magnitude |∇V|:</span>
          <span class="val" id="calc-grad-mag" style="color: #4ade80; font-weight: 600;">${formatScientific(initialRes.mag, 4)} V/m</span>
        </div>
      </div>
    `;

    const latexEl = container.querySelector('#calc-grad-latex-display');
    const valEl = container.querySelector('#calc-grad-val');
    const vecEl = container.querySelector('#calc-grad-vec');
    const magEl = container.querySelector('#calc-grad-mag');

    const updateLatex = () => {
      const activeCoord = this.calcState.gradCoord;
      const activeExpr = this.calcState.gradExpressions[activeCoord];
      const latex = formatFormulaToLatex(activeCoord, activeExpr);
      this.renderKaTeX(latex, latexEl, true);
    };

    const updateGradResults = () => {
      const activeCoord = this.calcState.gradCoord;
      const activeExpr = this.calcState.gradExpressions[activeCoord];
      const activePt = this.calcState.gradPoints[activeCoord];
      const curRes = evaluateCustomGradientAt(activeCoord, activeExpr, activePt);
      if (valEl) valEl.textContent = `${formatScientific(curRes.v0, 4)} V`;
      if (vecEl) vecEl.textContent = `(${formatScientific(curRes.g1, 3)}, ${formatScientific(curRes.g2, 3)}, ${formatScientific(curRes.g3, 3)}) V/m`;
      if (magEl) magEl.textContent = `${formatScientific(curRes.mag, 4)} V/m`;
    };

    // Initial render of live KaTeX preview
    updateLatex();

    // Coordinate switch buttons
    const coordBtns = container.querySelectorAll('#calc-grad-coord-control .segment-btn');
    coordBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextCoord = btn.dataset.gradCoord;
        if (nextCoord === this.calcState.gradCoord) return;
        this.calcState.gradCoord = nextCoord;

        coordBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const nextLabels = getGradLabels(nextCoord);
        const nextExpr = this.calcState.gradExpressions[nextCoord];
        const nextPt = this.calcState.gradPoints[nextCoord];

        container.querySelector('#calc-grad-expr').value = nextExpr;

        container.querySelector('#calc-grad-p1-label').innerHTML = `<span class="calc-sym">${nextLabels.p1Sym}</span> <span class="calc-unit">${nextLabels.p1Unit}</span>`;
        container.querySelector('#calc-grad-p2-label').innerHTML = `<span class="calc-sym">${nextLabels.p2Sym}</span> <span class="calc-unit">${nextLabels.p2Unit}</span>`;
        container.querySelector('#calc-grad-p3-label').innerHTML = `<span class="calc-sym">${nextLabels.p3Sym}</span> <span class="calc-unit">${nextLabels.p3Unit}</span>`;
        container.querySelector('#calc-grad-p1').value = nextPt[0];
        container.querySelector('#calc-grad-p2').value = nextPt[1];
        container.querySelector('#calc-grad-p3').value = nextPt[2];

        updateLatex();
        updateGradResults();
      });
    });

    const exprInput = container.querySelector('#calc-grad-expr');
    exprInput.addEventListener('input', (e) => {
      const activeCoord = this.calcState.gradCoord;
      this.calcState.gradExpressions[activeCoord] = e.target.value;
      updateLatex();
      updateGradResults();
    });

    ['p1', 'p2', 'p3'].forEach((id, idx) => {
      const el = container.querySelector(`#calc-grad-${id}`);
      el.addEventListener('input', (e) => {
        const activeCoord = this.calcState.gradCoord;
        const val = parseFloat(e.target.value);
        this.calcState.gradPoints[activeCoord][idx] = isNaN(val) ? 0 : val;
        updateGradResults();
      });
    });
  }

  // 6. Divergence Calculator (Custom Vector Function in Cartesian, Cylindrical, Spherical)
  renderDivergenceCalculator(container) {
    const coord = this.calcState.divCoord;
    const comps = this.calcState.divComponents[coord];
    const pt = this.calcState.divPoint[coord];

    // Helper: Scans balanced parentheses starting at openIdx
    const extractBalanced = (str, openIdx) => {
      let depth = 1;
      let i = openIdx + 1;
      while (i < str.length && depth > 0) {
        if (str[i] === '(') depth++;
        else if (str[i] === ')') depth--;
        i++;
      }
      if (depth === 0) return { inside: str.slice(openIdx + 1, i - 1), endIdx: i };
      return null;
    };

    // Helper: Replaces functions with balanced parens
    const replaceBalancedFn = (str, prefix, callback) => {
      let out = '';
      let lastIdx = 0;
      const regex = new RegExp(prefix + '\\s*\\(', 'gi');
      let match;
      while ((match = regex.exec(str)) !== null) {
        out += str.slice(lastIdx, match.index);
        const openIdx = match.index + match[0].length - 1;
        const res = extractBalanced(str, openIdx);
        if (res) {
          out += callback(res.inside);
          lastIdx = res.endIdx;
          regex.lastIndex = res.endIdx;
        } else {
          out += str.slice(match.index);
          lastIdx = str.length;
          break;
        }
      }
      out += str.slice(lastIdx);
      return out;
    };

    // Helper: Formats single component expression to LaTeX representation
    const formatComponentToLatex = (raw) => {
      if (!raw || !raw.trim()) return '0';
      let s = raw.trim();

      const formatInner = (str) => {
        let sub = str.trim();
        sub = replaceBalancedFn(sub, '\\bexp', (inner) => `e^{${formatInner(inner)}}`);
        sub = replaceBalancedFn(sub, '\\be\\s*\\^', (inner) => `e^{${formatInner(inner)}}`);
        sub = replaceBalancedFn(sub, '\\bsqrt', (inner) => `\\sqrt{${formatInner(inner)}}`);
        sub = replaceBalancedFn(sub, '\\babs', (inner) => `\\left|${formatInner(inner)}\\right|`);
        sub = replaceBalancedFn(sub, '\\bsin', (inner) => `\\sin\\left(${formatInner(inner)}\\right)`);
        sub = replaceBalancedFn(sub, '\\bcos', (inner) => `\\cos\\left(${formatInner(inner)}\\right)`);
        sub = replaceBalancedFn(sub, '\\btan', (inner) => `\\tan\\left(${formatInner(inner)}\\right)`);
        sub = replaceBalancedFn(sub, '\\bln', (inner) => `\\ln\\left(${formatInner(inner)}\\right)`);
        sub = replaceBalancedFn(sub, '\\blog', (inner) => `\\log\\left(${formatInner(inner)}\\right)`);
        sub = sub.replace(/ρ/g, '\\rho');
        sub = sub.replace(/φ/g, '\\phi');
        sub = sub.replace(/θ/g, '\\theta');
        sub = sub.replace(/(?<!\\)\brho\b/gi, '\\rho');
        sub = sub.replace(/(?<!\\)\bphi\b/gi, '\\phi');
        sub = sub.replace(/(?<!\\)\btheta\b/gi, '\\theta');
        sub = sub.replace(/\^([a-zA-Z0-9]+)/g, '^{$1}');
        sub = sub.replace(/\*/g, ' \\cdot ');
        return sub;
      };

      s = replaceBalancedFn(s, '\\bexp', (inner) => `e^{${formatInner(inner)}}`);
      s = replaceBalancedFn(s, '\\be\\s*\\^', (inner) => `e^{${formatInner(inner)}}`);
      s = replaceBalancedFn(s, '\\bsqrt', (inner) => `\\sqrt{${formatInner(inner)}}`);
      s = replaceBalancedFn(s, '\\babs', (inner) => `\\left|${formatInner(inner)}\\right|`);
      s = replaceBalancedFn(s, '\\bsin', (inner) => `\\sin\\left(${formatInner(inner)}\\right)`);
      s = replaceBalancedFn(s, '\\bcos', (inner) => `\\cos\\left(${formatInner(inner)}\\right)`);
      s = replaceBalancedFn(s, '\\btan', (inner) => `\\tan\\left(${formatInner(inner)}\\right)`);
      s = replaceBalancedFn(s, '\\bln', (inner) => `\\ln\\left(${formatInner(inner)}\\right)`);
      s = replaceBalancedFn(s, '\\blog', (inner) => `\\log\\left(${formatInner(inner)}\\right)`);
      s = s.replace(/ρ/g, '\\rho');
      s = s.replace(/φ/g, '\\phi');
      s = s.replace(/θ/g, '\\theta');
      s = s.replace(/(?<!\\)\brho\b/gi, '\\rho');
      s = s.replace(/(?<!\\)\bphi\b/gi, '\\phi');
      s = s.replace(/(?<!\\)\btheta\b/gi, '\\theta');
      s = s.replace(/\^([a-zA-Z0-9]+)/g, '^{$1}');
      s = s.replace(/\*/g, ' \\cdot ');
      return s;
    };

    // Helper: Formats full vector function into LaTeX preview
    const formatVectorLatex = (coordSys, c1, c2, c3) => {
      const l1 = formatComponentToLatex(c1);
      const l2 = formatComponentToLatex(c2);
      const l3 = formatComponentToLatex(c3);
      if (coordSys === 'cartesian') {
        return `\\vec{A}(x,y,z) = (${l1})\\hat{a}_x + (${l2})\\hat{a}_y + (${l3})\\hat{a}_z`;
      } else if (coordSys === 'cylindrical') {
        return `\\vec{A}(\\rho,\\phi,z) = (${l1})\\hat{a}_\\rho + (${l2})\\hat{a}_\\phi + (${l3})\\hat{a}_z`;
      } else {
        return `\\vec{A}(r,\\theta,\\phi) = (${l1})\\hat{a}_r + (${l2})\\hat{a}_\\theta + (${l3})\\hat{a}_\\phi`;
      }
    };

    // Helper: Evaluates a single scalar component safely
    const evaluateComponent = (raw, u1, u2, u3, coordSys) => {
      if (!raw || !raw.trim()) return 0;
      let s = raw.trim();

      // Convert Greek letters to ascii variable names
      s = s.replace(/ρ/g, 'rho');
      s = s.replace(/φ/g, 'phi');
      s = s.replace(/θ/g, 'theta');

      // Convert e^(...) -> exp(...) with balanced parentheses
      s = replaceBalancedFn(s, '\\be\\s*\\^', (inside) => `exp(${inside})`);
      s = s.replace(/\be\s*\^\s*([a-zA-Z0-9_]+)/gi, 'exp($1)');

      // Unary minus before exponentiation: -z^2 -> (0 - 1) * z^2
      s = s.replace(/(^|[+\-*/(,])\s*-\s*([a-zA-Z_]\w*|\d+(?:\.\d+)?)\s*\^/g, '$1 (0 - 1) * $2^');

      s = s.replace(/\^/g, '**');
      s = s.replace(/(\d)\s*([a-zA-Z_]\w*|\()/g, '$1*$2');
      s = s.replace(/(\*\*)\s*(\d+)\s*([a-zA-Z_(])/g, '$1$2*$3');
      s = s.replace(/\)\s*(\(|\d|[a-zA-Z_])/g, ')*$1');
      s = s.replace(/\b([xyzXYZ]{2,})\b/g, (match) => match.split('').join('*'));
      s = s.replace(/\b([a-zA-Z_]\w*)\s*\(/g, (match, name) => {
        const fnNames = ['sin', 'cos', 'tan', 'exp', 'log', 'ln', 'sqrt', 'abs', 'sinh', 'cosh', 'tanh', 'asin', 'acos', 'atan'];
        if (fnNames.includes(name.toLowerCase())) return `${name.toLowerCase()}(`;
        return `${name}*(`;
      });
      s = s.replace(/\b([xyzXYZ])\s+([xyzXYZ])\b/g, '$1*$2');

      try {
        const fn = new Function('u1', 'u2', 'u3', `
          const { sin, cos, tan, exp, log, sqrt, abs, PI } = Math;
          const ln = log, pi = PI, Pi = PI, e = Math.E, E = Math.E;
          let x = u1, y = u2, z = u3;
          let rho = u1, phi = u2;
          let r = u1, theta = u2;
          if ('${coordSys}' === 'cylindrical') {
            rho = u1; phi = u2; z = u3;
            x = rho * Math.cos(phi); y = rho * Math.sin(phi);
          } else if ('${coordSys}' === 'spherical') {
            r = u1; theta = u2; phi = u3;
            x = r * Math.sin(theta) * Math.cos(phi);
            y = r * Math.sin(theta) * Math.sin(phi);
            z = r * Math.cos(theta);
            rho = r * Math.sin(theta);
          }
          const X = x, Y = y, Z = z, RHO = rho, Rho = rho, PHI = phi, Phi = phi, R = r, THETA = theta, Theta = theta;
          const Sin = sin, Cos = cos, Tan = tan, Exp = exp, Log = log, Ln = ln, Sqrt = sqrt, Abs = abs;
          try {
            const val = Number(${s});
            return (typeof val === 'number' && !isNaN(val) && isFinite(val)) ? val : 0;
          } catch(e) { return 0; }
        `);
        return fn(u1, u2, u3);
      } catch (err) {
        return 0;
      }
    };

    // Helper: Calculates divergence analytically/numerically in active coordinate system
    const computeDivergence = (coordSys, cList, pList, eps = 1e-5) => {
      let u1 = pList[0];
      let u2 = pList[1];
      let u3 = pList[2];

      if (coordSys === 'cylindrical') {
        u2 = (pList[1] * Math.PI) / 180; // phi in radians
      } else if (coordSys === 'spherical') {
        u2 = (pList[1] * Math.PI) / 180; // theta in radians
        u3 = (pList[2] * Math.PI) / 180; // phi in radians
      }

      const A1 = evaluateComponent(cList[0], u1, u2, u3, coordSys);
      const A2 = evaluateComponent(cList[1], u1, u2, u3, coordSys);
      const A3 = evaluateComponent(cList[2], u1, u2, u3, coordSys);
      const mag = Math.sqrt(A1 * A1 + A2 * A2 + A3 * A3);

      let div = 0;
      if (coordSys === 'cartesian') {
        const dAx_dx = (evaluateComponent(cList[0], u1 + eps, u2, u3, coordSys) - evaluateComponent(cList[0], u1 - eps, u2, u3, coordSys)) / (2 * eps);
        const dAy_dy = (evaluateComponent(cList[1], u1, u2 + eps, u3, coordSys) - evaluateComponent(cList[1], u1, u2 - eps, u3, coordSys)) / (2 * eps);
        const dAz_dz = (evaluateComponent(cList[2], u1, u2, u3 + eps, coordSys) - evaluateComponent(cList[2], u1, u2, u3 - eps, coordSys)) / (2 * eps);
        div = dAx_dx + dAy_dy + dAz_dz;
      } else if (coordSys === 'cylindrical') {
        const rho = Math.max(1e-4, u1);
        const fRhoPlus = (rho + eps) * evaluateComponent(cList[0], rho + eps, u2, u3, coordSys);
        const fRhoMinus = (rho - eps) * evaluateComponent(cList[0], rho - eps, u2, u3, coordSys);
        const d_rhoArho_drho = (fRhoPlus - fRhoMinus) / (2 * eps);

        const dAphi_dphi = (evaluateComponent(cList[1], u1, u2 + eps, u3, coordSys) - evaluateComponent(cList[1], u1, u2 - eps, u3, coordSys)) / (2 * eps);
        const dAz_dz = (evaluateComponent(cList[2], u1, u2, u3 + eps, coordSys) - evaluateComponent(cList[2], u1, u2, u3 - eps, coordSys)) / (2 * eps);
        div = (1 / rho) * d_rhoArho_drho + (1 / rho) * dAphi_dphi + dAz_dz;
      } else if (coordSys === 'spherical') {
        const r = Math.max(1e-4, u1);
        const theta = u2;
        const sinTheta = Math.max(1e-4, Math.abs(Math.sin(theta)));

        const fRPlus = Math.pow(r + eps, 2) * evaluateComponent(cList[0], r + eps, u2, u3, coordSys);
        const fRMinus = Math.pow(r - eps, 2) * evaluateComponent(cList[0], r - eps, u2, u3, coordSys);
        const d_r2Ar_dr = (fRPlus - fRMinus) / (2 * eps);

        const fThetaPlus = Math.sin(theta + eps) * evaluateComponent(cList[1], u1, theta + eps, u3, coordSys);
        const fThetaMinus = Math.sin(theta - eps) * evaluateComponent(cList[1], u1, theta - eps, u3, coordSys);
        const d_sinThetaAtheta_dtheta = (fThetaPlus - fThetaMinus) / (2 * eps);

        const dAphi_dphi = (evaluateComponent(cList[2], u1, u2, u3 + eps, coordSys) - evaluateComponent(cList[2], u1, u2, u3 - eps, coordSys)) / (2 * eps);
        div = (1 / (r * r)) * d_r2Ar_dr + (1 / (r * sinTheta)) * d_sinThetaAtheta_dtheta + (1 / (r * sinTheta)) * dAphi_dphi;
      }

      let classification = 'Solenoidal (∇·A = 0)';
      if (div > 0.005) classification = 'Net Source (∇·A > 0)';
      else if (div < -0.005) classification = 'Net Sink (∇·A < 0)';

      return { A1, A2, A3, mag, div, classification };
    };

    // Dynamic labels and units based on coordinate system
    const getLabels = (coordSys) => {
      if (coordSys === 'cartesian') {
        return {
          c1: 'A_x', c2: 'A_y', c3: 'A_z',
          p1Sym: 'x', p1Unit: '(m)',
          p2Sym: 'y', p2Unit: '(m)',
          p3Sym: 'z', p3Unit: '(m)'
        };
      } else if (coordSys === 'cylindrical') {
        return {
          c1: 'A_ρ', c2: 'A_φ', c3: 'A_z',
          p1Sym: 'ρ', p1Unit: '(m)',
          p2Sym: 'φ', p2Unit: '(°)',
          p3Sym: 'z', p3Unit: '(m)'
        };
      } else {
        return {
          c1: 'A_r', c2: 'A_θ', c3: 'A_φ',
          p1Sym: 'r', p1Unit: '(m)',
          p2Sym: 'θ', p2Unit: '(°)',
          p3Sym: 'φ', p3Unit: '(°)'
        };
      }
    };

    const initialLabels = getLabels(coord);
    const initialRes = computeDivergence(coord, comps, pt);

    // Helper: Selects divergence display color (Source: green, Sink: red, Zero/Solenoidal: amber)
    const getDivColor = (div) => {
      if (div > 0.005) return '#4ade80';   // Positive Net Source (green)
      if (div < -0.005) return '#ef4444';  // Negative Net Sink (red)
      return '#fbbf24';                   // Zero / Solenoidal (amber)
    };

    // Helper: Formats divergence value text with sign
    const formatDivVal = (div) => {
      if (div > 0.005) return `+${formatScientific(div, 4)} s⁻¹`;
      if (div < -0.005) return `${formatScientific(div, 4)} s⁻¹`;
      return `0.0000 s⁻¹`;
    };

    container.innerHTML = `
      <!-- Coordinate System Segmented Control -->
      <div class="segmented-control" id="calc-div-coord-control" style="margin-bottom: 8px;">
        <button type="button" class="segment-btn ${coord === 'cartesian' ? 'active' : ''}" data-div-coord="cartesian">Cartesian <br>(x, y, z)</button>
        <button type="button" class="segment-btn ${coord === 'cylindrical' ? 'active' : ''}" data-div-coord="cylindrical">Cylindrical <br>(ρ, φ, z)</button>
        <button type="button" class="segment-btn ${coord === 'spherical' ? 'active' : ''}" data-div-coord="spherical">Spherical <br>(r, θ, φ)</button>
      </div>

      <!-- Vector Function Box -->
      <div class="calc-result-box" style="margin-bottom: 6px;">
        <div class="calc-result-title">Vector Function Components</div>
        <div class="calc-input-row" style="margin-bottom: 4px;">
          <div class="calc-input-box">
            <span class="calc-input-label" id="calc-div-c1-label">${initialLabels.c1}</span>
            <input type="text" class="calc-input-field" id="calc-div-c1" value="${comps[0]}" style="font-size: 12px; font-weight: 600; color: #38bdf8;">
          </div>
          <div class="calc-input-box">
            <span class="calc-input-label" id="calc-div-c2-label">${initialLabels.c2}</span>
            <input type="text" class="calc-input-field" id="calc-div-c2" value="${comps[1]}" style="font-size: 12px; font-weight: 600; color: #38bdf8;">
          </div>
          <div class="calc-input-box">
            <span class="calc-input-label" id="calc-div-c3-label">${initialLabels.c3}</span>
            <input type="text" class="calc-input-field" id="calc-div-c3" value="${comps[2]}" style="font-size: 12px; font-weight: 600; color: #38bdf8;">
          </div>
        </div>
        <div id="calc-div-latex-display" class="math-display" style="padding: 6px 10px; font-size: 13px; text-align: center; min-height: 32px; background: rgba(10, 14, 22, 0.75);"></div>
      </div>

      <!-- Evaluation Point Inputs -->
      <div class="calc-input-row">
        <div class="calc-input-box">
          <span class="calc-input-label" id="calc-div-p1-label"><span class="calc-sym">${initialLabels.p1Sym}</span> <span class="calc-unit">${initialLabels.p1Unit}</span></span>
          <input type="number" step="0.1" class="calc-input-field" id="calc-div-p1" value="${pt[0]}">
        </div>
        <div class="calc-input-box">
          <span class="calc-input-label" id="calc-div-p2-label"><span class="calc-sym">${initialLabels.p2Sym}</span> <span class="calc-unit">${initialLabels.p2Unit}</span></span>
          <input type="number" step="0.1" class="calc-input-field" id="calc-div-p2" value="${pt[1]}">
        </div>
        <div class="calc-input-box">
          <span class="calc-input-label" id="calc-div-p3-label"><span class="calc-sym">${initialLabels.p3Sym}</span> <span class="calc-unit">${initialLabels.p3Unit}</span></span>
          <input type="number" step="0.1" class="calc-input-field" id="calc-div-p3" value="${pt[2]}">
        </div>
      </div>

      <!-- Evaluated Divergence Results Box -->
      <div class="calc-result-box" style="margin-top: 8px;">
        <div class="calc-result-title">Evaluated Divergence & Field Value</div>
        <div class="calc-result-item">
          <span class="lbl">Divergence ∇·A:</span>
          <span class="val" id="calc-div-res-val" style="color: ${getDivColor(initialRes.div)}; font-size: 13px; font-weight: 700;">${formatDivVal(initialRes.div)}</span>
        </div>
        <div class="calc-result-item">
          <span class="lbl">Field Vector A(P):</span>
          <span class="val" id="calc-div-res-vec">(${formatScientific(initialRes.A1, 3)}, ${formatScientific(initialRes.A2, 3)}, ${formatScientific(initialRes.A3, 3)})</span>
        </div>
        <div class="calc-result-item">
          <span class="lbl">Field Magnitude |A|:</span>
          <span class="val" id="calc-div-res-mag" style="color: #4ade80; font-weight: 600;">${formatScientific(initialRes.mag, 4)}</span>
        </div>
        <div class="calc-result-item">
          <span class="lbl">Classification:</span>
          <span class="val" id="calc-div-res-class" style="color: ${getDivColor(initialRes.div)}; font-weight: 600;">${initialRes.classification}</span>
        </div>
      </div>
    `;

    const latexEl = container.querySelector('#calc-div-latex-display');
    const valEl = container.querySelector('#calc-div-res-val');
    const vecEl = container.querySelector('#calc-div-res-vec');
    const magEl = container.querySelector('#calc-div-res-mag');
    const classEl = container.querySelector('#calc-div-res-class');

    const updateLatexPreview = () => {
      const activeCoord = this.calcState.divCoord;
      const activeComps = this.calcState.divComponents[activeCoord];
      const latex = formatVectorLatex(activeCoord, activeComps[0], activeComps[1], activeComps[2]);
      this.renderKaTeX(latex, latexEl, true);
    };

    const updateResults = () => {
      const activeCoord = this.calcState.divCoord;
      const activeComps = this.calcState.divComponents[activeCoord];
      const activePt = this.calcState.divPoint[activeCoord];
      const res = computeDivergence(activeCoord, activeComps, activePt);

      if (valEl) {
        valEl.style.color = getDivColor(res.div);
        valEl.textContent = formatDivVal(res.div);
      }
      if (vecEl) vecEl.textContent = `(${formatScientific(res.A1, 3)}, ${formatScientific(res.A2, 3)}, ${formatScientific(res.A3, 3)})`;
      if (magEl) magEl.textContent = formatScientific(res.mag, 4);
      if (classEl) {
        classEl.style.color = getDivColor(res.div);
        classEl.textContent = res.classification;
      }
    };

    updateLatexPreview();

    // Coordinate switch buttons
    const coordBtns = container.querySelectorAll('#calc-div-coord-control .segment-btn');
    coordBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextCoord = btn.dataset.divCoord;
        if (nextCoord === this.calcState.divCoord) return;
        this.calcState.divCoord = nextCoord;

        coordBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const nextLabels = getLabels(nextCoord);
        const nextComps = this.calcState.divComponents[nextCoord];
        const nextPt = this.calcState.divPoint[nextCoord];

        // Update Component labels & input values
        container.querySelector('#calc-div-c1-label').textContent = nextLabels.c1;
        container.querySelector('#calc-div-c2-label').textContent = nextLabels.c2;
        container.querySelector('#calc-div-c3-label').textContent = nextLabels.c3;
        container.querySelector('#calc-div-c1').value = nextComps[0];
        container.querySelector('#calc-div-c2').value = nextComps[1];
        container.querySelector('#calc-div-c3').value = nextComps[2];

        // Update Point labels & input values
        container.querySelector('#calc-div-p1-label').innerHTML = `<span class="calc-sym">${nextLabels.p1Sym}</span> <span class="calc-unit">${nextLabels.p1Unit}</span>`;
        container.querySelector('#calc-div-p2-label').innerHTML = `<span class="calc-sym">${nextLabels.p2Sym}</span> <span class="calc-unit">${nextLabels.p2Unit}</span>`;
        container.querySelector('#calc-div-p3-label').innerHTML = `<span class="calc-sym">${nextLabels.p3Sym}</span> <span class="calc-unit">${nextLabels.p3Unit}</span>`;
        container.querySelector('#calc-div-p1').value = nextPt[0];
        container.querySelector('#calc-div-p2').value = nextPt[1];
        container.querySelector('#calc-div-p3').value = nextPt[2];

        updateLatexPreview();
        updateResults();
      });
    });

    // Component inputs
    ['c1', 'c2', 'c3'].forEach((id, idx) => {
      const el = container.querySelector(`#calc-div-${id}`);
      el.addEventListener('input', (e) => {
        const activeCoord = this.calcState.divCoord;
        this.calcState.divComponents[activeCoord][idx] = e.target.value;
        updateLatexPreview();
        updateResults();
      });
    });

    // Point coordinate inputs
    ['p1', 'p2', 'p3'].forEach((id, idx) => {
      const el = container.querySelector(`#calc-div-${id}`);
      el.addEventListener('input', (e) => {
        const activeCoord = this.calcState.divCoord;
        const val = parseFloat(e.target.value);
        this.calcState.divPoint[activeCoord][idx] = isNaN(val) ? 0 : val;
        updateResults();
      });
    });
  }

  // 7. Curl Calculator (Custom Vector Function in Cartesian, Cylindrical, Spherical)
  renderCurlCalculator(container) {
    const coord = this.calcState.curlCoord;
    const comps = this.calcState.curlComponents[coord];
    const pt = this.calcState.curlPoint[coord];

    // Helper: Scans balanced parentheses starting at openIdx
    const extractBalanced = (str, openIdx) => {
      let depth = 1;
      let i = openIdx + 1;
      while (i < str.length && depth > 0) {
        if (str[i] === '(') depth++;
        else if (str[i] === ')') depth--;
        i++;
      }
      if (depth === 0) return { inside: str.slice(openIdx + 1, i - 1), endIdx: i };
      return null;
    };

    // Helper: Replaces functions with balanced parens
    const replaceBalancedFn = (str, prefix, callback) => {
      let out = '';
      let lastIdx = 0;
      const regex = new RegExp(prefix + '\\s*\\(', 'gi');
      let match;
      while ((match = regex.exec(str)) !== null) {
        out += str.slice(lastIdx, match.index);
        const openIdx = match.index + match[0].length - 1;
        const res = extractBalanced(str, openIdx);
        if (res) {
          out += callback(res.inside);
          lastIdx = res.endIdx;
          regex.lastIndex = res.endIdx;
        } else {
          out += str.slice(match.index);
          lastIdx = str.length;
          break;
        }
      }
      out += str.slice(lastIdx);
      return out;
    };

    // Helper: Formats single component expression to LaTeX representation
    const formatComponentToLatex = (raw) => {
      if (!raw || !raw.trim()) return '0';
      let s = raw.trim();

      const formatInner = (str) => {
        let sub = str.trim();
        sub = replaceBalancedFn(sub, '\\bexp', (inner) => `e^{${formatInner(inner)}}`);
        sub = replaceBalancedFn(sub, '\\be\\s*\\^', (inner) => `e^{${formatInner(inner)}}`);
        sub = replaceBalancedFn(sub, '\\bsqrt', (inner) => `\\sqrt{${formatInner(inner)}}`);
        sub = replaceBalancedFn(sub, '\\babs', (inner) => `\\left|${formatInner(inner)}\\right|`);
        sub = replaceBalancedFn(sub, '\\bsin', (inner) => `\\sin\\left(${formatInner(inner)}\\right)`);
        sub = replaceBalancedFn(sub, '\\bcos', (inner) => `\\cos\\left(${formatInner(inner)}\\right)`);
        sub = replaceBalancedFn(sub, '\\btan', (inner) => `\\tan\\left(${formatInner(inner)}\\right)`);
        sub = replaceBalancedFn(sub, '\\bln', (inner) => `\\ln\\left(${formatInner(inner)}\\right)`);
        sub = replaceBalancedFn(sub, '\\blog', (inner) => `\\log\\left(${formatInner(inner)}\\right)`);
        sub = sub.replace(/ρ/g, '\\rho');
        sub = sub.replace(/φ/g, '\\phi');
        sub = sub.replace(/θ/g, '\\theta');
        sub = sub.replace(/(?<!\\)\brho\b/gi, '\\rho');
        sub = sub.replace(/(?<!\\)\bphi\b/gi, '\\phi');
        sub = sub.replace(/(?<!\\)\btheta\b/gi, '\\theta');
        sub = sub.replace(/\^([a-zA-Z0-9]+)/g, '^{$1}');
        sub = sub.replace(/\*/g, ' \\cdot ');
        return sub;
      };

      s = replaceBalancedFn(s, '\\bexp', (inner) => `e^{${formatInner(inner)}}`);
      s = replaceBalancedFn(s, '\\be\\s*\\^', (inner) => `e^{${formatInner(inner)}}`);
      s = replaceBalancedFn(s, '\\bsqrt', (inner) => `\\sqrt{${formatInner(inner)}}`);
      s = replaceBalancedFn(s, '\\babs', (inner) => `\\left|${formatInner(inner)}\\right|`);
      s = replaceBalancedFn(s, '\\bsin', (inner) => `\\sin\\left(${formatInner(inner)}\\right)`);
      s = replaceBalancedFn(s, '\\bcos', (inner) => `\\cos\\left(${formatInner(inner)}\\right)`);
      s = replaceBalancedFn(s, '\\btan', (inner) => `\\tan\\left(${formatInner(inner)}\\right)`);
      s = replaceBalancedFn(s, '\\bln', (inner) => `\\ln\\left(${formatInner(inner)}\\right)`);
      s = replaceBalancedFn(s, '\\blog', (inner) => `\\log\\left(${formatInner(inner)}\\right)`);
      s = s.replace(/ρ/g, '\\rho');
      s = s.replace(/φ/g, '\\phi');
      s = s.replace(/θ/g, '\\theta');
      s = s.replace(/(?<!\\)\brho\b/gi, '\\rho');
      s = s.replace(/(?<!\\)\bphi\b/gi, '\\phi');
      s = s.replace(/(?<!\\)\btheta\b/gi, '\\theta');
      s = s.replace(/\^([a-zA-Z0-9]+)/g, '^{$1}');
      s = s.replace(/\*/g, ' \\cdot ');
      return s;
    };

    // Helper: Formats full vector function into LaTeX preview
    const formatVectorLatex = (coordSys, c1, c2, c3) => {
      const l1 = formatComponentToLatex(c1);
      const l2 = formatComponentToLatex(c2);
      const l3 = formatComponentToLatex(c3);
      if (coordSys === 'cartesian') {
        return `\\vec{A}(x,y,z) = (${l1})\\hat{a}_x + (${l2})\\hat{a}_y + (${l3})\\hat{a}_z`;
      } else if (coordSys === 'cylindrical') {
        return `\\vec{A}(\\rho,\\phi,z) = (${l1})\\hat{a}_\\rho + (${l2})\\hat{a}_\\phi + (${l3})\\hat{a}_z`;
      } else {
        return `\\vec{A}(r,\\theta,\\phi) = (${l1})\\hat{a}_r + (${l2})\\hat{a}_\\theta + (${l3})\\hat{a}_\\phi`;
      }
    };

    // Helper: Evaluates a single scalar component safely
    const evaluateComponent = (raw, u1, u2, u3, coordSys) => {
      if (!raw || !raw.trim()) return 0;
      let s = raw.trim();

      // Convert Greek letters to ascii variable names
      s = s.replace(/ρ/g, 'rho');
      s = s.replace(/φ/g, 'phi');
      s = s.replace(/θ/g, 'theta');

      s = replaceBalancedFn(s, '\\be\\s*\\^', (inside) => `exp(${inside})`);
      s = s.replace(/\be\s*\^\s*([a-zA-Z0-9_]+)/gi, 'exp($1)');
      s = s.replace(/(^|[+\-*/(,])\s*-\s*([a-zA-Z_]\w*|\d+(?:\.\d+)?)\s*\^/g, '$1 (0 - 1) * $2^');
      s = s.replace(/\^/g, '**');
      s = s.replace(/(\d)\s*([a-zA-Z_]\w*|\()/g, '$1*$2');
      s = s.replace(/(\*\*)\s*(\d+)\s*([a-zA-Z_(])/g, '$1$2*$3');
      s = s.replace(/\)\s*(\(|\d|[a-zA-Z_])/g, ')*$1');
      s = s.replace(/\b([xyzXYZ]{2,})\b/g, (match) => match.split('').join('*'));
      s = s.replace(/\b([a-zA-Z_]\w*)\s*\(/g, (match, name) => {
        const fnNames = ['sin', 'cos', 'tan', 'exp', 'log', 'ln', 'sqrt', 'abs', 'sinh', 'cosh', 'tanh', 'asin', 'acos', 'atan'];
        if (fnNames.includes(name.toLowerCase())) return `${name.toLowerCase()}(`;
        return `${name}*(`;
      });
      s = s.replace(/\b([xyzXYZ])\s+([xyzXYZ])\b/g, '$1*$2');

      try {
        const fn = new Function('u1', 'u2', 'u3', `
          const { sin, cos, tan, exp, log, sqrt, abs, PI } = Math;
          const ln = log, pi = PI, Pi = PI, e = Math.E, E = Math.E;
          let x = u1, y = u2, z = u3;
          let rho = u1, phi = u2;
          let r = u1, theta = u2;
          if ('${coordSys}' === 'cylindrical') {
            rho = u1; phi = u2; z = u3;
            x = rho * Math.cos(phi); y = rho * Math.sin(phi);
          } else if ('${coordSys}' === 'spherical') {
            r = u1; theta = u2; phi = u3;
            x = r * Math.sin(theta) * Math.cos(phi);
            y = r * Math.sin(theta) * Math.sin(phi);
            z = r * Math.cos(theta);
            rho = r * Math.sin(theta);
          }
          const X = x, Y = y, Z = z, RHO = rho, Rho = rho, PHI = phi, Phi = phi, R = r, THETA = theta, Theta = theta;
          const Sin = sin, Cos = cos, Tan = tan, Exp = exp, Log = log, Ln = ln, Sqrt = sqrt, Abs = abs;
          try {
            const val = Number(${s});
            return (typeof val === 'number' && !isNaN(val) && isFinite(val)) ? val : 0;
          } catch(e) { return 0; }
        `);
        return fn(u1, u2, u3);
      } catch (err) {
        return 0;
      }
    };

    // Helper: Calculates 3D curl vector and magnitude with metric scale factors
    const computeCurl = (coordSys, cList, pList, eps = 1e-5) => {
      let u1 = pList[0];
      let u2 = pList[1];
      let u3 = pList[2];

      if (coordSys === 'cylindrical') {
        u2 = (pList[1] * Math.PI) / 180; // phi in radians
      } else if (coordSys === 'spherical') {
        u2 = (pList[1] * Math.PI) / 180; // theta in radians
        u3 = (pList[2] * Math.PI) / 180; // phi in radians
      }

      const A1 = evaluateComponent(cList[0], u1, u2, u3, coordSys);
      const A2 = evaluateComponent(cList[1], u1, u2, u3, coordSys);
      const A3 = evaluateComponent(cList[2], u1, u2, u3, coordSys);
      const fieldMag = Math.sqrt(A1 * A1 + A2 * A2 + A3 * A3);

      let c1 = 0, c2 = 0, c3 = 0;

      if (coordSys === 'cartesian') {
        const dAz_dy = (evaluateComponent(cList[2], u1, u2 + eps, u3, coordSys) - evaluateComponent(cList[2], u1, u2 - eps, u3, coordSys)) / (2 * eps);
        const dAy_dz = (evaluateComponent(cList[1], u1, u2, u3 + eps, coordSys) - evaluateComponent(cList[1], u1, u2, u3 - eps, coordSys)) / (2 * eps);
        c1 = dAz_dy - dAy_dz;

        const dAx_dz = (evaluateComponent(cList[0], u1, u2, u3 + eps, coordSys) - evaluateComponent(cList[0], u1, u2, u3 - eps, coordSys)) / (2 * eps);
        const dAz_dx = (evaluateComponent(cList[2], u1 + eps, u2, u3, coordSys) - evaluateComponent(cList[2], u1 - eps, u2, u3, coordSys)) / (2 * eps);
        c2 = dAx_dz - dAz_dx;

        const dAy_dx = (evaluateComponent(cList[1], u1 + eps, u2, u3, coordSys) - evaluateComponent(cList[1], u1 - eps, u2, u3, coordSys)) / (2 * eps);
        const dAx_dy = (evaluateComponent(cList[0], u1, u2 + eps, u3, coordSys) - evaluateComponent(cList[0], u1, u2 - eps, u3, coordSys)) / (2 * eps);
        c3 = dAy_dx - dAx_dy;
      } else if (coordSys === 'cylindrical') {
        const rho = Math.max(1e-4, u1);

        const dAz_dphi = (evaluateComponent(cList[2], u1, u2 + eps, u3, coordSys) - evaluateComponent(cList[2], u1, u2 - eps, u3, coordSys)) / (2 * eps);
        const dAphi_dz = (evaluateComponent(cList[1], u1, u2, u3 + eps, coordSys) - evaluateComponent(cList[1], u1, u2, u3 - eps, coordSys)) / (2 * eps);
        c1 = (1 / rho) * dAz_dphi - dAphi_dz;

        const dArho_dz = (evaluateComponent(cList[0], u1, u2, u3 + eps, coordSys) - evaluateComponent(cList[0], u1, u2, u3 - eps, coordSys)) / (2 * eps);
        const dAz_drho = (evaluateComponent(cList[2], rho + eps, u2, u3, coordSys) - evaluateComponent(cList[2], rho - eps, u2, u3, coordSys)) / (2 * eps);
        c2 = dArho_dz - dAz_drho;

        const fRhoPlus = (rho + eps) * evaluateComponent(cList[1], rho + eps, u2, u3, coordSys);
        const fRhoMinus = (rho - eps) * evaluateComponent(cList[1], rho - eps, u2, u3, coordSys);
        const d_rhoAphi_drho = (fRhoPlus - fRhoMinus) / (2 * eps);

        const dArho_dphi = (evaluateComponent(cList[0], u1, u2 + eps, u3, coordSys) - evaluateComponent(cList[0], u1, u2 - eps, u3, coordSys)) / (2 * eps);
        c3 = (1 / rho) * (d_rhoAphi_drho - dArho_dphi);
      } else if (coordSys === 'spherical') {
        const r = Math.max(1e-4, u1);
        const theta = u2;
        const sinTheta = Math.max(1e-4, Math.abs(Math.sin(theta)));

        const fThetaPlus = Math.sin(theta + eps) * evaluateComponent(cList[2], u1, theta + eps, u3, coordSys);
        const fThetaMinus = Math.sin(theta - eps) * evaluateComponent(cList[2], u1, theta - eps, u3, coordSys);
        const d_sinThetaAphi_dtheta = (fThetaPlus - fThetaMinus) / (2 * eps);
        const dAtheta_dphi = (evaluateComponent(cList[1], u1, u2 + eps, u3, coordSys) - evaluateComponent(cList[1], u1, u2 - eps, u3, coordSys)) / (2 * eps);
        c1 = (1 / (r * sinTheta)) * (d_sinThetaAphi_dtheta - dAtheta_dphi);

        const dAr_dphi = (evaluateComponent(cList[0], u1, u2 + eps, u3, coordSys) - evaluateComponent(cList[0], u1, u2 - eps, u3, coordSys)) / (2 * eps);
        const fRPhiPlus = (r + eps) * evaluateComponent(cList[2], r + eps, u2, u3, coordSys);
        const fRPhiMinus = (r - eps) * evaluateComponent(cList[2], r - eps, u2, u3, coordSys);
        const d_rAphi_dr = (fRPhiPlus - fRPhiMinus) / (2 * eps);
        c2 = (1 / r) * ((1 / sinTheta) * dAr_dphi - d_rAphi_dr);

        const fRThetaPlus = (r + eps) * evaluateComponent(cList[1], r + eps, u2, u3, coordSys);
        const fRThetaMinus = (r - eps) * evaluateComponent(cList[1], r - eps, u2, u3, coordSys);
        const d_rAtheta_dr = (fRThetaPlus - fRThetaMinus) / (2 * eps);
        const dAr_dtheta = (evaluateComponent(cList[0], u1, theta + eps, u3, coordSys) - evaluateComponent(cList[0], u1, theta - eps, u3, coordSys)) / (2 * eps);
        c3 = (1 / r) * (d_rAtheta_dr - dAr_dtheta);
      }

      const curlMag = Math.sqrt(c1 * c1 + c2 * c2 + c3 * c3);

      let classification = 'Conservative (∇×A = 0)';
      if (curlMag > 0.005) {
        if (coordSys === 'cartesian' || coordSys === 'cylindrical') {
          if (c3 > 0.005) classification = 'Rotational / CCW (∇×A > 0)';
          else if (c3 < -0.005) classification = 'Rotational / CW (∇×A < 0)';
          else classification = 'Rotational (|∇×A| > 0)';
        } else {
          classification = 'Rotational (|∇×A| > 0)';
        }
      }

      return { A1, A2, A3, fieldMag, c1, c2, c3, curlMag, classification };
    };

    // Dynamic labels and units based on coordinate system
    const getLabels = (coordSys) => {
      if (coordSys === 'cartesian') {
        return {
          c1: 'A_x', c2: 'A_y', c3: 'A_z',
          p1Sym: 'x', p1Unit: '(m)',
          p2Sym: 'y', p2Unit: '(m)',
          p3Sym: 'z', p3Unit: '(m)'
        };
      } else if (coordSys === 'cylindrical') {
        return {
          c1: 'A_ρ', c2: 'A_φ', c3: 'A_z',
          p1Sym: 'ρ', p1Unit: '(m)',
          p2Sym: 'φ', p2Unit: '(°)',
          p3Sym: 'z', p3Unit: '(m)'
        };
      } else {
        return {
          c1: 'A_r', c2: 'A_θ', c3: 'A_φ',
          p1Sym: 'r', p1Unit: '(m)',
          p2Sym: 'θ', p2Unit: '(°)',
          p3Sym: 'φ', p3Unit: '(°)'
        };
      }
    };

    const getCurlColor = (curlMag, c3, coordSys) => {
      if (curlMag <= 0.005) return '#fbbf24'; // Zero/Conservative: amber
      if (coordSys === 'cartesian' || coordSys === 'cylindrical') {
        if (c3 < -0.005) return '#ef4444'; // CW: red
      }
      return '#4ade80'; // CCW / Rotational: green
    };

    const initialLabels = getLabels(coord);
    const initialRes = computeCurl(coord, comps, pt);

    container.innerHTML = `
      <!-- Coordinate System Segmented Control -->
      <div class="segmented-control" id="calc-curl-coord-control" style="margin-bottom: 8px;">
        <button type="button" class="segment-btn ${coord === 'cartesian' ? 'active' : ''}" data-curl-coord="cartesian">Cartesian <br>(x, y, z)</button>
        <button type="button" class="segment-btn ${coord === 'cylindrical' ? 'active' : ''}" data-curl-coord="cylindrical">Cylindrical <br>(ρ, φ, z)</button>
        <button type="button" class="segment-btn ${coord === 'spherical' ? 'active' : ''}" data-curl-coord="spherical">Spherical <br>(r, θ, φ)</button>
      </div>

      <!-- Vector Function Box -->
      <div class="calc-result-box" style="margin-bottom: 6px;">
        <div class="calc-result-title">Vector Function Components</div>
        <div class="calc-input-row" style="margin-bottom: 4px;">
          <div class="calc-input-box">
            <span class="calc-input-label" id="calc-curl-c1-label">${initialLabels.c1}</span>
            <input type="text" class="calc-input-field" id="calc-curl-c1" value="${comps[0]}" style="font-size: 12px; font-weight: 600; color: #38bdf8;">
          </div>
          <div class="calc-input-box">
            <span class="calc-input-label" id="calc-curl-c2-label">${initialLabels.c2}</span>
            <input type="text" class="calc-input-field" id="calc-curl-c2" value="${comps[1]}" style="font-size: 12px; font-weight: 600; color: #38bdf8;">
          </div>
          <div class="calc-input-box">
            <span class="calc-input-label" id="calc-curl-c3-label">${initialLabels.c3}</span>
            <input type="text" class="calc-input-field" id="calc-curl-c3" value="${comps[2]}" style="font-size: 12px; font-weight: 600; color: #38bdf8;">
          </div>
        </div>
        <div id="calc-curl-latex-display" class="math-display" style="padding: 6px 10px; font-size: 13px; text-align: center; min-height: 32px; background: rgba(10, 14, 22, 0.75);"></div>
      </div>

      <!-- Evaluation Point Inputs -->
      <div class="calc-input-row">
        <div class="calc-input-box">
          <span class="calc-input-label" id="calc-curl-p1-label"><span class="calc-sym">${initialLabels.p1Sym}</span> <span class="calc-unit">${initialLabels.p1Unit}</span></span>
          <input type="number" step="0.1" class="calc-input-field" id="calc-curl-p1" value="${pt[0]}">
        </div>
        <div class="calc-input-box">
          <span class="calc-input-label" id="calc-curl-p2-label"><span class="calc-sym">${initialLabels.p2Sym}</span> <span class="calc-unit">${initialLabels.p2Unit}</span></span>
          <input type="number" step="0.1" class="calc-input-field" id="calc-curl-p2" value="${pt[1]}">
        </div>
        <div class="calc-input-box">
          <span class="calc-input-label" id="calc-curl-p3-label"><span class="calc-sym">${initialLabels.p3Sym}</span> <span class="calc-unit">${initialLabels.p3Unit}</span></span>
          <input type="number" step="0.1" class="calc-input-field" id="calc-curl-p3" value="${pt[2]}">
        </div>
      </div>

      <!-- Evaluated Curl Results Box -->
      <div class="calc-result-box" style="margin-top: 8px;">
        <div class="calc-result-title">Evaluated Curl & Field Value</div>
        <div class="calc-result-item">
          <span class="lbl">Curl Vector ∇×A:</span>
          <span class="val" id="calc-curl-res-vec">(${formatScientific(initialRes.c1, 3)}, ${formatScientific(initialRes.c2, 3)}, ${formatScientific(initialRes.c3, 3)}) s⁻¹</span>
        </div>
        <div class="calc-result-item">
          <span class="lbl">Curl Magnitude |∇×A|:</span>
          <span class="val" id="calc-curl-res-mag" style="color: ${getCurlColor(initialRes.curlMag, initialRes.c3, coord)}; font-size: 13px; font-weight: 700;">${formatScientific(initialRes.curlMag, 4)} s⁻¹</span>
        </div>
        <div class="calc-result-item">
          <span class="lbl">Field Vector A(P):</span>
          <span class="val" id="calc-curl-res-field">(${formatScientific(initialRes.A1, 3)}, ${formatScientific(initialRes.A2, 3)}, ${formatScientific(initialRes.A3, 3)})</span>
        </div>
        <div class="calc-result-item">
          <span class="lbl">Field Magnitude |A|:</span>
          <span class="val" id="calc-curl-res-fieldmag" style="color: #4ade80; font-weight: 600;">${formatScientific(initialRes.fieldMag, 4)}</span>
        </div>
        <div class="calc-result-item">
          <span class="lbl">Classification:</span>
          <span class="val" id="calc-curl-res-class" style="color: ${getCurlColor(initialRes.curlMag, initialRes.c3, coord)}; font-weight: 600;">${initialRes.classification}</span>
        </div>
      </div>
    `;

    const latexEl = container.querySelector('#calc-curl-latex-display');
    const vecEl = container.querySelector('#calc-curl-res-vec');
    const magEl = container.querySelector('#calc-curl-res-mag');
    const fieldEl = container.querySelector('#calc-curl-res-field');
    const fieldMagEl = container.querySelector('#calc-curl-res-fieldmag');
    const classEl = container.querySelector('#calc-curl-res-class');

    const updateLatexPreview = () => {
      const activeCoord = this.calcState.curlCoord;
      const activeComps = this.calcState.curlComponents[activeCoord];
      const latex = formatVectorLatex(activeCoord, activeComps[0], activeComps[1], activeComps[2]);
      this.renderKaTeX(latex, latexEl, true);
    };

    const updateResults = () => {
      const activeCoord = this.calcState.curlCoord;
      const activeComps = this.calcState.curlComponents[activeCoord];
      const activePt = this.calcState.curlPoint[activeCoord];
      const res = computeCurl(activeCoord, activeComps, activePt);

      if (vecEl) vecEl.textContent = `(${formatScientific(res.c1, 3)}, ${formatScientific(res.c2, 3)}, ${formatScientific(res.c3, 3)}) s⁻¹`;
      if (magEl) {
        magEl.style.color = getCurlColor(res.curlMag, res.c3, activeCoord);
        magEl.textContent = `${formatScientific(res.curlMag, 4)} s⁻¹`;
      }
      if (fieldEl) fieldEl.textContent = `(${formatScientific(res.A1, 3)}, ${formatScientific(res.A2, 3)}, ${formatScientific(res.A3, 3)})`;
      if (fieldMagEl) fieldMagEl.textContent = formatScientific(res.fieldMag, 4);
      if (classEl) {
        classEl.style.color = getCurlColor(res.curlMag, res.c3, activeCoord);
        classEl.textContent = res.classification;
      }
    };

    updateLatexPreview();

    // Coordinate switch buttons
    const coordBtns = container.querySelectorAll('#calc-curl-coord-control .segment-btn');
    coordBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextCoord = btn.dataset.curlCoord;
        if (nextCoord === this.calcState.curlCoord) return;
        this.calcState.curlCoord = nextCoord;

        coordBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const nextLabels = getLabels(nextCoord);
        const nextComps = this.calcState.curlComponents[nextCoord];
        const nextPt = this.calcState.curlPoint[nextCoord];

        // Update Component labels & input values
        container.querySelector('#calc-curl-c1-label').textContent = nextLabels.c1;
        container.querySelector('#calc-curl-c2-label').textContent = nextLabels.c2;
        container.querySelector('#calc-curl-c3-label').textContent = nextLabels.c3;
        container.querySelector('#calc-curl-c1').value = nextComps[0];
        container.querySelector('#calc-curl-c2').value = nextComps[1];
        container.querySelector('#calc-curl-c3').value = nextComps[2];

        // Update Point labels & input values
        container.querySelector('#calc-curl-p1-label').innerHTML = `<span class="calc-sym">${nextLabels.p1Sym}</span> <span class="calc-unit">${nextLabels.p1Unit}</span>`;
        container.querySelector('#calc-curl-p2-label').innerHTML = `<span class="calc-sym">${nextLabels.p2Sym}</span> <span class="calc-unit">${nextLabels.p2Unit}</span>`;
        container.querySelector('#calc-curl-p3-label').innerHTML = `<span class="calc-sym">${nextLabels.p3Sym}</span> <span class="calc-unit">${nextLabels.p3Unit}</span>`;
        container.querySelector('#calc-curl-p1').value = nextPt[0];
        container.querySelector('#calc-curl-p2').value = nextPt[1];
        container.querySelector('#calc-curl-p3').value = nextPt[2];

        updateLatexPreview();
        updateResults();
      });
    });

    // Component inputs
    ['c1', 'c2', 'c3'].forEach((id, idx) => {
      const el = container.querySelector(`#calc-curl-${id}`);
      el.addEventListener('input', (e) => {
        const activeCoord = this.calcState.curlCoord;
        this.calcState.curlComponents[activeCoord][idx] = e.target.value;
        updateLatexPreview();
        updateResults();
      });
    });

    // Point coordinate inputs
    ['p1', 'p2', 'p3'].forEach((id, idx) => {
      const el = container.querySelector(`#calc-curl-${id}`);
      el.addEventListener('input', (e) => {
        const activeCoord = this.calcState.curlCoord;
        const val = parseFloat(e.target.value);
        this.calcState.curlPoint[activeCoord][idx] = isNaN(val) ? 0 : val;
        updateResults();
      });
    });
  }
}
