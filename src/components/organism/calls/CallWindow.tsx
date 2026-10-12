// "use client";

// import { useEffect, useRef, useState } from "react";
// import { Room, RoomEvent, Track } from "livekit-client";
// import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
// import { useCallStore } from "@/store/call-store";
// import { endCall, subscribeToCall } from "@/lib/calls";

// export default function CallWindow() {
//     const {
//         activeCall,
//         livekitToken,
//         isMuted,
//         isCameraOff,
//         toggleMute,
//         toggleCamera,
//         resetCall,
//         myUid,
//     } = useCallStore();
//     const roomRef = useRef<Room | null>(null);
//     const localVideoRef = useRef<HTMLVideoElement | null>(null);
//     const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
//     const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
//     const [remoteName, setRemoteName] = useState<string>("");
//     const [elapsed, setElapsed] = useState(0);
//     const [remoteConnected, setRemoteConnected] = useState(false);
//     const [remoteMicMuted, setRemoteMicMuted] = useState(false);
//     const [mediaError, setMediaError] = useState<string | null>(null);

//     const callId = activeCall?.id;
//     const roomName = activeCall?.roomName;
//     const callType = activeCall?.type;

//     useEffect(() => {
//         if (!roomName || !livekitToken) return;

//         let cancelled = false;
//         const room = new Room();
//         roomRef.current = room;

//         const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL!;

//         (async () => {
//             try {
//                 await room.connect(livekitUrl, livekitToken);
//                 if (cancelled) return;

//                 const attachRemoteTrack = (
//                     track: any,
//                     participant: { name?: string; identity: string }
//                 ) => {
//                     setRemoteName(participant.name ?? participant.identity);
//                     setRemoteConnected(true);
//                     if (track.kind === Track.Kind.Video && remoteVideoRef.current) {
//                         track.attach(remoteVideoRef.current);
//                     }
//                     if (track.kind === Track.Kind.Audio && remoteAudioRef.current) {
//                         track.attach(remoteAudioRef.current);
//                     }
//                 };

//                 room.on(RoomEvent.TrackSubscribed, (track, _pub, participant) => {
//                     attachRemoteTrack(track, participant);
//                 });

//                 room.on(RoomEvent.TrackUnsubscribed, (track) => {
//                     track.detach();
//                 });

//                 room.on(RoomEvent.TrackMuted, (pub, participant) => {
//                     if (
//                         pub.kind === Track.Kind.Audio &&
//                         participant.identity !== room.localParticipant.identity
//                     ) {
//                         setRemoteMicMuted(true);
//                     }
//                 });
//                 room.on(RoomEvent.TrackUnmuted, (pub, participant) => {
//                     if (
//                         pub.kind === Track.Kind.Audio &&
//                         participant.identity !== room.localParticipant.identity
//                     ) {
//                         setRemoteMicMuted(false);
//                     }
//                 });

//                 room.on(RoomEvent.ParticipantDisconnected, () => {
//                     handleEnd();
//                 });

//                 room.remoteParticipants.forEach((participant) => {
//                     participant.trackPublications.forEach((pub) => {
//                         if (pub.track) attachRemoteTrack(pub.track, participant);
//                         if (pub.kind === Track.Kind.Audio) {
//                             setRemoteMicMuted(pub.isMuted);
//                         }
//                     });
//                 });

//                 if (cancelled) return;

//                 try {
//                     if (callType === "video") {
//                         await room.localParticipant.enableCameraAndMicrophone();
//                     } else {
//                         await room.localParticipant.setMicrophoneEnabled(true);
//                     }
//                     if (cancelled) return;

//                     const localTrack = room.localParticipant.videoTrackPublications
//                         .values()
//                         .next().value;
//                     if (localTrack?.track && localVideoRef.current) {
//                         localTrack.track.attach(localVideoRef.current);
//                     }
//                 } catch (mediaErr) {
//                     console.error("Local media error:", mediaErr);
//                     if (!cancelled) {
//                         setMediaError(
//                             callType === "video"
//                                 ? "Failed to enable the camera/microphone."
//                                 : "Failed to enable the microphone."
//                         );
//                     }
//                 }
//             } catch (err) {
//                 if (!cancelled) {
//                     console.error("Call connection error:", err);
//                 }
//             }
//         })();

//         return () => {
//             cancelled = true;
//             try {
//                 room.localParticipant.videoTrackPublications.forEach((pub) =>
//                     pub.track?.detach()
//                 );
//                 room.localParticipant.audioTrackPublications.forEach((pub) =>
//                     pub.track?.detach()
//                 );
//             } catch { }
//             room.disconnect();
//             roomRef.current = null;
//         };
//     }, [roomName, livekitToken, callType]);

//     useEffect(() => {
//         if (!callId) return;
//         const unsubscribe = subscribeToCall(callId, (call) => {
//             if (!call || call.status === "ended" || call.status === "declined") {
//                 handleEnd();
//             }
//         });
//         return () => unsubscribe();
//     }, [callId]);

