import { CONFIG } from './config.js';
import { getStressLevel, getStressIndex, STRESS_POSITIONS } from './stress.js';

const DIGIT_H = 68;

/** Curva de aceleración fuerte (ease-in quint) */
function easeInQuint(t) {
  return t * t * t * t * t;
}

export class BarrioAnimator {
  constructor({ digitsEl, nameEl, indicatorDot, stressScaleEl, onFrame, onTransitionEnd }) {
    this.digitsEl = digitsEl;
    this.nameEl = nameEl;
    this.indicatorDot = indicatorDot;
    this.stressScaleEl = stressScaleEl;
    this.onFrame = onFrame;
    this.onTransitionEnd = onTransitionEnd;

    this.barrios = [];
    this.currentIndex = 0;
    this.currentCodigo = '00000';
    this.currentStress = STRESS_POSITIONS[2];
    this.currentStressIndex = 2;

    this._raf = null;
    this._playing = false;
    this._transitionStart = 0;
    this._holdStart = 0;
    this._phase = 'idle'; // idle | transition | hold
    this._targetIndex = 0;
  }

  setBarrios(barrios) {
    this.barrios = barrios;
    this._buildDigitBoxes();
    if (barrios.length) {
      const b = barrios[0];
      this.currentCodigo = b.codigo.padStart(5, '0');
      this.currentStress = getStressLevel(b.categoria);
      this.currentStressIndex = getStressIndex(b.categoria);
      this._setDigitsInstant(this.currentCodigo);
      this.nameEl.textContent = b.nombre;
      this._setReveal(1);
      this._setIndicator(this.currentStress, false);
      this._setScaleLevel(this.currentStressIndex);
    }
  }

  _buildDigitBoxes() {
    this.digitsEl.innerHTML = '';
    this.strips = [];

    for (let i = 0; i < 5; i++) {
      const box = document.createElement('div');
      box.className = 'digit-box';

      const strip = document.createElement('div');
      strip.className = 'digit-strip';

      for (let d = 0; d <= 9; d++) {
        const span = document.createElement('span');
        span.textContent = d;
        strip.appendChild(span);
      }

      box.appendChild(strip);
      this.digitsEl.appendChild(box);
      this.strips.push(strip);
    }
  }

  _setDigitsInstant(codigo) {
    codigo.split('').forEach((d, i) => {
      this.strips[i].style.transition = 'none';
      this.strips[i].style.transform = `translateY(-${Number(d) * DIGIT_H}px)`;
      this.strips[i].offsetHeight;
      this.strips[i].style.transition = '';
    });
  }

  _setDigitAnimated(index, digit, duration) {
    const strip = this.strips[index];
    strip.style.transition = `transform ${duration}s cubic-bezier(0.4, 0, 0.2, 1)`;
    strip.style.transform = `translateY(-${digit * DIGIT_H}px)`;
  }

  _setReveal(progress) {
    const p = Math.max(0, Math.min(1, progress));
    const eased = easeInQuint(p);
    const clipTop = (1 - eased) * 100;
    this.nameEl.style.clipPath = `inset(${clipTop}% 0 0 0)`;
  }

  _setIndicator(level, animate) {
    const track = this.indicatorDot.parentElement;
    const trackH = track.clientHeight;
    const dotH = this.indicatorDot.offsetHeight;
    const pad = 3;
    const maxTravel = trackH - dotH - pad * 2;
    const y = (1 - level) * maxTravel + pad;

    this.indicatorDot.style.transition = animate
      ? `bottom ${CONFIG.indicatorDuration}s cubic-bezier(0.22, 1, 0.36, 1)`
      : 'none';
    this.indicatorDot.style.bottom = `${y}px`;
  }

  _setScaleLevel(index) {
    if (!this.stressScaleEl) return;
    this.stressScaleEl.querySelectorAll('.stress-row').forEach((row) => {
      row.classList.toggle('active', Number(row.dataset.level) === index);
    });
  }

  /** Duración total de una transición entre barrios */
  getTransitionDuration() {
    const { digitStagger, digitDuration, revealDuration } = CONFIG;
    const digitSpan = digitStagger * 4 + digitDuration;
    return Math.max(digitSpan, revealDuration);
  }

  getBarrioDuration() {
    return this.getTransitionDuration() + CONFIG.holdDuration;
  }

  getTotalDuration() {
    if (this.barrios.length <= 1) return this.getBarrioDuration();
    return this.getTransitionDuration() + (this.barrios.length - 1) * this.getBarrioDuration();
  }

  /** Avanza al barrio `index` con animación */
  goTo(index, { immediate = false } = {}) {
    if (!this.barrios.length) return;

    index = ((index % this.barrios.length) + this.barrios.length) % this.barrios.length;
    this._targetIndex = index;

    if (immediate) {
      this._cancel();
      const b = this.barrios[index];
      this.currentIndex = index;
      this.currentCodigo = b.codigo;
      this.currentStress = getStressLevel(b.categoria);
      this.currentStressIndex = getStressIndex(b.categoria);
      this._setDigitsInstant(b.codigo);
      this.nameEl.textContent = b.nombre;
      this._setReveal(1);
      this._setIndicator(this.currentStress, false);
      this._setScaleLevel(this.currentStressIndex);
      this._phase = 'hold';
      this._holdStart = performance.now();
      return;
    }

    this._cancel();
    this._phase = 'transition';
    this._transitionStart = performance.now();
    this._tick();
  }

  play() {
    if (this._playing || !this.barrios.length) return;
    this._playing = true;
    if (this._phase === 'idle') {
      this._phase = 'hold';
      this._holdStart = performance.now();
    }
    this._tick();
  }

  pause() {
    this._playing = false;
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null;
  }

