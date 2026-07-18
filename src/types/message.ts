export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: number;
  forwardedFrom?: ForwardedFrom | null;
}
export interface ForwardedFrom {
  chatId: string;
  senderId: string;
  senderName?: string;
}
