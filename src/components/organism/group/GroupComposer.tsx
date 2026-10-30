"use client";

import {
    forwardRef,
    useCallback,
    useImperativeHandle,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import { Paperclip, Send, Smile, X } from "lucide-react";
import { CUSTOM_EMOJIS } from "@/lib/customEmoji";
import VoiceRecordButton from "@/components/atoms/recordButton";
import {
    sendGroupMessage,
    sendGroupVoiceMessage,
    setGroupTyping,
} from "@/lib/firestore/groups";
import { readImageSize } from "@/lib/imageUpload";
import { getReplyPreview, ReplyIcon, useReplyAuthor } from "../chat-window/reply-preview";

const TEXT_EMOJIS = (
    "😀 😁 😂 🤣 😊 😉 😍 🥰 😘 😎 🤔 🤨 😐 🙄 😏 😴 😢 😭 😡 🤯 🥳 🤗 😅 🙃 " +
    "👍 👎 👏 🙏 💪 🤝 👀 🔥 ❤️ 🧡 💛 💚 💙 💜 🖤 🤍 💔 ✨ 🎉 💯 ☕ 🍕 🎮 🚀"
).split(" ");

const MAX_HEIGHT = 140;

type UploadResult = { url: string; width?: number; height?: number };

async function uploadToCloudinary(file: File): Promise<UploadResult> {
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
    return {
        url: data.secure_url as string,
        width: isVid ? undefined : (data.width as number | undefined),
        height: isVid ? undefined : (data.height as number | undefined),
    };
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

function ReplyBar({
    message,
    myUid,
    onCancel,
}: {
    message: any;
    myUid: string | null;
    onCancel: () => void;
}) {
    const [shown, setShown] = useState(false);

    useEffect(() => {
        const id = requestAnimationFrame(() => setShown(true));
        return () => cancelAnimationFrame(id);
    }, []);

    const preview = getReplyPreview(message);
    const author = useReplyAuthor(message.senderId, myUid);
    const isMine = !!myUid && message.senderId === myUid;
    const title = isMine
        ? "Replying to yourself"
        : author
            ? `Replying to ${author}`
            : "Replying";

    return (
        <div
            className={`mx-4 mt-3 flex items-center gap-3 pl-3 pr-2 py-2 rounded-2xl border transition-all duration-200 ease-out ${shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
                }`}
            style={{
                background: "rgba(18,17,31,0.72)",
                borderColor: "rgba(124,92,255,0.16)",
            }}
        >
            <span className="shrink-0 self-stretch w-[3px] rounded-full bg-gradient-to-b from-[#a996ff] to-[#5b3df0]" />

            {preview.thumbUrl && (
                <img
                    src={preview.thumbUrl}
                    alt=""
                    className="shrink-0 w-10 h-10 rounded-lg object-cover"
                />
            )}

            <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold leading-tight text-[#a996ff] mb-0.5 truncate">
                    {title}
                </div>
                <div className="flex items-center gap-1.5 text-[13px] leading-tight text-zinc-400">
                    <ReplyIcon icon={preview.icon} />
                    <span className="truncate">{preview.label}</span>
                </div>
            </div>

            <button
                onClick={onCancel}
                aria-label="Cancel reply"
                className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
                <X size={14} />
            </button>
        </div>
    );
}

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
        const [imageSize, setImageSize] = useState<{
            width: number;
            height: number;
        } | null>(null);
        const [isFileVideo, setIsFileVideo] = useState(false);
        const [uploading, setUploading] = useState(false);
        const [emojiPanelOpen, setEmojiPanelOpen] = useState(false);
        const [composerFocused, setComposerFocused] = useState(false);

        const inputRef = useRef<HTMLTextAreaElement | null>(null);
        const fileInputRef = useRef<HTMLInputElement | null>(null);
        const emojiPanelRef = useRef<HTMLDivElement | null>(null);
        const lastCaretPos = useRef<number>(0);
        const previewUrlRef = useRef<string | null>(null);
        const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
        const isTypingRef = useRef(false);
        const sizeTokenRef = useRef(0);

        const stopTyping = useCallback(() => {
            if (typingTimeout.current) clearTimeout(typingTimeout.current);
            typingTimeout.current = null;
            if (isTypingRef.current && myUid) {
                isTypingRef.current = false;
                setGroupTyping(groupId, myUid, false).catch(() => { });
            }
        }, [groupId, myUid]);

        const notifyTyping = useCallback(() => {
            if (!myUid) return;
            if (!isTypingRef.current) {
                isTypingRef.current = true;
                setGroupTyping(groupId, myUid, true).catch(() => { });
            }
            if (typingTimeout.current) clearTimeout(typingTimeout.current);
            typingTimeout.current = setTimeout(stopTyping, 1500);
        }, [groupId, myUid, stopTyping]);

        const setFileForPreview = useCallback((file: File) => {
            const isVid = file.type.startsWith("video/");
            if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
            setIsFileVideo(isVid);
            setImageFile(file);
            const previewUrl = URL.createObjectURL(file);
            previewUrlRef.current = previewUrl;
            setImagePreview(previewUrl);

            const token = ++sizeTokenRef.current;
            setImageSize(null);
            if (!isVid) {
                readImageSize(file).then((size) => {
                    if (sizeTokenRef.current === token) setImageSize(size);
                });
            }
        }, []);

        useImperativeHandle(
            ref,
            () => ({
                focus: () => inputRef.current?.focus(),
                acceptFile: setFileForPreview,
            }),
            [setFileForPreview]
        );

        useLayoutEffect(() => {
            const el = inputRef.current;
            if (!el) return;
            el.style.height = "auto";
            el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
        }, [text]);

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

        useEffect(() => {
            return () => {
                stopTyping();
                if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
            };
        }, [stopTyping]);

        function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
            const v = e.target.value;
            setText(v);
            lastCaretPos.current = e.target.selectionStart ?? v.length;
            if (v.trim()) notifyTyping();
            else stopTyping();
        }

        function trackCaret(e: React.SyntheticEvent<HTMLTextAreaElement>) {
            lastCaretPos.current =
                e.currentTarget.selectionStart ?? e.currentTarget.value.length;
        }

        function insertEmoji(token: string) {
            const pos = Math.min(lastCaretPos.current ?? text.length, text.length);
            const newText = text.slice(0, pos) + token + text.slice(pos);
            setText(newText);
            const newPos = pos + token.length;
            lastCaretPos.current = newPos;
            requestAnimationFrame(() => {
                inputRef.current?.focus();
                inputRef.current?.setSelectionRange(newPos, newPos);
            });
        }

        function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
            const file = e.target.files?.[0];
            if (!file) return;
            e.target.value = "";
            setFileForPreview(file);
        }

        function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
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
            sizeTokenRef.current++;
            if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
            previewUrlRef.current = null;
            setImageFile(null);
            setImagePreview(null);
            setImageSize(null);
            setIsFileVideo(false);
        }

        function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
            if (e.key === "Escape" && replyMessage) {
                onClearReply();
                return;
            }
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
            }
        }

        async function send() {
            const messageText = text.trim();
            const hasText = !!messageText;
            const hasImage = !!imageFile;
            if (!hasText && !hasImage) return;
            if (!groupId || !myUid) return;

            const currentReply = replyMessage;
            const fileToUpload = imageFile;
            const localPreviewUrl = imagePreview;
            const localSize = imageSize;
            const wasVideo = isFileVideo;
            const senderName = myUsername || "Unknown";

            const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            const optimisticMsg = {
                id: tempId,
                senderId: myUid,
                senderName,
                text: messageText,
                imageUrl: localPreviewUrl || undefined,
                imageWidth: localSize?.width,
                imageHeight: localSize?.height,
                isLocalVideo: wasVideo,
                replyTo: currentReply
                    ? {
                        id: currentReply.id,
                        text: currentReply.text,
                        imageUrl: currentReply.imageUrl,
                        senderId: currentReply.senderId,
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
            stopTyping();
            sizeTokenRef.current++;
            previewUrlRef.current = null;
            setImageFile(null);
            setImagePreview(null);
            setImageSize(null);
            setIsFileVideo(false);
            isNearBottomRef.current = true;
            scrollIntentRef.current = "force";

            try {
                let imageUrl: string | undefined;
                let imageWidth = localSize?.width;
                let imageHeight = localSize?.height;

                if (fileToUpload) {
                    setUploading(true);
                    const uploaded = await uploadToCloudinary(fileToUpload);
                    imageUrl = uploaded.url;
                    imageWidth = uploaded.width ?? imageWidth;
                    imageHeight = uploaded.height ?? imageHeight;
                }
                await sendGroupMessage(
                    groupId,
                    myUid,
                    senderName,
                    messageText,
                    groupMembers,
                    undefined,
                    currentReply,
                    imageUrl,
                    imageWidth,
                    imageHeight
                );
            } catch (err) {
                console.error("Send failed:", err);
                setPendingMessages((prev) => prev.filter((p) => p.id !== tempId));
                if (localPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(localPreviewUrl);
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
            <div className="relative z-10 flex-none">
                {replyMessage && (
                    <ReplyBar
                        key={replyMessage.id}
                        message={replyMessage}
                        myUid={myUid}
                        onCancel={onClearReply}
                    />
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
                                border: composerFocused
                                    ? "1px solid rgba(124,92,255,0.45)"
                                    : "1px solid rgba(124,92,255,0.16)",
                                boxShadow: composerFocused
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
                                    onClick={() => setEmojiPanelOpen((v) => !v)}
                                    title="Emoji & stickers"
                                    aria-label="Emoji and stickers"
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
                            <textarea
                                ref={inputRef}
                                rows={1}
                                value={text}
                                onChange={handleChange}
                                onKeyDown={handleKeyDown}
                                onKeyUp={trackCaret}
                                onClick={trackCaret}
                                onPaste={handlePaste}
                                onFocus={() => setComposerFocused(true)}
                                onBlur={() => setComposerFocused(false)}
                                placeholder="Message…"
                                aria-label="Message"
                                className="chat-scroll flex-1 min-w-0 resize-none bg-transparent outline-none text-[15px] leading-7 text-white placeholder:text-zinc-600"
                                style={{ caretColor: "#7c5cff", maxHeight: MAX_HEIGHT }}
                            />
                        </div>
                    </div>
                    {canSend ? (
                        <button
                            onClick={send}
                            disabled={!canSend}
                            aria-label="Send message"
                            className="shrink-0 w-[42px] h-[42px] mb-[6px] flex items-center justify-center rounded-full bg-gradient-to-br from-[#7c5cff] to-[#5b3df0] shadow-[0_0_35px_rgba(124,92,255,.45)] transition-all hover:scale-105 active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed"
                        >
                            <Send
                                size={19}
                                className="text-white"
                                style={{ transform: "translateX(-1px)" }}
                            />
                        </button>
                    ) : (
                        <div className="shrink-0 mb-[6px]">
                            <VoiceRecordButton onSend={handleVoiceSend} />
                        </div>
                    )}
                </div>
            </div>
        );
    }
);

export default GroupComposer;