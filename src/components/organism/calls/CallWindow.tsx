"use client";

import { useEffect, useRef, useState } from "react";
import { Room, RoomEvent, Track } from "livekit-client";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { useCallStore } from "@/store/call-store";
import { endCall, subscribeToCall } from "@/lib/calls";

export default function CallWindow() {
    const {
        activeCall,
        livekitToken,
        isMuted,
        isCameraOff,
        toggleMute,
        toggleCamera,
        resetCall,
        myUid,
    } = useCallStore();
    const roomRef = useRef<Room | null>(null);
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
    const [remoteName, setRemoteName] = useState<string>("");
    const [elapsed, setElapsed] = useState(0);
    const [remoteConnected, setRemoteConnected] = useState(false);
    const [remoteMicMuted, setRemoteMicMuted] = useState(false);

    // stable primitives — prevents reconnect loops caused by activeCall
    // being a fresh object reference on every store update
    const callId = activeCall?.id;
    const roomName = activeCall?.roomName;
    const callType = activeCall?.type;

    // Connect to LiveKit room — only re-runs when the actual room/token changes
    useEffect(() => {
        if (!roomName || !livekitToken) return;

        let cancelled = false;
        const room = new Room();
        roomRef.current = room;

        const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL!;

        (async () => {
            await room.connect(livekitUrl, livekitToken);
            if (cancelled) return;

            if (callType === "video") {
                await room.localParticipant.enableCameraAndMicrophone();
            } else {
                await room.localParticipant.setMicrophoneEnabled(true);
            }
            if (cancelled) return;

            const localTrack = room.localParticipant.videoTrackPublications
                .values()
                .next().value;
            if (localTrack?.track && localVideoRef.current) {
                localTrack.track.attach(localVideoRef.current);
            }

            const attachRemoteTrack = (
                track: any,
                participant: { name?: string; identity: string }
            ) => {
                setRemoteName(participant.name ?? participant.identity);
                setRemoteConnected(true);
                if (track.kind === Track.Kind.Video && remoteVideoRef.current) {
                    track.attach(remoteVideoRef.current);
                }
                if (track.kind === Track.Kind.Audio && remoteAudioRef.current) {
                    track.attach(remoteAudioRef.current);
                }
            };

            room.on(RoomEvent.TrackSubscribed, (track, _pub, participant) => {
                attachRemoteTrack(track, participant);
            });

            // remote mute indicator — LiveKit fires these on the participant's
            // publication whenever they toggle their mic, independent of the
            // track being subscribed/attached
            room.on(RoomEvent.TrackMuted, (pub, participant) => {
                if (
                    pub.kind === Track.Kind.Audio &&
                    participant.identity !== room.localParticipant.identity
                ) {
                    setRemoteMicMuted(true);
                }
            });
            room.on(RoomEvent.TrackUnmuted, (pub, participant) => {
                if (
                    pub.kind === Track.Kind.Audio &&
                    participant.identity !== room.localParticipant.identity
                ) {
                    setRemoteMicMuted(false);
                }
            });

            room.on(RoomEvent.ParticipantDisconnected, () => {
                handleEnd();
            });

            // guard against a race where the remote participant's track was
            // already subscribed before we attached the listener above — without
            // this, that side can get stuck showing "Calling..." forever even
            // though the other side is already connected
            room.remoteParticipants.forEach((participant) => {
                participant.trackPublications.forEach((pub) => {
                    if (pub.track) attachRemoteTrack(pub.track, participant);
                    if (pub.kind === Track.Kind.Audio) {
                        setRemoteMicMuted(pub.isMuted);
                    }
                });
            });
        })();

        return () => {
            cancelled = true;
            room.disconnect();
            roomRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomName, livekitToken, callType]);

    // Listen for remote hangup / decline via Firestore
    useEffect(() => {
        if (!callId) return;
        const unsubscribe = subscribeToCall(callId, (call) => {
            if (!call || call.status === "ended" || call.status === "declined") {
                handleEnd();
            }
        });
        return () => unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [callId]);

    // call duration timer, starts once the remote side actually joins
    useEffect(() => {
        if (!remoteConnected) return;
        const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
        return () => clearInterval(interval);
    }, [remoteConnected]);

    const handleEnd = async () => {
        if (callId) {
            await endCall(callId);
        }
        roomRef.current?.disconnect();
        resetCall();
    };

    const handleToggleMute = async () => {
        const room = roomRef.current;
        if (!room) return;
        await room.localParticipant.setMicrophoneEnabled(isMuted);
        toggleMute();
    };

    const handleToggleCamera = async () => {
        const room = roomRef.current;
        if (!room) return;
        await room.localParticipant.setCameraEnabled(isCameraOff);
        toggleCamera();
    };

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

    function formatElapsed(sec: number) {
        const m = Math.floor(sec / 60)
            .toString()
            .padStart(2, "0");
        const s = (sec % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    }

    return (
        <>
            <style>{`
        @keyframes callFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes callPanelIn {
          from { opacity: 0; transform: scale(0.96) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes ringPulse {
          0% { transform: scale(1); opacity: 0.55; }
          70% { transform: scale(1.55); opacity: 0; }
          100% { transform: scale(1.55); opacity: 0; }
        }
        @keyframes avatarGlow {
          0%, 100% { box-shadow: 0 0 40px rgba(124,92,255,0.25), 0 0 0 1px rgba(124,92,255,0.25) inset; }
          50% { box-shadow: 0 0 60px rgba(124,92,255,0.4), 0 0 0 1px rgba(124,92,255,0.35) inset; }
        }
        .call-overlay { animation: callFadeIn 0.2s ease-out; }
        .call-panel { animation: callPanelIn 0.28s cubic-bezier(0.34, 1.2, 0.64, 1); }
        .call-ring { animation: ringPulse 2.2s ease-out infinite; }
        .call-avatar { animation: avatarGlow 3.2s ease-in-out infinite; }

        /* glass panel — pure CSS backdrop-filter, aether-css style, tinted to app violet */
        .glass-panel {
          background: rgba(30, 22, 66, 0.28);
          backdrop-filter: blur(24px) saturate(160%);
          -webkit-backdrop-filter: blur(24px) saturate(160%);
          border: 1px solid rgba(169, 150, 255, 0.18);
          box-shadow:
            0 10px 40px 0 rgba(10, 6, 30, 0.4),
            inset 0 0 4px 2px rgba(255, 255, 255, 0.05),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.08);
        }

        /* glass buttons — same recipe, lighter blur since they're small */
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
      `}</style>

            <div className="call-overlay fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                {/* ambient violet glow field — this is what the glass panel refracts through backdrop-filter */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -top-32 -left-24 w-[460px] h-[460px] rounded-full bg-[#5b3df0]/25 blur-[130px]" />
                    <div className="absolute -bottom-40 -right-20 w-[420px] h-[420px] rounded-full bg-[#2b1f78]/28 blur-[130px]" />
                </div>

                <div className="call-panel glass-panel relative w-full max-w-md h-[85vh] max-h-[640px] flex flex-col overflow-hidden">
                    {/* subtle top sheen */}
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

                    <audio ref={remoteAudioRef} autoPlay />

                    {/* Status bar */}
                    <div className="flex-none flex items-center justify-center pt-6 pb-2">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08]">
                            <span
                                className={`w-1.5 h-1.5 rounded-full ${remoteConnected
                                    ? "bg-[#34D399] shadow-[0_0_6px_#34D399]"
                                    : "bg-[#a996ff] animate-pulse"
                                    }`}
                            />
                            <span className="text-[11px] font-medium text-white/60 tracking-wide">
                                {remoteConnected ? formatElapsed(elapsed) : "Calling…"}
                            </span>
                        </div>
                    </div>

                    {/* Main area */}
                    <div className="flex-1 relative flex items-center justify-center min-h-0">
                        {callType === "video" ? (
                            <>
                                <video
                                    ref={remoteVideoRef}
                                    autoPlay
                                    playsInline
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                                {!remoteConnected && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-[#0d0b17]/60 backdrop-blur-md">
                                        <div className="flex flex-col items-center gap-4">
                                            <Avatar initial={initial} avatarUrl={displayAvatar} ringing muted={remoteConnected && remoteMicMuted} />
                                            <p className="text-white/90 text-base font-medium">
                                                {displayName}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="glass-btn absolute bottom-4 right-4 w-28 h-40 object-cover"
                                />
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-5">
                                <Avatar initial={initial} avatarUrl={displayAvatar} ringing={!remoteConnected} muted={remoteConnected && remoteMicMuted} />
                                <div className="text-center">
                                    <p className="text-white text-xl font-semibold tracking-tight">
                                        {displayName}
                                    </p>
                                    <p className="text-white/40 text-[13px] mt-1">
                                        {remoteConnected ? "Voice call" : "Ringing…"}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Remote mute indicator — sits right above the controls,
                        below the avatar/video, only visible once the other
                        side is actually connected and their mic is off */}
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

                    {/* Controls */}
                    <div className="flex-none flex items-center justify-center gap-4 px-6 py-7 border-t border-white/[0.06]">
                        <button
                            onClick={handleToggleMute}
                            title={isMuted ? "Unmute" : "Mute"}
                            className={`glass-btn w-[52px] h-[52px] flex items-center justify-center ${isMuted ? "active text-[#0d0b17]" : "text-white"
                                }`}
                        >
                            {isMuted ? <MicOff size={19} /> : <Mic size={19} />}
                        </button>

                        {callType === "video" && (
                            <button
                                onClick={handleToggleCamera}
                                title={isCameraOff ? "Turn camera on" : "Turn camera off"}
                                className={`glass-btn w-[52px] h-[52px] flex items-center justify-center ${isCameraOff ? "active text-[#0d0b17]" : "text-white"
                                    }`}
                            >
                                {isCameraOff ? <VideoOff size={19} /> : <Video size={19} />}
                            </button>
                        )}

                        <button
                            onClick={handleEnd}
                            title="End call"
                            className="glass-btn w-[52px] h-[52px] flex items-center justify-center !bg-gradient-to-br !from-red-500 !to-red-600 !border-red-400/40 text-white shadow-[0_0_28px_rgba(239,68,68,0.45)] hover:!shadow-[0_0_36px_rgba(239,68,68,0.6)]"
                        >
                            <PhoneOff size={19} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

function Avatar({
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
                    <span className="call-ring absolute inset-0 border-2 border-[#7c5cff]/50" />
                    <span
                        className="call-ring absolute inset-0 border-2 border-[#7c5cff]/50"
                        style={{ animationDelay: "0.6s" }}
                    />
                </>
            )}
            {avatarUrl ? (
                <img
                    src={avatarUrl}
                    alt={initial}
                    className="call-avatar relative w-24 h-24 object-cover border border-[#a996ff]/30"
                />
            ) : (
                <div className="call-avatar relative w-24 h-24 flex items-center justify-center bg-gradient-to-br from-[#6b46f0] via-[#5b3df0] to-[#4028b0] border border-[#a996ff]/30 text-white text-3xl font-semibold">
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
}