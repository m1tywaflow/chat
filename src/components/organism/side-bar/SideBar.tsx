"use client";

import { useEffect } from "react";
import { useChatStore } from "@/store/chat-store";
import { chatsMock } from "@/mocks/chat";
import ChatItem from "./ChatItem";

export default function SideBar() {
  const chats = useChatStore((state) => state.chats);
  const setChats = useChatStore((state) => state.setChats);
  useEffect(() => {
    setChats(chatsMock);
  }, [setChats]);

  return (
    <>
      <section className="left h-screen bg-[#74658A] border w-76">
        <div>
          {chats.map((chat) => (
            <ChatItem key={chat.id} chat={chat} />
          ))}
        </div>
      </section>
    </>
  );
}
