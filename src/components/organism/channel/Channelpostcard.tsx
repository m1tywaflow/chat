"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
    MessageCircle,
    Plus,
    Pin,
    Pencil,
    Check,
    Eye,
    ChevronDown,
    Trash2,
} from "lucide-react";
import { ChannelPost } from "@/types/channel";
import { CUSTOM_EMOJIS, isCustomEmojiUrl } from "@/lib/customEmoji";
import ForwardedFrom from "@/components/atoms/ForwardedFrom";
import {
    ReactionGlyph,
    RichText,
    formatTime,
    formatViews,
    isStickerOnlyText,
} from "./ChannelShared";

const REACTION_EMOJIS = ["❤️", "😂", "😮", "👍", "🔥"];

/* ───────── картинка поста ───────── */

const cloudinaryUrl = (url: string, transform: string) =>
    url?.includes("/upload/")
        ? url.replace("/upload/", `/upload/${transform}/`)
        : url;
const tinySrc = (url: string) => cloudinaryUrl(url, "e_blur:1000,q_1,w_24,f_auto");
const fullSrc = (url: string, w = 760) =>
    cloudinaryUrl(url, `f_auto,q_auto,dpr_auto,w_${w}`);

const PostImage = memo(function PostImage({
    url,
    width,
    height,
    priority = false,
    onOpen,
}: {
    url: string;
    width?: number;
    height?: number;
    priority?: boolean;
    onOpen: (url: string) => void;
}) {
    const [loaded, setLoaded] = useState(false);
    return (
        <div
            className="relative w-full max-h-[300px] overflow-hidden rounded-t-2xl bg-white/[0.03]"
            style={{
                aspectRatio:
                    width && height && width > 0 && height > 0
                        ? `${width} / ${height}`
                        : "4 / 3",
            }}
        >
            <img
                src={tinySrc(url)}
                alt=""
                aria-hidden="true"
                draggable={false}
                className="absolute inset-0 w-full h-full object-cover scale-105"
                style={{ filter: "blur(10px)" }}
            />
            <img
                src={fullSrc(url)}
                alt="post"
                decoding="async"
                loading={priority ? "eager" : "lazy"}
                fetchPriority={priority ? "high" : "auto"}
                draggable={false}
                onLoad={() => setLoaded(true)}
                onClick={() => onOpen(url)}
                className="absolute inset-0 w-full h-full object-cover cursor-zoom-in transition-opacity duration-150"
                style={{ opacity: loaded ? 1 : 0 }}
            />
        </div>
    );
});

/* ───────── мета ───────── */

function PostMeta({
    time,
    views,
    isPinned,
}: {
    time: string;
    views?: number;
    isPinned?: boolean;
}) {
    return (
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 select-none">
            {isPinned && <Pin size={10} className="text-[#a893ff] shrink-0" />}
            <span className="tabular-nums">{time}</span>
            <span className="flex items-center gap-0.5 opacity-80">
                <Eye size={11} className="shrink-0" strokeWidth={2.25} />
                <span className="tabular-nums">{formatViews(views)}</span>
            </span>
        </div>
    );
}

/* ───────── реакции ───────── */

interface ActionsProps {
    postId: string;
    reactions: Record<string, string[]> | undefined;
    commentCount: number;
    myUid: string;
    isPickerOpen: boolean;
    isCustomPickerOpen: boolean;
    onReact: (postId: string, token: string) => void;
    onOpenComments: (postId: string) => void;
    onTogglePicker: (postId: string) => void;
    onToggleCustomPicker: (postId: string) => void;
}