//     useEffect(() => {
//         if (!remoteConnected) return;
//         const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
//         return () => clearInterval(interval);
//     }, [remoteConnected]);

//     const handleEnd = async () => {
//         if (callId) {
//             await endCall(callId);
//         }
//         roomRef.current?.disconnect();
//         resetCall();
//     };

//     const handleToggleMute = async () => {
//         const room = roomRef.current;
//         if (!room) return;
//         const enable = isMuted; 
//         await room.localParticipant.setMicrophoneEnabled(enable);
//         toggleMute();
//     };

//     const handleToggleCamera = async () => {
//         const room = roomRef.current;
//         if (!room) return;
//         const enable = isCameraOff;
//         await room.localParticipant.setCameraEnabled(enable);

//         if (enable) {
//             const pub = room.localParticipant.videoTrackPublications
//                 .values()
//                 .next().value;
//             if (pub?.track && localVideoRef.current) {
//                 pub.track.attach(localVideoRef.current);
//             }
//         } else {
//             localVideoRef.current?.pause();
//         }

//         toggleCamera();
//     };

//     if (!activeCall) return null;

//     const otherName =
//         activeCall.callerId === myUid
//             ? activeCall.calleeName
//             : activeCall.callerName;

//     const otherAvatar =
//         activeCall.callerId === myUid
//             ? activeCall.calleeAvatar
//             : activeCall.callerAvatar;

//     const displayName = remoteName || otherName || "Unknown";
//     const displayAvatar = otherAvatar || null;
//     const initial = displayName[0]?.toUpperCase() ?? "?";

//     function formatElapsed(sec: number) {
//         const m = Math.floor(sec / 60)
//             .toString()
//             .padStart(2, "0");
//         const s = (sec % 60).toString().padStart(2, "0");
//         return `${m}:${s}`;
//     }

//     return (
//         <>
//             <style>{`
//         @keyframes callFadeIn {
//           from { opacity: 0; }
//           to { opacity: 1; }
//         }
//         @keyframes callPanelIn {
//           from { opacity: 0; transform: scale(0.94) translateY(14px); }
//           to { opacity: 1; transform: scale(1) translateY(0); }
//         }
//         @keyframes ringPulse {
//           0% { transform: scale(1); opacity: 0.55; }
//           70% { transform: scale(1.6); opacity: 0; }
//           100% { transform: scale(1.6); opacity: 0; }
//         }
//         @keyframes avatarGlow {
//           0%, 100% { box-shadow: 0 0 40px rgba(124,92,255,0.25), 0 0 0 1px rgba(124,92,255,0.25) inset; }
//           50% { box-shadow: 0 0 65px rgba(124,92,255,0.42), 0 0 0 1px rgba(124,92,255,0.4) inset; }
//         }
//         @keyframes statusPulse {
//           0%, 100% { opacity: 1; }
//           50% { opacity: 0.45; }
//         }
//         .call-overlay { animation: callFadeIn 0.2s ease-out; }
//         .call-panel { animation: callPanelIn 0.32s cubic-bezier(0.34, 1.2, 0.64, 1); }
//         .call-ring { animation: ringPulse 2.2s ease-out infinite; }
//         .call-avatar { animation: avatarGlow 3.2s ease-in-out infinite; }
//         .status-dot-ringing { animation: statusPulse 1.4s ease-in-out infinite; }

//         .glass-panel {
//           background: rgba(30, 22, 66, 0.32);
//           backdrop-filter: blur(28px) saturate(160%);
//           -webkit-backdrop-filter: blur(28px) saturate(160%);
//           border: 1px solid rgba(169, 150, 255, 0.18);
//           box-shadow:
//             0 20px 60px 0 rgba(10, 6, 30, 0.5),
//             inset 0 0 4px 2px rgba(255, 255, 255, 0.05),
//             inset 0 1px 0 0 rgba(255, 255, 255, 0.08);
//         }

//         .glass-btn {
//           background: rgba(255, 255, 255, 0.06);
//           border: 1px solid rgba(255, 255, 255, 0.14);
//           backdrop-filter: blur(10px) saturate(150%);
//           -webkit-backdrop-filter: blur(10px) saturate(150%);
//           box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.08);
//           transition: transform 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
//         }
//         .glass-btn:hover { transform: translateY(-2px); background: rgba(255, 255, 255, 0.1); }
//         .glass-btn:active { transform: translateY(0) scale(0.94); }
//         .glass-btn.active {
//           background: rgba(255, 255, 255, 0.92);
//           border-color: rgba(255, 255, 255, 0.92);
//         }
//       `}</style>

//             <div className="call-overlay fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
//                 <div className="pointer-events-none absolute inset-0 overflow-hidden">
//                     <div className="absolute -top-32 -left-24 w-[460px] h-[460px] rounded-full bg-[#5b3df0]/25 blur-[130px]" />
//                     <div className="absolute -bottom-40 -right-20 w-[420px] h-[420px] rounded-full bg-[#2b1f78]/28 blur-[130px]" />
//                 </div>

//                 <div className="call-panel glass-panel relative w-full max-w-md h-[85vh] max-h-[640px] flex flex-col overflow-hidden rounded-[32px]">
//                     <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

