export interface ForwardedFrom {
  sourceType?: "chat" | "channel" | "group";
  chatId?: string | null;
  channelId?: string | null;
  groupId?: string | null;
  postId?: string | null;
  senderId: string;
  senderName?: string | null;
}

export interface ForwardableContent {
  text: string;
  imageUrl?: string | null;
  senderId: string;
  senderName?: string | null;
  chatId?: string;
  channelId?: string;
  groupId?: string;
  postId?: string;
  forwardedFrom?: ForwardedFrom | null;
}
