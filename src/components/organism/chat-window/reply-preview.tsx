"use client";

import { Mic, Video } from "lucide-react";
import { isCustomEmojiUrl } from "@/lib/customEmoji";
import { useUsername } from "@/lib/usernameCache";
import { isStickerOnlyText, isVideo } from "./chat-shared";

const TOKEN_RE = /::[\w-]+::/g;

export interface ReplyPreview {
    label: string;
    thumbUrl: string | null;
    icon: "voice" | "video" | null;
}

export function getReplyPreview(reply: {
    text?: string | null;
    imageUrl?: string | null;
}): ReplyPreview {
    const text = (reply.text ?? "").trim();
    const url = reply.imageUrl ?? null;

    if (text) {
        if (isStickerOnlyText(text)) {
            return { label: "Sticker", thumbUrl: null, icon: null };
        }
        const withThumb = url && !isVideo(url) && !isCustomEmojiUrl(url);
        return {
            label: text.replace(TOKEN_RE, "🙂").replace(/\s+/g, " "),
            thumbUrl: withThumb ? url : null,
            icon: null,
        };
    }

    if (url) {
        if (isCustomEmojiUrl(url)) {
            return { label: "Sticker", thumbUrl: url, icon: null };
        }
        if (isVideo(url)) {
            return { label: "Video", thumbUrl: null, icon: "video" };
        }
        return { label: "Photo", thumbUrl: url, icon: null };
    }

    return { label: "Voice message", thumbUrl: null, icon: "voice" };
}

export function ReplyIcon({ icon }: { icon: ReplyPreview["icon"] }) {
    if (icon === "voice") return <Mic size={12} className="shrink-0" />;
    if (icon === "video") return <Video size={12} className="shrink-0" />;
    return null;
}

export function useReplyAuthor(
    senderId: string | null | undefined,
    myUid: string | null
): string | null {
    const name = useUsername(senderId && senderId !== myUid ? senderId : "");
    if (!senderId) return null;
    if (senderId === myUid) return "You";
    return name || null;
}