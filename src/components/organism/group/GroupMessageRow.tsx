"use client";

import {
    memo,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type RefObject,
} from "react";
import { createPortal } from "react-dom";
import {
    CornerUpLeft,
    MoreVertical,
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
    formatTime,
    isStickerOnlyText,
    isVideo,
} from "./GroupShared";
import { RichText } from "../chat-window/chat-shared";
import { getReplyPreview, useReplyAuthor } from "../chat-window/reply-preview";
import LinkPreview from "../chat-window/LinkPreview";

const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "👍", "🔥"];
const REACTION_OPTIONS = [...REACTION_EMOJIS, ...CUSTOM_EMOJIS.map((e) => e.id)];

const PICKER_MARGIN = 8;
const PICKER_GAP = 8;
const PICKER_TOP_LIMIT = 64;

const URL_REGEX = /https?:\/\/[^\s<>"]+/i;

function extractUrl(text: unknown): string | null {
    if (typeof text !== "string") return null;
    const match = text.match(URL_REGEX);
    if (!match) return null;
    const cleaned = match[0].replace(/[.,!?;:)\]}'"]+$/, "");
    try {
        const u = new URL(cleaned);
        return u.protocol === "http:" || u.protocol === "https:" ? cleaned : null;
    } catch {
        return null;
    }
}

const cloudinaryUrl = (url: string, transform: string) =>
    url?.includes("/upload/")
        ? url.replace("/upload/", `/upload/${transform}/`)
        : url;
const tinySrc = (url: string) => cloudinaryUrl(url, "e_blur:1000,q_1,w_24,f_auto");
const fullSrc = (url: string, w = 520) =>
    cloudinaryUrl(url, `f_auto,q_auto,dpr_auto,w_${w}`);

const ReactionPicker = memo(function ReactionPicker({
    anchorRef,
    messageId,
    isMine,
    expanded,
    onReact,
    onExpand,
}: {
    anchorRef: RefObject<HTMLDivElement | null>;
    messageId: string;
    isMine: boolean;
    expanded: boolean;
    onReact: (id: string, token: string) => void;
    onExpand: () => void;
}) {
    const pickerRef = useRef<HTMLDivElement | null>(null);
    const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

    useLayoutEffect(() => {
        function place() {
            const anchor = anchorRef.current;
            const el = pickerRef.current;
            if (!anchor || !el) return;
            const a = anchor.getBoundingClientRect();
            const { width, height } = el.getBoundingClientRect();
            const vw = window.innerWidth;
            const vh = window.innerHeight;

            let top = a.top - height - PICKER_GAP;
            if (top < PICKER_TOP_LIMIT) top = a.bottom + PICKER_GAP;
            top = Math.max(
                PICKER_MARGIN,
                Math.min(top, vh - height - PICKER_MARGIN)
            );

            let left = isMine ? a.right - width : a.left;
            left = Math.max(
                PICKER_MARGIN,
                Math.min(left, vw - width - PICKER_MARGIN)
            );

            setPos((prev) =>
                prev && prev.left === left && prev.top === top
                    ? prev
                    : { left, top }
            );
        }

        place();
        window.addEventListener("resize", place);
        window.addEventListener("scroll", place, true);
        return () => {
            window.removeEventListener("resize", place);
            window.removeEventListener("scroll", place, true);
        };
    }, [anchorRef, isMine, expanded]);

    if (typeof document === "undefined") return null;

    return createPortal(
        <div
            ref={pickerRef}
            className={`reaction-picker fixed z-[1000] rounded-2xl bg-[#12111f] border border-white/[0.10] shadow-xl shadow-black/50 ${expanded ? "p-2.5 w-[252px]" : "px-2.5 py-2"
                }`}
            style={{
                left: pos?.left ?? 0,
                top: pos?.top ?? 0,
                visibility: pos ? "visible" : "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
        >
            {!expanded ? (
                <div className="flex items-center gap-1">
                    {REACTION_EMOJIS.map((token) => (
                        <button
                            key={token}
                            onClick={() => onReact(messageId, token)}
                            className="reaction-emoji-btn w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/[0.08] cursor-pointer"
                        >
                            <ReactionGlyph token={token} size={26} />
                        </button>
                    ))}
                    <button
                        onClick={onExpand}
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
                            onClick={() => onReact(messageId, token)}
                            className="reaction-emoji-btn w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/[0.08] cursor-pointer"
                        >
                            <ReactionGlyph token={token} size={26} />
                        </button>
                    ))}
                </div>
            )}
        </div>,
        document.body
    );
});

