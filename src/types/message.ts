import { Timestamp } from "firebase/firestore";

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

export interface VoiceMessage {
  id: string;
  senderId: string;
  type: "voice";
  audioUrl: string;
  duration: number;
  waveform: number[];
  createdAt: Timestamp;
  read: boolean;
}
