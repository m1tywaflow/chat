"use client";

import {
    forwardRef,
    useImperativeHandle,
    useEffect,
    useRef,
    useState,
} from "react";
import { Paperclip, ImageIcon, Send, Smile, X } from "lucide-react";
import { CUSTOM_EMOJIS } from "@/lib/customEmoji";
import VoiceRecordButton from "@/components/atoms/recordButton";
import {
    sendGroupMessage,
    sendGroupVoiceMessage,
} from "@/lib/firestore/groups";

const TEXT_EMOJIS = [
    "😀", "😁", "😂", "🤣", "😊", "😉", "😍", "🥰", "😘", "😎", "🤔", "🤨",
    "😐", "🙄", "😏", "😴", "😢", "😭", "😡", "🤯", "🥳", "🤗", "😅", "🙃",
    "👍", "👎", "👏", "🙏", "💪", "🤝", "👀", "🔥", "❤️", "🧡", "💛", "💚",
    "💙", "💜", "🖤", "🤍", "💔", "✨", "🎉", "💯", "☕", "🍕", "🎮", "🚀",
];

async function uploadToCloudinary(file: File): Promise<string> {
    const isVid = file.type.startsWith("video/");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "jhravxtb");
    formData.append("folder", isVid ? "group_videos" : "group_images");
    const res = await fetch(
        `https://api.cloudinary.com/v1_1/dgylh67ms/${isVid ? "video" : "image"}/upload`,
        { method: "POST", body: formData }
    );
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.secure_url;
}

export interface GroupComposerHandle {
    focus: () => void;
    acceptFile: (file: File) => void;
}

interface GroupComposerProps {
    groupId: string;
    myUid: string | null;
    myUsername: string;
    groupMembers: string[];
    replyMessage: any | null;
    onClearReply: () => void;
    setPendingMessages: React.Dispatch<React.SetStateAction<any[]>>;
    isNearBottomRef: React.MutableRefObject<boolean>;
    scrollIntentRef: React.MutableRefObject<
        "initial" | "follow" | "force" | null
    >;
}

/**
 * Composer for GroupWindow: text input, attach/emoji/voice controls, and the
 * reply/image-preview banners above it.
 *
 * Deliberately its own component with its own `text` state - typing here no
 * longer re-renders GroupWindow's (potentially very long) message list.
 * GroupWindow only re-renders this component when its own props change
 * (replyMessage, groupId, etc.), never on a keystroke.
 */
