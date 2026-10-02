"use client";

import { memo, useEffect } from "react";
import { Check, CheckCheck, Clock } from "lucide-react";
import { getCustomEmoji } from "@/lib/customEmoji";

/* ───────────── stickers / rich text ───────────── */

const STICKER_TOKEN_SPLIT_RE = /(::[\w-]+::)/g;
const STICKER_TOKEN_MATCH_RE = /^::([\w-]+)::$/;
const STICKER_TOKEN_ONLY_RE = /^(?:\s*::[\w-]+::\s*)+$/;

export function isStickerOnlyText(text: string): boolean {
    if (!text) return false;
    const trimmed = text.trim();
    return trimmed.length > 0 && STICKER_TOKEN_ONLY_RE.test(trimmed);
}

/* ───────────── media helpers ───────────── */

export function isVideo(url: string) {
    return (
        /\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(url) ||
        url.includes("/video/upload/")
    );
}

export async function uploadToCloudinary(
    file: File,
    folder?: string
): Promise<string> {
    const isVid = file.type.startsWith("video/");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "jhravxtb");
    formData.append("folder", folder ?? (isVid ? "chat_videos" : "chat_images"));
    const res = await fetch(
        `https://api.cloudinary.com/v1_1/dgylh67ms/${isVid ? "video" : "image"}/upload`,
        { method: "POST", body: formData }
    );
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.secure_url;
}

/** Отдаёт Cloudinary-картинку в нужном размере и современном формате. */
export function optimizeImage(url: string, width = 520): string {
    if (!url.includes("res.cloudinary.com") || !url.includes("/image/upload/"))
        return url;
    if (/\/upload\/[a-z]+_/.test(url)) return url; // трансформации уже есть
    return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width},c_limit/`);
}

/* ───────────── dates ───────────── */

export function toDate(ts: any): Date {
    if (!ts) return new Date();
    return typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
}

export function formatTime(ts: any): string {
    if (!ts) return "";
    return toDate(ts).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function dayKey(d: Date): string {
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function formatDayLabel(d: Date): string {
    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const key = dayKey(d);
    if (key === dayKey(now)) return "Today";
    if (key === dayKey(yesterday)) return "Yesterday";
    return d.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        ...(d.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
    });
}

/* ───────────── small components ───────────── */

export const ReactionGlyph = memo(function ReactionGlyph({
    token,
    size = 24,
}: {
    token: string;
    size?: number;
}) {
    const custom = getCustomEmoji(token);
    if (custom) {
        return (
            <img
                src={custom.url}
                alt={custom.id}
                style={{ width: size, height: size, objectFit: "contain" }}
                className="inline-block align-middle"
            />
        );
    }
    return (
        <span style={{ fontSize: size }} className="leading-none">
            {token}
        </span>
    );
});

export const RichText = memo(function RichText({
    text,
    variant = "inline",
}: {
    text: string;
    variant?: "inline" | "large";
}) {
    const parts = text.split(STICKER_TOKEN_SPLIT_RE);
    return (
        <>
            {parts.map((part, i) => {
                const match = part.match(STICKER_TOKEN_MATCH_RE);
                if (match) {
                    const custom = getCustomEmoji(match[1]);
                    if (custom) {
                        return variant === "large" ? (
                            <img
                                key={i}
                                src={custom.url}
                                alt={custom.id}
                                className="inline-block w-28 h-28 object-contain"
                            />
                        ) : (
                            <img
                                key={i}
                                src={custom.url}
                                alt={custom.id}
                                className="inline-block align-text-bottom w-6 h-6 object-contain mx-0.5"
                            />
                        );
                    }
                }
                if (variant === "large" && !part.trim()) return null;
                return part ? <span key={i}>{part}</span> : null;
            })}
        </>
    );
});

function StatusTick({
    pending,
    isRead,
    size = 14,
}: {
    pending?: boolean;
    isRead: boolean;
    size?: number;
}) {
    if (pending)
        return (
            <Clock size={size - 2} className="opacity-70 shrink-0" strokeWidth={2.25} />
        );
    return isRead ? (
        <CheckCheck size={size} className="shrink-0" strokeWidth={2.25} />
    ) : (
        <Check size={size} className="shrink-0" strokeWidth={2.25} />
    );
}

export function MessageMeta({
    time,
    pending,
    isMine,
    isRead,
    variant = "inline",
}: {
    time: string;
    pending?: boolean;
    isMine: boolean;
    isRead: boolean;
    variant?: "inline" | "pill";
}) {
    const content = (
        <span
            className={`inline-flex items-center gap-1 leading-none tabular-nums select-none whitespace-nowrap text-[11px] ${variant === "pill" ? "text-white/90" : ""
                } ${variant === "inline" && isMine ? "text-white/65" : ""}`}
            style={
                variant === "inline" && !isMine
                    ? { color: "var(--color-text)", opacity: 0.55 }
                    : undefined
            }
        >
            <span>{pending ? "" : time}</span>
            {isMine && (
                <span
                    className={
                        variant === "pill"
                            ? "text-white/90"
                            : isRead
                                ? "text-[#d7c3ff]"
                                : "text-white/60"
                    }
                >
                    <StatusTick pending={pending} isRead={isRead} />
                </span>
            )}
        </span>
    );

    if (variant === "pill") {
        return (
            <span className="inline-flex items-center rounded-full bg-black/55 px-1.5 py-[3px]">
                {content}
            </span>
        );
    }
    return content;
}

export function ConfirmDialog({
    icon,
    title,
    description,
    onCancel,
    onConfirm,
    confirmLabel = "Delete",
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    onCancel: () => void;
    onConfirm: () => void;
    confirmLabel?: string;
}) {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onCancel();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onCancel]);

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60"
            onClick={onCancel}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className="confirm-dialog w-80 rounded-2xl bg-[#0d0b17] border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 pt-6 pb-4">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                        {icon}
                    </div>
                    <h3 className="text-[15px] font-semibold text-white mb-1">{title}</h3>
                    <p className="text-[13px] text-zinc-400 leading-relaxed">
                        {description}
                    </p>
                </div>
                <div className="flex border-t border-white/[0.06]">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3.5 text-sm text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors font-medium border-r border-white/[0.06] cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-3.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/[0.08] transition-colors font-semibold cursor-pointer"
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}