//                     <audio ref={remoteAudioRef} autoPlay />

//                     {/* Status bar */}
//                     <div className="flex-none flex items-center justify-center pt-6 pb-2">
//                         <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08]">
//                             <span
//                                 className={`w-1.5 h-1.5 rounded-full ${remoteConnected
//                                     ? "bg-[#34D399] shadow-[0_0_6px_#34D399]"
//                                     : "bg-[#a996ff] status-dot-ringing"
//                                     }`}
//                             />
//                             <span className="text-[11px] font-medium text-white/60 tracking-wide">
//                                 {remoteConnected ? formatElapsed(elapsed) : "Calling…"}
//                             </span>
//                         </div>
//                     </div>

//                     <div className="flex-1 relative flex items-center justify-center min-h-0">
//                         {callType === "video" ? (
//                             <>
//                                 <video
//                                     ref={remoteVideoRef}
//                                     autoPlay
//                                     playsInline
//                                     className="absolute inset-0 w-full h-full object-cover"
//                                 />
//                                 {!remoteConnected && (
//                                     <div className="absolute inset-0 flex items-center justify-center bg-[#0d0b17]/60 backdrop-blur-md">
//                                         <div className="flex flex-col items-center gap-4">
//                                             <Avatar
//                                                 initial={initial}
//                                                 avatarUrl={displayAvatar}
//                                                 ringing
//                                                 muted={remoteConnected && remoteMicMuted}
//                                             />
//                                             <p className="text-white/90 text-base font-medium">
//                                                 {displayName}
//                                             </p>
//                                         </div>
//                                     </div>
//                                 )}
//                                 {!isCameraOff && (
//                                     <video
//                                         ref={localVideoRef}
//                                         autoPlay
//                                         playsInline
//                                         muted
//                                         className="absolute bottom-4 right-4 w-28 h-40 object-cover rounded-2xl border border-white/[0.14] shadow-lg shadow-black/40"
//                                     />
//                                 )}
//                             </>
//                         ) : (
//                             <div className="flex flex-col items-center gap-5">
//                                 <Avatar
//                                     initial={initial}
//                                     avatarUrl={displayAvatar}
//                                     ringing={!remoteConnected}
//                                     muted={remoteConnected && remoteMicMuted}
//                                 />
//                                 <div className="text-center">
//                                     <p className="text-white text-xl font-semibold tracking-tight">
//                                         {displayName}
//                                     </p>
//                                     <p className="text-white/40 text-[13px] mt-1">
//                                         {remoteConnected ? "Voice call" : "Ringing…"}
//                                     </p>
//                                 </div>
//                             </div>
//                         )}
//                     </div>

//                     {mediaError && (
//                         <div className="flex-none flex items-center justify-center pb-2">
//                             <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-400/20">
//                                 <span className="text-[11px] font-medium text-red-300 tracking-wide">
//                                     {mediaError}
//                                 </span>
//                             </div>
//                         </div>
//                     )}

//                     {remoteConnected && remoteMicMuted && (
//                         <div className="flex-none flex items-center justify-center pb-3">
//                             <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08]">
//                                 <MicOff size={12} className="text-red-400" />
//                                 <span className="text-[11px] font-medium text-white/50 tracking-wide">
//                                     {displayName} muted their mic
//                                 </span>
//                             </div>
//                         </div>
//                     )}

//                     <div className="flex-none flex items-center justify-center gap-4 px-6 py-7 border-t border-white/[0.06]">
//                         <button
//                             onClick={handleToggleMute}
//                             title={isMuted ? "Unmute" : "Mute"}
//                             className={`glass-btn w-[52px] h-[52px] rounded-full flex items-center justify-center ${isMuted ? "active text-[#0d0b17]" : "text-white"
//                                 }`}
//                         >
//                             {isMuted ? <MicOff size={19} /> : <Mic size={19} />}
//                         </button>

//                         {callType === "video" && (
//                             <button
//                                 onClick={handleToggleCamera}
//                                 title={isCameraOff ? "Turn camera on" : "Turn camera off"}
//                                 className={`glass-btn w-[52px] h-[52px] rounded-full flex items-center justify-center ${isCameraOff ? "active text-[#0d0b17]" : "text-white"
//                                     }`}
//                             >
//                                 {isCameraOff ? <VideoOff size={19} /> : <Video size={19} />}
//                             </button>
//                         )}

//                         <button
//                             onClick={handleEnd}
//                             title="End call"
//                             className="glass-btn w-[52px] h-[52px] rounded-full flex items-center justify-center !bg-gradient-to-br !from-red-500 !to-red-600 !border-red-400/40 text-white shadow-[0_0_28px_rgba(239,68,68,0.45)] hover:!shadow-[0_0_36px_rgba(239,68,68,0.6)]"
//                         >
//                             <PhoneOff size={19} />
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         </>
//     );
// }

