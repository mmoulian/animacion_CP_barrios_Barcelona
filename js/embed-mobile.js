import { loadBarrios } from './data.js?v=13';
import { BarrioAnimator } from './animation.js?v=13';

const displayEl = document.querySelector('.display');

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

function reportEmbedHeight() {
  const height = Math.ceil(displayEl?.offsetHeight ?? document.documentElement.scrollHeight);
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'cp-barrios-embed-height', height }, '*');
  }
}

async function init() {
  const barrios = await loadBarrios();
  await document.fonts.ready;
  animator.setBarrios(barrios);
  animator.refreshDigitMetrics();
  animator.play();

  requestAnimationFrame(() => {
    animator.refreshDigitMetrics();
    reportEmbedHeight();
    requestAnimationFrame(reportEmbedHeight);
  });
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
