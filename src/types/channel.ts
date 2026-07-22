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
  pinnedPostId?: string | null;
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
  commentCount?: number;
}

export interface ChannelCommentReplyTo {
  commentId: string;
  authorId: string;
  authorUsername: string;
  text: string;
}

export interface ChannelComment {
  id: string;
  authorId: string;
  text: string;
  createdAt: any;
  imageUrl?: string | null;
  replyTo?: ChannelCommentReplyTo | null;
  reactions?: Record<string, string[]>;
}

export interface ChannelSubscriber {
  uid: string;
  username: string;
  avatarUrl: string | null;
  subscribedAt: any;
}
