// "use client";

// import { memo, useEffect } from "react";
// import { X } from "lucide-react";
// import { getCustomEmoji } from "@/lib/customEmoji";
// import { splitLinks } from "@/lib/links";

// const STICKER_TOKEN_SPLIT_RE = /(::[\w-]+::)/g;
// const STICKER_TOKEN_MATCH_RE = /^::([\w-]+)::$/;
// const STICKER_TOKEN_ONLY_RE = /^(?:\s*::[\w-]+::\s*)+$/;

// export function isStickerOnlyText(text: string | undefined): boolean {
//     if (!text) return false;
//     const trimmed = text.trim();
//     return trimmed.length > 0 && STICKER_TOKEN_ONLY_RE.test(trimmed);
// }

// export function isVideoUrl(url: string): boolean {
//     return (
//         /\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(url) ||
//         url.includes("/video/upload/")
//     );
// }

// export const TEXT_EMOJIS = (
//     "😀 😁 😂 🤣 😊 😉 😍 🥰 😘 😎 🤔 🤨 😐 🙄 😏 😴 😢 😭 😡 🤯 🥳 🤗 😅 🙃 " +
//     "👍 👎 👏 🙏 💪 🤝 👀 🔥 ❤️ 🧡 💛 💚 💙 💜 🖤 🤍 💔 ✨ 🎉 💯 ☕ 🍕 🎮 🚀"
// ).split(" ");

// export function toDate(ts: any): Date {
//     if (!ts) return new Date();
//     return typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
// }

// export function formatTime(ts: any): string {
//     if (!ts) return "";
//     return toDate(ts).toLocaleTimeString([], {
//         hour: "2-digit",
//         minute: "2-digit",
//     });
// }

// export function dayKey(d: Date): string {
//     return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
// }

// export function formatDayLabel(d: Date): string {
//     const now = new Date();
//     const yesterday = new Date();
//     yesterday.setDate(now.getDate() - 1);
//     const key = dayKey(d);
//     if (key === dayKey(now)) return "Today";
//     if (key === dayKey(yesterday)) return "Yesterday";
//     return d.toLocaleDateString("en-US", {
//         day: "numeric",
//         month: "long",
//         ...(d.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
//     });
// }

// export function formatViews(n: number | undefined): string {
//     const v = n ?? 0;
//     if (v < 1000) return String(v);
//     if (v < 1_000_000) {
//         const k = v / 1000;
//         return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
//     }
//     const m = v / 1_000_000;
//     return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
// }

// export async function uploadPostImage(file: File) {
//     const isVid = file.type.startsWith("video/");
//     const formData = new FormData();
//     formData.append("file", file);
//     formData.append("upload_preset", "jhravxtb");
//     formData.append("folder", isVid ? "channel_videos" : "channel_posts");
//     const res = await fetch(
//         `https://api.cloudinary.com/v1_1/dgylh67ms/${isVid ? "video" : "image"}/upload`,
//         { method: "POST", body: formData }
//     );
//     if (!res.ok) throw new Error("Upload failed");
//     const data = await res.json();
//     return {
//         url: data.secure_url as string,
//         width: data.width as number,
//         height: data.height as number,
//     };
// }

// export const ReactionGlyph = memo(function ReactionGlyph({
//     token,
//     size = 24,
// }: {
//     token: string;
//     size?: number;
// }) {
//     const custom = getCustomEmoji(token);
//     if (custom) {
//         return (
//             <img
//                 src={custom.url}
//                 alt={custom.id}
//                 style={{ width: size, height: size, objectFit: "contain" }}
//                 className="inline-block align-middle"
//             />
//         );
//     }
//     return (
//         <span style={{ fontSize: size }} className="leading-none">
//             {token}
//         </span>
//     );
// });

// type LinkTone = "mine" | "other";

// const LINK_TONES: Record<LinkTone, string> = {
//     mine: "text-white decoration-white/50 hover:decoration-white",
//     other: "text-[#a996ff] decoration-[#a996ff]/50 hover:decoration-[#a996ff]",
// };

// const TextWithLinks = memo(function TextWithLinks({
//     text,
//     tone,
// }: {
//     text: string;
//     tone: LinkTone;
// }) {
//     if (!text.includes("http")) return <span>{text}</span>;
//     const segments = splitLinks(text);
//     return (
//         <>
//             {segments.map((segment, i) =>
//                 segment.type === "link" ? (
//                     <a
//                         key={i}
//                         href={segment.value}
//                         target="_blank"
//                         rel="noreferrer noopener"
//                         onClick={(e) => e.stopPropagation()}
//                         className={`underline underline-offset-2 [overflow-wrap:anywhere] transition-colors ${LINK_TONES[tone]}`}
//                     >
//                         {segment.value}
//                     </a>
//                 ) : (
//                     <span key={i}>{segment.value}</span>
//                 )
//             )}
//         </>
//     );
// });

