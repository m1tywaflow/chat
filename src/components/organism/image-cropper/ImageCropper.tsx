// "use client";

// import { useEffect, useRef, useState, useCallback } from "react";
// import { X, Check, ZoomIn, ZoomOut } from "lucide-react";

// interface ImageCropperProps {
//   src: string;
//   aspectRatio: number;
//   onConfirm: (blob: Blob) => void;
//   onCancel: () => void;
//   label?: string;
// }

// export default function ImageCropper({
//   src,
//   aspectRatio,
//   onConfirm,
//   onCancel,
//   label,
// }: ImageCropperProps) {
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const containerRef = useRef<HTMLDivElement>(null);
//   const imgRef = useRef<HTMLImageElement | null>(null);

//   const [scale, setScale] = useState(1);
//   const [offset, setOffset] = useState({ x: 0, y: 0 });
//   const [dragging, setDragging] = useState(false);
//   const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
//   const [imgLoaded, setImgLoaded] = useState(false);

//   const CANVAS_W = 320;
//   const CANVAS_H = Math.round(CANVAS_W / aspectRatio);

//   useEffect(() => {
//     const img = new Image();
//     img.onload = () => {
//       imgRef.current = img;
//       const scaleX = CANVAS_W / img.width;
//       const scaleY = CANVAS_H / img.height;
//       const initScale = Math.max(scaleX, scaleY);
//       setScale(initScale);
//       setOffset({
//         x: (CANVAS_W - img.width * initScale) / 2,
//         y: (CANVAS_H - img.height * initScale) / 2,
//       });
//       setImgLoaded(true);
//     };
//     img.src = src;
//   }, [src, CANVAS_W, CANVAS_H]);

//   const draw = useCallback(() => {
//     const canvas = canvasRef.current;
//     const img = imgRef.current;
//     if (!canvas || !img) return;
//     const ctx = canvas.getContext("2d");
//     if (!ctx) return;
//     ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
//     ctx.drawImage(
//       img,
//       offset.x,
//       offset.y,
//       img.width * scale,
//       img.height * scale
//     );

//     // grid overlay
//     ctx.strokeStyle = "rgba(255,255,255,0.18)";
//     ctx.lineWidth = 0.5;
//     const cols = 3;
//     const rows = 3;
//     for (let i = 1; i < cols; i++) {
//       ctx.beginPath();
//       ctx.moveTo((CANVAS_W / cols) * i, 0);
//       ctx.lineTo((CANVAS_W / cols) * i, CANVAS_H);
//       ctx.stroke();
//     }
//     for (let j = 1; j < rows; j++) {
//       ctx.beginPath();
//       ctx.moveTo(0, (CANVAS_H / rows) * j);
//       ctx.lineTo(CANVAS_W, (CANVAS_H / rows) * j);
//       ctx.stroke();
//     }

//     // border
//     ctx.strokeStyle = "rgba(167,139,250,0.6)";
//     ctx.lineWidth = 1.5;
//     ctx.strokeRect(0, 0, CANVAS_W, CANVAS_H);
//   }, [offset, scale, CANVAS_W, CANVAS_H]);

//   useEffect(() => {
//     draw();
//   }, [draw, imgLoaded]);

//   function clampOffset(ox: number, oy: number, s: number) {
//     const img = imgRef.current;
//     if (!img) return { x: ox, y: oy };
//     const w = img.width * s;
//     const h = img.height * s;
//     return {
//       x: Math.min(0, Math.max(CANVAS_W - w, ox)),
//       y: Math.min(0, Math.max(CANVAS_H - h, oy)),
//     };
//   }

//   function onMouseDown(e: React.MouseEvent) {
//     setDragging(true);
//     setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
//   }

//   function onMouseMove(e: React.MouseEvent) {
//     if (!dragging) return;
//     const raw = { x: e.clientX - dragStart.x, y: e.clientY - dragStart.y };
//     setOffset(clampOffset(raw.x, raw.y, scale));
//   }

//   function onMouseUp() {
//     setDragging(false);
//   }

//   function onTouchStart(e: React.TouchEvent) {
//     const t = e.touches[0];
//     setDragging(true);
//     setDragStart({ x: t.clientX - offset.x, y: t.clientY - offset.y });
//   }

