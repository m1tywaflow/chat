import { domToCanvas } from "modern-screenshot";

const MAX_PARTICLES = 4500;
const MIN_CELL = 3;
const ALPHA_THRESHOLD = 12;
const PAD_LEFT = 24;
const PAD_RIGHT = 190;
const PAD_TOP = 140;
const PAD_BOTTOM = 48;
const IGNORED_SELECTOR = ".reply-btn, .react-btn, .msg-dots";

interface Particles {
  count: number;
  cell: number;
  rx: number;
  ry: number;
  px: Float32Array;
  py: Float32Array;
  tx: Float32Array;
  ty: Float32Array;
  delay: Float32Array;
  life: Float32Array;
  phase: Float32Array;
}

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

function buildParticles(
  snapshot: HTMLCanvasElement,
  width: number,
  height: number
): Particles {
  const ctx = snapshot.getContext("2d");
  if (!ctx) throw new Error("snapshot context unavailable");

  const rx = snapshot.width / width;
  const ry = snapshot.height / height;
  const data = ctx.getImageData(0, 0, snapshot.width, snapshot.height).data;

  const cell = Math.max(
    MIN_CELL,
    Math.ceil(Math.sqrt((width * height) / MAX_PARTICLES))
  );
  const cols = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);
  const total = cols * rows;

  const px = new Float32Array(total);
  const py = new Float32Array(total);
  const tx = new Float32Array(total);
  const ty = new Float32Array(total);
  const delay = new Float32Array(total);
  const life = new Float32Array(total);
  const phase = new Float32Array(total);

  let count = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cell;
      const y = r * cell;
      const ix = clamp(Math.floor((x + cell / 2) * rx), 0, snapshot.width - 1);
      const iy = clamp(Math.floor((y + cell / 2) * ry), 0, snapshot.height - 1);
      const alpha = data[(iy * snapshot.width + ix) * 4 + 3];
      if (alpha < ALPHA_THRESHOLD) continue;

      px[count] = x;
      py[count] = y;
      tx[count] = 30 + Math.random() * 130;
      ty[count] = -Math.random() * 110 + Math.random() * 24;
      delay[count] = (x / width) * 0.35 + Math.random() * 0.1;
      life[count] = 0.4 + Math.random() * 0.15;
      phase[count] = Math.random() * Math.PI * 2;
      count++;
    }
  }

  return { count, cell, rx, ry, px, py, tx, ty, delay, life, phase };
}

async function fadeOut(el: HTMLElement) {
  const animation = el.animate(
    [
      { opacity: 1, transform: "translateX(0) scale(1)" },
      { opacity: 0, transform: "translateX(24px) scale(0.96)" },
    ],
    { duration: 260, easing: "ease-in", fill: "forwards" }
  );
  try {
    await animation.finished;
  } catch {
    return;
  } finally {
    el.style.visibility = "hidden";
    animation.cancel();
  }
}

export async function disintegrate(
  el: HTMLElement,
  duration = 1100
): Promise<void> {
  if (document.hidden) return;

  const rect = el.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  let snapshot: HTMLCanvasElement;
  try {
    snapshot = await domToCanvas(el, {
      scale: dpr,
      filter: (node) =>
        !(node instanceof Element && node.matches(IGNORED_SELECTOR)),
    });
  } catch {
    await fadeOut(el);
    return;
  }

  let particles: Particles;
  try {
    particles = buildParticles(snapshot, rect.width, rect.height);
  } catch {
    snapshot.width = 0;
    await fadeOut(el);
    return;
  }

  const cssW = rect.width + PAD_LEFT + PAD_RIGHT;
  const cssH = rect.height + PAD_TOP + PAD_BOTTOM;

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(cssW * dpr);
  canvas.height = Math.ceil(cssH * dpr);
  canvas.style.cssText = `position:fixed;left:${rect.left - PAD_LEFT}px;top:${
    rect.top - PAD_TOP
  }px;width:${cssW}px;height:${cssH}px;pointer-events:none;z-index:9999;`;

  const ctx = canvas.getContext("2d");
  if (!ctx || !particles.count) {
    snapshot.width = 0;
    await fadeOut(el);
    return;
  }
  ctx.scale(dpr, dpr);

  const { count, cell, rx, ry, px, py, tx, ty, delay, life, phase } = particles;

  const render = (t: number) => {
    ctx.clearRect(0, 0, cssW, cssH);
    for (let i = 0; i < count; i++) {
      const p = clamp((t - delay[i]) / life[i], 0, 1);
      if (p >= 1) continue;

      const w = Math.min(cell, rect.width - px[i]);
      const h = Math.min(cell, rect.height - py[i]);
      const e = 1 - (1 - p) * (1 - p);
      const s = 1 - 0.55 * p;
      const dw = (w + 0.5) * s;
      const dh = (h + 0.5) * s;
      const wobble = Math.sin(p * 5 + phase[i]) * 10 * p;

      const dx = PAD_LEFT + px[i] + w / 2 + tx[i] * e - dw / 2;
      const dy = PAD_TOP + py[i] + h / 2 + ty[i] * e + wobble - dh / 2;

      ctx.globalAlpha = p === 0 ? 1 : 1 - Math.pow(p, 1.5);
      ctx.drawImage(
        snapshot,
        px[i] * rx,
        py[i] * ry,
        w * rx,
        h * ry,
        dx,
        dy,
        dw,
        dh
      );
    }
    ctx.globalAlpha = 1;
  };

  render(0);
  document.body.appendChild(canvas);
  el.style.visibility = "hidden";

  await new Promise<void>((resolve) => {
    let start: number | null = null;
    const frame = (now: number) => {
      if (start === null) start = now;
      const t = clamp((now - start) / duration, 0, 1);
      render(t);
      if (t < 1) requestAnimationFrame(frame);
      else resolve();
    };
    requestAnimationFrame(frame);
  });

  canvas.remove();
  snapshot.width = 0;
}
