"use client";

import { memo } from "react";
import { ArrowDownLeft, ArrowUpRight, Phone, Video } from "lucide-react";
import { toDate } from "./chat-shared";
import { getCallTitle } from "@/lib/firestore/callLog";

function formatClock(ts: any) {
    if (!ts) return "";
    return toDate(ts).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatCallDuration(total: number) {
    if (total < 60) return `${total} ${total === 1 ? "second" : "seconds"}`;
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m} min ${s} s`;
}

interface CallLogMessageProps {
    m: any;
    isMine: boolean;
    isFirstInGroup: boolean;
    onCallBack: (type: "audio" | "video") => void;
}

const CallLogMessage = memo(function CallLogMessage({
    m,
    isMine,
    isFirstInGroup,
    onCallBack,
}: CallLogMessageProps) {
    const isVideoCall = m.callType === "video";
    const status = m.callStatus;
    const duration = typeof m.duration === "number" ? m.duration : 0;
    const completed = status === "completed";

    const title = getCallTitle(status, isVideoCall ? "video" : "audio", isMine);

    const subtitle =
        formatClock(m.createdAt) +
        (completed && duration > 0 ? `, ${formatCallDuration(duration)}` : "");

    const Arrow = isMine ? ArrowUpRight : ArrowDownLeft;
    const MainIcon = isVideoCall ? Video : Phone;
    const arrowColor = completed ? "text-[#a893ff]" : "text-red-400";

    return (
        <div
            id={`msg-${m.id}`}
            className={`flex ${isMine ? "justify-end" : "justify-start"} ${isFirstInGroup ? "pt-2.5" : "pt-0.5"
                }`}
        >
            <button
                type="button"
                onClick={() => onCallBack(isVideoCall ? "video" : "audio")}
                title="Call back"
                className="flex items-center justify-between gap-6 min-w-[220px] px-4 py-2.5 rounded-2xl bg-[#1a1433]/90 border border-white/[0.08] text-left hover:bg-[#221a40] transition-colors cursor-pointer"
            >
                <div className="flex flex-col gap-0.5">
                    <span className="text-[14px] font-semibold text-white/90 leading-tight">
                        {title}
                    </span>
                    <span className="flex items-center gap-1 text-[12px] text-zinc-400 leading-tight tabular-nums">
                        <Arrow size={13} className={`shrink-0 ${arrowColor}`} strokeWidth={2.5} />
                        {subtitle}
                    </span>
                </div>
                <MainIcon size={18} className="shrink-0 text-[#7c5cff]" />
            </button>
        </div>
    );
});

export default CallLogMessage;