"use client";

import {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import { Send, Paperclip, Smile, X, ImageIcon } from "lucide-react";
import { setTyping } from "@/lib/firestore/chats";
import { CUSTOM_EMOJIS } from "@/lib/customEmoji";
import VoiceRecordButton from "@/components/atoms/recordButton";

const TEXT_EMOJIS = (
    "😀 😁 😂 🤣 😊 😉 😍 🥰 😘 😎 🤔 🤨 😐 🙄 😏 😴 😢 😭 😡 🤯 🥳 🤗 😅 🙃 " +
    "👍 👎 👏 🙏 💪 🤝 👀 🔥 ❤️ 🧡 💛 💚 💙 💜 🖤 🤍 💔 ✨ 🎉 💯 ☕ 🍕 🎮 🚀"
).split(" ");

export interface ComposerHandle {
    attachFile: (file: File) => void;
    focus: () => void;
    restoreText: (text: string) => void;
}

export interface SendPayload {
    text: string;
    file: File | null;
    previewUrl: string | null;
    isVideo: boolean;
}

interface Props {
    chatId: string;
    myUid: string | null;
    replyMessage: any | null;
    onCancelReply: () => void;
    onSend: (payload: SendPayload) => void;
    onSendVoice: (r: {
        audioUrl: string;
        duration: number;
        waveform: number[];
    }) => void;
}

const MAX_HEIGHT = 140;

const Composer = forwardRef<ComposerHandle, Props>(function Composer(
    { chatId, myUid, replyMessage, onCancelReply, onSend, onSendVoice },
    ref
) {
    const [text, setText] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isFileVideo, setIsFileVideo] = useState(false);
    const [focused, setFocused] = useState(false);
    const [emojiOpen, setEmojiOpen] = useState(false);

    const inputRef = useRef<HTMLTextAreaElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const emojiPanelRef = useRef<HTMLDivElement | null>(null);
    const caretRef = useRef(0);
    const previewUrlRef = useRef<string | null>(null);
    const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isTypingRef = useRef(false);

    /* ── typing: одна запись на старт и одна на остановку ── */
    const stopTyping = useCallback(() => {
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = null;
        if (isTypingRef.current && myUid) {
            isTypingRef.current = false;
            setTyping(chatId, myUid, false).catch(() => { });
        }
    }, [chatId, myUid]);

    const notifyTyping = useCallback(() => {
        if (!myUid) return;
        if (!isTypingRef.current) {
            isTypingRef.current = true;
            setTyping(chatId, myUid, true).catch(() => { });
        }
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(stopTyping, 1500);
    }, [chatId, myUid, stopTyping]);

    useEffect(() => {
        return () => {
            stopTyping();
            if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        };
    }, [stopTyping]);

    /* ── файл / превью ── */
    const setFileForPreview = useCallback((f: File) => {
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        const url = URL.createObjectURL(f);
        previewUrlRef.current = url;
        setIsFileVideo(f.type.startsWith("video/"));
        setFile(f);
        setPreview(url);
    }, []);

    const clearFile = useCallback(() => {
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
        setFile(null);
        setPreview(null);
        setIsFileVideo(false);
    }, []);

    useImperativeHandle(
        ref,
        () => ({
            attachFile: setFileForPreview,
            focus: () => inputRef.current?.focus(),
            restoreText: (t) => setText((cur) => cur || t),
        }),
        [setFileForPreview]
    );

    /* ── авто-рост textarea ── */
    useLayoutEffect(() => {
        const el = inputRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
    }, [text]);

    /* ── закрытие панели эмодзи ── */
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

    /* ── handlers ── */
    function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
        const v = e.target.value;
        setText(v);
        caretRef.current = e.target.selectionStart ?? v.length;
        if (v.trim()) notifyTyping();
        else stopTyping();
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

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        e.target.value = "";
        if (f) setFileForPreview(f);
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

    const canSend = text.trim().length > 0 || !!file;

    function submit() {
        if (!canSend) return;
        onSend({
            text: text.trim(),
            file,
            previewUrl: preview,
            isVideo: isFileVideo,
        });
        // владение blob-URL переходит к родителю — здесь его не отзываем
        previewUrlRef.current = null;
        setFile(null);
        setPreview(null);
        setIsFileVideo(false);
        setText("");
        caretRef.current = 0;
        stopTyping();
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Escape" && replyMessage) {
            onCancelReply();
            return;
        }
        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
        }
    }

    return (
        <div className="relative z-10 flex-none">
            {replyMessage && (
                <div className="mx-3 mt-3 flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-[#7c5cff]/[0.06] border border-[#7c5cff]/20">
                    <div className="w-0.5 h-7 rounded-full bg-[#7c5cff] shrink-0" />
                    <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-medium text-[#a893ff] mb-0.5">
                            Replying
                        </div>
                        {replyMessage.imageUrl && !replyMessage.text ? (
                            <div className="flex items-center gap-1 text-xs text-zinc-500">
                                <ImageIcon size={11} />
                                <span>Photo</span>
                            </div>
                        ) : (
                            <div className="text-xs text-zinc-500 truncate">
                                {replyMessage.text}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onCancelReply}
                        aria-label="Cancel reply"
                        className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-white/[0.05] text-zinc-500 hover:text-white hover:bg-white/[0.1] transition-all"
                    >
                        <X size={11} />
                    </button>
                </div>
            )}

            {preview && (
                <div className="mx-3 mt-3 relative inline-block">
                    {isFileVideo ? (
                        <video
                            src={preview}
                            className="h-24 rounded-2xl border border-white/[0.08] bg-black"
                            muted
                        />
                    ) : (
                        <img
                            src={preview}
                            alt="preview"
                            className="h-24 rounded-2xl object-cover border border-white/[0.08]"
                        />
                    )}
                    <button
                        onClick={clearFile}
                        aria-label="Remove attachment"
                        className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center rounded-full bg-[#0F1620] border border-white/[0.12] text-zinc-500 hover:text-white transition-colors"
                    >
                        <X size={11} />
                    </button>
                </div>
            )}

            <div className="px-4 py-3 flex items-end gap-3">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleFileChange}
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
                            onClick={() => fileInputRef.current?.click()}
                            title="Attach file"
                            aria-label="Attach file"
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
                                                className="reaction-emoji-btn w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.08] cursor-pointer text-lg leading-none"
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
                                                className="reaction-emoji-btn w-12 h-12 flex items-center justify-center rounded-xl hover:bg-white/[0.08] cursor-pointer transition hover:scale-110"
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
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            onKeyUp={trackCaret}
                            onClick={trackCaret}
                            onPaste={handlePaste}
                            onFocus={() => setFocused(true)}
                            onBlur={() => setFocused(false)}
                            placeholder="Message…"
                            aria-label="Message"
                            className="chat-scroll flex-1 min-w-0 resize-none bg-transparent outline-none text-[15px] leading-7 text-white placeholder:text-zinc-600"
                            style={{ caretColor: "#7c5cff", maxHeight: MAX_HEIGHT }}
                        />
                    </div>
                </div>

                {canSend ? (
                    <button
                        onClick={submit}
                        aria-label="Send message"
                        className="shrink-0 w-[42px] h-[42px] mb-[6px] flex items-center justify-center rounded-full bg-gradient-to-br from-[#7c5cff] to-[#5b3df0] shadow-[0_0_35px_rgba(124,92,255,.45)] transition-all hover:scale-105 active:scale-95"
                    >
                        <Send
                            size={19}
                            className="text-white"
                            style={{ transform: "translateX(-1px)" }}
                        />
                    </button>
                ) : (
                    <div className="shrink-0 mb-[6px]">
                        <VoiceRecordButton onSend={onSendVoice} />
                    </div>
                )}
            </div>
        </div>
    );
});

export default Composer;