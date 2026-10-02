"use client";

import { memo, useEffect, useRef, useState } from "react";
import {
    CornerUpLeft,
    MoreVertical,
    ImageIcon,
    Check,
    X,
    Play,
    ChevronDown,
} from "lucide-react";
import ForwardedFrom from "@/components/atoms/ForwardedFrom";
import VoiceBubble from "@/components/atoms/VoiceBubble";
import { CUSTOM_EMOJIS, isCustomEmojiUrl } from "@/lib/customEmoji";
import {
    MessageMeta,
    ReactionGlyph,
    RichText,
    formatTime,
    isStickerOnlyText,
    isVideo,
    optimizeImage,
} from "./chat-shared";

const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "👍", "🔥"];
const REACTION_OPTIONS = [...REACTION_EMOJIS, ...CUSTOM_EMOJIS.map((e) => e.id)];

export interface MessageRowProps {
    m: any;
    myUid: string | null;
    isMine: boolean;
    isRead: boolean;
    isFirstInGroup: boolean;
    isLastInGroup: boolean;
    isUnreadStart: boolean;
    isPickerOpen: boolean;
    pickerExpanded: boolean;
    isPinned: boolean;
    isEditing: boolean;
    animate: boolean;
    onReply: (m: any) => void;
    onOpenPicker: (e: React.MouseEvent, id: string) => void;
    onExpandPicker: () => void;
    onOpenMenu: (e: React.MouseEvent, id: string, isMine: boolean) => void;
    onReact: (id: string, token: string) => void;
    onScrollToMessage: (id: string) => void;
    onOpenLightbox: (url: string) => void;
    onMediaLoad: () => void;
    onSubmitEdit: (id: string, text: string) => void;
    onCancelEdit: () => void;
}

const ts = (x: any) => x?.seconds ?? x?.getTime?.() ?? 0;

function sameMsg(a: any, b: any) {
    if (a === b) return true;
    return (
        a.id === b.id &&
        a.text === b.text &&
        a.edited === b.edited &&
        a.deleted === b.deleted &&
        a.imageUrl === b.imageUrl &&
        a.voiceUrl === b.voiceUrl &&
        a.pending === b.pending &&
        ts(a.createdAt) === ts(b.createdAt) &&
        (a.readBy?.length ?? 0) === (b.readBy?.length ?? 0) &&
        a.replyTo?.id === b.replyTo?.id &&
        JSON.stringify(a.reactions ?? null) === JSON.stringify(b.reactions ?? null) &&
        JSON.stringify(a.forwardedFrom ?? null) ===
        JSON.stringify(b.forwardedFrom ?? null)
    );
}

// Firestore отдаёт новые объекты на каждый снапшот — сравниваем по содержимому
function areEqual(prev: MessageRowProps, next: MessageRowProps) {
    for (const key of Object.keys(next) as (keyof MessageRowProps)[]) {
        if (key === "m") {
            if (!sameMsg(prev.m, next.m)) return false;
        } else if (!Object.is(prev[key], next[key])) return false;
    }
    return true;
}

