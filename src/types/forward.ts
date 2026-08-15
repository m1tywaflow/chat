export interface ForwardedFrom {
  sourceType?: "chat" | "channel" | "group";
  sourceName?: string | null;
  chatId?: string | null;
  channelId?: string | null;
  groupId?: string | null;
  messageId?: string | null;
  postId?: string | null;
  senderId: string;
  senderName?: string | null;
}

export interface ForwardableContent {
  text: string;
  imageUrl?: string | null;
  voiceUrl?: string | null;
  duration?: number;
  waveform?: number[];
  senderId: string;
  senderName?: string | null;
  chatId?: string;
  channelId?: string;
  groupId?: string;
  postId?: string;
  messageId?: string;
  sourceName?: string;
  forwardedFrom?: ForwardedFrom | null;
}
