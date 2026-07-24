import type { Timestamp } from "firebase/firestore";

export type GroupRole = "owner" | "admin" | "member";
export interface Group {
  id: string;
  name: string;
  avatarUrl?: string;
  ownerId: string;
  admins: string[];
  members: string[];
  memberCount: number;
  createdAt: Timestamp;
  ownerName: string;
  lastMessage?: {
    text: string;
    senderId: string;
    senderName: string;
    createdAt: Timestamp;
  };
  order?: Record<string, number>;
}

export interface GroupMessage {
  id: string;
  text: string;
  imageUrl?: string | null;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string | null;
  replyTo?: {
    id: string;
    text: string;
    imageUrl?: string;
  } | null;
  createdAt: any;
  readBy: string[];
  reactions: Record<string, string[]>;
}
