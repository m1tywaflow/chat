"use client";

import { useRef } from "react";
import { Mic, Trash2 } from "lucide-react";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";

const CANCEL_THRESHOLD = 80;

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
  const { isRecording, elapsed, willCancel, setWillCancel, start, stop } =
    useVoiceRecorder(onSend);

  const handlePointerDown = (e: React.PointerEvent) => {
    startXRef.current = e.clientX;
    start();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isRecording) return;
    const delta = startXRef.current - e.clientX;
    setWillCancel(delta > CANCEL_THRESHOLD);
  };

  const handlePointerUp = () => {
    stop(willCancel);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="relative flex items-center">
      {isRecording && (
        <div className="absolute right-14 whitespace-nowrap flex items-center gap-2 text-xs">
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
              <span className="text-zinc-600">swipe to left</span>
            </>
          )}
        </div>
      )}
      <button
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={isRecording ? handlePointerUp : undefined}
        className={`shrink-0 w-[42px] h-[42px] flex items-center justify-center rounded-full transition-all active:scale-95 ${
          isRecording
            ? "bg-red-500/20 scale-110"
            : "bg-gradient-to-br from-[#7c5cff] to-[#5b3df0] shadow-[0_0_35px_rgba(124,92,255,.45)] hover:scale-105"
        }`}
      >
        <Mic
          size={19}
          className={isRecording ? "text-red-400" : "text-white"}
        />
      </button>
    </div>
  );
}