const MessageRow = memo(function MessageRow({
    m,
    myUid,
    isMine,
    isRead,
    isFirstInGroup,
    isLastInGroup,
    isUnreadStart,
    isPickerOpen,
    pickerExpanded,
    isPinned,
    isEditing,
    animate,
    onReply,
    onOpenPicker,
    onExpandPicker,
    onOpenMenu,
    onReact,
    onScrollToMessage,
    onOpenLightbox,
    onMediaLoad,
    onSubmitEdit,
    onCancelEdit,
}: MessageRowProps) {
    const [editText, setEditText] = useState("");
    const editRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (!isEditing) return;
        setEditText(m.text || "");
        requestAnimationFrame(() => editRef.current?.focus());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditing]);

    const reactionSummary = Object.entries(
        (m.reactions || {}) as Record<string, string[]>
    )
        .filter(([, uids]) => uids.length > 0)
        .map(([token, uids]) => ({
            token,
            count: uids.length,
            mine: myUid ? uids.includes(myUid) : false,
        }));
    const hasReactions = reactionSummary.length > 0;

    const msgIsVideo = m.imageUrl && (m.isLocalVideo || isVideo(m.imageUrl));
    const isImageStickerMsg = !m.text && m.imageUrl && isCustomEmojiUrl(m.imageUrl);
    const isTextStickerMsg = !m.imageUrl && isStickerOnlyText(m.text);
    const isStickerMsg = isImageStickerMsg || isTextStickerMsg;
    const isVoiceMsg = !!m.voiceUrl;
    const time = formatTime(m.createdAt);

    function submitEdit() {
        const trimmed = editText.trim();
        if (trimmed) onSubmitEdit(m.id, trimmed);
    }

    const bubbleClass = isStickerMsg
        ? `leading-none ${m.pending ? "msg-bubble-pending" : ""}`
        : `text-sm leading-relaxed overflow-hidden ${isMine
            ? `bg-gradient-to-r from-[#6b46f0] via-[#5b3df0] to-[#4028b0] text-white rounded-[18px] shadow-md shadow-[#5b3df0]/20 ${isLastInGroup ? "rounded-br-[6px]" : ""
            }`
            : `border border-white/[0.08] rounded-[18px] ${isLastInGroup ? "rounded-bl-[6px]" : ""
            }`
        } ${!m.text && m.imageUrl ? "p-1" : "px-4 py-2"} ${isPinned ? "ring-1 ring-[#7c5cff]/40" : ""
        } ${m.pending ? "msg-bubble-pending" : ""}`;

    return (
        <div className={isFirstInGroup ? "pt-2.5" : "pt-0.5"}>
            {isUnreadStart && (
                <div className="flex items-center gap-3 my-3 px-1">
                    <div className="flex-1 h-px bg-[#7c5cff]/30" />
                    <span className="text-[11px] font-medium text-[#a893ff]">
                        Unread messages
                    </span>
                    <div className="flex-1 h-px bg-[#7c5cff]/30" />
                </div>
            )}
            <div
                id={`msg-${m.id}`}
                className={`msg-row flex ${isMine ? "justify-end" : "justify-start"} ${hasReactions ? "mb-2" : ""
                    } ${animate ? "msg-enter" : ""}`}
                onContextMenu={(e) => {
                    if (!m.deleted && !m.pending) onOpenMenu(e, m.id, isMine);
                }}
            >
                <div data-msg-anim={m.id} className="relative group max-w-[72%] min-w-0">
                    {isPickerOpen && (
                        <div
                            className={`reaction-picker absolute z-30 bottom-full mb-2 ${isMine ? "right-0" : "left-0"
                                } rounded-2xl bg-[#12111f] border border-white/[0.10] shadow-xl shadow-black/50 ${pickerExpanded ? "p-2.5 w-[252px]" : "px-2.5 py-2"
                                }`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {!pickerExpanded ? (
                                <div className="flex items-center gap-1">
                                    {REACTION_EMOJIS.map((token) => (
                                        <button
                                            key={token}
                                            onClick={() => onReact(m.id, token)}
                                            className="reaction-emoji-btn w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/[0.08] cursor-pointer"
                                        >
                                            <ReactionGlyph token={token} size={26} />
                                        </button>
                                    ))}
                                    <button
                                        onClick={onExpandPicker}
                                        title="More reactions"
                                        aria-label="More reactions"
                                        className="w-7 h-10 flex items-center justify-center rounded-xl hover:bg-white/[0.08] text-zinc-500 hover:text-white cursor-pointer"
                                    >
                                        <ChevronDown size={22} />
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-6 gap-1">
                                    {REACTION_OPTIONS.map((token) => (
                                        <button
                                            key={token}
                                            onClick={() => onReact(m.id, token)}
                                            className="reaction-emoji-btn w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/[0.08] cursor-pointer"
                                        >
                                            <ReactionGlyph token={token} size={26} />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {!m.deleted && !m.pending && (
                        <>
                            <button
                                onClick={() => onReply(m)}
                                title="Reply"
                                aria-label="Reply"
                                className={`reply-btn absolute top-1/2 -translate-y-1/2 ${isMine ? "-left-16" : "-right-16"
                                    } w-6 h-6 flex items-center justify-center rounded-full text-zinc-300 hover:text-[#a893ff] bg-[#0d0b17]/80 hover:bg-[#7c5cff]/20 transition-colors border border-white/[0.08]`}
                            >
                                <CornerUpLeft size={13} />
                            </button>
                            <button
                                onClick={(e) => onOpenPicker(e, m.id)}
                                title="React"
                                aria-label="React"
                                className={`react-btn absolute top-1/2 -translate-y-1/2 ${isMine ? "-left-8" : "-right-8"
                                    } w-6 h-6 flex items-center justify-center rounded-full text-zinc-300 hover:text-[#a893ff] bg-[#0d0b17]/80 hover:bg-[#7c5cff]/20 transition-colors text-base leading-none border border-white/[0.08]`}
                            >
                                <span>😊</span>
                            </button>
                            <button
                                title="More options"
                                aria-label="More options"
                                onClick={(e) => onOpenMenu(e, m.id, isMine)}
                                className="msg-dots absolute -top-2.5 right-0 w-6 h-6 flex items-center justify-center rounded-full bg-[#0d0b17] border border-white/[0.12] text-zinc-400 hover:text-white hover:border-[#7c5cff]/40 hover:bg-[#1b1633] transition-all shadow-sm"
                            >
                                <MoreVertical size={12} />
                            </button>
                        </>
                    )}

                    {m.forwardedFrom && <ForwardedFrom source={m.forwardedFrom} />}

                    {m.replyTo && (
                        <div
                            onClick={() => onScrollToMessage(m.replyTo.id)}
                            className="mb-1 cursor-pointer px-3 py-1.5 rounded-xl rounded-b-sm border-l-2 border-[#7c5cff] bg-white/[0.04] hover:bg-white/[0.07] transition-colors"
                        >
                            <div className="text-[11px] font-medium text-[#a893ff] mb-0.5">
                                Reply
                            </div>
                            {m.replyTo.imageUrl && !m.replyTo.text ? (
                                <div className="flex items-center gap-1 text-xs text-zinc-400">
                                    <ImageIcon size={11} />
                                    <span>Photo</span>
                                </div>
                            ) : (
                                <div className="text-xs text-zinc-400 truncate">
                                    {m.replyTo.text}
                                </div>
                            )}
                        </div>
                    )}

                    <div
                        className={bubbleClass}
                        style={
                            !isMine && !isStickerMsg
                                ? { background: "var(--color-msg-bg)", color: "var(--color-text)" }
                                : undefined
                        }
                    >
                        {isVoiceMsg ? (
                            <div className="relative">
                                <VoiceBubble
                                    id={m.id}
                                    audioUrl={m.voiceUrl}
                                    duration={m.duration}
                                    waveform={m.waveform}
                                    isMine={isMine}
                                />
                                {isMine && (
                                    <div className="flex justify-end px-1 pb-0.5">
                                        <MessageMeta
                                            time={time}
                                            pending={m.pending}
                                            isMine={isMine}
                                            isRead={isRead}
                                            variant="inline"
                                        />
                                    </div>
                                )}
                            </div>
                        ) : isImageStickerMsg ? (
                            <div className="relative inline-block">
                                <img
                                    src={m.imageUrl}
                                    alt="sticker"
                                    className="w-32 h-32 object-contain"
                                    onLoad={onMediaLoad}
                                />
                                {isMine && (
                                    <span className="absolute bottom-1.5 right-1.5">
                                        <MessageMeta
                                            time={time}
                                            pending={m.pending}
                                            isMine={isMine}
                                            isRead={isRead}
                                            variant="pill"
                                        />
                                    </span>
                                )}
                            </div>
                        ) : isTextStickerMsg ? (
                            <div className="relative inline-flex flex-wrap items-end gap-1">
                                <RichText text={m.text} variant="large" />
                                {isMine && (
                                    <span className="absolute -bottom-1 -right-1">
                                        <MessageMeta
                                            time={time}
                                            pending={m.pending}
                                            isMine={isMine}
                                            isRead={isRead}
                                            variant="pill"
                                        />
                                    </span>
                                )}
                            </div>
                        ) : (
                            <>
                                {m.imageUrl &&
                                    (msgIsVideo ? (
                                        <div
                                            className="video-thumb"
                                            onClick={() => !m.pending && onOpenLightbox(m.imageUrl)}
                                        >
                                            <video
                                                src={m.imageUrl}
                                                className="chat-video"
                                                preload="metadata"
                                                onLoadedMetadata={onMediaLoad}
                                            />
                                            <div className="play-overlay">
                                                <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center">
                                                    <Play size={18} className="text-white ml-0.5" fill="white" />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <img
                                            src={optimizeImage(m.imageUrl)}
                                            alt="image"
                                            loading="lazy"
                                            decoding="async"
                                            className="chat-img rounded-xl max-w-[260px] w-full object-cover block"
                                            onLoad={onMediaLoad}
                                            onClick={() => !m.pending && onOpenLightbox(m.imageUrl)}
                                        />
                                    ))}
                                {isEditing ? (
                                    <div className="flex items-center gap-2 py-0.5">
                                        <input
                                            ref={editRef}
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && !e.nativeEvent.isComposing)
                                                    submitEdit();
                                                if (e.key === "Escape") onCancelEdit();
                                            }}
                                            className="flex-1 bg-transparent outline-none text-white text-sm min-w-0"
                                        />
                                        <button
                                            onClick={submitEdit}
                                            aria-label="Save edit"
                                            className="shrink-0 text-white/60 hover:text-white transition-colors"
                                        >
                                            <Check size={14} />
                                        </button>
                                        <button
                                            onClick={onCancelEdit}
                                            aria-label="Cancel edit"
                                            className="shrink-0 text-white/40 hover:text-white transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    m.text && (
                                        <div
                                            className={`flex items-end gap-2.5 flex-wrap justify-between ${m.imageUrl ? "px-3 pb-1 pt-2" : ""
                                                }`}
                                        >
                                            <span className="whitespace-pre-wrap break-words">
                                                <RichText text={m.text} />
                                                {m.edited && (
                                                    <span className="text-[10px] ml-1 opacity-50">
                                                        (edited)
                                                    </span>
                                                )}
                                            </span>
                                            <MessageMeta
                                                time={time}
                                                pending={m.pending}
                                                isMine={isMine}
                                                isRead={isRead}
                                                variant="inline"
                                            />
                                        </div>
                                    )
                                )}
                                {!m.text && m.imageUrl && isMine && (
                                    <div className="flex justify-end px-1.5 pb-1 pt-1">
                                        <MessageMeta
                                            time={time}
                                            pending={m.pending}
                                            isMine={isMine}
                                            isRead={isRead}
                                            variant="pill"
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {hasReactions && (
                        <div
                            className={`flex flex-wrap gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"
                                }`}
                        >
                            {reactionSummary.map(({ token, count, mine }) => (
                                <button
                                    key={token}
                                    onClick={() => onReact(m.id, token)}
                                    className={`reaction-pill flex items-center gap-1 px-2 py-0.5 rounded-full text-xs cursor-pointer border ${mine
                                            ? "bg-[#7c5cff]/25 border-[#7c5cff]/50 text-[#a893ff]"
                                            : "bg-black/50 border-white/20 text-zinc-300 hover:border-white/30"
                                        }`}
                                >
                                    <ReactionGlyph token={token} size={15} />
                                    <span className="font-medium">{count}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
},
    areEqual);

export default MessageRow;