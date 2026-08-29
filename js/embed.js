import { loadBarrios } from './data.js?v=13';
import { BarrioAnimator } from './animation.js?v=13';

const DESIGN_WIDTH = 960;
const MAX_SCALE = 1.35;

const displayEl = document.querySelector('.display');
const stageEl = document.querySelector('.embed-stage');
const scalerEl = document.querySelector('.embed-scaler');

const animator = new BarrioAnimator({
  digitsEl: document.getElementById('digits'),
  nameEl: document.getElementById('name'),
  vulnerabilityEl: document.getElementById('vulnerability'),
  thermalStressEl: document.getElementById('thermal-stress'),
  vulnerabilityIconEl: document.getElementById('vulnerability-icon'),
  thermalStressIconEl: document.getElementById('thermal-stress-icon'),
  vulnerabilityRowEl: document.getElementById('vulnerability-row'),
  thermalStressRowEl: document.getElementById('thermal-stress-row'),
  indicatorFill: document.getElementById('stress-fill'),
  stressScaleEl: document.getElementById('stress-scale'),
});

function applyScale(scale) {
  if (!displayEl) return;

  displayEl.style.width = `${DESIGN_WIDTH}px`;

  // zoom ajusta layout en Chromium/Safari; transform como respaldo
  if (CSS.supports('zoom', '1')) {
    displayEl.style.zoom = String(scale);
    displayEl.style.transform = '';
  } else {
    displayEl.style.zoom = '';
    displayEl.style.transform = `scale(${scale})`;
  }
}

function updateEmbedLayout() {
  if (!displayEl || !stageEl || !scalerEl) return;

  const scale = Math.min(window.innerWidth / DESIGN_WIDTH, MAX_SCALE);
  applyScale(scale);

  const scaledW = Math.ceil(DESIGN_WIDTH * scale);
  const scaledH = Math.ceil(displayEl.getBoundingClientRect().height);

  stageEl.style.width = `${scaledW}px`;
  stageEl.style.height = `${scaledH}px`;
  scalerEl.style.height = `${scaledH}px`;

  animator.refreshDigitMetrics();
  reportEmbedHeight();
}

function reportEmbedHeight() {
  const height = Math.ceil(scalerEl?.offsetHeight ?? document.documentElement.scrollHeight);
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'cp-barrios-embed-height', height }, '*');
  }
}

async function waitForFonts() {
  await document.fonts.ready;
  try {
    await Promise.all([
      document.fonts.load('900 1em korolev-compressed-heavy'),
      document.fonts.load('300 1em korolev-compressed-light'),
    ]);
  } catch (_) {
    /* Typekit puede cargar de forma asíncrona */
  }
}

async function init() {
  const barrios = await loadBarrios();
  await waitForFonts();

  animator.setBarrios(barrios);
  updateEmbedLayout();

  await new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });

  updateEmbedLayout();
  animator.play();
}

if (displayEl) {
  new ResizeObserver(updateEmbedLayout).observe(displayEl);
}

window.addEventListener('load', updateEmbedLayout);
window.addEventListener('resize', updateEmbedLayout);

init().catch(console.error);
