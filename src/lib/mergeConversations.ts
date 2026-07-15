// import { Channel } from "@/types/channel";

// export type ConversationItem =
//   | { type: "chat"; id: string; data: any; sortTime: number }
//   | { type: "channel"; id: string; data: Channel; sortTime: number };

// function toMillis(ts: any): number {
//   if (!ts) return 0;
//   if (typeof ts.toMillis === "function") return ts.toMillis();
//   if (typeof ts === "string") return new Date(ts).getTime() || 0;
//   return 0;
// }

// export function mergeConversations(
//   chats: any[],
//   channels: Channel[]
// ): ConversationItem[] {
//   const chatItems: ConversationItem[] = chats.map((c) => ({
//     type: "chat",
//     id: c.id,
//     data: c,
//     sortTime: toMillis(c.lastMessageTime),
//   }));
//   const channelItems: ConversationItem[] = channels.map((c) => ({
//     type: "channel",
//     id: c.id,
//     data: c,
//     sortTime: toMillis(c.lastPostAt),
//   }));
//   return [...chatItems, ...channelItems].sort(
//     (a, b) => b.sortTime - a.sortTime
//   );
// }
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

export function buildConversationItems(
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
  return [...chatItems, ...channelItems];
}

export function sortConversationItems(
  items: ConversationItem[],
  orderMap: Record<string, number> | undefined
): ConversationItem[] {
  return [...items].sort((a, b) => {
    const oa = orderMap?.[a.id];
    const ob = orderMap?.[b.id];
    if (oa !== undefined && ob !== undefined) return oa - ob;
    if (oa !== undefined) return 1;
    if (ob !== undefined) return -1;
    return b.sortTime - a.sortTime;
  });
}

export function mergeConversations(
  chats: any[],
  channels: Channel[],
  orderMap?: Record<string, number>
): ConversationItem[] {
  return sortConversationItems(
    buildConversationItems(chats, channels),
    orderMap
  );
}
