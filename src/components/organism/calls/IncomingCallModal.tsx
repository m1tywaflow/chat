"use client";

import { Phone, PhoneOff, Video } from "lucide-react";
import { useCallStore } from "@/store/call-store";
import { acceptCall, declineCall, fetchLiveKitToken } from "@/lib/calls";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function IncomingCallModal() {
    const { incomingCall, setIncomingCall, setActiveCall, setLivekitToken, setMyUid } =
        useCallStore();
    const { firebaseUser } = useCurrentUser();

    if (!incomingCall) return null;

    const handleAccept = async () => {
        if (!firebaseUser) return;
        await acceptCall(incomingCall.id);
        // incomingCall.calleeName is our own username — firebaseUser.displayName
        // is always null here because auth uses a fake email/password login,
        // so relying on it was making LiveKit register us as literal "User"
        const token = await fetchLiveKitToken(
            incomingCall.roomName,
            firebaseUser.uid,
            incomingCall.calleeName || firebaseUser.displayName || "User"
        );
        setLivekitToken(token);
        setMyUid(firebaseUser.uid);
        setActiveCall(incomingCall);
        setIncomingCall(null);
    };

    const handleDecline = async () => {
        await declineCall(incomingCall.id);
        setIncomingCall(null);
    };

    const initial = (incomingCall.callerName || "?")[0]?.toUpperCase();

    return (
        <>
            <style>{`
        @keyframes incomingFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes incomingPanelIn {
          from { opacity: 0; transform: scale(0.94) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes incomingRing {
          0% { transform: scale(1); opacity: 0.55; }
          70% { transform: scale(1.5); opacity: 0; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes incomingAvatarGlow {
          0%, 100% { box-shadow: 0 0 36px rgba(124,92,255,0.28), 0 0 0 1px rgba(124,92,255,0.28) inset; }
          50% { box-shadow: 0 0 54px rgba(124,92,255,0.42), 0 0 0 1px rgba(124,92,255,0.4) inset; }
        }
        .incoming-overlay { animation: incomingFadeIn 0.2s ease-out; }
        .incoming-panel { animation: incomingPanelIn 0.28s cubic-bezier(0.34, 1.2, 0.64, 1); }
        .incoming-ring { animation: incomingRing 2.2s ease-out infinite; }
        .incoming-avatar { animation: incomingAvatarGlow 3.2s ease-in-out infinite; }
        .incoming-btn { transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .incoming-btn:hover { transform: translateY(-2px); }
        .incoming-btn:active { transform: translateY(0) scale(0.94); }
      `}</style>

            <div className="incoming-overlay fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -top-32 -left-24 w-[460px] h-[460px] rounded-full bg-[#5b3df0]/18 blur-[130px]" />
                    <div className="absolute -bottom-40 -right-20 w-[420px] h-[420px] rounded-full bg-[#2b1f78]/20 blur-[130px]" />
                </div>

                <div
                    className="incoming-panel relative w-full max-w-[340px] flex flex-col items-center overflow-hidden border border-white/[0.08] backdrop-blur-2xl shadow-[0_0_80px_rgba(124,92,255,0.15)] px-8 py-9 gap-5"
                    style={{
                        background:
                            "linear-gradient(180deg, rgba(18,17,31,0.75) 0%, rgba(7,6,13,0.85) 100%)",
                    }}
                >
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                    <div className="pointer-events-none absolute inset-0 border border-white/[0.04]" />

                    <div className="relative w-24 h-24 flex items-center justify-center">
                        <span className="incoming-ring absolute inset-0 border-2 border-[#7c5cff]/50" />
                        <span
                            className="incoming-ring absolute inset-0 border-2 border-[#7c5cff]/50"
                            style={{ animationDelay: "0.6s" }}
                        />
                        {incomingCall.callerAvatar ? (
                            <img
                                src={incomingCall.callerAvatar}
                                alt={incomingCall.callerName}
                                className="incoming-avatar relative w-20 h-20 object-cover border border-[#a996ff]/30"
                            />
                        ) : (
                            <div className="incoming-avatar relative w-20 h-20 flex items-center justify-center bg-gradient-to-br from-[#6b46f0] via-[#5b3df0] to-[#4028b0] border border-[#a996ff]/30 text-white text-2xl font-semibold">
                                {initial}
                            </div>
                        )}
                    </div>

                    <div className="text-center relative z-10">
                        <p className="text-white text-lg font-semibold tracking-tight">
                            {incomingCall.callerName}
                        </p>
                        <p className="text-white/40 text-[13px] mt-1 flex items-center justify-center gap-1.5">
                            {incomingCall.type === "video" ? (
                                <Video size={13} className="text-[#a996ff]" />
                            ) : (
                                <Phone size={13} className="text-[#a996ff]" />
                            )}
                            Incoming {incomingCall.type === "video" ? "video" : "voice"} call
                        </p>
                    </div>

                    <div className="flex items-center gap-5 mt-2 relative z-10">
                        <button
                            onClick={handleDecline}
                            title="Decline"
                            className="incoming-btn w-14 h-14 flex items-center justify-center bg-gradient-to-br from-red-500 to-red-600 text-white shadow-[0_0_28px_rgba(239,68,68,0.45)] hover:shadow-[0_0_36px_rgba(239,68,68,0.6)]"
                        >
                            <PhoneOff size={20} />
                        </button>
                        <button
                            onClick={handleAccept}
                            title="Accept"
                            className="incoming-btn w-14 h-14 flex items-center justify-center bg-gradient-to-br from-[#7c5cff] to-[#5b3df0] text-white shadow-[0_0_28px_rgba(124,92,255,0.5)] hover:shadow-[0_0_36px_rgba(124,92,255,0.65)]"
                        >
                            <Phone size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}