// ВАЖНО: компонент объявлен на уровне модуля. Раньше он создавался внутри
// ChannelWindow, из-за чего React размонтировал и монтировал его заново
// на каждый рендер родителя.
const PostActionsBar = memo(function PostActionsBar({
    postId,
    reactions,
    commentCount,
    myUid,
    isPickerOpen,
    isCustomPickerOpen,
    onReact,
    onOpenComments,
    onTogglePicker,
    onToggleCustomPicker,
}: ActionsProps) {
    const summary = Object.entries(reactions || {})
        .filter(([, uids]) => uids.length > 0)
        .map(([token, uids]) => ({
            token,
            count: uids.length,
            mine: uids.includes(myUid),
        }));

    return (
        <div className="flex items-center gap-1.5 flex-wrap">
            {summary.map(({ token, count, mine }) => (
                <button
                    key={token}
                    onClick={() => onReact(postId, token)}
                    className={`flex items-center gap-1.5 h-7 px-2.5 rounded-full text-sm cursor-pointer border transition-colors ${mine
                            ? "bg-[#7c5cff]/20 border-[#7c5cff]/50 text-[#a893ff]"
                            : "bg-black/20 border-white/15 text-zinc-400 hover:border-white/25"
                        }`}
                >
                    <ReactionGlyph token={token} size={18} />
                    <span className="font-medium leading-none">{count}</span>
                </button>
            ))}

            <button
                onClick={() => onOpenComments(postId)}
                aria-label="Comments"
                className="flex items-center gap-1 h-6 px-2 rounded-full text-xs cursor-pointer border bg-black/20 border-white/15 text-zinc-400 hover:text-[#a893ff] hover:border-[#7c5cff]/40 transition-colors"
            >
                <MessageCircle size={12} />
                <span className="font-medium leading-none">{commentCount}</span>
            </button>

            <div className="relative reaction-picker-wrapper">
                <button
                    onClick={() => onTogglePicker(postId)}
                    aria-label="Add reaction"
                    className="w-6 h-6 flex items-center justify-center rounded-full text-zinc-500 hover:text-[#a893ff] hover:bg-white/[0.05] transition-colors cursor-pointer"
                >
                    <Plus size={13} />
                </button>

                {isPickerOpen && (
                    <div className="absolute z-30 bottom-full mb-2 left-0">
                        <div className="reaction-picker flex items-center gap-1 px-2.5 py-2 rounded-2xl bg-[#12111f] border border-white/[0.10] shadow-xl shadow-black/50">
                            {REACTION_EMOJIS.map((token) => (
                                <button
                                    key={token}
                                    onClick={() => onReact(postId, token)}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.08] cursor-pointer transition hover:scale-110"
                                >
                                    <ReactionGlyph token={token} size={22} />
                                </button>
                            ))}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleCustomPicker(postId);
                                }}
                                aria-label="More reactions"
                                className={`w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.08] cursor-pointer transition ${isCustomPickerOpen ? "text-[#a893ff] bg-white/[0.08]" : ""
                                    }`}
                            >
                                <ChevronDown
                                    size={16}
                                    className={`transition-transform ${isCustomPickerOpen ? "rotate-180" : ""
                                        }`}
                                />
                            </button>
                        </div>

                        {isCustomPickerOpen && (
                            <div
                                className="absolute bottom-full right-0 mb-2 w-[230px] max-h-[230px] overflow-y-auto grid grid-cols-4 gap-2 p-3 rounded-2xl bg-[#12111f] border border-white/[0.10] shadow-xl shadow-black/50 chat-scroll"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {CUSTOM_EMOJIS.map((emoji) => (
                                    <button
                                        key={emoji.id}
                                        onClick={() => onReact(postId, emoji.id)}
                                        className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-white/[0.08] cursor-pointer transition hover:scale-110"
                                    >
                                        <img
                                            src={emoji.url}
                                            alt={emoji.id}
                                            className="w-9 h-9 object-contain"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
});

/* ───────── карточка поста ───────── */

export interface PostCardProps {
    post: ChannelPost;
    myUid: string;
    isOwner: boolean;
    isPinned: boolean;
    isEditing: boolean;
    isPickerOpen: boolean;
    isCustomPickerOpen: boolean;
    priority: boolean;
    animate: boolean;
    onObserve: (el: HTMLElement | null, postId: string) => void;
    onContextMenu: (e: React.MouseEvent, postId: string) => void;
    onStartEdit: (postId: string) => void;
    onSaveEdit: (postId: string, text: string) => void;
    onCancelEdit: () => void;
    onDelete: (postId: string) => void;
    onOpenLightbox: (url: string) => void;
    onReact: (postId: string, token: string) => void;
    onOpenComments: (postId: string) => void;
    onTogglePicker: (postId: string) => void;
    onToggleCustomPicker: (postId: string) => void;
}

const ts = (x: any) => x?.seconds ?? x?.getTime?.() ?? 0;

function samePost(a: any, b: any) {
    if (a === b) return true;
    return (
        a.id === b.id &&
        a.text === b.text &&
        a.edited === b.edited &&
        a.imageUrl === b.imageUrl &&
        a.views === b.views &&
        a.commentCount === b.commentCount &&
        a.imageWidth === b.imageWidth &&
        a.imageHeight === b.imageHeight &&
        ts(a.createdAt) === ts(b.createdAt) &&
        JSON.stringify(a.reactions ?? null) === JSON.stringify(b.reactions ?? null) &&
        JSON.stringify(a.forwardedFrom ?? null) ===
        JSON.stringify(b.forwardedFrom ?? null)
    );
}

function areEqual(prev: PostCardProps, next: PostCardProps) {
    for (const key of Object.keys(next) as (keyof PostCardProps)[]) {
        if (key === "post") {
            if (!samePost(prev.post, next.post)) return false;
        } else if (!Object.is(prev[key], next[key])) return false;
    }
    return true;
}

const ChannelPostCard = memo(function ChannelPostCard({
    post: p,
    myUid,
    isOwner,
    isPinned,
    isEditing,
    isPickerOpen,
    isCustomPickerOpen,
    priority,
    animate,
    onObserve,
    onContextMenu,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    onDelete,
    onOpenLightbox,
    onReact,
    onOpenComments,
    onTogglePicker,
    onToggleCustomPicker,
}: PostCardProps) {
    const [editText, setEditText] = useState("");
    const editRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        if (!isEditing) return;
        setEditText(p.text || "");
        requestAnimationFrame(() => {
            const el = editRef.current;
            if (!el) return;
            el.focus();
            el.setSelectionRange(el.value.length, el.value.length);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditing]);

    const setRootRef = useCallback(
        (el: HTMLDivElement | null) => onObserve(el, p.id),
        [onObserve, p.id]
    );

    const views = (p as any).views as number | undefined;
    const time = formatTime(p.createdAt);
    const isImageStickerPost = !p.text && p.imageUrl && isCustomEmojiUrl(p.imageUrl);
    const isTextStickerPost = !p.imageUrl && isStickerOnlyText(p.text);
    // текстовый стикер в режиме редактирования рисуем обычной карточкой
    const isStickerPost = (isImageStickerPost || isTextStickerPost) && !isEditing;

    function save() {
        const trimmed = editText.trim();
        if (!trimmed) onCancelEdit();
        else onSaveEdit(p.id, trimmed);
    }

    const actions = (
        <PostActionsBar
            postId={p.id}
            reactions={p.reactions}
            commentCount={p.commentCount || 0}
            myUid={myUid}
            isPickerOpen={isPickerOpen}
            isCustomPickerOpen={isCustomPickerOpen}
            onReact={onReact}
            onOpenComments={onOpenComments}
            onTogglePicker={onTogglePicker}
            onToggleCustomPicker={onToggleCustomPicker}
        />
    );

    if (isStickerPost) {
        return (
            <div
                id={`channel-post-${p.id}`}
                ref={setRootRef}
                onContextMenu={(e) => onContextMenu(e, p.id)}
                className={`relative group max-w-[380px] flex flex-col items-start gap-1.5 ${animate ? "post-enter" : ""
                    }`}
            >
                {p.forwardedFrom && <ForwardedFrom source={p.forwardedFrom} />}
                {isImageStickerPost ? (
                    <img
                        src={p.imageUrl!}
                        alt="sticker"
                        className="w-32 h-32 object-contain"
                    />
                ) : (
                    <div className="inline-flex flex-wrap items-end gap-1">
                        <RichText text={p.text} variant="large" />
                    </div>
                )}

                <div className="flex items-center gap-2 px-1">
                    <PostMeta time={time} views={views} isPinned={isPinned} />
                    {isOwner && (
                        <>
                            {isTextStickerPost && (
                                <button
                                    onClick={() => onStartEdit(p.id)}
                                    aria-label="Edit post"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-[#a893ff] cursor-pointer"
                                >
                                    <Pencil size={12} />
                                </button>
                            )}
                            <button
                                onClick={() => onDelete(p.id)}
                                aria-label="Delete post"
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-red-400 cursor-pointer"
                            >
                                <Trash2 size={12} />
                            </button>
                        </>
                    )}
                </div>
                <div className="px-1">{actions}</div>
            </div>
        );
    }

    return (
        <div
            id={`channel-post-${p.id}`}
            ref={setRootRef}
            onContextMenu={(e) => onContextMenu(e, p.id)}
            className={`relative group max-w-[380px] rounded-2xl border overflow-visible shadow-sm shadow-black/20 transition-colors ${isPinned ? "border-[#7c5cff]/40" : "border-white/[0.08]"
                } ${animate ? "post-enter" : ""}`}
            style={{ background: "var(--color-msg-bg)" }}
        >
            {p.forwardedFrom && <ForwardedFrom source={p.forwardedFrom} />}
            {p.imageUrl && (
                <PostImage
                    url={p.imageUrl}
                    width={(p as ChannelPost & { imageWidth?: number }).imageWidth}
                    height={(p as ChannelPost & { imageHeight?: number }).imageHeight}
                    priority={priority}
                    onOpen={onOpenLightbox}
                />
            )}

            <div className="px-3.5 py-2.5">
                {isEditing ? (
                    <div className="flex flex-col gap-2">
                        <textarea
                            ref={editRef}
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                                    e.preventDefault();
                                    save();
                                } else if (e.key === "Escape") {
                                    onCancelEdit();
                                }
                            }}
                            rows={2}
                            className="w-full resize-none rounded-lg bg-black/20 border border-[#7c5cff]/30 px-2.5 py-2 text-sm text-white outline-none focus:border-[#7c5cff]/60 transition-colors"
                        />
                        <div className="flex items-center gap-2 justify-end">
                            <button
                                onClick={onCancelEdit}
                                className="px-2.5 py-1 rounded-lg text-[11px] text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={save}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-[#a893ff] bg-[#7c5cff]/10 hover:bg-[#7c5cff]/20 transition-colors cursor-pointer"
                            >
                                <Check size={11} />
                                Save
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {p.text && (
                            <div className="text-[14px] leading-[1.45] whitespace-pre-wrap break-words">
                                <RichText text={p.text} />
                                {p.edited && (
                                    <span className="text-[11px] ml-1 opacity-50">(edited)</span>
                                )}
                            </div>
                        )}

                        <div className="flex items-center justify-between mt-2">
                            <PostMeta time={time} views={views} isPinned={isPinned} />
                            {isOwner && (
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => onStartEdit(p.id)}
                                        aria-label="Edit post"
                                        className="text-zinc-600 hover:text-[#a893ff] cursor-pointer"
                                    >
                                        <Pencil size={13} />
                                    </button>
                                    <button
                                        onClick={() => onDelete(p.id)}
                                        aria-label="Delete post"
                                        className="text-zinc-600 hover:text-red-400 cursor-pointer"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="mt-2">{actions}</div>
                    </>
                )}
            </div>
        </div>
    );
}, areEqual);

export default ChannelPostCard;