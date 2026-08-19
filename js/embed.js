import { loadBarrios } from './data.js';
import { BarrioAnimator } from './animation.js';

const animator = new BarrioAnimator({
  digitsEl: document.getElementById('digits'),
  nameEl: document.getElementById('name'),
  vulnerabilityEl: document.getElementById('vulnerability'),
  thermalStressEl: document.getElementById('thermal-stress'),
  indicatorFill: document.getElementById('stress-fill'),
  stressScaleEl: document.getElementById('stress-scale'),
});

async function init() {
  const barrios = await loadBarrios();
  animator.setBarrios(barrios);
  animator.play();
  reportEmbedHeight();
}

function reportEmbedHeight() {
  const height = Math.ceil(document.documentElement.scrollHeight);
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'cp-barrios-embed-height', height }, '*');
  }
}

window.addEventListener('load', reportEmbedHeight);
window.addEventListener('resize', reportEmbedHeight);

init().catch(console.error);
