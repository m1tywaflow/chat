"use client";

import { useEffect } from "react";
import { useChatStore } from "@/store/chat-store";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { subscribeToUserChats } from "@/lib/firestore/chats";
import ChatItem from "./ChatItem";

export default function SideBar() {
  const chats = useChatStore((state) => state.chats);
  const setChats = useChatStore((state) => state.setChats);
  const { firebaseUser } = useCurrentUser();

  useEffect(() => {
    if (!firebaseUser) return;

    const unsub = subscribeToUserChats(firebaseUser.uid, setChats);
    return unsub;
  }, [firebaseUser, setChats]);

  return (
    <section className="left h-screen bg-[#74658A] border w-76">
      <div>
        {chats.length === 0 && (
          <p className="text-zinc-200 text-sm p-4">
            There are no chats yet. Find someone to chat with by username.
          </p>
        )}
        {chats.map((chat) => (
          <ChatItem key={chat.id} chat={chat} />
        ))}
      </div>
    </section>
  );
}
