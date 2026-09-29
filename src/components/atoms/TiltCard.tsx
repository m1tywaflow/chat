"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";

export function TiltCard({
  children,
  max = 9,
  className = "",
  style,
}: {
  children: ReactNode;
  max?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const raf = useRef<number | null>(null);

  function onMove(e: React.PointerEvent) {
    if (e.pointerType !== "mouse") return; // на тач-экранах не наклоняем
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;

    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      el.style.transition = "transform 90ms linear";
      el.style.setProperty("--rx", `${(0.5 - py) * max * 2}deg`);
      el.style.setProperty("--ry", `${(px - 0.5) * max * 2}deg`);
      el.style.setProperty("--mx", `${px * 100}%`);
      el.style.setProperty("--my", `${py * 100}%`);
      el.style.setProperty("--px", `${px - 0.5}`);
      el.style.setProperty("--py", `${py - 0.5}`);
      el.style.setProperty("--glare", "1");
    });
  }

  function onLeave() {
    const el = ref.current;
    if (!el) return;
    if (raf.current) cancelAnimationFrame(raf.current);
    el.style.transition = "transform 600ms cubic-bezier(.22,1,.36,1)";
    ["--rx", "--ry", "--px", "--py"].forEach((v) => el.style.setProperty(v, "0"));
    el.style.setProperty("--glare", "0");
  }

  return (
    <div style={{ perspective: 900 }} className={className}>
      <div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className="relative"
        style={{
          transformStyle: "preserve-3d",
          transform: "rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))",
          willChange: "transform",
          ...style,
        }}
      >
        {children}

        {/* блик по стеклу */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: "var(--glare,0)" as any,
            transition: "opacity 300ms",
            background:
              "radial-gradient(circle at var(--mx,50%) var(--my,50%), rgba(255,255,255,0.20), rgba(169,150,255,0.08) 35%, transparent 60%)",
            mixBlendMode: "soft-light",
            transform: "translateZ(1px)",
          }}
        />
      </div>
    </div>
  );
}

/** Слой на своей глубине: чем больше depth, тем сильнее параллакс и "ближе" к камере */
export function TiltLayer({
  depth = 20,
  children,
  className = "",
  style,
}: {
  depth?: number;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        transform: `translate3d(calc(var(--px,0) * ${depth}px), calc(var(--py,0) * ${depth}px), ${depth}px)`,
        transition: "transform 90ms linear",
        ...style,
      }}
    >
      {children}
    </div>
  );
}