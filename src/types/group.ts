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
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string;
  createdAt: Timestamp;
  readBy: string[];
}
