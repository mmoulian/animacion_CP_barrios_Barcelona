import { loadBarrios } from './data.js';
import { BarrioAnimator } from './animation.js';

const DESIGN_WIDTH = 960;

const animator = new BarrioAnimator({
  digitsEl: document.getElementById('digits'),
  nameEl: document.getElementById('name'),
  vulnerabilityEl: document.getElementById('vulnerability'),
  thermalStressEl: document.getElementById('thermal-stress'),
  indicatorFill: document.getElementById('stress-fill'),
  stressScaleEl: document.getElementById('stress-scale'),
});

function updateEmbedLayout() {
  const scale = Math.min(1, window.innerWidth / DESIGN_WIDTH);
  document.documentElement.style.setProperty('--embed-scale', String(scale));

  const display = document.querySelector('.display');
  const scaler = document.querySelector('.embed-scaler');
  if (display && scaler) {
    scaler.style.height = `${Math.ceil(display.offsetHeight * scale)}px`;
  }

  reportEmbedHeight();
}

function reportEmbedHeight() {
  const scaler = document.querySelector('.embed-scaler');
  const height = Math.ceil(scaler?.offsetHeight ?? document.documentElement.scrollHeight);
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'cp-barrios-embed-height', height }, '*');
  }
}

async function init() {
  const barrios = await loadBarrios();
  animator.setBarrios(barrios);
  animator.play();
  updateEmbedLayout();
}

window.addEventListener('load', updateEmbedLayout);
window.addEventListener('resize', updateEmbedLayout);

init().catch(console.error);
