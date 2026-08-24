import { loadBarrios } from './data.js';
import { BarrioAnimator } from './animation.js';

const DESIGN_WIDTH = 960;

const displayEl = document.querySelector('.display');
const stageEl = document.querySelector('.embed-stage');
const scalerEl = document.querySelector('.embed-scaler');

const animator = new BarrioAnimator({
  digitsEl: document.getElementById('digits'),
  nameEl: document.getElementById('name'),
  vulnerabilityEl: document.getElementById('vulnerability'),
  thermalStressEl: document.getElementById('thermal-stress'),
  indicatorFill: document.getElementById('stress-fill'),
  stressScaleEl: document.getElementById('stress-scale'),
});

function updateEmbedLayout() {
  if (!displayEl || !stageEl || !scalerEl) return;

  const scale = Math.min(1, window.innerWidth / DESIGN_WIDTH);
  document.documentElement.style.setProperty('--embed-scale', String(scale));

  const naturalH = displayEl.offsetHeight;
  const scaledW = DESIGN_WIDTH * scale;
  const scaledH = Math.ceil(naturalH * scale);

  stageEl.style.width = `${scaledW}px`;
  stageEl.style.height = `${scaledH}px`;
  scalerEl.style.height = `${scaledH}px`;

  reportEmbedHeight();
}

function reportEmbedHeight() {
  const height = Math.ceil(scalerEl?.offsetHeight ?? document.documentElement.scrollHeight);
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'cp-barrios-embed-height', height }, '*');
  }
}

async function init() {
  const barrios = await loadBarrios();
  animator.setBarrios(barrios);
  animator.play();

  requestAnimationFrame(() => {
    updateEmbedLayout();
    requestAnimationFrame(updateEmbedLayout);
  });
}

if (displayEl) {
  new ResizeObserver(updateEmbedLayout).observe(displayEl);
}

window.addEventListener('load', updateEmbedLayout);
window.addEventListener('resize', updateEmbedLayout);

init().catch(console.error);
