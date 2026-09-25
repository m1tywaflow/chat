// import { useRef, useState, useCallback } from "react";
// import { getWaveform, uploadVoice } from "@/lib/voice";

// interface RecordResult {
//   audioUrl: string;
//   duration: number;
//   waveform: number[];
// }

// export function useVoiceRecorder(onFinish: (r: RecordResult) => void) {
//   const [isRecording, setIsRecording] = useState(false);
//   const [elapsed, setElapsed] = useState(0);
//   const [willCancel, setWillCancel] = useState(false);

//   const mediaRecorderRef = useRef<MediaRecorder | null>(null);
//   const chunksRef = useRef<BlobPart[]>([]);
//   const streamRef = useRef<MediaStream | null>(null);
//   const timerRef = useRef<NodeJS.Timeout | null>(null);
//   const cancelledRef = useRef(false);

//   const start = useCallback(async () => {
//     cancelledRef.current = false;
//     chunksRef.current = [];
//     setElapsed(0);
//     setWillCancel(false);

//     const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//     streamRef.current = stream;

//     const recorder = new MediaRecorder(stream, {
//       mimeType: "audio/webm;codecs=opus",
//     });
//     mediaRecorderRef.current = recorder;

//     recorder.ondataavailable = (e) => {
//       if (e.data.size > 0) chunksRef.current.push(e.data);
//     };

//     recorder.onstop = async () => {
//       streamRef.current?.getTracks().forEach((t) => t.stop());
//       if (timerRef.current) clearInterval(timerRef.current);
//       if (cancelledRef.current) return;

//       const blob = new Blob(chunksRef.current, { type: "audio/webm" });
//       if (blob.size < 500) return;

//       try {
//         const waveform = await getWaveform(blob);
//         const { url, duration } = await uploadVoice(blob);
//         onFinish({ audioUrl: url, duration, waveform });
//       } catch (err) {
//         console.error("Voice send failed:", err);
//       }
//     };

//     recorder.start();
//     setIsRecording(true);
//     timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
//   }, [onFinish]);

//   const stop = useCallback((cancel = false) => {
//     cancelledRef.current = cancel;
//     mediaRecorderRef.current?.stop();
//     setIsRecording(false);
//   }, []);

//   return { isRecording, elapsed, willCancel, setWillCancel, start, stop };
// }
import { useRef, useState, useCallback, useEffect } from "react";
import { getWaveform, uploadVoice } from "@/lib/voice";

interface RecordResult {
  audioUrl: string;
  duration: number;
  waveform: number[];
}

const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];
const pickMime = () =>
  typeof MediaRecorder === "undefined"
    ? undefined
    : MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m));

const MIN_DURATION_MS = 600;
const MIC_IDLE_MS = 10_000; // keep the mic open this long so the next press is instant

export function useVoiceRecorder(onFinish: (r: RecordResult) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [willCancel, setWillCancel] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const idleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAtRef = useRef(0);
  const startingRef = useRef(false);
  const releasedEarlyRef = useRef(false);
  const cancelledRef = useRef(false);
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const closeMic = useCallback(() => {
    if (idleRef.current) clearTimeout(idleRef.current);
    idleRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const scheduleMicClose = useCallback(() => {
    if (idleRef.current) clearTimeout(idleRef.current);
    idleRef.current = setTimeout(closeMic, MIC_IDLE_MS);
  }, [closeMic]);

  const start = useCallback(async () => {
    if (startingRef.current || recorderRef.current) return;
    startingRef.current = true;
    releasedEarlyRef.current = false;
    cancelledRef.current = false;
    chunksRef.current = [];
    if (idleRef.current) clearTimeout(idleRef.current);
    setElapsed(0);
    setWillCancel(false);
    setIsRecording(true); // UI reacts on press, not after the mic is ready

    let stream = streamRef.current;
    const alive = stream?.getAudioTracks().some((t) => t.readyState === "live");
    if (!stream || !alive) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        streamRef.current = stream;
      } catch (err) {
        startingRef.current = false;
        setIsRecording(false);
        console.error("Mic access failed:", err);
        return;
      }
    }

    if (releasedEarlyRef.current) {
      startingRef.current = false;
      scheduleMicClose();
      return;
    }

    const mimeType = pickMime();
    const recorder = new MediaRecorder(stream, {
      ...(mimeType ? { mimeType } : {}),
      audioBitsPerSecond: 48000,
    });
    recorderRef.current = recorder;
    startingRef.current = false;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      const durationMs = performance.now() - startedAtRef.current;
      const type = recorder.mimeType || mimeType || "audio/webm";
      stopTimer();
      recorderRef.current = null;
      scheduleMicClose();
      if (cancelledRef.current || durationMs < MIN_DURATION_MS) return;

      let blob = new Blob(chunksRef.current, { type });
      if (blob.size < 500) return;

      // MediaRecorder webm has no duration in the header, so the browser
      // treats it like a live stream (duration = Infinity, seeking breaks).
      // Write the real duration into the file.
      if (type.includes("webm")) {
        try {
          const { webmFixDuration } = await import("webm-fix-duration");
          blob = await webmFixDuration(blob, Math.round(durationMs), type.split(";")[0]);
        } catch (err) {
          console.warn("webm duration fix failed, sending as is:", err);
        }
      }

      try {
        const [waveform, uploaded] = await Promise.all([
          getWaveform(blob),
          uploadVoice(blob),
        ]);
        onFinishRef.current({
          audioUrl: uploaded.url,
          duration: Math.max(1, Math.round(durationMs / 1000)),
          waveform,
        });
      } catch (err) {
        console.error("Voice send failed:", err);
      }
    };

    recorder.start(250);
    startedAtRef.current = performance.now();
    timerRef.current = setInterval(
      () => setElapsed(Math.floor((performance.now() - startedAtRef.current) / 1000)),
      250
    );
  }, [scheduleMicClose, stopTimer]);

  const stop = useCallback((cancel = false) => {
    const recorder = recorderRef.current;
    setIsRecording(false);
    setWillCancel(false);
    if (!recorder) {
      if (startingRef.current) releasedEarlyRef.current = true;
      return;
    }
    cancelledRef.current = cancel;
    if (recorder.state !== "inactive") recorder.stop();
  }, []);

  useEffect(
    () => () => {
      cancelledRef.current = true;
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      stopTimer();
      closeMic();
    },
    [stopTimer, closeMic]
  );

  return { isRecording, elapsed, willCancel, setWillCancel, start, stop };
}