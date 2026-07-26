import { useRef, useState, useCallback } from "react";
import { getWaveform, uploadVoice } from "@/lib/voice";

interface RecordResult {
  audioUrl: string;
  duration: number;
  waveform: number[];
}

export function useVoiceRecorder(onFinish: (r: RecordResult) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [willCancel, setWillCancel] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cancelledRef = useRef(false);

  const start = useCallback(async () => {
    cancelledRef.current = false;
    chunksRef.current = [];
    setElapsed(0);
    setWillCancel(false);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const recorder = new MediaRecorder(stream, {
      mimeType: "audio/webm;codecs=opus",
    });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
      if (cancelledRef.current) return;

      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      if (blob.size < 500) return;

      try {
        const waveform = await getWaveform(blob);
        const { url, duration } = await uploadVoice(blob);
        onFinish({ audioUrl: url, duration, waveform });
      } catch (err) {
        console.error("Voice send failed:", err);
      }
    };

    recorder.start();
    setIsRecording(true);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  }, [onFinish]);

  const stop = useCallback((cancel = false) => {
    cancelledRef.current = cancel;
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  return { isRecording, elapsed, willCancel, setWillCancel, start, stop };
}
