// Desktop canvas is 1440×860; the whole frame is CSS-zoomed to fit the window.
export const DESIGN_W = 1440;
export const DESIGN_H = 860;

export function fitZoom() {
  const z = Math.min(window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H);
  document.documentElement.style.setProperty('--zoom', String(z));
  return z;
}

export function installZoom() {
  fitZoom();
  window.addEventListener('resize', fitZoom);
}

export const currentZoom = () => Number(getComputedStyle(document.documentElement).getPropertyValue('--zoom')) || 1;
