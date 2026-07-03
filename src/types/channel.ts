export interface Channel {
  id: string;
  name: string;
  nameLower: string;
  description: string;
  avatarUrl: string | null;
  ownerId: string;
  ownerUsername: string;
  subscriberCount: number;
  createdAt: any;
  lastPostAt: any;
  lastPostPreview: string;
  deleted?: {
    [uid: string]: boolean;
  };
}

export interface ChannelPost {
  id: string;
  channelId: string;
  authorId: string;
  text: string;
  imageUrl: string | null;
  createdAt: any;
  edited?: boolean;
  reactions?: Record<string, string[]>;
}
