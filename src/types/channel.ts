// export interface Channel {
//   id: string;
//   name: string;
//   nameLower: string;
//   description: string;
//   avatarUrl: string | null;
//   ownerId: string;
//   ownerUsername: string;
//   subscriberCount: number;
//   createdAt: any;
//   lastPostAt: any;
//   lastPostPreview: string;
//   deleted?: {
//     [uid: string]: boolean;
//   };
// }

// export interface ChannelPost {
//   id: string;
//   channelId: string;
//   authorId: string;
//   text: string;
//   imageUrl: string | null;
//   createdAt: any;
//   edited?: boolean;
//   reactions?: Record<string, string[]>;
// }
// export interface ChannelSubscriber {
//   uid: string;
//   username: string;
//   avatarUrl: string | null;
//   subscribedAt: any;
// }
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
  commentCount?: number;
}

export interface ChannelComment {
  id: string;
  authorId: string;
  text: string;
  createdAt: any;
}

export interface ChannelSubscriber {
  uid: string;
  username: string;
  avatarUrl: string | null;
  subscribedAt: any;
}