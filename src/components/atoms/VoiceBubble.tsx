// "use client";

// import { useEffect, useRef, useState } from "react";
// import { Play, Pause } from "lucide-react";
// import { usePlayerStore } from "@/store/chat-store";

// export default function VoiceBubble({
//   id,
//   audioUrl,
//   duration,
//   waveform,
//   isMine,
// }: {
//   id: string;
//   audioUrl: string;
//   duration: number;
//   waveform: number[];
//   isMine: boolean;
// }) {
//   const audioRef = useRef<HTMLAudioElement | null>(null);
//   const [progress, setProgress] = useState(0);
//   const [speed, setSpeed] = useState<1 | 1.5 | 2>(1);

//   const currentlyPlayingId = usePlayerStore((s) => s.currentlyPlayingId);
//   const setCurrentlyPlaying = usePlayerStore((s) => s.setCurrentlyPlaying);
//   const isPlaying = currentlyPlayingId === id;

//   useEffect(() => {
//     const audio = new Audio(audioUrl);
//     audioRef.current = audio;

//     const onTime = () =>
//       setProgress(audio.currentTime / (audio.duration || duration));
//     const onEnd = () => {
//       setCurrentlyPlaying(null);
//       setProgress(0);
//     };

//     audio.addEventListener("timeupdate", onTime);
//     audio.addEventListener("ended", onEnd);
//     return () => {
//       audio.pause();
//       audio.removeEventListener("timeupdate", onTime);
//       audio.removeEventListener("ended", onEnd);
//     };
//   }, [audioUrl, duration, setCurrentlyPlaying]);

//   useEffect(() => {
//     if (!audioRef.current) return;
//     if (isPlaying) {
//       audioRef.current.playbackRate = speed;
//       audioRef.current.play();
//     } else {
//       audioRef.current.pause();
//     }
//   }, [isPlaying, speed]);

//   const toggle = () => setCurrentlyPlaying(isPlaying ? null : id);
//   const cycleSpeed = () => setSpeed((s) => (s === 1 ? 1.5 : s === 1.5 ? 2 : 1));

//   const formatDuration = (s: number) =>
//     `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

//   return (
//     <div className="flex items-center gap-2.5 min-w-[220px] py-1.5 px-1">
//       <button
//         onClick={toggle}
//         className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
//           isMine
//             ? "bg-white/20 hover:bg-white/30"
//             : "bg-[#7c5cff] hover:bg-[#8f70ff]"
//         }`}
//       >
//         {isPlaying ? (
//           <Pause size={16} className="text-white" />
//         ) : (
//           <Play size={16} className="text-white ml-0.5" />
//         )}
//       </button>

//       <div className="flex-1 flex items-end gap-[2px] h-8">
//         {waveform.map((amp, i) => {
//           const isPast = i / waveform.length <= progress;
//           return (
//             <div
//               key={i}
//               style={{ height: `${Math.max(15, amp * 100)}%` }}
//               className={`w-[3px] rounded-full transition-colors ${
//                 isPast
//                   ? isMine
//                     ? "bg-white"
//                     : "bg-[#a893ff]"
//                   : isMine
//                   ? "bg-white/35"
//                   : "bg-zinc-600"
//               }`}
//             />
//           );
//         })}
//       </div>

//       <button
//         onClick={cycleSpeed}
//         className={`text-[11px] w-7 text-right shrink-0 ${
//           isMine
//             ? "text-white/70 hover:text-white"
//             : "text-zinc-500 hover:text-zinc-300"
//         }`}
//       >
//         {isPlaying ? `${speed}×` : formatDuration(duration)}
//       </button>
//     </div>
//   );
// }
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { usePlayerStore } from "@/store/chat-store";

// Telegram-like look
const BAR_W = 3;
const BAR_GAP = 2;
const MIN_BAR = 3;
const WAVE_H = 28;

