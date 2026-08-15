import type { ForwardableContent, ForwardedFrom } from "@/types/forward";

/** Keeps the original origin when a forwarded message is forwarded again. */
export function buildForwardedFrom(
  original: ForwardableContent
): ForwardedFrom {
  if (original.forwardedFrom) return original.forwardedFrom;

  const sourceType = original.channelId
    ? "channel"
    : original.groupId
    ? "group"
    : "chat";

  return {
    sourceType,
    sourceName: original.sourceName ?? null,
    chatId: original.chatId ?? null,
    channelId: original.channelId ?? null,
    groupId: original.groupId ?? null,
    messageId: original.messageId ?? original.postId ?? null,
    postId: original.postId ?? null,
    senderId: original.senderId,
    senderName: original.senderName ?? null,
  };
}
