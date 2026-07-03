import { Channel } from "@/types/channel";

export type ConversationItem =
  | { type: "chat"; id: string; data: any; sortTime: number }
  | { type: "channel"; id: string; data: Channel; sortTime: number };

function toMillis(ts: any): number {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts === "string") return new Date(ts).getTime() || 0;
  return 0;
}

export function mergeConversations(
  chats: any[],
  channels: Channel[]
): ConversationItem[] {
  const chatItems: ConversationItem[] = chats.map((c) => ({
    type: "chat",
    id: c.id,
    data: c,
    sortTime: toMillis(c.lastMessageTime),
  }));
  const channelItems: ConversationItem[] = channels.map((c) => ({
    type: "channel",
    id: c.id,
    data: c,
    sortTime: toMillis(c.lastPostAt),
  }));
  return [...chatItems, ...channelItems].sort(
    (a, b) => b.sortTime - a.sortTime
  );
}
