import { Timestamp } from "firebase/firestore";
import type { ForwardedFrom } from "@/types/forward";

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: number;
  forwardedFrom?: ForwardedFrom | null;
}
export type { ForwardedFrom };

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
