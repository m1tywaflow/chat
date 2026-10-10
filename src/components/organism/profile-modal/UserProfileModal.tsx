"use client";

import { useState } from "react";
import { MessageCircle, Phone, Video, Link2, Check } from "lucide-react";
import FullProfileView from "./Fullprofileview";

export default function UserProfileModal({
    user,
    onClose,
    onWrite,
    onCall,
}: {
    user: any;
    onClose: () => void;
    onWrite: () => void;
    onCall?: (kind: "audio" | "video") => void;
}) {
    const [copied, setCopied] = useState(false);

    const copyLink = async () => {
        await navigator.clipboard.writeText(
            `${window.location.origin}/u/${user.username}`
        );
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const btn =
        "flex-1 h-14 flex flex-col items-center justify-center gap-1 rounded-sm bg-white/[0.06] border border-white/[0.1] text-[11px] text-white/80 hover:bg-white/[0.12] hover:text-white transition-colors cursor-pointer";

    return (
        <FullProfileView
            onClose={onClose}
            username={user.username ?? ""}
            avatar={user.avatar ?? ""}
            avatarBorder={user.avatarBorder ?? "linear-gradient(135deg,#7c5cff,#5b3df0)"}
            avatarDecoration={user.avatarDecoration ?? null}
            bannerGradient={user.bannerGradient ?? "linear-gradient(135deg,#1a1333,#07060d)"}
            bannerIsImage={Boolean(user.bannerIsImage)}
            cardColor={user.cardColor ?? "#0a0913"}
            gifts={user.gifts ?? []}
            bio={user.bio}
            actions={
                <>
                    <button type="button" onClick={onWrite} className={btn}>
                        <MessageCircle size={16} />
                        Write
                    </button>

                    {onCall && (
                        <>
                            <button type="button" onClick={() => onCall("audio")} className={btn}>
                                <Phone size={16} />
                                Call
                            </button>
                            <button type="button" onClick={() => onCall("video")} className={btn}>
                                <Video size={16} />
                                Video
                            </button>
                        </>
                    )}

                    <button type="button" onClick={copyLink} className={btn}>
                        {copied ? <Check size={16} /> : <Link2 size={16} />}
                        {copied ? "Copied" : "Link"}
                    </button>
                </>
            }
        />
    );
}