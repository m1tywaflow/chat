const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

export async function disintegrate(el: HTMLElement, duration = 900): Promise<void> {
  // if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const rect = el.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  const cs = getComputedStyle(el);
  const cols = clamp(Math.round(rect.width / 28), 4, 12);
  const rows = clamp(Math.round(rect.height / 28), 3, 6);

  const overlay = document.createElement("div");
  overlay.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;pointer-events:none;z-index:9999;color:${cs.color};font-family:${cs.fontFamily};font-size:${cs.fontSize};`;

  const animations: Animation[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tile = document.createElement("div");
      const top = (r / rows) * 100;
      const bottom = 100 - ((r + 1) / rows) * 100;
      const left = (c / cols) * 100;
      const right = 100 - ((c + 1) / cols) * 100;
      tile.style.cssText = `position:absolute;inset:0;will-change:transform,opacity,filter;clip-path:inset(${top}% ${right}% ${bottom}% ${left}%);`;

      const clone = el.cloneNode(true) as HTMLElement;
      clone.removeAttribute("data-msg-anim");
      Object.assign(clone.style, {
        position: "absolute",
        left: "0",
        top: "0",
        margin: "0",
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        maxWidth: "none",
        animation: "none",
        transform: "none",
      });
      tile.appendChild(clone);
      overlay.appendChild(tile);

      const dx = 30 + Math.random() * 90;
      const dy = -(10 + Math.random() * 80);
      const rot = (Math.random() - 0.5) * 60;
      const delay = (c / cols) * 260 + Math.random() * 140;

      animations.push(
        tile.animate(
          [
            { transform: "translate(0,0) rotate(0deg) scale(1)", opacity: 1, filter: "blur(0px)" },
            { transform: `translate(${dx}px,${dy}px) rotate(${rot}deg) scale(0.5)`, opacity: 0, filter: "blur(4px)" },
          ],
          { duration, delay, easing: "cubic-bezier(.2,.6,.3,1)", fill: "forwards" }
        )
      );
    }
  }

  document.body.appendChild(overlay);
  el.style.visibility = "hidden";

  try {
    await Promise.all(animations.map((a) => a.finished.catch(() => {})));
  } finally {
    overlay.remove();
  }
}