  _cancel() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null;
  }

  _tick = () => {
    const now = performance.now();

    if (this._phase === 'transition') {
      this._runTransition(now);
    } else if (this._phase === 'hold') {
      this._runHold(now);
    }

    this.onFrame?.(this.getState(now));

    if (this._playing || this._phase === 'transition') {
      this._raf = requestAnimationFrame(this._tick);
    }
  };

  _runTransition(now) {
    const target = this.barrios[this._targetIndex];
    const fromCodigo = this.currentCodigo.padStart(5, '0');
    const toCodigo = target.codigo.padStart(5, '0');
    const elapsed = (now - this._transitionStart) / 1000;
    const { digitStagger, digitDuration, revealDuration } = CONFIG;

    // Actualizar nombre al inicio de la transición
    if (elapsed < 0.016) {
      this.nameEl.textContent = target.nombre;
      this._setScaleLevel(getStressIndex(target.categoria));
    }

    // Dígitos: uno a uno, giro directo (sin slot machine)
    for (let i = 0; i < 5; i++) {
      const startT = i * digitStagger;
      const fromD = Number(fromCodigo[i]);
      const toD = Number(toCodigo[i]);

      if (elapsed >= startT && elapsed < startT + digitDuration) {
        // En animación: interpolar posición del strip
        const localT = (elapsed - startT) / digitDuration;
        const eased = localT < 0.5
          ? 2 * localT * localT
          : 1 - Math.pow(-2 * localT + 2, 2) / 2;

        // Giro directo: calcular dirección más corta
        let delta = toD - fromD;
        if (delta > 5) delta -= 10;
        if (delta < -5) delta += 10;
        const current = fromD + delta * eased;
        const strip = this.strips[i];
        strip.style.transition = 'none';
        strip.style.transform = `translateY(-${current * DIGIT_H}px)`;
      } else if (elapsed >= startT + digitDuration) {
        this._setDigitAnimated(i, toD, 0);
        this.strips[i].style.transition = 'none';
        this.strips[i].style.transform = `translateY(-${toD * DIGIT_H}px)`;
      }
    }

    // Revelación del nombre: de abajo hacia arriba, sincronizada, con aceleración
    const revealT = Math.min(1, elapsed / revealDuration);
    this._setReveal(revealT);

    // Indicador de categoría
    const targetStress = getStressLevel(target.categoria);
    const targetIndex = getStressIndex(target.categoria);
    const indT = Math.min(1, elapsed / CONFIG.indicatorDuration);
    const stress = this.currentStress + (targetStress - this.currentStress) * easeInQuint(indT);
    this._setIndicator(stress, false);
    this.indicatorDot.style.transition = 'none';

    const totalDuration = this.getTransitionDuration();

    if (elapsed >= totalDuration) {
      this.currentIndex = this._targetIndex;
      this.currentCodigo = toCodigo;
      this.currentStress = targetStress;
      this.currentStressIndex = targetIndex;
      this._setDigitsInstant(toCodigo);
      this._setReveal(1);
      this._setIndicator(targetStress, true);
      this._setScaleLevel(targetIndex);
      this._phase = 'hold';
      this._holdStart = now;
      this.onTransitionEnd?.(this.currentIndex);
    }
  }

  _runHold(now) {
    const elapsed = (now - this._holdStart) / 1000;

    if (this._playing && elapsed >= CONFIG.holdDuration) {
      const next = (this.currentIndex + 1) % this.barrios.length;
      this.goTo(next);
    }
  }

  getState(now = performance.now()) {
    let globalTime = 0;

    if (this._phase === 'transition') {
      globalTime = this.currentIndex * this.getBarrioDuration() + (now - this._transitionStart) / 1000;
    } else {
      globalTime = this.currentIndex * this.getBarrioDuration() + (now - this._holdStart) / 1000;
    }

    return {
      index: this.currentIndex,
      targetIndex: this._targetIndex,
      phase: this._phase,
      globalTime,
      frame: Math.round(globalTime * CONFIG.fps),
      barrio: this.barrios[this._phase === 'transition' ? this._targetIndex : this.currentIndex],
    };
  }

  /** Exporta timeline para sincronizar con After Effects */
  exportTimeline() {
    const events = [];
    let t = 0;
    const transDur = this.getTransitionDuration();

    this.barrios.forEach((b, i) => {
      if (i > 0) t += CONFIG.holdDuration;

      const fromCodigo = this.barrios[i - 1]?.codigo ?? b.codigo;

      events.push({
        barrio: b.nombre,
        codigo: b.codigo,
        categoria: b.categoria,
        stressIndex: getStressIndex(b.categoria),
        stress: getStressLevel(b.categoria),
        startSec: +t.toFixed(3),
        startFrame: Math.round(t * CONFIG.fps),
        digits: Array.from({ length: 5 }, (_, d) => ({
          index: d,
          from: fromCodigo.padStart(5, '0')[d],
          to: b.codigo.padStart(5, '0')[d],
          startSec: +(t + d * CONFIG.digitStagger).toFixed(3),
          startFrame: Math.round((t + d * CONFIG.digitStagger) * CONFIG.fps),
        })),
        nameRevealStartSec: +t.toFixed(3),
        nameRevealEndSec: +(t + CONFIG.revealDuration).toFixed(3),
        indicatorTarget: getStressLevel(b.categoria),
        indicatorIndex: getStressIndex(b.categoria),
        transitionEndSec: +(t + transDur).toFixed(3),
      });

      t += transDur;
    });

    return {
      fps: CONFIG.fps,
      config: { ...CONFIG },
      totalDurationSec: +t.toFixed(3),
      totalFrames: Math.round(t * CONFIG.fps),
      events,
    };
  }
}