//   function onTouchMove(e: React.TouchEvent) {
//     if (!dragging) return;
//     const t = e.touches[0];
//     const raw = { x: t.clientX - dragStart.x, y: t.clientY - dragStart.y };
//     setOffset(clampOffset(raw.x, raw.y, scale));
//   }

//   function changeScale(delta: number) {
//     const img = imgRef.current;
//     if (!img) return;
//     const minScale = Math.max(CANVAS_W / img.width, CANVAS_H / img.height);
//     const next = Math.min(4, Math.max(minScale, scale + delta));
//     const cx = CANVAS_W / 2;
//     const cy = CANVAS_H / 2;
//     const nx = cx - (cx - offset.x) * (next / scale);
//     const ny = cy - (cy - offset.y) * (next / scale);
//     setScale(next);
//     setOffset(clampOffset(nx, ny, next));
//   }

//   function handleWheel(e: React.WheelEvent) {
//     e.preventDefault();
//     changeScale(e.deltaY < 0 ? 0.08 : -0.08);
//   }

//   function confirm() {
//     const canvas = canvasRef.current;
//     if (!canvas) return;
//     canvas.toBlob(
//       (blob) => {
//         if (blob) onConfirm(blob);
//       },
//       "image/jpeg",
//       0.92
//     );
//   }

//   return (
//     <div
//       className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80"
//       onClick={onCancel}
//     >
//       <div
//         className="flex flex-col items-center gap-4 bg-[#0f1520] border border-white/[0.08] rounded-2xl p-5 w-[360px]"
//         onClick={(e) => e.stopPropagation()}
//       >
//         <div className="flex items-center justify-between w-full">
//           <span className="text-xs text-white/40 uppercase tracking-widest">
//             {label ?? "Adjust image"}
//           </span>
//           <button
//             onClick={onCancel}
//             className="text-white/30 hover:text-white/70 transition-colors"
//           >
//             <X size={16} />
//           </button>
//         </div>

//         <div
//           ref={containerRef}
//           className="relative overflow-hidden rounded-xl"
//           style={{
//             width: CANVAS_W,
//             height: CANVAS_H,
//             cursor: dragging ? "grabbing" : "grab",
//           }}
//           onMouseDown={onMouseDown}
//           onMouseMove={onMouseMove}
//           onMouseUp={onMouseUp}
//           onMouseLeave={onMouseUp}
//           onTouchStart={onTouchStart}
//           onTouchMove={onTouchMove}
//           onTouchEnd={onMouseUp}
//           onWheel={handleWheel}
//         >
//           <canvas
//             ref={canvasRef}
//             width={CANVAS_W}
//             height={CANVAS_H}
//             className="block"
//           />
//         </div>

//         <div className="flex items-center gap-2 w-full">
//           <button
//             onClick={() => changeScale(-0.1)}
//             className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
//           >
//             <ZoomOut size={16} />
//           </button>
//           <input
//             type="range"
//             min={0}
//             max={100}
//             value={Math.round(
//               ((scale -
//                 (imgRef.current
//                   ? Math.max(
//                       CANVAS_W / imgRef.current.width,
//                       CANVAS_H / imgRef.current.height
//                     )
//                   : 1)) /
//                 3) *
//                 100
//             )}
//             onChange={(e) => {
//               const img = imgRef.current;
//               if (!img) return;
//               const minS = Math.max(
//                 CANVAS_W / img.width,
//                 CANVAS_H / img.height
//               );
//               const next = minS + (Number(e.target.value) / 100) * 3;
//               const cx = CANVAS_W / 2;
//               const cy = CANVAS_H / 2;
//               const nx = cx - (cx - offset.x) * (next / scale);
//               const ny = cy - (cy - offset.y) * (next / scale);
//               setScale(next);
//               setOffset(clampOffset(nx, ny, next));
//             }}
//             className="flex-1 accent-[#A78BFA]"
//           />
//           <button
//             onClick={() => changeScale(0.1)}
//             className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
//           >
//             <ZoomIn size={16} />
//           </button>
//         </div>

//         <p className="text-[10px] text-white/25 tracking-wide">
//           Drag to reposition · scroll or pinch to zoom
//         </p>