const ChatImage = memo(function ChatImage({
    url,
    width,
    height,
    onClick,
    onLoad,
    priority = false,
}: {
    url: string;
    width?: number;
    height?: number;
    onClick?: () => void;
    onLoad?: () => void;
    priority?: boolean;
}) {
    const [loaded, setLoaded] = useState(false);
    const [settled, setSettled] = useState(false);
    return (
        <div
            className="relative w-[260px] max-w-full max-h-[300px] overflow-hidden rounded-xl bg-white/[0.03]"
            style={{
                aspectRatio:
                    width && height && width > 0 && height > 0
                        ? `${width} / ${height}`
                        : "4 / 3",
            }}
        >
            {!settled && (
                <img
                    src={tinySrc(url)}
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                    className="absolute inset-0 w-full h-full object-cover"
                />
            )}
            <img
                src={fullSrc(url)}
                alt="image"
                decoding="async"
                loading={priority ? "eager" : "lazy"}
                fetchPriority={priority ? "high" : "auto"}
                draggable={false}
                onLoad={() => {
                    setLoaded(true);
                    onLoad?.();
                }}
                onTransitionEnd={() => {
                    if (loaded) setSettled(true);
                }}
                onClick={onClick}
                className="absolute inset-0 w-full h-full object-cover cursor-zoom-in transition-opacity duration-150"
                style={{ opacity: loaded ? 1 : 0 }}
            />
        </div>
    );
});

const EditField = memo(function EditField({
    initial,
    onSubmit,
    onCancel,
}: {
    initial: string;
    onSubmit: (text: string) => void;
    onCancel: () => void;
}) {
    const [value, setValue] = useState(initial);
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    function submit() {
        const trimmed = value.trim();
        if (trimmed) onSubmit(trimmed);
    }

    return (
        <div className="flex items-center gap-2 py-0.5">
            <input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing) submit();
                    if (e.key === "Escape") onCancel();
                }}
                className="flex-1 bg-transparent outline-none text-white text-sm min-w-0"
            />
            <button
                onClick={submit}
                aria-label="Save edit"
                className="shrink-0 text-white/60 hover:text-white transition-colors"
            >
                <Check size={14} />
            </button>
            <button
                onClick={onCancel}
                aria-label="Cancel edit"
                className="shrink-0 text-white/40 hover:text-white transition-colors"
            >
                <X size={14} />
            </button>
        </div>
    );
});

const ReplyQuote = memo(function ReplyQuote({
    reply,
    myUid,
    isMine,
    standalone,
    onClick,
}: {
    reply: {
        id: string;
        text?: string | null;
        imageUrl?: string | null;
        senderId?: string | null;
    };
    myUid: string | null;
    isMine: boolean;
    standalone: boolean;
    onClick: () => void;
}) {
    const preview = getReplyPreview(reply);
    const author = useReplyAuthor(reply.senderId, myUid);
    const onMine = !standalone && isMine;
    const isSticker = preview.label === "Sticker";

    const surface = standalone
        ? "bg-[#12111f]/85 backdrop-blur-xl"
        : onMine
            ? "bg-white/[0.14]"
            : "bg-[#7c5cff]/[0.14]";
    const barColor = onMine ? "bg-white" : "bg-[#8f75ff]";
    const nameColor = onMine ? "text-white" : "text-[#a996ff]";
    const textColor = onMine
        ? "text-white/90"
        : standalone
            ? "text-zinc-300"
            : "opacity-85";

    return (
        <div
            role="button"
            onClick={onClick}
            className={`relative flex items-center gap-2 overflow-hidden cursor-pointer rounded-md pl-3 pr-2.5 py-1 mb-1 hover:brightness-110 transition-[filter] ${surface}`}
        >
            <span className={`absolute left-0 top-0 h-full w-[3px] ${barColor}`} />
            {preview.thumbUrl && (
                <img
                    src={fullSrc(preview.thumbUrl, 64)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className={`shrink-0 w-8 h-8 rounded ${isSticker ? "object-contain" : "object-cover"
                        }`}
                />
            )}
            <div className="min-w-0 flex-1">
                <div
                    className={`truncate text-[13px] font-semibold leading-[1.25] ${nameColor}`}
                >
                    {author ?? "Reply"}
                </div>
                <div className={`truncate text-[13px] leading-[1.25] ${textColor}`}>
                    {preview.label}
                </div>
            </div>
        </div>
    );
});

export interface GroupMessageRowProps {
    m: any;
    myUid: string | null;
    isMine: boolean;
    isRead: boolean;
    isFirstInGroup: boolean;
    isLastInGroup: boolean;
    isPickerOpen: boolean;
    pickerExpanded: boolean;
    isPinned: boolean;
    isEditing: boolean;
    animate: boolean;
    priority: boolean;
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
        a.imageWidth === b.imageWidth &&
        a.imageHeight === b.imageHeight &&
        a.voiceUrl === b.voiceUrl &&
        a.pending === b.pending &&
        a.isLocalVideo === b.isLocalVideo &&
        a.senderName === b.senderName &&
        ts(a.createdAt) === ts(b.createdAt) &&
        (a.readBy?.length ?? 0) === (b.readBy?.length ?? 0) &&
        a.replyTo?.id === b.replyTo?.id &&
        a.replyTo?.senderId === b.replyTo?.senderId &&
        JSON.stringify(a.reactions ?? null) === JSON.stringify(b.reactions ?? null) &&
        JSON.stringify(a.forwardedFrom ?? null) ===
        JSON.stringify(b.forwardedFrom ?? null)
    );
}