// function Avatar({
//     initial,
//     avatarUrl,
//     ringing,
//     muted,
// }: {
//     initial: string;
//     avatarUrl?: string | null;
//     ringing?: boolean;
//     muted?: boolean;
// }) {
//     return (
//         <div className="relative w-28 h-28 flex items-center justify-center">
//             {ringing && (
//                 <>
//                     <span className="call-ring absolute inset-0 rounded-full border-2 border-[#7c5cff]/50" />
//                     <span
//                         className="call-ring absolute inset-0 rounded-full border-2 border-[#7c5cff]/50"
//                         style={{ animationDelay: "0.6s" }}
//                     />
//                 </>
//             )}
//             {avatarUrl ? (
//                 <img
//                     src={avatarUrl}
//                     alt={initial}
//                     className="call-avatar relative w-24 h-24 rounded-full object-cover border border-[#a996ff]/30"
//                 />
//             ) : (
//                 <div className="call-avatar relative w-24 h-24 rounded-full flex items-center justify-center bg-gradient-to-br from-[#6b46f0] via-[#5b3df0] to-[#4028b0] border border-[#a996ff]/30 text-white text-3xl font-semibold">
//                     {initial}
//                 </div>
//             )}
//             {muted && (
//                 <div className="absolute bottom-0.5 right-0.5 w-7 h-7 rounded-full bg-[#0d0b17] border border-white/[0.12] flex items-center justify-center shadow-md shadow-black/40">
//                     <MicOff size={13} className="text-red-400" />
//                 </div>
//             )}
//         </div>
//     );
// }


"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Room, RoomEvent, Track } from "livekit-client";
import {
    Maximize2,
    Mic,
    MicOff,
    Monitor,
    MonitorOff,
    PhoneOff,
    Video,
    VideoOff,
    Volume1,
    Volume2,
    VolumeX,
    X,
} from "lucide-react";
import { useCallStore } from "@/store/call-store";
import { endCall, subscribeToCall } from "@/lib/calls";

const CALL_CSS = `
@keyframes callFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes callPanelIn {
  from { opacity: 0; transform: scale(0.94) translateY(14px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes ringPulse {
  0% { transform: scale(1); opacity: 0.55; }
  70% { transform: scale(1.6); opacity: 0; }
  100% { transform: scale(1.6); opacity: 0; }
}
@keyframes avatarGlow {
  0%, 100% { box-shadow: 0 0 40px rgba(124,92,255,0.25), 0 0 0 1px rgba(124,92,255,0.25) inset; }
  50% { box-shadow: 0 0 65px rgba(124,92,255,0.42), 0 0 0 1px rgba(124,92,255,0.4) inset; }
}
@keyframes statusPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}
.call-overlay { animation: callFadeIn 0.2s ease-out; }
.call-panel { animation: callPanelIn 0.32s cubic-bezier(0.34, 1.2, 0.64, 1); }
.call-ring { animation: ringPulse 2.2s ease-out infinite; }
.call-avatar { animation: avatarGlow 3.2s ease-in-out infinite; }
.status-dot-ringing { animation: statusPulse 1.4s ease-in-out infinite; }

.glass-panel {
  background: rgba(30, 22, 66, 0.32);
  backdrop-filter: blur(28px) saturate(160%);
  -webkit-backdrop-filter: blur(28px) saturate(160%);
  border: 1px solid rgba(169, 150, 255, 0.18);
  box-shadow:
    0 20px 60px 0 rgba(10, 6, 30, 0.5),
    inset 0 0 4px 2px rgba(255, 255, 255, 0.05),
    inset 0 1px 0 0 rgba(255, 255, 255, 0.08);
  transition: max-width 0.3s ease;
}

.glass-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(10px) saturate(150%);
  -webkit-backdrop-filter: blur(10px) saturate(150%);
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.08);
  transition: transform 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
}
.glass-btn:hover { transform: translateY(-2px); background: rgba(255, 255, 255, 0.1); }
.glass-btn:active { transform: translateY(0) scale(0.94); }
.glass-btn.active {
  background: rgba(255, 255, 255, 0.92);
  border-color: rgba(255, 255, 255, 0.92);
}
`;

const CallStyles = memo(function CallStyles() {
    return <style>{CALL_CSS}</style>;
});

function formatElapsed(sec: number) {
    const m = Math.floor(sec / 60)
        .toString()
        .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}

const CallTimer = memo(function CallTimer() {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    return <>{formatElapsed(elapsed)}</>;
});

function setScreenSubscribed(room: Room, subscribed: boolean) {
    room.remoteParticipants.forEach((participant) => {
        participant.trackPublications.forEach((pub) => {
            if (
                pub.source === Track.Source.ScreenShare ||
                pub.source === Track.Source.ScreenShareAudio
            ) {
                pub.setSubscribed(subscribed);
            }
        });
    });
}

const glassChip =
    "flex items-center gap-1.5 h-8 px-3 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-white text-[12px] font-medium hover:bg-black/70 transition-colors cursor-pointer";

