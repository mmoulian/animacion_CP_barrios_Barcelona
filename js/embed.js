import { loadBarrios } from './data.js';
import { BarrioAnimator } from './animation.js';

const animator = new BarrioAnimator({
  digitsEl: document.getElementById('digits'),
  nameEl: document.getElementById('name'),
  indicatorFill: document.getElementById('stress-fill'),
  stressScaleEl: document.getElementById('stress-scale'),
});

async function init() {
  const barrios = await loadBarrios();
  animator.setBarrios(barrios);
  animator.play();
}

init().catch(console.error);