const GroupComposer = forwardRef<GroupComposerHandle, GroupComposerProps>(
    function GroupComposer(
        {
            groupId,
            myUid,
            myUsername,
            groupMembers,
            replyMessage,
            onClearReply,
            setPendingMessages,
            isNearBottomRef,
            scrollIntentRef,
        },
        ref
    ) {
        const [text, setText] = useState("");
        const [imagePreview, setImagePreview] = useState<string | null>(null);
        const [imageFile, setImageFile] = useState<File | null>(null);
        const [isFileVideo, setIsFileVideo] = useState(false);
        const [uploading, setUploading] = useState(false);
        const [emojiPanelOpen, setEmojiPanelOpen] = useState(false);
        const [composerFocused, setComposerFocused] = useState(false);

        const inputRef = useRef<HTMLInputElement | null>(null);
        const fileInputRef = useRef<HTMLInputElement | null>(null);
        const emojiPanelRef = useRef<HTMLDivElement | null>(null);
        const lastCaretPos = useRef<number>(0);

        useImperativeHandle(ref, () => ({
            focus: () => inputRef.current?.focus(),
            acceptFile: (file: File) => setFileForPreview(file),
        }));

        useEffect(() => {
            if (!emojiPanelOpen) return;
            const handleClick = (e: MouseEvent) => {
                if (
                    emojiPanelRef.current &&
                    !emojiPanelRef.current.contains(e.target as Node)
                )
                    setEmojiPanelOpen(false);
            };
            window.addEventListener("click", handleClick);
            return () => window.removeEventListener("click", handleClick);
        }, [emojiPanelOpen]);

        function handleTyping(e: React.ChangeEvent<HTMLInputElement>) {
            setText(e.target.value);
            lastCaretPos.current = e.target.selectionStart ?? e.target.value.length;
        }

        function trackCaret(e: React.SyntheticEvent<HTMLInputElement>) {
            lastCaretPos.current =
                e.currentTarget.selectionStart ?? e.currentTarget.value.length;
        }

        function insertEmoji(token: string) {
            const pos = lastCaretPos.current ?? text.length;
            const newText = text.slice(0, pos) + token + text.slice(pos);
            setText(newText);
            const newPos = pos + token.length;
            lastCaretPos.current = newPos;
            requestAnimationFrame(() => {
                inputRef.current?.focus();
                inputRef.current?.setSelectionRange(newPos, newPos);
            });
        }

        function setFileForPreview(file: File) {
            setIsFileVideo(file.type.startsWith("video/"));
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }

        function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
            const file = e.target.files?.[0];
            if (!file) return;
            e.target.value = "";
            setFileForPreview(file);
        }

        function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (const item of Array.from(items)) {
                if (item.type.startsWith("image/")) {
                    const file = item.getAsFile();
                    if (file) {
                        e.preventDefault();
                        setFileForPreview(file);
                    }
                    break;
                }
            }
        }

        function removeImagePreview() {
            setImageFile(null);
            setImagePreview(null);
            setIsFileVideo(false);
        }

        function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
            if (e.key === "Enter") send();
        }

        async function send() {
            const hasText = !!text.trim();
            const hasImage = !!imageFile;
            if (!hasText && !hasImage) return;
            if (!groupId || !myUid) return;

            const messageText = text;
            const currentReply = replyMessage;
            const fileToUpload = imageFile;
            const localPreviewUrl = imagePreview;
            const wasVideo = isFileVideo;
            const senderName = myUsername || "Unknown";

            const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            const optimisticMsg = {
                id: tempId,
                senderId: myUid,
                senderName,
                text: messageText,
                imageUrl: localPreviewUrl || undefined,
                isLocalVideo: wasVideo,
                replyTo: currentReply
                    ? {
                        id: currentReply.id,
                        text: currentReply.text,
                        imageUrl: currentReply.imageUrl,
                    }
                    : null,
                createdAt: new Date(),
                readBy: [],
                reactions: {},
                pending: true,
            };

            setPendingMessages((prev) => [...prev, optimisticMsg]);
            setText("");
            lastCaretPos.current = 0;
            onClearReply();
            setImageFile(null);
            setImagePreview(null);
            setIsFileVideo(false);
            isNearBottomRef.current = true;
            scrollIntentRef.current = "force";

            try {
                let imageUrl: string | undefined;
                if (fileToUpload) {
                    setUploading(true);
                    imageUrl = await uploadToCloudinary(fileToUpload);
                }
                await sendGroupMessage(
                    groupId,
                    myUid,
                    senderName,
                    messageText,
                    groupMembers,
                    undefined,
                    currentReply,
                    imageUrl
                );
            } catch (err) {
                console.error("Send failed:", err);
                setPendingMessages((prev) => prev.filter((p) => p.id !== tempId));
                setText((t) => t || messageText);
            } finally {
                setUploading(false);
            }
        }

        async function handleVoiceSend(r: {
            audioUrl: string;
            duration: number;
            waveform: number[];
        }) {
            if (!groupId || !myUid) return;

            const currentReply = replyMessage;
            onClearReply();
            isNearBottomRef.current = true;
            scrollIntentRef.current = "force";

            try {
                await sendGroupVoiceMessage(
                    groupId,
                    myUid,
                    myUsername || "Unknown",
                    currentReply,
                    r.audioUrl,
                    r.duration,
                    r.waveform,
                    groupMembers
                );
            } catch (err) {
                console.error("Group voice send failed:", err);
            }
        }

        const canSend = (text.trim() || imageFile) && !uploading;

        return (
            <div className="flex-none border-t border-white/[0.06] bg-[#0d0b17]/95 backdrop-blur-xl relative z-10">
                {replyMessage && (
                    <div className="mx-3 mt-3 flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-[#7c5cff]/[0.06] border border-[#7c5cff]/20">
                        <div className="w-0.5 h-7 rounded-full bg-[#7c5cff] shrink-0" />
                        <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-semibold text-[#a893ff] uppercase tracking-wide mb-0.5">
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
                            onClick={onClearReply}
                            className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-white/[0.05] text-zinc-600 hover:text-white hover:bg-white/[0.1] transition-all"
                        >
                            <X size={11} />
                        </button>
                    </div>
                )}

                {imagePreview && (
                    <div className="mx-3 mt-3 relative inline-block">
                        {isFileVideo ? (
                            <video
                                src={imagePreview}
                                className="h-24 rounded-2xl border border-white/[0.08] bg-black"
                                muted
                            />
                        ) : (
                            <img
                                src={imagePreview}
                                alt="preview"
                                className="h-24 rounded-2xl object-cover border border-white/[0.08]"
                            />
                        )}
                        <button
                            onClick={removeImagePreview}
                            className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center rounded-full bg-[#0F1620] border border-white/[0.12] text-zinc-500 hover:text-white transition-colors"
                        >
                            <X size={11} />
                        </button>
                    </div>
                )}

                <div className="px-4 py-3 flex items-center gap-3">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <div className="flex-1 relative isolate rounded-full">
                        <div
                            className="composer-tint absolute inset-0 z-0 rounded-full pointer-events-none"
                            style={{
                                background: "rgba(18,17,31,0.55)",
                                border: composerFocused
                                    ? "1px solid rgba(124,92,255,0.45)"
                                    : "1px solid rgba(124,92,255,0.16)",
                                boxShadow: composerFocused
                                    ? "inset 0 0 24px rgba(124,92,255,0.10)"
                                    : "inset 0 0 20px rgba(124,92,255,0.03)",
                            }}
                        />
                        <div
                            className="absolute inset-0 z-0 rounded-full pointer-events-none"
                            style={{
                                backdropFilter: "blur(20px)",
                                WebkitBackdropFilter: "blur(20px)",
                                filter: "url(#glass-distortion-composer)",
                                WebkitFilter: "url(#glass-distortion-composer)",
                            }}
                        />

                        <div className="relative z-10 h-[54px] flex items-center gap-3 px-4">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                title="Attach file"
                                className="shrink-0 w-7 h-7 flex items-center justify-center rounded-xl text-zinc-500 hover:text-[#a893ff] hover:bg-[#7c5cff]/10 transition-all hover:scale-105 active:scale-95"
                            >
                                <Paperclip size={18} />
                            </button>
                            <div className="relative shrink-0" ref={emojiPanelRef}>
                                <button
                                    onClick={() => setEmojiPanelOpen((v) => !v)}
                                    title="Emoji & stickers"
                                    className="w-7 h-7 flex items-center justify-center rounded-xl text-zinc-500 hover:text-[#a893ff] hover:bg-[#7c5cff]/10 transition-all hover:scale-105 active:scale-95"
                                >
                                    <Smile size={18} />
                                </button>
                                {emojiPanelOpen && (
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
                            <input
                                ref={inputRef}
                                value={text}
                                onChange={handleTyping}
                                onKeyDown={handleKeyDown}
                                onKeyUp={trackCaret}
                                onClick={trackCaret}
                                onPaste={handlePaste}
                                onFocus={() => setComposerFocused(true)}
                                onBlur={() => setComposerFocused(false)}
                                placeholder="Message…"
                                className="flex-1 min-w-0 bg-transparent outline-none text-[15px] text-white placeholder:text-zinc-600"
                                style={{ caretColor: "#7c5cff" }}
                            />
                        </div>
                    </div>
                    {canSend ? (
                        <button
                            onClick={send}
                            disabled={!canSend}
                            className="shrink-0 w-[42px] h-[42px] flex items-center justify-center rounded-full bg-gradient-to-br from-[#7c5cff] to-[#5b3df0] shadow-[0_0_35px_rgba(124,92,255,.45)] transition-all hover:scale-105 active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed"
                        >
                            <Send
                                size={19}
                                className="text-white"
                                style={{ transform: "translateX(-1px)" }}
                            />
                        </button>
                    ) : (
                        <VoiceRecordButton onSend={handleVoiceSend} />
                    )}
                </div>
            </div>
        );
    }
);

export default GroupComposer;