export default function CallWindow() {
    const activeCall = useCallStore((s) => s.activeCall);
    const livekitToken = useCallStore((s) => s.livekitToken);
    const isMuted = useCallStore((s) => s.isMuted);
    const isCameraOff = useCallStore((s) => s.isCameraOff);
    const toggleMute = useCallStore((s) => s.toggleMute);
    const toggleCamera = useCallStore((s) => s.toggleCamera);
    const resetCall = useCallStore((s) => s.resetCall);
    const myUid = useCallStore((s) => s.myUid);

    const roomRef = useRef<Room | null>(null);
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
    const remoteScreenRef = useRef<HTMLVideoElement | null>(null);
    const screenAudioRef = useRef<HTMLAudioElement | null>(null);
    const screenBoxRef = useRef<HTMLDivElement | null>(null);
    const endingRef = useRef(false);
    const handleEndRef = useRef<() => void>(() => { });

    const [remoteName, setRemoteName] = useState<string>("");
    const [remoteConnected, setRemoteConnected] = useState(false);
    const [remoteMicMuted, setRemoteMicMuted] = useState(false);
    const [mediaError, setMediaError] = useState<string | null>(null);
    const [screenSharing, setScreenSharing] = useState(false);
    const [remoteScreenShared, setRemoteScreenShared] = useState(false);
    const [watching, setWatching] = useState(true);
    const [screenHasAudio, setScreenHasAudio] = useState(false);
    const [screenVolume, setScreenVolume] = useState(1);
    const [screenMuted, setScreenMuted] = useState(false);
    const [canShareScreen, setCanShareScreen] = useState(false);

    const callId = activeCall?.id;
    const roomName = activeCall?.roomName;
    const callType = activeCall?.type;

    const handleEnd = useCallback(async () => {
        if (endingRef.current) return;
        endingRef.current = true;
        try {
            if (callId) await endCall(callId);
        } catch (err) {
            console.error("End call error:", err);
        }
        roomRef.current?.disconnect();
        resetCall();
    }, [callId, resetCall]);

    useEffect(() => {
        handleEndRef.current = handleEnd;
    }, [handleEnd]);

    useEffect(() => {
        endingRef.current = false;
    }, [callId]);

    useEffect(() => {
        setCanShareScreen(
            typeof navigator !== "undefined" &&
            typeof navigator.mediaDevices?.getDisplayMedia === "function"
        );
    }, []);

    useEffect(() => {
        const el = screenAudioRef.current;
        if (!el) return;
        el.volume = screenVolume;
        el.muted = screenMuted;
    }, [screenVolume, screenMuted, screenHasAudio]);

    useEffect(() => {
        if (!roomName || !livekitToken) return;

        let cancelled = false;
        const room = new Room({ adaptiveStream: true, dynacast: true });
        roomRef.current = room;

        const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL!;

        (async () => {
            try {
                await room.connect(livekitUrl, livekitToken);
                if (cancelled) return;

                const attachRemoteTrack = (
                    track: any,
                    participant: { name?: string; identity: string }
                ) => {
                    setRemoteName(participant.name ?? participant.identity);
                    setRemoteConnected(true);

                    if (track.kind === Track.Kind.Video) {
                        if (track.source === Track.Source.ScreenShare) {
                            if (remoteScreenRef.current) {
                                track.attach(remoteScreenRef.current);
                            }
                        } else if (remoteVideoRef.current) {
                            track.attach(remoteVideoRef.current);
                        }
                        return;
                    }

                    if (track.kind === Track.Kind.Audio) {
                        if (track.source === Track.Source.ScreenShareAudio) {
                            if (screenAudioRef.current) {
                                track.attach(screenAudioRef.current);
                                setScreenHasAudio(true);
                            }
                        } else if (remoteAudioRef.current) {
                            track.attach(remoteAudioRef.current);
                        }
                    }
                };

                room.on(RoomEvent.TrackSubscribed, (track, _pub, participant) => {
                    attachRemoteTrack(track, participant);
                });

                room.on(RoomEvent.TrackUnsubscribed, (track) => {
                    track.detach();
                    if (track.source === Track.Source.ScreenShareAudio) {
                        setScreenHasAudio(false);
                    }
                });

                room.on(RoomEvent.TrackPublished, (pub) => {
                    if (pub.source === Track.Source.ScreenShare) {
                        setRemoteScreenShared(true);
                        setWatching(true);
                    }
                });

                room.on(RoomEvent.TrackUnpublished, (pub) => {
                    if (pub.source === Track.Source.ScreenShare) {
                        setRemoteScreenShared(false);
                        setWatching(true);
                        setScreenHasAudio(false);
                        if (document.fullscreenElement) {
                            document.exitFullscreen().catch(() => { });
                        }
                    }
                });

                room.on(RoomEvent.TrackMuted, (pub, participant) => {
                    if (
                        pub.kind === Track.Kind.Audio &&
                        pub.source === Track.Source.Microphone &&
                        participant.identity !== room.localParticipant.identity
                    ) {
                        setRemoteMicMuted(true);
                    }
                });

                room.on(RoomEvent.TrackUnmuted, (pub, participant) => {
                    if (
                        pub.kind === Track.Kind.Audio &&
                        pub.source === Track.Source.Microphone &&
                        participant.identity !== room.localParticipant.identity
                    ) {
                        setRemoteMicMuted(false);
                    }
                });

                room.on(RoomEvent.LocalTrackPublished, (pub) => {
                    if (pub.source === Track.Source.ScreenShare) {
                        setScreenSharing(true);
                    }
                });

                room.on(RoomEvent.LocalTrackUnpublished, (pub) => {
                    if (pub.source === Track.Source.ScreenShare) {
                        setScreenSharing(false);
                    }
                });

                room.on(RoomEvent.ParticipantDisconnected, () => {
                    handleEndRef.current();
                });

                room.remoteParticipants.forEach((participant) => {
                    participant.trackPublications.forEach((pub) => {
                        if (pub.track) attachRemoteTrack(pub.track, participant);
                        if (pub.source === Track.Source.ScreenShare) {
                            setRemoteScreenShared(true);
                        }
                        if (
                            pub.kind === Track.Kind.Audio &&
                            pub.source === Track.Source.Microphone
                        ) {
                            setRemoteMicMuted(pub.isMuted);
                        }
                    });
                });

                if (cancelled) return;

                try {
                    if (callType === "video") {
                        await room.localParticipant.enableCameraAndMicrophone();
                    } else {
                        await room.localParticipant.setMicrophoneEnabled(true);
                    }
                    if (cancelled) return;

                    const localTrack = room.localParticipant.getTrackPublication(
                        Track.Source.Camera
                    );
                    if (localTrack?.track && localVideoRef.current) {
                        localTrack.track.attach(localVideoRef.current);
                    }
                } catch (mediaErr) {
                    console.error("Local media error:", mediaErr);
                    if (!cancelled) {
                        setMediaError(
                            callType === "video"
                                ? "Failed to enable the camera/microphone."
                                : "Failed to enable the microphone."
                        );
                    }
                }
            } catch (err) {
                if (!cancelled) {
                    console.error("Call connection error:", err);
                }
            }
        })();

        return () => {
            cancelled = true;
            try {
                room.localParticipant.videoTrackPublications.forEach((pub) =>
                    pub.track?.detach()
                );
                room.localParticipant.audioTrackPublications.forEach((pub) =>
                    pub.track?.detach()
                );
            } catch { }
            room.disconnect();
            roomRef.current = null;
            setScreenSharing(false);
            setRemoteScreenShared(false);
            setWatching(true);
            setScreenHasAudio(false);
        };
    }, [roomName, livekitToken, callType]);

    useEffect(() => {
        if (!callId) return;
        const unsubscribe = subscribeToCall(callId, (call) => {
            if (!call || call.status === "ended" || call.status === "declined") {
                handleEndRef.current();
            }
        });
        return () => unsubscribe();
    }, [callId]);

    const handleToggleMute = useCallback(async () => {
        const room = roomRef.current;
        if (!room) return;
        await room.localParticipant.setMicrophoneEnabled(isMuted);
        toggleMute();
    }, [isMuted, toggleMute]);

    const handleToggleCamera = useCallback(async () => {
        const room = roomRef.current;
        if (!room) return;
        const enable = isCameraOff;
        await room.localParticipant.setCameraEnabled(enable);

        if (enable) {
            const pub = room.localParticipant.getTrackPublication(
                Track.Source.Camera
            );
            if (pub?.track && localVideoRef.current) {
                pub.track.attach(localVideoRef.current);
            }
        } else {
            localVideoRef.current?.pause();
        }

        toggleCamera();
    }, [isCameraOff, toggleCamera]);

    const handleToggleScreenShare = useCallback(async () => {
        const room = roomRef.current;
        if (!room) return;
        setMediaError(null);
        try {
            await room.localParticipant.setScreenShareEnabled(!screenSharing, {
                audio: true,
            });
        } catch (err) {
            if ((err as { name?: string })?.name !== "NotAllowedError") {
                console.error("Screen share error:", err);
                setMediaError("Failed to start screen sharing.");
            }
        }
    }, [screenSharing]);

    const handleLeaveScreen = useCallback(() => {
        const room = roomRef.current;
        if (!room) return;
        setWatching(false);
        setScreenSubscribed(room, false);
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => { });
        }
    }, []);

    const handleJoinScreen = useCallback(() => {
        const room = roomRef.current;
        if (!room) return;
        setWatching(true);
        setScreenSubscribed(room, true);
    }, []);

    const handleFullscreen = useCallback(() => {
        const el = screenBoxRef.current;
        if (!el) return;
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => { });
        } else {
            el.requestFullscreen().catch(() => { });
        }
    }, []);

    const handleToggleScreenMute = useCallback(() => {
        setScreenMuted((m) => !m);
    }, []);

    const handleVolumeChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = Number(e.target.value);
            setScreenVolume(value);
            setScreenMuted(value === 0);
        },
        []
    );

    if (!activeCall) return null;

    const otherName =
        activeCall.callerId === myUid
            ? activeCall.calleeName
            : activeCall.callerName;

    const otherAvatar =
        activeCall.callerId === myUid
            ? activeCall.calleeAvatar
            : activeCall.callerAvatar;

    const displayName = remoteName || otherName || "Unknown";
    const displayAvatar = otherAvatar || null;
    const initial = displayName[0]?.toUpperCase() ?? "?";
    const showScreen = remoteScreenShared && watching;
    const wide = showScreen || screenSharing;
    const effectiveVolume = screenMuted ? 0 : screenVolume;
    const VolumeIcon =
        effectiveVolume === 0 ? VolumeX : effectiveVolume < 0.5 ? Volume1 : Volume2;

    return (
        <>
            <CallStyles />

            <div className="call-overlay fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -top-32 -left-24 w-[460px] h-[460px] rounded-full bg-[#5b3df0]/25 blur-[130px]" />
                    <div className="absolute -bottom-40 -right-20 w-[420px] h-[420px] rounded-full bg-[#2b1f78]/28 blur-[130px]" />
                </div>

                <div
                    className={`call-panel glass-panel relative w-full ${wide ? "max-w-3xl" : "max-w-md"
                        } h-[85vh] max-h-[640px] flex flex-col overflow-hidden rounded-[32px]`}
                >
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

                    <audio ref={remoteAudioRef} autoPlay />
                    <audio ref={screenAudioRef} autoPlay />

                    <div className="flex-none flex items-center justify-center gap-2 pt-6 pb-2 flex-wrap px-4">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08]">
                            <span
                                className={`w-1.5 h-1.5 rounded-full ${remoteConnected
                                    ? "bg-[#34D399] shadow-[0_0_6px_#34D399]"
                                    : "bg-[#a996ff] status-dot-ringing"
                                    }`}
                            />
                            <span className="text-[11px] font-medium text-white/60 tracking-wide tabular-nums">
                                {remoteConnected ? <CallTimer /> : "Calling…"}
                            </span>
                        </div>

                        {screenSharing && (
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08]">
                                <Monitor size={12} className="text-[#a996ff]" />
                                <span className="text-[11px] font-medium text-white/60 tracking-wide">
                                    You are sharing your screen
                                </span>
                            </div>
                        )}

                        {remoteScreenShared && !watching && (
                            <button
                                onClick={handleJoinScreen}
                                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7c5cff]/20 border border-[#a996ff]/30 hover:bg-[#7c5cff]/30 transition-colors cursor-pointer"
                            >
                                <Monitor size={12} className="text-[#a996ff]" />
                                <span className="text-[11px] font-medium text-white/85 tracking-wide">
                                    {displayName} is sharing · Watch
                                </span>
                            </button>
                        )}
                    </div>

                    <div className="flex-1 relative flex items-center justify-center min-h-0">
                        <div
                            ref={screenBoxRef}
                            onDoubleClick={handleFullscreen}
                            className={
                                showScreen
                                    ? "group absolute inset-0 z-10 bg-[#07060d]"
                                    : "hidden"
                            }
                        >
                            <video
                                ref={remoteScreenRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-contain"
                            />

                            <div
                                onDoubleClick={(e) => e.stopPropagation()}
                                className="absolute top-3 left-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
                            >
                                <button
                                    onClick={handleLeaveScreen}
                                    title="Leave screen share"
                                    className={glassChip}
                                >
                                    <X size={14} />
                                    Leave
                                </button>
                                <button
                                    onClick={handleFullscreen}
                                    title="Fullscreen"
                                    className={`${glassChip} !px-2.5`}
                                >
                                    <Maximize2 size={14} />
                                </button>
                            </div>

                            {screenHasAudio && (
                                <div
                                    onDoubleClick={(e) => e.stopPropagation()}
                                    className="absolute bottom-3 left-3 flex items-center gap-2.5 h-9 pl-3 pr-4 rounded-full bg-black/50 backdrop-blur-md border border-white/15 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
                                >
                                    <button
                                        onClick={handleToggleScreenMute}
                                        title={effectiveVolume === 0 ? "Unmute" : "Mute"}
                                        className="text-white/90 hover:text-white transition-colors cursor-pointer"
                                    >
                                        <VolumeIcon size={16} />
                                    </button>
                                    <input
                                        type="range"
                                        min={0}
                                        max={1}
                                        step={0.01}
                                        value={effectiveVolume}
                                        onChange={handleVolumeChange}
                                        aria-label="Screen share volume"
                                        className="w-24 h-1 accent-[#7c5cff] cursor-pointer"
                                    />
                                </div>
                            )}
                        </div>

                        {callType === "video" ? (
                            <>
                                <video
                                    ref={remoteVideoRef}
                                    autoPlay
                                    playsInline
                                    className={
                                        showScreen
                                            ? "absolute top-4 right-4 z-20 w-28 h-40 object-cover rounded-2xl border border-white/[0.14] shadow-lg shadow-black/40"
                                            : "absolute inset-0 w-full h-full object-cover"
                                    }
                                />
                                {!remoteConnected && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-[#0d0b17]/60 backdrop-blur-md">
                                        <div className="flex flex-col items-center gap-4">
                                            <Avatar
                                                initial={initial}
                                                avatarUrl={displayAvatar}
                                                ringing
                                                muted={false}
                                            />
                                            <p className="text-white/90 text-base font-medium">
                                                {displayName}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {!isCameraOff && (
                                    <video
                                        ref={localVideoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="absolute bottom-4 right-4 z-20 w-28 h-40 object-cover rounded-2xl border border-white/[0.14] shadow-lg shadow-black/40"
                                    />
                                )}
                            </>
                        ) : (
                            !showScreen && (
                                <div className="flex flex-col items-center gap-5">
                                    <Avatar
                                        initial={initial}
                                        avatarUrl={displayAvatar}
                                        ringing={!remoteConnected}
                                        muted={remoteConnected && remoteMicMuted}
                                    />
                                    <div className="text-center">
                                        <p className="text-white text-xl font-semibold tracking-tight">
                                            {displayName}
                                        </p>
                                        <p className="text-white/40 text-[13px] mt-1">
                                            {remoteConnected ? "Voice call" : "Ringing…"}
                                        </p>
                                    </div>
                                </div>
                            )
                        )}
                    </div>

                    {mediaError && (
                        <div className="flex-none flex items-center justify-center pb-2">
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-400/20">
                                <span className="text-[11px] font-medium text-red-300 tracking-wide">
                                    {mediaError}
                                </span>
                            </div>
                        </div>
                    )}

                    {remoteConnected && remoteMicMuted && (
                        <div className="flex-none flex items-center justify-center pb-3">
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08]">
                                <MicOff size={12} className="text-red-400" />
                                <span className="text-[11px] font-medium text-white/50 tracking-wide">
                                    {displayName} muted their mic
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="flex-none flex items-center justify-center gap-4 px-6 py-7 border-t border-white/[0.06]">
                        <button
                            onClick={handleToggleMute}
                            title={isMuted ? "Unmute" : "Mute"}
                            className={`glass-btn w-[52px] h-[52px] rounded-full flex items-center justify-center ${isMuted ? "active text-[#0d0b17]" : "text-white"
                                }`}
                        >
                            {isMuted ? <MicOff size={19} /> : <Mic size={19} />}
                        </button>

                        {callType === "video" && (
                            <button
                                onClick={handleToggleCamera}
                                title={isCameraOff ? "Turn camera on" : "Turn camera off"}
                                className={`glass-btn w-[52px] h-[52px] rounded-full flex items-center justify-center ${isCameraOff ? "active text-[#0d0b17]" : "text-white"
                                    }`}
                            >
                                {isCameraOff ? <VideoOff size={19} /> : <Video size={19} />}
                            </button>
                        )}

                        {canShareScreen && (
                            <button
                                onClick={handleToggleScreenShare}
                                title={screenSharing ? "Stop sharing" : "Share screen"}
                                className={`glass-btn w-[52px] h-[52px] rounded-full flex items-center justify-center ${screenSharing ? "active text-[#0d0b17]" : "text-white"
                                    }`}
                            >
                                {screenSharing ? (
                                    <MonitorOff size={19} />
                                ) : (
                                    <Monitor size={19} />
                                )}
                            </button>
                        )}

                        <button
                            onClick={handleEnd}
                            title="End call"
                            className="glass-btn w-[52px] h-[52px] rounded-full flex items-center justify-center !bg-gradient-to-br !from-red-500 !to-red-600 !border-red-400/40 text-white shadow-[0_0_28px_rgba(239,68,68,0.45)] hover:!shadow-[0_0_36px_rgba(239,68,68,0.6)]"
                        >
                            <PhoneOff size={19} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

const Avatar = memo(function Avatar({
    initial,
    avatarUrl,
    ringing,
    muted,
}: {
    initial: string;
    avatarUrl?: string | null;
    ringing?: boolean;
    muted?: boolean;
}) {
    return (
        <div className="relative w-28 h-28 flex items-center justify-center">
            {ringing && (
                <>
                    <span className="call-ring absolute inset-0 rounded-full border-2 border-[#7c5cff]/50" />
                    <span
                        className="call-ring absolute inset-0 rounded-full border-2 border-[#7c5cff]/50"
                        style={{ animationDelay: "0.6s" }}
                    />
                </>
            )}
            {avatarUrl ? (
                <img
                    src={avatarUrl}
                    alt={initial}
                    className="call-avatar relative w-24 h-24 rounded-full object-cover border border-[#a996ff]/30"
                />
            ) : (
                <div className="call-avatar relative w-24 h-24 rounded-full flex items-center justify-center bg-gradient-to-br from-[#6b46f0] via-[#5b3df0] to-[#4028b0] border border-[#a996ff]/30 text-white text-3xl font-semibold">
                    {initial}
                </div>
            )}
            {muted && (
                <div className="absolute bottom-0.5 right-0.5 w-7 h-7 rounded-full bg-[#0d0b17] border border-white/[0.12] flex items-center justify-center shadow-md shadow-black/40">
                    <MicOff size={13} className="text-red-400" />
                </div>
            )}
        </div>
    );
});