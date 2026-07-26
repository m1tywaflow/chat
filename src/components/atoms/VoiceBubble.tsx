"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { usePlayerStore } from "@/store/chat-store";

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
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState<1 | 1.5 | 2>(1);

  const currentlyPlayingId = usePlayerStore((s) => s.currentlyPlayingId);
  const setCurrentlyPlaying = usePlayerStore((s) => s.setCurrentlyPlaying);
  const isPlaying = currentlyPlayingId === id;

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const onTime = () =>
      setProgress(audio.currentTime / (audio.duration || duration));
    const onEnd = () => {
      setCurrentlyPlaying(null);
      setProgress(0);
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
    };
  }, [audioUrl, duration, setCurrentlyPlaying]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.playbackRate = speed;
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, speed]);

  const toggle = () => setCurrentlyPlaying(isPlaying ? null : id);
  const cycleSpeed = () => setSpeed((s) => (s === 1 ? 1.5 : s === 1.5 ? 2 : 1));

  const formatDuration = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-2.5 min-w-[220px] py-1.5 px-1">
      <button
        onClick={toggle}
        className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
          isMine
            ? "bg-white/20 hover:bg-white/30"
            : "bg-[#7c5cff] hover:bg-[#8f70ff]"
        }`}
      >
        {isPlaying ? (
          <Pause size={16} className="text-white" />
        ) : (
          <Play size={16} className="text-white ml-0.5" />
        )}
      </button>

      <div className="flex-1 flex items-end gap-[2px] h-8">
        {waveform.map((amp, i) => {
          const isPast = i / waveform.length <= progress;
          return (
            <div
              key={i}
              style={{ height: `${Math.max(15, amp * 100)}%` }}
              className={`w-[3px] rounded-full transition-colors ${
                isPast
                  ? isMine
                    ? "bg-white"
                    : "bg-[#a893ff]"
                  : isMine
                  ? "bg-white/35"
                  : "bg-zinc-600"
              }`}
            />
          );
        })}
      </div>

      <button
        onClick={cycleSpeed}
        className={`text-[11px] w-7 text-right shrink-0 ${
          isMine
            ? "text-white/70 hover:text-white"
            : "text-zinc-500 hover:text-zinc-300"
        }`}
      >
        {isPlaying ? `${speed}×` : formatDuration(duration)}
      </button>
    </div>
  );
}