function resample(data: number[], n: number): number[] {
  if (!data?.length || n <= 0) return Array(Math.max(n, 0)).fill(0.2);
  const step = data.length / n;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const from = Math.floor(i * step);
    const to = Math.max(from + 1, Math.floor((i + 1) * step));
    let max = 0;
    for (let j = from; j < to && j < data.length; j++) max = Math.max(max, data[j]);
    out.push(max);
  }
  const peak = Math.max(...out, 0.001);
  const norm = out.map((v) => Math.pow(v / peak, 0.85));
  // light 3-tap smoothing so neighbouring bars don't look jagged
  return norm.map((v, i) => (norm[i - 1] ?? v) * 0.25 + v * 0.5 + (norm[i + 1] ?? v) * 0.25);
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

const formatTime = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export default function VoiceBubble({
  id,
  audioUrl,
  duration,
  waveform,
  isMine,
}: {
  id: string;
  audioUrl: string;
  duration: number;
  waveform: number[];
  isMine: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const widthRef = useRef(0);
  const barsRef = useRef<number[]>([]);
  const progressRef = useRef(0); // 0..1, drawn imperatively (no React re-render at 60fps)
  const draggingRef = useRef(false);
  const pendingSeekRef = useRef<number | null>(null);
  const fixingRef = useRef(false);
  const rafRef = useRef(0);

  const [barCount, setBarCount] = useState(0);
  const [speed, setSpeed] = useState<1 | 1.5 | 2>(1);
  const [elapsed, setElapsed] = useState<number | null>(null);

  const currentlyPlayingId = usePlayerStore((s) => s.currentlyPlayingId);
  const setCurrentlyPlaying = usePlayerStore((s) => s.setCurrentlyPlaying);
  const isPlaying = currentlyPlayingId === id;

  const colors = useMemo(
    () =>
      isMine
        ? { idle: "rgba(255,255,255,0.4)", played: "#ffffff" }
        : { idle: "#52525b", played: "#a893ff" },
    [isMine]
  );

  const bars = useMemo(
    () => (barCount ? resample(waveform, barCount) : []),
    [waveform, barCount]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const w = widthRef.current;
    const list = barsRef.current;
    if (!canvas || !ctx || !w || !list.length) return;

    const dpr = window.devicePixelRatio || 1;
    const pw = Math.round(w * dpr);
    if (canvas.width !== pw) {
      canvas.width = pw;
      canvas.height = Math.round(WAVE_H * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, WAVE_H);

    const step = BAR_W + BAR_GAP;
    const offset = (w - (list.length * step - BAR_GAP)) / 2;
    const px = progressRef.current * w;

    const paint = (color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      list.forEach((a, i) => {
        const bh = Math.max(MIN_BAR, a * WAVE_H);
        roundedRect(ctx, offset + i * step, (WAVE_H - bh) / 2, BAR_W, bh, BAR_W / 2);
      });
      ctx.fill();
    };

    paint(colors.idle);
    // clip = the played part fills smoothly, even through the middle of a bar
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, px, WAVE_H);
    ctx.clip();
    paint(colors.played);
    ctx.restore();

    if (draggingRef.current) {
      ctx.fillStyle = colors.played;
      ctx.beginPath();
      ctx.arc(Math.min(Math.max(px, 4), w - 4), WAVE_H / 2, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [colors]);

  // measure the wave area -> number of bars that fit
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.floor(entry.contentRect.width);
      widthRef.current = w;
      setBarCount(Math.max(8, Math.floor((w + BAR_GAP) / (BAR_W + BAR_GAP))));
      draw();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [draw]);

  useEffect(() => {
    barsRef.current = bars;
    draw();
  }, [bars, draw]);

  const getTotal = useCallback(
    (audio: HTMLAudioElement) =>
      Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : Math.max(duration, 1),
    [duration]
  );

  // Audio is created lazily (first hover / tap), not for every bubble on mount.
  const getAudio = useCallback(() => {
    if (audioRef.current) return audioRef.current;
    const audio = new Audio();
    audio.preload = "auto";
    audio.preservesPitch = true;
    audio.src = audioUrl;

    audio.addEventListener("loadedmetadata", () => {
      if (audio.duration === Infinity) {
        // old messages recorded without duration in the header:
        // jump to the end once so the browser computes the real length
        fixingRef.current = true;
        const onFixed = () => {
          audio.removeEventListener("timeupdate", onFixed);
          fixingRef.current = false;
          audio.currentTime = pendingSeekRef.current ?? 0;
          pendingSeekRef.current = null;
          if (usePlayerStore.getState().currentlyPlayingId === id) audio.play().catch(() => {});
        };
        audio.addEventListener("timeupdate", onFixed);
        audio.currentTime = 1e101;
      } else if (pendingSeekRef.current != null) {
        audio.currentTime = pendingSeekRef.current;
        pendingSeekRef.current = null;
      }
    });

    audio.addEventListener("ended", () => {
      if (fixingRef.current) return;
      audio.currentTime = 0;
      progressRef.current = 0;
      setElapsed(null);
      draw();
      if (usePlayerStore.getState().currentlyPlayingId === id) setCurrentlyPlaying(null);
    });

    audioRef.current = audio;
    return audio;
  }, [audioUrl, id, draw, setCurrentlyPlaying]);

  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current);
      audioRef.current?.pause();
      audioRef.current = null;
    },
    [audioUrl]
  );

  useEffect(() => {
    if (!isPlaying) {
      audioRef.current?.pause();
      return;
    }
    const audio = getAudio();
    audio.playbackRate = speed;
    audio.play().catch(() => setCurrentlyPlaying(null));

    let lastSec = -1;
    const tick = () => {
      if (!draggingRef.current && !fixingRef.current) {
        progressRef.current = Math.min(1, audio.currentTime / getTotal(audio));
        const sec = Math.floor(audio.currentTime);
        if (sec !== lastSec) {
          lastSec = sec;
          setElapsed(sec);
        }
        draw();
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, speed, getAudio, getTotal, draw, setCurrentlyPlaying]);

  // ---- seeking: tap or drag on the waveform ----
  const ratioFromEvent = (e: React.PointerEvent) => {
    const rect = wrapRef.current!.getBoundingClientRect();
    return Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
  };

  const previewSeek = (ratio: number) => {
    progressRef.current = ratio;
    setElapsed(Math.floor(ratio * getTotal(getAudio())));
    draw();
  };

  const onWaveDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingRef.current = true;
    previewSeek(ratioFromEvent(e));
  };
  const onWaveMove = (e: React.PointerEvent) => {
    if (draggingRef.current) previewSeek(ratioFromEvent(e));
  };
  const onWaveUp = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const audio = getAudio();
    const t = ratioFromEvent(e) * getTotal(audio);
    if (audio.readyState >= 1 && audio.duration !== Infinity) audio.currentTime = t;
    else pendingSeekRef.current = t;
    progressRef.current = t / getTotal(audio);
    draw();
    if (!isPlaying) setCurrentlyPlaying(id);
  };

  const toggle = () => setCurrentlyPlaying(isPlaying ? null : id);
  const cycleSpeed = () => setSpeed((s) => (s === 1 ? 1.5 : s === 1.5 ? 2 : 1));

  return (
    <div
      className="flex items-center gap-2.5 w-[240px] max-w-full h-11 select-none"
      onPointerEnter={() => getAudio()}
    >
      <button
        onClick={toggle}
        className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
          isMine ? "bg-white/20 hover:bg-white/30" : "bg-[#7c5cff] hover:bg-[#8f70ff]"
        }`}
      >
        {isPlaying ? (
          <Pause size={17} className="text-white" />
        ) : (
          <Play size={17} className="text-white ml-0.5" />
        )}
      </button>

      <div
        ref={wrapRef}
        className="flex-1 min-w-0 h-full flex items-center cursor-pointer touch-none"
        onPointerDown={onWaveDown}
        onPointerMove={onWaveMove}
        onPointerUp={onWaveUp}
        onPointerCancel={() => {
          draggingRef.current = false;
          draw();
        }}
      >
        <canvas ref={canvasRef} className="block w-full" style={{ height: WAVE_H }} />
      </div>

      <div
        className={`w-9 shrink-0 flex flex-col items-end justify-center gap-1 leading-none tabular-nums ${
          isMine ? "text-white/80" : "text-zinc-400"
        }`}
      >
        <span className="text-[11px]">{formatTime(elapsed ?? duration)}</span>
        <button
          onClick={cycleSpeed}
          className={`text-[10px] rounded px-1 py-0.5 bg-white/15 hover:bg-white/25 ${
            isPlaying ? "" : "invisible"
          }`}
        >
          {speed}×
        </button>
      </div>
    </div>
  );
}