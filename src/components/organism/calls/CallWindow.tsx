"use client";

import { useEffect, useRef, useState } from "react";
import { Room, RoomEvent, Track } from "livekit-client";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { useCallStore } from "@/store/call-store";
import { endCall, subscribeToCall } from "@/lib/calls";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function CallWindow() {
    const {
        activeCall,
        livekitToken,
        isMuted,
        isCameraOff,
        toggleMute,
        toggleCamera,
        resetCall,
    } = useCallStore();

    const { firebaseUser } = useCurrentUser();
    const roomRef = useRef<Room | null>(null);
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
    const [remoteName, setRemoteName] = useState<string>("");
    const [elapsed, setElapsed] = useState(0);
    const [remoteConnected, setRemoteConnected] = useState(false);

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
        activeCall.callerId === firebaseUser?.uid
            ? activeCall.calleeName
            : activeCall.callerName;

    const otherAvatar =
        activeCall.callerId === firebaseUser?.uid
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
        .call-btn { transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease; }
        .call-btn:hover { transform: translateY(-2px); }
        .call-btn:active { transform: translateY(0) scale(0.94); }
      `}</style>

            <div className="call-overlay fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                {/* ambient violet glow field, matches the rest of the app */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -top-32 -left-24 w-[460px] h-[460px] rounded-full bg-[#5b3df0]/18 blur-[130px]" />
                    <div className="absolute -bottom-40 -right-20 w-[420px] h-[420px] rounded-full bg-[#2b1f78]/20 blur-[130px]" />
                </div>

                <div
                    className="call-panel relative w-full max-w-md h-[85vh] max-h-[640px] flex flex-col overflow-hidden border border-white/[0.08] bg-[#0d0b17]/70 backdrop-blur-2xl shadow-[0_0_80px_rgba(124,92,255,0.15)]"
                    style={{
                        background:
                            "linear-gradient(180deg, rgba(18,17,31,0.75) 0%, rgba(7,6,13,0.85) 100%)",
                    }}
                >
                    {/* subtle top sheen for the glass effect */}
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                    <div className="pointer-events-none absolute inset-0 border border-white/[0.04]" />

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
                                            <Avatar initial={initial} avatarUrl={displayAvatar} ringing />
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
                                    className="absolute bottom-4 right-4 w-28 h-40 object-cover border border-white/[0.12] bg-black/60 shadow-lg shadow-black/40 backdrop-blur-sm"
                                />
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-5">
                                <Avatar initial={initial} avatarUrl={displayAvatar} ringing={!remoteConnected} />
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

                    {/* Controls */}
                    <div className="flex-none flex items-center justify-center gap-4 px-6 py-7 border-t border-white/[0.06] bg-white/[0.02]">
                        <button
                            onClick={handleToggleMute}
                            title={isMuted ? "Unmute" : "Mute"}
                            className={`call-btn w-13 h-13 w-[52px] h-[52px] flex items-center justify-center border backdrop-blur-sm ${isMuted
                                    ? "bg-white text-[#0d0b17] border-white"
                                    : "bg-white/[0.06] text-white border-white/[0.12] hover:bg-white/[0.1]"
                                }`}
                        >
                            {isMuted ? <MicOff size={19} /> : <Mic size={19} />}
                        </button>

                        {callType === "video" && (
                            <button
                                onClick={handleToggleCamera}
                                title={isCameraOff ? "Turn camera on" : "Turn camera off"}
                                className={`call-btn w-[52px] h-[52px] flex items-center justify-center border backdrop-blur-sm ${isCameraOff
                                        ? "bg-white text-[#0d0b17] border-white"
                                        : "bg-white/[0.06] text-white border-white/[0.12] hover:bg-white/[0.1]"
                                    }`}
                            >
                                {isCameraOff ? <VideoOff size={19} /> : <Video size={19} />}
                            </button>
                        )}

                        <button
                            onClick={handleEnd}
                            title="End call"
                            className="call-btn w-[52px] h-[52px] flex items-center justify-center bg-gradient-to-br from-red-500 to-red-600 text-white shadow-[0_0_28px_rgba(239,68,68,0.45)] hover:shadow-[0_0_36px_rgba(239,68,68,0.6)]"
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
}: {
    initial: string;
    avatarUrl?: string | null;
    ringing?: boolean;
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
        </div>
    );
}