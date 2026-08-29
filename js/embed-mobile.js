import { loadBarrios } from './data.js?v=13';
import { BarrioAnimator } from './animation.js?v=13';

const displayEl = document.querySelector('.display');
const MOBILE_EMBED_HEIGHT = 228;

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

function fitEmbedDocument(height) {
  const h = Math.max(MOBILE_EMBED_HEIGHT, Math.ceil(height));
  document.documentElement.style.height = `${h}px`;
  document.body.style.height = `${h}px`;

  try {
    if (window.frameElement) {
      window.frameElement.style.height = `${h}px`;
    }
  } catch (_) {
    /* cross-origin: Framer debe ajustar el frame manualmente */
  }

  if (window.parent !== window) {
    window.parent.postMessage({ type: 'cp-barrios-embed-height', height: h }, '*');
  }
}

function reportEmbedHeight() {
  const height = displayEl?.getBoundingClientRect().height ?? displayEl?.offsetHeight ?? MOBILE_EMBED_HEIGHT;
  fitEmbedDocument(height);
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
  animator.refreshDigitMetrics();

  await new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });

  reportEmbedHeight();
  animator.play();

  requestAnimationFrame(() => {
    animator.refreshDigitMetrics();
    reportEmbedHeight();
    requestAnimationFrame(reportEmbedHeight);
  });

  let passes = 0;
  const syncHeight = setInterval(() => {
    reportEmbedHeight();
    if (++passes >= 12) clearInterval(syncHeight);
  }, 250);
}

if (displayEl) {
  new ResizeObserver(reportEmbedHeight).observe(displayEl);
}

window.addEventListener('load', reportEmbedHeight);
window.addEventListener('resize', () => {
  animator.refreshDigitMetrics();
  reportEmbedHeight();
});

init().catch(console.error);