function areEqual(prev: GroupMessageRowProps, next: GroupMessageRowProps) {
    for (const key of Object.keys(next) as (keyof GroupMessageRowProps)[]) {
        if (key === "m") {
            if (!sameMsg(prev.m, next.m)) return false;
        } else if (!Object.is(prev[key], next[key])) return false;
    }
    return true;
}

const GroupMessageRow = memo(function GroupMessageRow({
    m,
    myUid,
    isMine,
    isRead,
    isFirstInGroup,
    isLastInGroup,
    isPickerOpen,
    pickerExpanded,
    isPinned,
    isEditing,
    animate,
    priority,
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
}: GroupMessageRowProps) {
    const wrapRef = useRef<HTMLDivElement | null>(null);

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
    const linkUrl =
        !isStickerMsg && !isVoiceMsg && !m.pending && !m.deleted
            ? extractUrl(m.text)
            : null;

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
            <div
                id={`gmsg-${m.id}`}
                className={`msg-row flex ${isMine ? "justify-end" : "justify-start"} ${hasReactions ? "mb-2" : ""
                    } ${animate ? "msg-enter" : ""}`}
                onContextMenu={(e) => {
                    if (!m.deleted && !m.pending) onOpenMenu(e, m.id, isMine);
                }}
            >
                <div
                    ref={wrapRef}
                    data-msg-anim={m.id}
                    className={`relative group min-w-0 ${linkUrl && !m.imageUrl ? "max-w-[min(72%,360px)]" : "max-w-[min(72%,480px)]"
                        }`}
                >
                    {isPickerOpen && (
                        <ReactionPicker
                            anchorRef={wrapRef}
                            messageId={m.id}
                            isMine={isMine}
                            expanded={pickerExpanded}
                            onReact={onReact}
                            onExpand={onExpandPicker}
                        />
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

                    {!isMine && isFirstInGroup && (
                        <div className="mb-0.5 px-1 text-[12px] font-semibold text-[#a893ff]">
                            {m.senderName}
                        </div>
                    )}

                    {m.forwardedFrom && <ForwardedFrom source={m.forwardedFrom} />}

                    {m.replyTo && isStickerMsg && (
                        <ReplyQuote
                            reply={m.replyTo}
                            myUid={myUid}
                            isMine={isMine}
                            standalone
                            onClick={() => onScrollToMessage(m.replyTo.id)}
                        />
                    )}

                    <div
                        className={bubbleClass}
                        style={
                            !isMine && !isStickerMsg
                                ? { background: "var(--color-msg-bg)", color: "var(--color-text)" }
                                : undefined
                        }
                    >
                        {m.replyTo && !isStickerMsg && (
                            <ReplyQuote
                                reply={m.replyTo}
                                myUid={myUid}
                                isMine={isMine}
                                standalone={false}
                                onClick={() => onScrollToMessage(m.replyTo.id)}
                            />
                        )}

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
                                    decoding="async"
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
                                        <ChatImage
                                            url={m.imageUrl}
                                            width={m.imageWidth}
                                            height={m.imageHeight}
                                            priority={priority}
                                            onLoad={onMediaLoad}
                                            onClick={() => !m.pending && onOpenLightbox(m.imageUrl)}
                                        />
                                    ))}
                                {isEditing ? (
                                    <EditField
                                        initial={m.text || ""}
                                        onSubmit={(text) => onSubmitEdit(m.id, text)}
                                        onCancel={onCancelEdit}
                                    />
                                ) : (
                                    m.text && (
                                        <>
                                            <div
                                                className={`flex items-end gap-2.5 flex-wrap justify-between ${m.imageUrl ? "px-3 pb-1 pt-2" : ""
                                                    }`}
                                            >
                                                <span className="whitespace-pre-wrap [overflow-wrap:anywhere] min-w-0 max-w-full">
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
                                            {linkUrl && !m.imageUrl && (
                                                <LinkPreview
                                                    url={linkUrl}
                                                    isMine={isMine}
                                                    onLayout={onMediaLoad}
                                                />
                                            )}
                                        </>
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
                            className={`flex flex-wrap gap-1 mt-1 ${isMine ? "justify-end" : "justify-start pl-1"
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

export default GroupMessageRow;