// export const RichText = memo(function RichText({
//     text,
//     variant = "inline",
//     tone = "other",
// }: {
//     text: string;
//     variant?: "inline" | "large";
//     tone?: LinkTone;
// }) {
//     const parts = text.split(STICKER_TOKEN_SPLIT_RE);
//     return (
//         <>
//             {parts.map((part, i) => {
//                 const match = part.match(STICKER_TOKEN_MATCH_RE);
//                 if (match) {
//                     const custom = getCustomEmoji(match[1]);
//                     if (custom) {
//                         return variant === "large" ? (
//                             <img
//                                 key={i}
//                                 src={custom.url}
//                                 alt={custom.id}
//                                 className="inline-block w-28 h-28 object-contain"
//                             />
//                         ) : (
//                             <img
//                                 key={i}
//                                 src={custom.url}
//                                 alt={custom.id}
//                                 className="inline-block align-text-bottom w-6 h-6 object-contain mx-0.5"
//                             />
//                         );
//                     }
//                 }
//                 if (variant === "large" && !part.trim()) return null;
//                 if (!part) return null;
//                 return <TextWithLinks key={i} text={part} tone={tone} />;
//             })}
//         </>
//     );
// });

// export function ImageLightbox({
//     url,
//     onClose,
// }: {
//     url: string;
//     onClose: () => void;
// }) {
//     useEffect(() => {
//         const handler = (e: KeyboardEvent) => {
//             if (e.key === "Escape") onClose();
//         };
//         window.addEventListener("keydown", handler);
//         return () => window.removeEventListener("keydown", handler);
//     }, [onClose]);

//     return (
//         <div
//             className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 animate-[fadeIn_0.15s_ease]"
//             onClick={onClose}
//         >
//             <button
//                 onClick={onClose}
//                 aria-label="Close"
//                 className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-full bg-white/[0.08] text-white hover:bg-white/[0.15] transition-colors cursor-pointer"
//             >
//                 <X size={20} />
//             </button>
//             {isVideoUrl(url) ? (
//                 <video
//                     src={url}
//                     controls
//                     autoPlay
//                     className="max-w-[90vw] max-h-[90vh] rounded-lg"
//                     onClick={(e) => e.stopPropagation()}
//                 />
//             ) : (
//                 <img
//                     src={url}
//                     alt="full"
//                     className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg select-none"
//                     onClick={(e) => e.stopPropagation()}
//                 />
//             )}
//         </div>
//     );
// }

// export function ConfirmDialog({
//     icon,
//     title,
//     description,
//     onCancel,
//     onConfirm,
//     confirmLabel = "Delete",
// }: {
//     icon: React.ReactNode;
//     title: string;
//     description: string;
//     onCancel: () => void;
//     onConfirm: () => void;
//     confirmLabel?: string;
// }) {
//     useEffect(() => {
//         const handler = (e: KeyboardEvent) => {
//             if (e.key === "Escape") onCancel();
//         };
//         window.addEventListener("keydown", handler);
//         return () => window.removeEventListener("keydown", handler);
//     }, [onCancel]);

//     return (
//         <div
//             className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60"
//             onClick={onCancel}
//         >
//             <div
//                 role="dialog"
//                 aria-modal="true"
//                 aria-label={title}
//                 className="w-80 rounded-2xl bg-[#0d0b17] border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden"
//                 onClick={(e) => e.stopPropagation()}
//             >
//                 <div className="px-6 pt-6 pb-4">
//                     <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
//                         {icon}
//                     </div>
//                     <h3 className="text-[15px] font-semibold text-white mb-1">{title}</h3>
//                     <p className="text-[13px] text-zinc-400 leading-relaxed">
//                         {description}
//                     </p>
//                 </div>
//                 <div className="flex border-t border-white/[0.06]">
//                     <button
//                         onClick={onCancel}
//                         className="flex-1 py-3.5 text-sm text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors font-medium border-r border-white/[0.06] cursor-pointer"
//                     >
//                         Cancel
//                     </button>
//                     <button
//                         onClick={onConfirm}
//                         className="flex-1 py-3.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/[0.08] transition-colors font-semibold cursor-pointer"
//                     >
//                         {confirmLabel}
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// }


"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import { X } from "lucide-react";
import { getCustomEmoji } from "@/lib/customEmoji";
import { splitLinks } from "@/lib/links";

const STICKER_TOKEN_SPLIT_RE = /(::[\w-]+::)/g;
const STICKER_TOKEN_MATCH_RE = /^::([\w-]+)::$/;
const STICKER_TOKEN_ONLY_RE = /^(?:\s*::[\w-]+::\s*)+$/;

const CLOUDINARY_CLOUD =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "dgylh67ms";
const CLOUDINARY_PRESET =
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "jhravxtb";

const TIME_FORMAT = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
});
const DAY_FORMAT = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
});
const DAY_YEAR_FORMAT = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
});

export function isStickerOnlyText(text: string | undefined): boolean {
    if (!text) return false;
    const trimmed = text.trim();
    return trimmed.length > 0 && STICKER_TOKEN_ONLY_RE.test(trimmed);
}

export function isVideoUrl(url: string): boolean {
    return (
        /\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(url) ||
        url.includes("/video/upload/")
    );
}

