/** Parámetros de timing — ajustables para sincronizar con After Effects */
export const CONFIG = {
  fps: 25,

  /** Segundos entre el inicio de cada dígito (secuencial, uno a uno) */
  digitStagger: 0.07,

  /** Duración del giro de cada dígito individual */
  digitDuration: 0.18,

  /** Duración total de la revelación del nombre (sincronizada con los dígitos) */
  revealDuration: 0.45,

  /** Curva de aceleración del reveal (CSS cubic-bezier) — gran aceleración al final */
  revealEase: 'cubic-bezier(0.55, 0.0, 0.85, 0.05)',

  /** Duración del movimiento del indicador de categoría */
  indicatorDuration: 0.35,

  /** Tiempo de pausa con cada barrio visible antes del siguiente */
  holdDuration: 1.2,
};