//         <div className="flex gap-2 w-full">
//           <button
//             onClick={onCancel}
//             className="flex-1 py-2 text-[11px] text-white/30 hover:text-white/60 border border-white/[0.08] rounded-lg transition-colors tracking-widest"
//           >
//             CANCEL
//           </button>
//           <button
//             onClick={confirm}
//             className="flex-1 py-2 text-[11px] text-[#A78BFA] hover:text-white border border-[#A78BFA]/30 hover:border-[#A78BFA]/60 rounded-lg transition-colors tracking-widest flex items-center justify-center gap-1.5"
//           >
//             <Check size={12} /> APPLY
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Check, ZoomIn, ZoomOut } from "lucide-react";

interface ImageCropperProps {
  src: string;
  aspectRatio: number;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
  label?: string;
}

const CONTAINER_W = 320;
const HANDLE_SIZE = 10;

type DragMode = "move" | "nw" | "ne" | "sw" | "se" | null;

export default function ImageCropper({
  src,
  aspectRatio,
  onConfirm,
  onCancel,
  label,
}: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragMode = useRef<DragMode>(null);
  const dragStart = useRef({ x: 0, y: 0, cx: 0, cy: 0, cw: 0, ch: 0 });

  const CONTAINER_H = Math.round(CONTAINER_W / aspectRatio);
  const MIN_CROP = 40;

  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgRect, setImgRect] = useState({
    x: 0,
    y: 0,
    w: CONTAINER_W,
    h: CONTAINER_H,
  });
  const [crop, setCrop] = useState({
    x: 0,
    y: 0,
    w: CONTAINER_W,
    h: CONTAINER_H,
  });
  const [scale, setScale] = useState(1);

  // Load image and fit to container
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const s = Math.min(CONTAINER_W / img.width, CONTAINER_H / img.height);
      const w = img.width * s;
      const h = img.height * s;
      const x = (CONTAINER_W - w) / 2;
      const y = (CONTAINER_H - h) / 2;
      setImgRect({ x, y, w, h });
      setScale(s);
      // initial crop = full image area
      setCrop({ x, y, w, h });
      setImgLoaded(true);
    };
    img.src = src;
  }, [src, CONTAINER_H]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CONTAINER_W, CONTAINER_H);

    // draw full image dimmed
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.drawImage(img, imgRect.x, imgRect.y, imgRect.w, imgRect.h);
    ctx.restore();

    // draw cropped region bright
    ctx.save();
    ctx.beginPath();
    ctx.rect(crop.x, crop.y, crop.w, crop.h);
    ctx.clip();
    ctx.drawImage(img, imgRect.x, imgRect.y, imgRect.w, imgRect.h);
    ctx.restore();

    // dark overlay outside crop
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, CONTAINER_W, crop.y); // top
    ctx.fillRect(
      0,
      crop.y + crop.h,
      CONTAINER_W,
      CONTAINER_H - crop.y - crop.h
    ); // bottom
    ctx.fillRect(0, crop.y, crop.x, crop.h); // left
    ctx.fillRect(
      crop.x + crop.w,
      crop.y,
      CONTAINER_W - crop.x - crop.w,
      crop.h
    ); // right
    ctx.restore();

    // grid lines inside crop
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 0.5;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(crop.x + (crop.w / 3) * i, crop.y);
      ctx.lineTo(crop.x + (crop.w / 3) * i, crop.y + crop.h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(crop.x, crop.y + (crop.h / 3) * i);
      ctx.lineTo(crop.x + crop.w, crop.y + (crop.h / 3) * i);
      ctx.stroke();
    }
    ctx.restore();

    // crop border
    ctx.strokeStyle = "#A78BFA";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(crop.x, crop.y, crop.w, crop.h);

    // corner handles
    const hs = HANDLE_SIZE;
    const corners = [
      { x: crop.x - hs / 2, y: crop.y - hs / 2 },
      { x: crop.x + crop.w - hs / 2, y: crop.y - hs / 2 },
      { x: crop.x - hs / 2, y: crop.y + crop.h - hs / 2 },
      { x: crop.x + crop.w - hs / 2, y: crop.y + crop.h - hs / 2 },
    ];
    ctx.fillStyle = "#A78BFA";
    corners.forEach(({ x, y }) => {
      ctx.beginPath();
      ctx.roundRect(x, y, hs, hs, 2);
      ctx.fill();
    });

    // L-shaped thick corner accents
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    const L = 14;
    [
      [crop.x, crop.y, 1, 1],
      [crop.x + crop.w, crop.y, -1, 1],
      [crop.x, crop.y + crop.h, 1, -1],
      [crop.x + crop.w, crop.y + crop.h, -1, -1],
    ].forEach(([cx, cy, dx, dy]) => {
      ctx.beginPath();
      ctx.moveTo(cx + dx * L, cy);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx, cy + dy * L);
      ctx.stroke();
    });
  }, [crop, imgRect, CONTAINER_H]);

  useEffect(() => {
    draw();
  }, [draw, imgLoaded]);

  function clampCrop(c: { x: number; y: number; w: number; h: number }) {
    const x = Math.max(imgRect.x, c.x);
    const y = Math.max(imgRect.y, c.y);
    const maxW = imgRect.x + imgRect.w - x;
    const maxH = imgRect.y + imgRect.h - y;
    const w = Math.min(maxW, Math.max(MIN_CROP, c.w));
    const h = Math.min(maxH, Math.max(MIN_CROP, c.h));
    return { x, y, w, h };
  }

  function getMode(e: { offsetX: number; offsetY: number }): DragMode {
    const { x, y, w, h } = crop;
    const t = HANDLE_SIZE + 4;
    const mx = e.offsetX,
      my = e.offsetY;
    if (Math.abs(mx - x) < t && Math.abs(my - y) < t) return "nw";
    if (Math.abs(mx - (x + w)) < t && Math.abs(my - y) < t) return "ne";
    if (Math.abs(mx - x) < t && Math.abs(my - (y + h)) < t) return "sw";
    if (Math.abs(mx - (x + w)) < t && Math.abs(my - (y + h)) < t) return "se";
    if (mx > x && mx < x + w && my > y && my < y + h) return "move";
    return null;
  }

  function getCursor(mode: DragMode) {
    if (mode === "nw" || mode === "se") return "nwse-resize";
    if (mode === "ne" || mode === "sw") return "nesw-resize";
    if (mode === "move") return "move";
    return "default";
  }

  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const ox = e.clientX - rect.left,
      oy = e.clientY - rect.top;
    const mode = getMode({ offsetX: ox, offsetY: oy });
    if (!mode) return;
    dragMode.current = mode;
    dragStart.current = {
      x: ox,
      y: oy,
      cx: crop.x,
      cy: crop.y,
      cw: crop.w,
      ch: crop.h,
    };
    e.preventDefault();
  }

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const ox = e.clientX - rect.left,
        oy = e.clientY - rect.top;

      if (!dragMode.current) {
        const mode = getMode({ offsetX: ox, offsetY: oy });
        e.currentTarget.style.cursor = getCursor(mode);
        return;
      }

      const dx = ox - dragStart.current.x;
      const dy = oy - dragStart.current.y;
      const { cx, cy, cw, ch } = dragStart.current;
      let nc = { x: crop.x, y: crop.y, w: crop.w, h: crop.h };

      if (dragMode.current === "move") {
        nc = clampCrop({ x: cx + dx, y: cy + dy, w: cw, h: ch });
      } else if (dragMode.current === "se") {
        nc = clampCrop({ x: cx, y: cy, w: cw + dx, h: ch + dy });
      } else if (dragMode.current === "sw") {
        const newW = Math.max(MIN_CROP, cw - dx);
        nc = clampCrop({ x: cx + cw - newW, y: cy, w: newW, h: ch + dy });
      } else if (dragMode.current === "ne") {
        const newH = Math.max(MIN_CROP, ch - dy);
        nc = clampCrop({ x: cx, y: cy + ch - newH, w: cw + dx, h: newH });
      } else if (dragMode.current === "nw") {
        const newW = Math.max(MIN_CROP, cw - dx);
        const newH = Math.max(MIN_CROP, ch - dy);
        nc = clampCrop({
          x: cx + cw - newW,
          y: cy + ch - newH,
          w: newW,
          h: newH,
        });
      }

      setCrop(nc);
    },
    [crop, imgRect]
  );

  function onMouseUp() {
    dragMode.current = null;
  }

  function onTouchStart(e: React.TouchEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const t = e.touches[0];
    const ox = t.clientX - rect.left,
      oy = t.clientY - rect.top;
    const mode = getMode({ offsetX: ox, offsetY: oy });
    if (!mode) return;
    dragMode.current = mode;
    dragStart.current = {
      x: ox,
      y: oy,
      cx: crop.x,
      cy: crop.y,
      cw: crop.w,
      ch: crop.h,
    };
  }

  function onTouchMove(e: React.TouchEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const t = e.touches[0];
    const fakeEvent = {
      clientX: t.clientX,
      clientY: t.clientY,
      currentTarget: {
        getBoundingClientRect: () => rect,
        style: { cursor: "" },
      },
    } as any;
    onMouseMove(fakeEvent);
  }

  function changeScale(delta: number) {
    const img = imgRef.current;
    if (!img) return;
    const minS = Math.min(CONTAINER_W / img.width, CONTAINER_H / img.height);
    const next = Math.min(4, Math.max(minS, scale + delta));
    const w = img.width * next;
    const h = img.height * next;
    const x = (CONTAINER_W - w) / 2;
    const y = (CONTAINER_H - h) / 2;
    setImgRect({ x, y, w, h });
    setScale(next);
    setCrop((prev) => clampCrop({ ...prev }));
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    changeScale(e.deltaY < 0 ? 0.05 : -0.05);
  }

  function confirm() {
    const img = imgRef.current;
    if (!img) return;
    const out = document.createElement("canvas");
    // map crop coords back to original image pixels
    const srcX = (crop.x - imgRect.x) / scale;
    const srcY = (crop.y - imgRect.y) / scale;
    const srcW = crop.w / scale;
    const srcH = crop.h / scale;
    out.width = Math.round(srcW);
    out.height = Math.round(srcH);
    const ctx = out.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, out.width, out.height);
    out.toBlob(
      (blob) => {
        if (blob) onConfirm(blob);
      },
      "image/jpeg",
      0.92
    );
  }

  const sliderVal = imgRef.current
    ? Math.round(
        ((scale -
          Math.min(
            CONTAINER_W / imgRef.current.width,
            CONTAINER_H / imgRef.current.height
          )) /
          3) *
          100
      )
    : 0;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80"
      onClick={onCancel}
    >
      <div
        className="flex flex-col items-center gap-4 bg-[#0f1520] border border-white/[0.08] rounded-2xl p-5 w-[360px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-white/40 uppercase tracking-widest">
            {label ?? "Adjust image"}
          </span>
          <button
            onClick={onCancel}
            className="text-white/30 hover:text-white/70 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div
          className="relative rounded-xl overflow-hidden bg-[#080c12]"
          style={{ width: CONTAINER_W, height: CONTAINER_H }}
        >
          <canvas
            ref={canvasRef}
            width={CONTAINER_W}
            height={CONTAINER_H}
            className="block"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onMouseUp}
            onWheel={handleWheel}
          />
        </div>

        <div className="flex items-center gap-2 w-full">
          <button
            onClick={() => changeScale(-0.08)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <ZoomOut size={16} />
          </button>
          <input
            type="range"
            min={0}
            max={100}
            value={sliderVal}
            onChange={(e) => {
              const img = imgRef.current;
              if (!img) return;
              const minS = Math.min(
                CONTAINER_W / img.width,
                CONTAINER_H / img.height
              );
              const next = minS + (Number(e.target.value) / 100) * 3;
              const w = img.width * next;
              const h = img.height * next;
              setImgRect({
                x: (CONTAINER_W - w) / 2,
                y: (CONTAINER_H - h) / 2,
                w,
                h,
              });
              setScale(next);
            }}
            className="flex-1 accent-[#A78BFA]"
          />
          <button
            onClick={() => changeScale(0.08)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <ZoomIn size={16} />
          </button>
        </div>

        <p className="text-[10px] text-white/25 tracking-wide">
          Drag corners to crop · scroll to zoom image
        </p>

        <div className="flex gap-2 w-full">
          <button
            onClick={onCancel}
            className="flex-1 py-2 text-[11px] text-white/30 hover:text-white/60 border border-white/[0.08] rounded-lg transition-colors tracking-widest"
          >
            CANCEL
          </button>
          <button
            onClick={confirm}
            className="flex-1 py-2 text-[11px] text-[#A78BFA] hover:text-white border border-[#A78BFA]/30 hover:border-[#A78BFA]/60 rounded-lg transition-colors tracking-widest flex items-center justify-center gap-1.5"
          >
            <Check size={12} /> APPLY
          </button>
        </div>
      </div>
    </div>
  );
}
