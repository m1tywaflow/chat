"use client";

import { useEffect, useState, useRef } from "react";
import { useChatStore } from "@/store/chat-store";
import {
  subscribeToMessages,
  sendMessage,
  setTyping,
} from "@/lib/firestore/chats";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot, doc, updateDoc } from "firebase/firestore";
import { X, Reply } from "lucide-react";

export default function ChatWindow() {
  const chatId = useChatStore((s) => s.activeChatId);
  const markOpened = useChatStore((s) => s.markOpened);

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [myUid, setMyUid] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const [replyMessage, setReplyMessage] = useState<any | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setMyUid(u?.uid || null));
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
    if (!chatId || !myUid) return;
    markOpened(chatId);
    updateDoc(doc(db, "chats", chatId), {
      [`unreadCount.${myUid}`]: 0,
    });
  }, [chatId, myUid]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleTyping(e: React.ChangeEvent<HTMLInputElement>) {
    setText(e.target.value);
    if (!chatId || !myUid) return;
    setTyping(chatId, myUid, true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      setTyping(chatId, myUid, false);
    }, 1200);
  }

  async function send() {
    if (!text.trim() || !chatId || !myUid) return;

    await sendMessage(chatId, myUid, text, replyMessage);

    setText("");
    setReplyMessage(null);

    setTyping(chatId, myUid, false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") send();
  }

  if (!chatId) {
    return (
      <div className="flex mx-auto items-center h-full text-zinc-400">
        Select a chat
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full min-h-0 bg-[#0B0F14] text-[#E5E7EB]">
      <div className="h-14 flex p-4 items-center justify-between border-b border-[#1F2A37] bg-[#0F1620] font-medium">
        Chat
        <button
          onClick={async () => {
            if (!chatId) return;

            await updateDoc(doc(db, "chats", chatId), {
              [`deleted.${myUid}`]: true,
            });

            useChatStore.getState().setActiveChat(null);
          }}
          className="text-xs text-red-400 hover:text-red-300"
        >
          Delete chat
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-2">
        {messages.map((m) => {
          const isMine = m.senderId === myUid;

          return (
            <div
              key={m.id}
              id={`msg-${m.id}`}
              className={`group flex ${
                isMine ? "justify-end" : "justify-start"
              }`}
              onContextMenu={(e) => {
                e.preventDefault();
                setReplyMessage(m);
              }}
            >
              <div className="relative max-w-[70%]">
                <button
                  onClick={() => setReplyMessage(m)}
                  className="opacity-0 group-hover:opacity-100 absolute -left-6 top-2 text-zinc-400 transition
          "
                >
                  <Reply />
                </button>
                <div
                  className={`px-4 py-2 rounded-2xl text-sm font-bold break-words
          ${
            isMine
              ? "bg-[#A78BFA]/90 text-white rounded-br-sm shadow-lg shadow-purple-500/10"
              : "bg-white/5 text-white border border-white/10 rounded-bl-sm"
          }`}
                >
                  {m.replyTo && (
                    <div
                      onClick={() => {
                        const el = document.getElementById(
                          `msg-${m.replyTo.id}`
                        );

                        el?.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });

                        el?.classList.add("ring-2", "ring-[#A78BFA]");

                        setTimeout(() => {
                          el?.classList.remove("ring-2", "ring-[#A78BFA]");
                        }, 1500);
                      }}
                      className="mb-2 cursor-pointer rounded-lg border-l-2 border-[#A78BFA] bg-black/20 px-2 py-1"
                    >
                      <div className="text-[10px] text-[#A78BFA] font-semibold">
                        Reply
                      </div>
                      <div className="truncate text-xs text-zinc-300">
                        {m.replyTo.text}
                      </div>
                    </div>
                  )}

                  {m.text}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {typingUsers.length > 0 && (
        <div className="px-4 pb-2 text-sm text-zinc-400 flex items-center gap-1">
          typing
          <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" />
          <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      )}
      {replyMessage && (
        <div className="border-t border-[#1F2A37] bg-[#111827] px-4 py-3">
          <div className="flex items-start justify-between gap-4">
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-[#A78BFA]">
                Replying to message
              </div>

              <div className="truncate text-sm text-zinc-400">
                {replyMessage.text}
              </div>
            </div>

            <button
              onClick={() => setReplyMessage(null)}
              className="text-zinc-500 hover:text-white"
            >
              <X />
            </button>
          </div>
        </div>
      )}
      <div className="border-t border-[#1F2A37] p-3 flex gap-2 bg-[#0F1620]">
        <input
          value={text}
          onChange={handleTyping}
          onKeyDown={handleKeyDown}
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
