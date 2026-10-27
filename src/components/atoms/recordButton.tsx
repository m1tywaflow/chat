"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Send, Trash2 } from "lucide-react";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";

const CANCEL_THRESHOLD = 80;

type Mode = "hold" | "toggle";

export default function VoiceRecordButton({
  onSend,
}: {
  onSend: (r: {
    audioUrl: string;
    duration: number;
    waveform: number[];
  }) => void;
}) {
  const startXRef = useRef(0);
  const [mode, setMode] = useState<Mode>("hold");
  const { isRecording, elapsed, willCancel, setWillCancel, start, stop } =
    useVoiceRecorder(onSend);

  const isToggleRecording = isRecording && mode === "toggle";
  const isHoldRecording = isRecording && mode === "hold";

  useEffect(() => {
    if (!isToggleRecording) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") stop(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isToggleRecording, stop]);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;

    if (e.pointerType === "mouse") {
      if (isRecording) {
        stop(false);
      } else {
        setMode("toggle");
        start();
      }
      return;
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    startXRef.current = e.clientX;
    setMode("hold");
    start();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isHoldRecording || e.pointerType === "mouse") return;
    const cancel = startXRef.current - e.clientX > CANCEL_THRESHOLD;
    if (cancel !== willCancel) setWillCancel(cancel);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isHoldRecording || e.pointerType === "mouse") return;
    stop(startXRef.current - e.clientX > CANCEL_THRESHOLD);
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isHoldRecording || e.pointerType === "mouse") return;
    stop(true);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="relative flex items-center gap-2">
      {isHoldRecording && (
        <div className="absolute right-14 whitespace-nowrap flex items-center gap-2 text-xs pointer-events-none">
          {willCancel ? (
            <span className="flex items-center gap-1 text-red-400 font-medium">
              <Trash2 size={13} /> Release to cancel
            </span>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-zinc-300 tabular-nums">
                {formatTime(elapsed)}
              </span>
              <span className="text-zinc-600">← swipe to cancel</span>
            </>
          )}
        </div>
      )}

      {isToggleRecording && (
        <>
          <div className="whitespace-nowrap flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-zinc-300 tabular-nums">
              {formatTime(elapsed)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => stop(true)}
            aria-label="Cancel recording"
            className="shrink-0 w-[42px] h-[42px] flex items-center justify-center rounded-full bg-zinc-800 text-zinc-300 transition-all hover:bg-red-500/20 hover:text-red-400 active:scale-95"
          >
            <Trash2 size={18} />
          </button>
        </>
      )}

      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onContextMenu={(e) => e.preventDefault()}
        aria-label={isToggleRecording ? "Send voice message" : "Record voice message"}
        className={`shrink-0 w-[42px] h-[42px] flex items-center justify-center rounded-full transition-all active:scale-95 touch-none select-none ${isToggleRecording
          ? "bg-gradient-to-br from-[#7c5cff] to-[#5b3df0] shadow-[0_0_35px_rgba(124,92,255,.45)]"
          : isHoldRecording
            ? "bg-red-500/20 scale-110"
            : "bg-gradient-to-br from-[#7c5cff] to-[#5b3df0] shadow-[0_0_35px_rgba(124,92,255,.45)] hover:scale-105"
          }`}
      >
        {isToggleRecording ? (
          <Send size={19} className="text-white" />
        ) : (
          <Mic
            size={19}
            className={isHoldRecording ? "text-red-400" : "text-white"}
          />
        )}
      </button>
    </div>
  );
}