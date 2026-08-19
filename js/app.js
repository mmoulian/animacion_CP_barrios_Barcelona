import { CONFIG } from './config.js';
import { loadBarrios } from './data.js';
import { getStressLabel } from './stress.js';
import { BarrioAnimator } from './animation.js';

const digitsEl = document.getElementById('digits');
const nameEl = document.getElementById('name');
const indicatorFill = document.getElementById('stress-fill');
const timecodeEl = document.getElementById('timecode');
const infoEl = document.getElementById('info');
const statusEl = document.getElementById('status');
const scrubberEl = document.getElementById('scrubber');
const btnPlay = document.getElementById('btn-play');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const btnExport = document.getElementById('btn-export');

const animator = new BarrioAnimator({
  digitsEl,
  nameEl,
  vulnerabilityEl: document.getElementById('vulnerability'),
  thermalStressEl: document.getElementById('thermal-stress'),
  indicatorFill,
  stressScaleEl: document.getElementById('stress-scale'),
  onFrame: updateUI,
  onTransitionEnd: (i) => {
    scrubberEl.value = i;
  },
});

function secToTimecode(sec) {
  const f = Math.floor(sec * CONFIG.fps);
  const s = Math.floor(sec);
  const frames = f % CONFIG.fps;
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
}

function updateUI(state) {
  if (!state?.barrio) return;
  const { globalTime, frame, barrio, index, phase } = state;

  timecodeEl.textContent = `${secToTimecode(globalTime)}  (${frame}f @ ${CONFIG.fps}fps)`;
  infoEl.innerHTML = `<strong>${index + 1}/${animator.barrios.length}</strong> · ${barrio.nombre}<br>${getStressLabel(barrio.categoria)}`;
  statusEl.textContent = phase === 'transition' ? '⟳ transición' : '● hold';

  if (document.activeElement !== scrubberEl) {
    scrubberEl.value = index;
  }
}

function bindConfigSliders() {
  const fields = [
    ['digitStagger', 'cfg-stagger'],
    ['digitDuration', 'cfg-digit-dur'],
    ['revealDuration', 'cfg-reveal-dur'],
    ['indicatorDuration', 'cfg-ind-dur'],
    ['holdDuration', 'cfg-hold-dur'],
  ];

  fields.forEach(([key, id]) => {
    const input = document.getElementById(id);
    const output = document.getElementById(`${id}-val`);
    if (!input) return;

    input.value = CONFIG[key];
    output.textContent = CONFIG[key];

    input.addEventListener('input', () => {
      CONFIG[key] = parseFloat(input.value);
      output.textContent = CONFIG[key];
    });
  });

  const fpsInput = document.getElementById('cfg-fps');
  const fpsOut = document.getElementById('cfg-fps-val');
  fpsInput.value = CONFIG.fps;
  fpsOut.textContent = CONFIG.fps;
  fpsInput.addEventListener('input', () => {
    CONFIG.fps = parseInt(fpsInput.value, 10);
    fpsOut.textContent = CONFIG.fps;
  });
}

async function init() {
  try {
    const barrios = await loadBarrios();
    animator.setBarrios(barrios);

    scrubberEl.max = barrios.length - 1;
    scrubberEl.value = 0;

    statusEl.textContent = `${barrios.length} barrios cargados`;
  } catch (err) {
    statusEl.textContent = `Error: ${err.message}. Ejecuta un servidor local (ver README).`;
    console.error(err);
  }

  bindConfigSliders();
  updateUI(animator.getState());
}

btnPlay.addEventListener('click', () => {
  if (animator._playing) {
    animator.pause();
    btnPlay.textContent = '▶ Play';
    btnPlay.classList.remove('active');
  } else {
    animator.play();
    btnPlay.textContent = '■ Pause';
    btnPlay.classList.add('active');
  }
});

btnPrev.addEventListener('click', () => {
  animator.pause();
  btnPlay.textContent = '▶ Play';
  btnPlay.classList.remove('active');
  animator.goTo(animator.currentIndex - 1, { immediate: true });
  updateUI(animator.getState());
});

btnNext.addEventListener('click', () => {
  animator.pause();
  btnPlay.textContent = '▶ Play';
  btnPlay.classList.remove('active');
  animator.goTo(animator.currentIndex + 1);
});

scrubberEl.addEventListener('input', () => {
  animator.pause();
  btnPlay.textContent = '▶ Play';
  btnPlay.classList.remove('active');
  animator.goTo(parseInt(scrubberEl.value, 10), { immediate: true });
  updateUI(animator.getState());
});

btnExport.addEventListener('click', () => {
  const timeline = animator.exportTimeline();
  const blob = new Blob([JSON.stringify(timeline, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'timeline_ae.json';
  a.click();
  URL.revokeObjectURL(a.href);
  statusEl.textContent = `Timeline exportada · ${timeline.totalFrames} frames · ${timeline.totalDurationSec}s`;
});

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') { e.preventDefault(); btnPlay.click(); }
  if (e.code === 'ArrowRight') btnNext.click();
  if (e.code === 'ArrowLeft') btnPrev.click();
});

init();
