"use client";

import { useEffect, useState, useRef } from "react";
import { useChatStore } from "@/store/chat-store";
import {
  subscribeToMessages,
  sendMessage,
  setTyping,
} from "@/lib/firestore/chats";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ChatWindow() {
  const chatId = useChatStore((s) => s.activeChatId);

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [myUid, setMyUid] = useState<string | null>(null);

  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setMyUid(u?.uid || null);
    });
  }, []);

  useEffect(() => {
    if (!chatId) return;

    const unsub = subscribeToMessages(chatId, setMessages);
    return () => unsub();
  }, [chatId]);

  useEffect(() => {
    if (!chatId || !myUid) return;

    const unsub = onSnapshot(doc(db, "chats", chatId), (snap) => {
      const data = snap.data();

      if (!data?.typing) return;

      const typingList = Object.entries(data.typing)
        .filter(([uid, val]) => val && uid !== myUid)
        .map(([uid]) => uid);

      setTypingUsers(typingList);
    });

    return () => unsub();
  }, [chatId, myUid]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleTyping(e: React.ChangeEvent<HTMLInputElement>) {
    setText(e.target.value);

    if (!chatId || !myUid) return;

    setTyping(chatId, myUid, true);

    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    typingTimeout.current = setTimeout(() => {
      setTyping(chatId, myUid, false);
    }, 1200);
  }

  async function send() {
    if (!text.trim() || !chatId || !myUid) return;

    await sendMessage(chatId, myUid, text);
    setText("");

    if (chatId && myUid) {
      setTyping(chatId, myUid, false);
    }
  }

  if (!chatId) {
    return (
      <div className="flex mx-auto items-center h-full text-zinc-400">
        Select a chat
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full bg-[#0B0F14] text-[#E5E7EB]">
      <div className="h-14 justify-center border-b border-[#1F2A37] bg-[#0F1620] flex items-center px-4 font-medium">
        Chat
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.map((m) => {
          const isMine = m.senderId === myUid;
          return (
            <div
              key={m.id}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm font-bold wrap-break-word transition-all duration-200
                  ${
                    isMine
                      ? "bg-[#A78BFA]/90 backdrop-blur-md text-white  rounded-br-sm shadow-lg shadow-purple-500/10"
                      : "bg-white/5 backdrop-blur-md text-white border  border-white/10 rounded-bl-sm"
                  }
                  `}
              >
                {m.text}
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>
      {typingUsers.length > 0 && (
        <div className="px-4 pb-2 text-sm text-zinc-400 flex items-center gap-1">
          <h1>typing</h1>
          <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" />
          <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      )}
      <div className="border-t border-[#1F2A37] p-3 flex gap-2 bg-[#0F1620]">
        <input
          value={text}
          onChange={handleTyping}
          className="flex-1 p-2 rounded bg-[#1B2633] text-[#E5E7EB] outline-none"
        />
        <button
          onClick={send}
          className="bg-[#A78BFA] hover:bg-[#34D399] text-white px-4 py-2 rounded-xl font-bold"
        >
          Send
        </button>
      </div>
    </div>
  );
}
