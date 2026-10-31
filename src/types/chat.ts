// import { User } from "./user";

// export interface Chat {
//   id: string;
//   participant: User;
//   lastMessage: string;
//   lastMessageTime: string;
//   unreadCount: number;
//   deleted?: {
//     [uid: string]: boolean;
//   };
// }
import { User } from "./user";

export interface Chat {
  id: string;
  participant: User;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isSaved?: boolean;
  deleted?: {
    [uid: string]: boolean;
  };
}
