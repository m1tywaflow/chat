"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Paperclip, Send, Smile, X } from "lucide-react";
import { CUSTOM_EMOJIS } from "@/lib/customEmoji";
import { TEXT_EMOJIS } from "./ChannelShared";

const MAX_HEIGHT = 160;

export default function ChannelComposer({
    onPost,
}: {
    /** Должна бросать ошибку при неудаче, тогда черновик останется в поле. */
    onPost: (text: string, file: File | null) => Promise<void>;
}) {
    const [text, setText] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [focused, setFocused] = useState(false);
    const [emojiOpen, setEmojiOpen] = useState(false);

    const inputRef = useRef<HTMLTextAreaElement | null>(null);
    const fileRef = useRef<HTMLInputElement | null>(null);
    const emojiPanelRef = useRef<HTMLDivElement | null>(null);
    const caretRef = useRef(0);
    const previewUrlRef = useRef<string | null>(null);

    const setFileForPreview = useCallback((f: File) => {
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        const url = URL.createObjectURL(f);
        previewUrlRef.current = url;
        setFile(f);
        setPreview(url);
    }, []);

    const clearFile = useCallback(() => {
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
        setFile(null);
        setPreview(null);
    }, []);

    useEffect(() => {
        return () => {
            if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        };
    }, []);

    useLayoutEffect(() => {
        const el = inputRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
    }, [text]);

    useEffect(() => {
        if (!emojiOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (
                emojiPanelRef.current &&
                !emojiPanelRef.current.contains(e.target as Node)
            )
                setEmojiOpen(false);
        };
        window.addEventListener("click", handleClick);
        return () => window.removeEventListener("click", handleClick);
    }, [emojiOpen]);

    const canSend = (text.trim().length > 0 || !!file) && !busy;

    async function submit() {
        if (!canSend) return;
        setBusy(true);
        try {
            await onPost(text.trim(), file);
            setText("");
            caretRef.current = 0;
            clearFile();
        } catch {
            // родитель уже залогировал; оставляем черновик
        } finally {
            setBusy(false);
        }
    }

    function trackCaret(e: React.SyntheticEvent<HTMLTextAreaElement>) {
        caretRef.current =
            e.currentTarget.selectionStart ?? e.currentTarget.value.length;
    }

    function insertEmoji(token: string) {
        const pos = Math.min(caretRef.current, text.length);
        setText(text.slice(0, pos) + token + text.slice(pos));
        const newPos = pos + token.length;
        caretRef.current = newPos;
        requestAnimationFrame(() => {
            inputRef.current?.focus();
            inputRef.current?.setSelectionRange(newPos, newPos);
        });
    }

    function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (const item of Array.from(items)) {
            if (item.type.startsWith("image/")) {
                const f = item.getAsFile();
                if (f) {
                    e.preventDefault();
                    setFileForPreview(f);
                }
                break;
            }
        }
    }

    return (
        <div className="relative z-10 flex-none border-t border-white/[0.06] bg-[#0d0b17]/95">
            {preview && (
                <div className="mx-3 mt-3 relative inline-block">
                    <img
                        src={preview}
                        alt="preview"
                        className="h-24 rounded-2xl object-cover border border-white/[0.08]"
                    />
                    <button
                        onClick={clearFile}
                        aria-label="Remove photo"
                        className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center rounded-full bg-[#0F1620] border border-white/[0.12] text-zinc-500 hover:text-white transition-colors"
                    >
                        <X size={11} />
                    </button>
                </div>
            )}

            <div className="px-4 py-3 flex items-end gap-3">
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = "";
                        if (f) setFileForPreview(f);
                    }}
                />

                <div className="flex-1 relative isolate rounded-[27px]">
                    <div
                        className="composer-tint absolute inset-0 z-0 rounded-[27px] pointer-events-none"
                        style={{
                            background: "rgba(18,17,31,0.72)",
                            border: focused
                                ? "1px solid rgba(124,92,255,0.45)"
                                : "1px solid rgba(124,92,255,0.16)",
                            boxShadow: focused
                                ? "inset 0 0 24px rgba(124,92,255,0.10)"
                                : "inset 0 0 20px rgba(124,92,255,0.03)",
                        }}
                    />

                    <div className="relative z-10 flex items-end gap-3 px-4 py-[13px]">
                        <button
                            onClick={() => fileRef.current?.click()}
                            title="Attach photo"
                            aria-label="Attach photo"
                            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-xl text-zinc-500 hover:text-[#a893ff] hover:bg-[#7c5cff]/10 transition-all hover:scale-105 active:scale-95"
                        >
                            <Paperclip size={18} />
                        </button>

                        <div className="relative shrink-0" ref={emojiPanelRef}>
                            <button
                                onClick={() => setEmojiOpen((v) => !v)}
                                title="Emoji & stickers"
                                aria-label="Emoji and stickers"
                                className="w-7 h-7 flex items-center justify-center rounded-xl text-zinc-500 hover:text-[#a893ff] hover:bg-[#7c5cff]/10 transition-all hover:scale-105 active:scale-95"
                            >
                                <Smile size={18} />
                            </button>

                            {emojiOpen && (
                                <div
                                    className="reaction-picker chat-scroll absolute z-50 bottom-full mb-3 left-0 p-3 w-[248px] max-h-[320px] overflow-y-auto rounded-2xl bg-[#12111f] border border-white/[0.08] shadow-xl shadow-black/50"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="grid grid-cols-6 gap-1 mb-2">
                                        {TEXT_EMOJIS.map((em) => (
                                            <button
                                                key={em}
                                                onClick={() => insertEmoji(em)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.08] cursor-pointer text-lg leading-none transition hover:scale-110"
                                            >
                                                {em}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="h-px bg-white/[0.06] mb-2" />
                                    <div className="grid grid-cols-4 gap-2">
                                        {CUSTOM_EMOJIS.map((e) => (
                                            <button
                                                key={e.id}
                                                onClick={() => insertEmoji(`::${e.id}::`)}
                                                className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-white/[0.08] cursor-pointer transition hover:scale-110"
                                            >
                                                <img
                                                    src={e.url}
                                                    alt={e.id}
                                                    className="w-9 h-9 object-contain"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <textarea
                            ref={inputRef}
                            rows={1}
                            value={text}
                            onChange={(e) => {
                                setText(e.target.value);
                                caretRef.current =
                                    e.target.selectionStart ?? e.target.value.length;
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                                    e.preventDefault();
                                    submit();
                                }
                            }}
                            onKeyUp={trackCaret}
                            onClick={trackCaret}
                            onPaste={handlePaste}
                            onFocus={() => setFocused(true)}
                            onBlur={() => setFocused(false)}
                            placeholder="Write a post…"
                            aria-label="Write a post"
                            className="chat-scroll flex-1 min-w-0 resize-none bg-transparent outline-none text-[15px] leading-7 text-white placeholder:text-zinc-600"
                            style={{ caretColor: "#7c5cff", maxHeight: MAX_HEIGHT }}
                        />
                    </div>
                </div>

                <button
                    onClick={submit}
                    disabled={!canSend}
                    aria-label="Publish post"
                    className="shrink-0 w-[42px] h-[42px] mb-[6px] flex items-center justify-center rounded-full bg-gradient-to-br from-[#7c5cff] to-[#5b3df0] shadow-[0_0_35px_rgba(124,92,255,.45)] transition-all hover:scale-105 active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed"
                >
                    {busy ? (
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Send
                            size={19}
                            className="text-white"
                            style={{ transform: "translateX(-1px)" }}
                        />
                    )}
                </button>
            </div>
        </div>
    );
}