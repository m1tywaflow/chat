import { Chat } from "@/types/chat";

export const chatsMock: Chat[] = [
  {
    id: "1",
    participant: {
      id: "101",
      username: "Alex",
      avatar: "https://i.pravatar.cc/150?img=1",
      online: true,
    },
    lastMessage: "Hello!",
    lastMessageTime: "12:30",
    unreadCount: 2,
  },
  {
    id: "2",
    participant: {
      id: "102",
      username: "John",
      avatar: "https://i.pravatar.cc/150?img=2",
      online: false,
    },
    lastMessage: "How are you?",
    lastMessageTime: "11:20",
    unreadCount: 0,
  },
  {
    id: "3",
    participant: {
      id: "103",
      username: "Kate",
      avatar: "https://i.pravatar.cc/150?img=3",
      online: true,
    },
    lastMessage: "sended file",
    lastMessageTime: "09:45",
    unreadCount: 5,
  },
];