export const TEXT_EMOJIS = (
    "😀 😁 😂 🤣 😊 😉 😍 🥰 😘 😎 🤔 🤨 😐 🙄 😏 😴 😢 😭 😡 🤯 🥳 🤗 😅 🙃 " +
    "👍 👎 👏 🙏 💪 🤝 👀 🔥 ❤️ 🧡 💛 💚 💙 💜 🖤 🤍 💔 ✨ 🎉 💯 ☕ 🍕 🎮 🚀"
).split(" ");

export function toDate(ts: unknown): Date {
    if (!ts) return new Date();
    if (ts instanceof Date) return ts;
    const value = ts as { toDate?: () => Date; seconds?: number };
    if (typeof value.toDate === "function") return value.toDate();
    if (typeof value.seconds === "number") return new Date(value.seconds * 1000);
    return new Date(ts as string | number);
}

export function formatTime(ts: unknown): string {
    if (!ts) return "";
    return TIME_FORMAT.format(toDate(ts));
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
    return d.getFullYear() !== now.getFullYear()
        ? DAY_YEAR_FORMAT.format(d)
        : DAY_FORMAT.format(d);
}

export function formatViews(n: number | undefined): string {
    const v = n ?? 0;
    if (v < 1000) return String(v);
    if (v < 1_000_000) {
        const k = v / 1000;
        return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
    }
    const m = v / 1_000_000;
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
}

export async function uploadPostImage(file: File) {
    const isVid = file.type.startsWith("video/");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_PRESET);
    formData.append("folder", isVid ? "channel_videos" : "channel_posts");
    const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/${isVid ? "video" : "image"}/upload`,
        { method: "POST", body: formData }
    );
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    if (!data?.secure_url) throw new Error("Upload failed");
    return {
        url: data.secure_url as string,
        width: data.width as number,
        height: data.height as number,
    };
}

function useEscapeKey(onEscape: () => void) {
    const handlerRef = useRef(onEscape);

    useEffect(() => {
        handlerRef.current = onEscape;
    });

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") handlerRef.current();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);
}

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

type LinkTone = "mine" | "other";

const LINK_TONES: Record<LinkTone, string> = {
    mine: "text-white decoration-white/50 hover:decoration-white",
    other: "text-[#a996ff] decoration-[#a996ff]/50 hover:decoration-[#a996ff]",
};

const TextWithLinks = memo(function TextWithLinks({
    text,
    tone,
}: {
    text: string;
    tone: LinkTone;
}) {
    const segments = useMemo(
        () => (text.includes("http") ? splitLinks(text) : null),
        [text]
    );

    if (!segments) return <span>{text}</span>;

    return (
        <>
            {segments.map((segment, i) =>
                segment.type === "link" ? (
                    <a
                        key={i}
                        href={segment.value}
                        target="_blank"
                        rel="noreferrer noopener"
                        onClick={(e) => e.stopPropagation()}
                        className={`underline underline-offset-2 [overflow-wrap:anywhere] transition-colors ${LINK_TONES[tone]}`}
                    >
                        {segment.value}
                    </a>
                ) : (
                    <span key={i}>{segment.value}</span>
                )
            )}
        </>
    );
});

export const RichText = memo(function RichText({
    text,
    variant = "inline",
    tone = "other",
}: {
    text: string;
    variant?: "inline" | "large";
    tone?: LinkTone;
}) {
    const parts = useMemo(() => text.split(STICKER_TOKEN_SPLIT_RE), [text]);

    return (
        <>
            {parts.map((part, i) => {
                if (!part) return null;
                const match = part.match(STICKER_TOKEN_MATCH_RE);
                if (match) {
                    const custom = getCustomEmoji(match[1]);
                    if (custom) {
                        return variant === "large" ? (
                            <img
                                key={i}
                                src={custom.url}
                                alt={custom.id}
                                decoding="async"
                                className="inline-block w-28 h-28 object-contain"
                            />
                        ) : (
                            <img
                                key={i}
                                src={custom.url}
                                alt={custom.id}
                                decoding="async"
                                className="inline-block align-text-bottom w-6 h-6 object-contain mx-0.5"
                            />
                        );
                    }
                }
                if (variant === "large" && !part.trim()) return null;
                return <TextWithLinks key={i} text={part} tone={tone} />;
            })}
        </>
    );
});

export function ImageLightbox({
    url,
    onClose,
}: {
    url: string;
    onClose: () => void;
}) {
    useEscapeKey(onClose);

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Media preview"
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 animate-[fadeIn_0.15s_ease]"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                aria-label="Close"
                className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-full bg-white/[0.08] text-white hover:bg-white/[0.15] transition-colors cursor-pointer"
            >
                <X size={20} />
            </button>
            {isVideoUrl(url) ? (
                <video
                    src={url}
                    controls
                    autoPlay
                    className="max-w-[90vw] max-h-[90vh] rounded-lg"
                    onClick={(e) => e.stopPropagation()}
                />
            ) : (
                <img
                    src={url}
                    alt="full"
                    className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg select-none"
                    onClick={(e) => e.stopPropagation()}
                />
            )}
        </div>
    );
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
    useEscapeKey(onCancel);

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60"
            onClick={onCancel}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className="w-80 rounded-2xl bg-[#0d0b17] border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden"
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